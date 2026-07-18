<?php

namespace App\Services;

use App\Models\Farm;
use App\Models\HarvestListingImage;
use App\Models\HarvestListing;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class HarvestListingService
{
    private const IMAGE_STORAGE_DISK = 'public';
    private const IMAGE_DIRECTORY = 'harvest-listings';
    private const MAX_IMAGES_PER_LISTING = 5;

    private const SUMMARY_RELATIONS = [
        'crop',
        'farm',
        'farmer',
        'images',
    ];

    private const DETAIL_RELATIONS = [
        'crop',
        'farm',
        'farmer',
        'images',
        'donation.farmer',
        'donation.ngo',
        'compostListing.farmer',
        'orderItems.order.consumer',
    ];

    public function getAll(User $user)
    {
        $this->expireElapsedListings();
        $this->expireElapsedFeaturedListings();

        return HarvestListing::with(self::SUMMARY_RELATIONS)
            ->where('user_id', $user->id)
            ->latest()
            ->get();
    }

    public function create(User $user, array $data)
    {
        $data['user_id'] = $user->id;
        $this->assertOwnedStore($user->id, $data['farm_id']);

        $data = $this->initializeStockState($data);

        return HarvestListing::create($data)->load(self::SUMMARY_RELATIONS);
    }

    public function getDetails(HarvestListing $listing)
    {
        $this->expireElapsedListings();
        $this->expireElapsedFeaturedListings();

        return $listing->fresh()->load(self::DETAIL_RELATIONS);
    }

    public function update(HarvestListing $listing, array $data)
    {
        if (array_key_exists('farm_id', $data)) {
            $this->assertOwnedStore($listing->user_id, $data['farm_id']);
        }

        $listing = DB::transaction(function () use ($listing, $data) {
            /** @var HarvestListing $lockedListing */
            $lockedListing = HarvestListing::query()
                ->lockForUpdate()
                ->findOrFail($listing->id);

            $totalQuantity = array_key_exists('quantity', $data)
                ? $this->toDecimal($data['quantity'])
                : $this->toDecimal($lockedListing->quantity);
            $reservedQuantity = $this->toDecimal($lockedListing->reserved_quantity);
            $soldQuantity = $this->toDecimal($lockedListing->sold_quantity);
            $minimumCommittedStock = $this->toDecimal($reservedQuantity + $soldQuantity);

            if ($totalQuantity < $minimumCommittedStock) {
                throw ValidationException::withMessages([
                    'quantity' => [
                        'Total quantity cannot be less than the already reserved and sold stock.',
                    ],
                ]);
            }

            $availableUntil = $data['available_until'] ?? $lockedListing->available_until;
            $data['available_quantity'] = $this->toDecimal(
                $totalQuantity - $reservedQuantity - $soldQuantity
            );
            $data['status'] = $this->determineStockStatus(
                totalQuantity: $totalQuantity,
                availableQuantity: $data['available_quantity'],
                reservedQuantity: $reservedQuantity,
                soldQuantity: $soldQuantity,
                availableUntil: $availableUntil,
                currentStatus: $lockedListing->status,
            );

            $lockedListing->update($data);

            return $lockedListing->fresh();
        });

        return $listing->load(self::SUMMARY_RELATIONS);
    }

    public function reserveStock(
        HarvestListing $listing,
        float $quantity
    ): HarvestListing {
        /** @var HarvestListing $lockedListing */
        $lockedListing = HarvestListing::query()
            ->lockForUpdate()
            ->findOrFail($listing->id);

        $this->refreshExpiredListing($lockedListing);

        if ($lockedListing->status === HarvestListing::STATUS_DONATED) {
            throw new \Exception('Harvest listing is not available for sale.');
        }

        if ($lockedListing->status === HarvestListing::STATUS_EXPIRED) {
            throw new \Exception('Harvest listing has expired.');
        }

        if ($lockedListing->status === HarvestListing::STATUS_SOLD) {
            throw new \Exception('Harvest listing is sold out.');
        }

        $requestedQuantity = $this->toDecimal($quantity);
        $availableQuantity = $this->toDecimal($lockedListing->available_quantity);

        if ($requestedQuantity <= 0) {
            throw ValidationException::withMessages([
                'quantity' => ['Requested quantity must be greater than zero.'],
            ]);
        }

        if ($requestedQuantity > $availableQuantity) {
            throw new \Exception('Requested quantity exceeds available stock.');
        }

        $lockedListing->update([
            'available_quantity' => $this->toDecimal($availableQuantity - $requestedQuantity),
            'reserved_quantity' => $this->toDecimal(
                $this->toDecimal($lockedListing->reserved_quantity) + $requestedQuantity
            ),
            'status' => $this->determineStockStatus(
                totalQuantity: $this->toDecimal($lockedListing->quantity),
                availableQuantity: $this->toDecimal($availableQuantity - $requestedQuantity),
                reservedQuantity: $this->toDecimal($lockedListing->reserved_quantity) + $requestedQuantity,
                soldQuantity: $this->toDecimal($lockedListing->sold_quantity),
                availableUntil: $lockedListing->available_until,
                currentStatus: $lockedListing->status,
            ),
        ]);

        return $lockedListing->fresh();
    }

    public function releaseReservedStock(
        HarvestListing $listing,
        float $quantity
    ): HarvestListing {
        /** @var HarvestListing $lockedListing */
        $lockedListing = HarvestListing::query()
            ->lockForUpdate()
            ->findOrFail($listing->id);

        $requestedQuantity = $this->toDecimal($quantity);
        $reservedQuantity = $this->toDecimal($lockedListing->reserved_quantity);

        if ($requestedQuantity > $reservedQuantity) {
            throw new \Exception('Cannot release more stock than is reserved.');
        }

        $availableQuantity = $this->toDecimal(
            $this->toDecimal($lockedListing->available_quantity) + $requestedQuantity
        );
        $updatedReservedQuantity = $this->toDecimal($reservedQuantity - $requestedQuantity);

        $lockedListing->update([
            'available_quantity' => $availableQuantity,
            'reserved_quantity' => $updatedReservedQuantity,
            'status' => $this->determineStockStatus(
                totalQuantity: $this->toDecimal($lockedListing->quantity),
                availableQuantity: $availableQuantity,
                reservedQuantity: $updatedReservedQuantity,
                soldQuantity: $this->toDecimal($lockedListing->sold_quantity),
                availableUntil: $lockedListing->available_until,
                currentStatus: $lockedListing->status,
            ),
        ]);

        return $lockedListing->fresh();
    }

    public function completeReservedStock(
        HarvestListing $listing,
        float $quantity
    ): HarvestListing {
        /** @var HarvestListing $lockedListing */
        $lockedListing = HarvestListing::query()
            ->lockForUpdate()
            ->findOrFail($listing->id);

        $requestedQuantity = $this->toDecimal($quantity);
        $reservedQuantity = $this->toDecimal($lockedListing->reserved_quantity);

        if ($requestedQuantity > $reservedQuantity) {
            throw new \Exception('Cannot complete more stock than is reserved.');
        }

        $updatedReservedQuantity = $this->toDecimal($reservedQuantity - $requestedQuantity);
        $updatedSoldQuantity = $this->toDecimal(
            $this->toDecimal($lockedListing->sold_quantity) + $requestedQuantity
        );

        $lockedListing->update([
            'reserved_quantity' => $updatedReservedQuantity,
            'sold_quantity' => $updatedSoldQuantity,
            'status' => $this->determineStockStatus(
                totalQuantity: $this->toDecimal($lockedListing->quantity),
                availableQuantity: $this->toDecimal($lockedListing->available_quantity),
                reservedQuantity: $updatedReservedQuantity,
                soldQuantity: $updatedSoldQuantity,
                availableUntil: $lockedListing->available_until,
                currentStatus: $lockedListing->status,
            ),
        ]);

        return $lockedListing->fresh();
    }

    public function expireElapsedListings(): void
    {
        HarvestListing::query()
            ->whereNotNull('available_until')
            ->whereDate('available_until', '<', now()->toDateString())
            ->whereIn('status', [
                HarvestListing::STATUS_AVAILABLE,
                HarvestListing::STATUS_RESERVED,
            ])
            ->update([
                'status' => HarvestListing::STATUS_EXPIRED,
            ]);
    }

    public function expireElapsedFeaturedListings(): void
    {
        HarvestListing::query()
            ->where('is_featured', true)
            ->whereNotNull('featured_until')
            ->whereDate('featured_until', '<', now()->toDateString())
            ->update([
                'is_featured' => false,
            ]);
    }

    /**
     * @param  UploadedFile[]  $images
     */
    public function uploadImages(HarvestListing $listing, array $images)
    {
        $currentImageCount = $listing->images()->count();
        $incomingImageCount = count($images);

        if ($currentImageCount + $incomingImageCount > self::MAX_IMAGES_PER_LISTING) {
            throw ValidationException::withMessages([
                'images' => [
                    'A harvest listing may have up to '.self::MAX_IMAGES_PER_LISTING.' images.',
                ],
            ]);
        }

        DB::transaction(function () use ($listing, $images) {
            $nextSortOrder =
                (int) ($listing->images()->max('sort_order') ?? 0);

            foreach ($images as $image) {
                $nextSortOrder++;

                $path = $image->store(
                    self::IMAGE_DIRECTORY.'/'.$listing->id,
                    self::IMAGE_STORAGE_DISK
                );

                $listing->images()->create([
                    'image_path' => $path,
                    'sort_order' => $nextSortOrder,
                ]);
            }
        });

        return $listing->fresh()->load(self::SUMMARY_RELATIONS);
    }

    public function deleteImage(
        HarvestListing $listing,
        HarvestListingImage $image
    ) {
        if ($image->harvest_listing_id !== $listing->id) {
            throw (new ModelNotFoundException())->setModel(
                HarvestListingImage::class,
                [$image->getKey()]
            );
        }

        DB::transaction(function () use ($listing, $image) {
            Storage::disk(self::IMAGE_STORAGE_DISK)->delete($image->image_path);
            $image->delete();
            $this->resequenceImages($listing);
        });

        return $listing->fresh()->load(self::SUMMARY_RELATIONS);
    }

    public function delete(HarvestListing $listing)
    {
        $listing->loadMissing('images');

        foreach ($listing->images as $image) {
            Storage::disk(self::IMAGE_STORAGE_DISK)->delete($image->image_path);
        }

        $listing->delete();
    }

    private function resequenceImages(HarvestListing $listing): void
    {
        $listing->images()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->values()
            ->each(function (HarvestListingImage $image, int $index) {
                $image->update([
                    'sort_order' => $index + 1,
                ]);
            });
    }

    private function initializeStockState(array $data): array
    {
        $totalQuantity = $this->toDecimal($data['quantity']);
        $data['available_quantity'] = $totalQuantity;
        $data['reserved_quantity'] = 0;
        $data['sold_quantity'] = 0;
        $data['status'] = $this->determineStockStatus(
            totalQuantity: $totalQuantity,
            availableQuantity: $totalQuantity,
            reservedQuantity: 0,
            soldQuantity: 0,
            availableUntil: $data['available_until'] ?? null,
            currentStatus: $data['status'] ?? HarvestListing::STATUS_AVAILABLE,
        );

        return $data;
    }

    private function assertOwnedStore(int $userId, mixed $farmId): void
    {
        $ownsStore = Farm::query()
            ->where('user_id', $userId)
            ->whereKey($farmId)
            ->exists();

        if (! $ownsStore) {
            throw ValidationException::withMessages([
                'farm_id' => ['You must select your own store profile before publishing a harvest listing.'],
            ]);
        }
    }

    private function refreshExpiredListing(HarvestListing $listing): void
    {
        $totalQuantity = $this->toDecimal($listing->quantity);
        $availableQuantity = $this->toDecimal($listing->available_quantity);
        $reservedQuantity = $this->toDecimal($listing->reserved_quantity);
        $soldQuantity = $this->toDecimal($listing->sold_quantity);
        $status = $this->determineStockStatus(
            totalQuantity: $totalQuantity,
            availableQuantity: $availableQuantity,
            reservedQuantity: $reservedQuantity,
            soldQuantity: $soldQuantity,
            availableUntil: $listing->available_until,
            currentStatus: $listing->status,
        );

        if ($status !== $listing->status) {
            $listing->update([
                'status' => $status,
            ]);
        }
    }

    private function determineStockStatus(
        float $totalQuantity,
        float $availableQuantity,
        float $reservedQuantity,
        float $soldQuantity,
        CarbonInterface|string|null $availableUntil,
        string $currentStatus
    ): string {
        if ($currentStatus === HarvestListing::STATUS_DONATED) {
            return HarvestListing::STATUS_DONATED;
        }

        if ($totalQuantity <= 0 || ($availableQuantity <= 0 && $reservedQuantity <= 0 && $soldQuantity >= $totalQuantity)) {
            return HarvestListing::STATUS_SOLD;
        }

        if ($this->isExpired($availableUntil)) {
            return HarvestListing::STATUS_EXPIRED;
        }

        if ($reservedQuantity > 0) {
            return HarvestListing::STATUS_RESERVED;
        }

        return HarvestListing::STATUS_AVAILABLE;
    }

    private function isExpired(
        CarbonInterface|string|null $availableUntil
    ): bool {
        if ($availableUntil === null) {
            return false;
        }

        $date = $availableUntil instanceof CarbonInterface
            ? $availableUntil
            : Carbon::parse($availableUntil);

        return $date->isBefore(now()->startOfDay());
    }

    private function toDecimal(float|int|string $value): float
    {
        return round((float) $value, 2);
    }
}
