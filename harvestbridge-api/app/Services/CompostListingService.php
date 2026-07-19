<?php

namespace App\Services;

use App\Models\CompostListing;
use App\Models\Farm;
use App\Models\HarvestListing;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class CompostListingService
{
    private const IMAGE_STORAGE_DISK = 'public';
    private const IMAGE_DIRECTORY = 'compost-listings';
    private const MAX_IMAGES_PER_LISTING = 5;
    private const EARTH_RADIUS_KM = 6371;
    private const DEFAULT_RADIUS_KM = 50;
    private const MAX_RADIUS_KM = 200;

    private const RELATIONS = [
        'farmer',
        'harvestListing.farm',
        'farmerStore',
        'images',
    ];

    public function getAll(User $farmer)
    {
        return CompostListing::query()
            ->with(self::RELATIONS)
            ->where('farmer_id', $farmer->id)
            ->latest()
            ->get();
    }

    public function create(
        User $farmer,
        array $data
    ) {
        return DB::transaction(function () use ($farmer, $data) {
            $images = $data['images'] ?? [];

            $this->assertLinkedHarvestListingOwnership(
                $farmer,
                $data['harvest_listing_id'] ?? null
            );

            if (count($images) > self::MAX_IMAGES_PER_LISTING) {
                throw ValidationException::withMessages([
                    'images' => [
                        'A compost listing may have up to '.self::MAX_IMAGES_PER_LISTING.' images.',
                    ],
                ]);
            }

            $listing = CompostListing::query()->create([
                'farmer_id' => $farmer->id,
                'harvest_listing_id' => $data['harvest_listing_id'] ?? null,
                'waste_type' => $data['waste_type'],
                'quantity' => $data['quantity'],
                'unit' => $data['unit'],
                'pickup_location' => $data['pickup_location'],
                'available_from' => $data['available_from'],
                'available_until' => $data['available_until'] ?? null,
                'status' => CompostListing::STATUS_AVAILABLE,
                'notes' => $this->resolveDescription($data),
            ]);

            $this->storeImages($listing, $images);

            return $listing->fresh()->load(self::RELATIONS);
        });
    }

    public function update(
        CompostListing $listing,
        array $data
    ) {
        return DB::transaction(function () use ($listing, $data) {
            $payload = $data;

            if (array_key_exists('harvest_listing_id', $data)) {
                $this->assertLinkedHarvestListingOwnership(
                    $listing->farmer,
                    $data['harvest_listing_id']
                );
            }

            if (array_key_exists('description', $data) || array_key_exists('notes', $data)) {
                $payload['notes'] = $this->resolveDescription($data);
            }

            unset($payload['images'], $payload['description']);

            $listing->update($payload);

            if (array_key_exists('images', $data)) {
                $this->replaceImages($listing, $data['images'] ?? []);
            }

            return $listing->fresh()->load(self::RELATIONS);
        });
    }

    public function delete(
        CompostListing $listing
    ) {
        $listing->loadMissing('images');

        foreach ($listing->images as $image) {
            Storage::disk(self::IMAGE_STORAGE_DISK)->delete($image->image_path);
        }

        $listing->delete();
    }

    public function marketplace(array $filters = [])
    {
        $query = CompostListing::query()
            ->where('status', CompostListing::STATUS_AVAILABLE)
            ->whereHas('farmerStore', fn ($storeQuery) => $storeQuery->where('is_suspended', false))
            ->whereDate('available_from', '<=', now()->toDateString())
            ->where(function ($builder) {
                $builder->whereNull('available_until')
                    ->orWhereDate('available_until', '>=', now()->toDateString());
            })
            ->with(self::RELATIONS);

        $this->applyNearbyJoin($query, $filters);

        if (! empty($filters['waste_type'])) {
            $query->where(
                'waste_type',
                'ILIKE',
                '%'.$filters['waste_type'].'%'
            );
        }

        if (! empty($filters['pickup_location'])) {
            $query->where(
                'pickup_location',
                'ILIKE',
                '%'.$filters['pickup_location'].'%'
            );
        }

        if (! empty($filters['date'])) {
            $query->whereDate(
                'available_from',
                '<=',
                $filters['date']
            );

            $query->where(function ($builder) use ($filters) {
                $builder->whereNull('available_until')
                    ->orWhereDate(
                        'available_until',
                        '>=',
                        $filters['date']
                    );
            });
        }

        $this->applyNearbyFilter($query, $filters);

        return $query
            ->when(
                $this->hasLocationSearch($filters),
                fn ($builder) => $builder->orderBy('distance_km')->latest('compost_listings.created_at'),
                fn ($builder) => $builder->latest()
            )
            ->get();
    }

    /**
     * @param UploadedFile[] $images
     */
    private function storeImages(CompostListing $listing, array $images): void
    {
        $sortOrder = 0;

        foreach ($images as $image) {
            $sortOrder++;

            $path = $image->store(
                self::IMAGE_DIRECTORY.'/'.$listing->id,
                self::IMAGE_STORAGE_DISK
            );

            $listing->images()->create([
                'image_path' => $path,
                'sort_order' => $sortOrder,
            ]);
        }
    }

    /**
     * @param UploadedFile[] $images
     */
    private function replaceImages(CompostListing $listing, array $images): void
    {
        if (count($images) > self::MAX_IMAGES_PER_LISTING) {
            throw ValidationException::withMessages([
                'images' => [
                    'A compost listing may have up to '.self::MAX_IMAGES_PER_LISTING.' images.',
                ],
            ]);
        }

        $listing->loadMissing('images');

        foreach ($listing->images as $image) {
            Storage::disk(self::IMAGE_STORAGE_DISK)->delete($image->image_path);
        }

        $listing->images()->delete();
        $this->storeImages($listing, $images);
    }

    private function resolveDescription(array $data): ?string
    {
        if (array_key_exists('description', $data)) {
            return $data['description'];
        }

        return $data['notes'] ?? null;
    }

    private function assertLinkedHarvestListingOwnership(User $farmer, mixed $harvestListingId): void
    {
        if ($harvestListingId === null) {
            return;
        }

        $ownsListing = HarvestListing::query()
            ->whereKey($harvestListingId)
            ->where('user_id', $farmer->id)
            ->exists();

        if (! $ownsListing) {
            throw ValidationException::withMessages([
                'harvest_listing_id' => [
                    'You may only link compost listings to your own harvest listings.',
                ],
            ]);
        }
    }

    private function applyNearbyJoin($query, array $filters): void
    {
        if (! $this->hasLocationSearch($filters)) {
            return;
        }

        $latestStoreSubquery = Farm::query()
            ->selectRaw('MAX(id) as id, user_id')
            ->groupBy('user_id');

        $query->leftJoinSub($latestStoreSubquery, 'latest_compost_store', function ($join) {
            $join->on('latest_compost_store.user_id', '=', 'compost_listings.farmer_id');
        })->leftJoin('farms as compost_stores', 'compost_stores.id', '=', 'latest_compost_store.id')
            ->select('compost_listings.*');
    }

    private function applyNearbyFilter($query, array $filters): void
    {
        if (! $this->hasLocationSearch($filters)) {
            return;
        }

        $latitude = (float) $filters['latitude'];
        $longitude = (float) $filters['longitude'];
        $radius = $this->resolveRadius($filters['radius'] ?? null);
        $distanceFormula = $this->distanceFormula();
        $bindings = [
            $latitude,
            $longitude,
            $latitude,
        ];

        $query->whereNotNull('compost_stores.latitude')
            ->whereNotNull('compost_stores.longitude')
            ->selectRaw("ROUND(($distanceFormula)::numeric, 2) as distance_km", $bindings)
            ->whereRaw("($distanceFormula) <= ?", [
                ...$bindings,
                $radius,
            ]);
    }

    private function hasLocationSearch(array $filters): bool
    {
        return array_key_exists('latitude', $filters)
            && array_key_exists('longitude', $filters)
            && $filters['latitude'] !== null
            && $filters['longitude'] !== null;
    }

    private function resolveRadius(mixed $radius): float
    {
        if ($radius === null) {
            return self::DEFAULT_RADIUS_KM;
        }

        $resolvedRadius = (float) $radius;

        if ($resolvedRadius < 1) {
            return self::DEFAULT_RADIUS_KM;
        }

        return min($resolvedRadius, self::MAX_RADIUS_KM);
    }

    private function distanceFormula(string $tableAlias = 'compost_stores'): string
    {
        return '('.self::EARTH_RADIUS_KM.' * acos(
            LEAST(
                1.0,
                GREATEST(
                    -1.0,
                    cos(radians(?))
                    * cos(radians('.$tableAlias.'.latitude))
                    * cos(radians('.$tableAlias.'.longitude) - radians(?))
                    + sin(radians(?))
                    * sin(radians('.$tableAlias.'.latitude))
                )
            )
        ))';
    }
}
