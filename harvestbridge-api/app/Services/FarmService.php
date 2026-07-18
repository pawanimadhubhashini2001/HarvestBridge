<?php

namespace App\Services;

use App\Models\Farm;
use App\Models\HarvestListing;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class FarmService
{
    private const MEDIA_DISK = 'public';
    private const STORE_LOGO_DIRECTORY = 'stores/logos';
    private const STORE_COVER_DIRECTORY = 'stores/covers';
    private const EARTH_RADIUS_KM = 6371;
    private const DEFAULT_PUBLIC_PRODUCTS_PAGE_SIZE = 12;
    private const MAX_PUBLIC_PRODUCTS_PAGE_SIZE = 50;

    public function getAll(User $user): Collection
    {
        return $user
            ->farms()
            ->with([
                'user:id,name,email,phone',
                'activeHarvestListings:id,farm_id,crop_id',
            ])
            ->latest()
            ->get();
    }

    public function getMyStore(User $user): Farm
    {
        $store = $user
            ->store()
            ->with([
                'user:id,name,email,phone',
                'activeHarvestListings:id,farm_id,crop_id',
            ])
            ->first();

        if ($store === null) {
            throw (new ModelNotFoundException())->setModel(Farm::class);
        }

        return $store;
    }

    public function getDetails(Farm $farm): Farm
    {
        return $farm->load([
            'user:id,name,email,phone',
            'activeHarvestListings:id,farm_id,crop_id',
        ]);
    }

    public function getPublicStoreDetails(Farm $farm, array $filters = []): Farm
    {
        $query = Farm::query()
            ->whereKey($farm->getKey())
            ->with([
                'user:id,name,phone',
                'activeHarvestListings:id,farm_id,crop_id',
            ]);

        if ($this->hasLocationSearch($filters)) {
            $latitude = (float) $filters['latitude'];
            $longitude = (float) $filters['longitude'];
            $distanceFormula = $this->distanceFormula('farms');

            $query->select('farms.*')
                ->selectRaw(
                    "CASE
                        WHEN farms.latitude IS NULL OR farms.longitude IS NULL THEN NULL
                        ELSE ROUND(($distanceFormula)::numeric, 2)
                    END as distance_km",
                    [$latitude, $longitude, $latitude]
                );
        }

        return $query->firstOrFail();
    }

    public function getPublicStoreProducts(Farm $farm, array $filters = []): LengthAwarePaginator
    {
        $query = HarvestListing::query()
            ->where('farm_id', $farm->getKey())
            ->whereIn('status', HarvestListing::marketplaceVisibleStatuses())
            ->where('available_quantity', '>', 0)
            ->with([
                'crop:id,name,category',
                'farm:id,farm_name,district,address,latitude,longitude,business_status',
                'farmer:id,name',
                'images:id,harvest_listing_id,image_path,sort_order',
            ]);

        if ($this->hasLocationSearch($filters)) {
            $latitude = (float) $filters['latitude'];
            $longitude = (float) $filters['longitude'];
            $distanceFormula = $this->distanceFormula('public_store_farms');

            $query->join(
                'farms as public_store_farms',
                'public_store_farms.id',
                '=',
                'harvest_listings.farm_id'
            )
                ->select('harvest_listings.*')
                ->selectRaw(
                    "CASE
                        WHEN public_store_farms.latitude IS NULL OR public_store_farms.longitude IS NULL THEN NULL
                        ELSE ROUND(($distanceFormula)::numeric, 2)
                    END as distance_km",
                    [$latitude, $longitude, $latitude]
                );
        }

        return $query
            ->orderByRaw(
                "CASE
                    WHEN is_featured = true
                        AND (featured_until IS NULL OR featured_until >= CURRENT_DATE)
                    THEN 0
                    ELSE 1
                END"
            )
            ->latest()
            ->paginate($this->resolvePublicProductsPerPage($filters['per_page'] ?? null))
            ->withQueryString();
    }

    public function getStoreLocation(Farm $farm): Farm
    {
        return $farm->loadMissing([
            'user:id,name,email,phone',
        ]);
    }

    public function getStoreStatus(Farm $farm): Farm
    {
        return $farm;
    }

    public function updateStoreLocation(Farm $farm, array $data): Farm
    {
        $farm->update([
            'district' => $data['district'],
            'address' => $data['address'],
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
        ]);

        return $this->getStoreLocation($farm->fresh());
    }

    public function updateStoreStatus(Farm $farm, array $data): Farm
    {
        $farm->update([
            'business_status' => $this->normalizeBusinessStatus($data['business_status']),
        ]);

        return $this->getDetails($farm->fresh());
    }

    public function create(User $user, array $data)
    {
        $farm = DB::transaction(function () use ($user, $data) {
            $existingStoreId = Farm::query()
                ->ownedBy($user)
                ->lockForUpdate()
                ->value('id');

            if ($existingStoreId !== null) {
                throw ValidationException::withMessages([
                    'store' => ['A farmer can only create one store profile.'],
                ]);
            }

            return $user->farms()->create(
                $this->preparePayload($data)
            );
        });

        return $this->getDetails($farm->fresh());
    }

    public function update(Farm $farm, array $data)
    {
        $farm->update(
            $this->preparePayload($data, $farm)
        );

        return $this->getDetails($farm->fresh());
    }

    public function uploadLogo(Farm $farm, UploadedFile $image): Farm
    {
        $farm->update([
            'store_logo_path' => $this->storeLogo($image, $farm->store_logo_path),
        ]);

        return $this->getDetails($farm->fresh());
    }

    public function uploadCover(Farm $farm, UploadedFile $image): Farm
    {
        $farm->update([
            'store_cover_image_path' => $this->storeCoverImage($image, $farm->store_cover_image_path),
        ]);

        return $this->getDetails($farm->fresh());
    }

    public function deleteLogo(Farm $farm): Farm
    {
        $this->deleteStoredMedia($farm->store_logo_path);
        $farm->update([
            'store_logo_path' => null,
        ]);

        return $this->getDetails($farm->fresh());
    }

    public function deleteCover(Farm $farm): Farm
    {
        $this->deleteStoredMedia($farm->store_cover_image_path);
        $farm->update([
            'store_cover_image_path' => null,
        ]);

        return $this->getDetails($farm->fresh());
    }

    public function delete(Farm $farm)
    {
        if ($farm->harvestListings()->exists()) {
            throw ValidationException::withMessages([
                'store' => ['This store cannot be deleted because it contains active harvest listings. Please remove all listings first.'],
            ]);
        }

        $this->deleteStoredMedia($farm->store_logo_path);
        $this->deleteStoredMedia($farm->store_cover_image_path);
        $farm->delete();
    }

    private function preparePayload(array $data, ?Farm $farm = null): array
    {
        if (! empty($data['store_name'] ?? null)) {
            $data['farm_name'] = $data['store_name'];
        }

        if (array_key_exists('store_description', $data)) {
            $data['description'] = $data['store_description'];
        }

        if (array_key_exists('business_status', $data)) {
            $data['business_status'] = $this->normalizeBusinessStatus(
                $data['business_status']
            );
        }

        if (($data['store_logo'] ?? null) instanceof UploadedFile) {
            $data['store_logo_path'] = $this->storeLogo(
                $data['store_logo'],
                $farm?->store_logo_path
            );
        }

        if (($data['store_image'] ?? null) instanceof UploadedFile) {
            $data['store_logo_path'] = $this->storeLogo(
                $data['store_image'],
                $farm?->store_logo_path
            );
        }

        if (($data['store_cover_image'] ?? null) instanceof UploadedFile) {
            $data['store_cover_image_path'] = $this->storeCoverImage(
                $data['store_cover_image'],
                $farm?->store_cover_image_path
            );
        }

        unset(
            $data['store_name'],
            $data['store_description'],
            $data['store_image'],
            $data['store_logo'],
            $data['store_cover_image']
        );

        return $data;
    }

    private function normalizeBusinessStatus(mixed $status): string
    {
        $normalizedStatus = strtolower(trim((string) $status));

        return match ($normalizedStatus) {
            'active' => Farm::BUSINESS_STATUS_OPEN,
            'inactive' => Farm::BUSINESS_STATUS_CLOSED,
            'temporarily closed' => Farm::BUSINESS_STATUS_TEMPORARILY_CLOSED,
            Farm::BUSINESS_STATUS_TEMPORARILY_CLOSED => Farm::BUSINESS_STATUS_TEMPORARILY_CLOSED,
            Farm::BUSINESS_STATUS_CLOSED => Farm::BUSINESS_STATUS_CLOSED,
            default => Farm::BUSINESS_STATUS_OPEN,
        };
    }

    private function deleteStoredMedia(?string $path): void
    {
        if (! $path) {
            return;
        }

        Storage::disk(self::MEDIA_DISK)->delete($path);
    }

    private function storeLogo(UploadedFile $image, ?string $existingPath = null): string
    {
        if ($existingPath) {
            $this->deleteStoredMedia($existingPath);
        }

        return $image->store(
            self::STORE_LOGO_DIRECTORY,
            self::MEDIA_DISK
        );
    }

    private function storeCoverImage(UploadedFile $image, ?string $existingPath = null): string
    {
        if ($existingPath) {
            $this->deleteStoredMedia($existingPath);
        }

        return $image->store(
            self::STORE_COVER_DIRECTORY,
            self::MEDIA_DISK
        );
    }

    private function hasLocationSearch(array $filters): bool
    {
        return array_key_exists('latitude', $filters)
            && array_key_exists('longitude', $filters)
            && $filters['latitude'] !== null
            && $filters['longitude'] !== null;
    }

    private function resolvePublicProductsPerPage(mixed $perPage): int
    {
        if ($perPage === null) {
            return self::DEFAULT_PUBLIC_PRODUCTS_PAGE_SIZE;
        }

        $resolvedPerPage = (int) $perPage;

        if ($resolvedPerPage < 1) {
            return self::DEFAULT_PUBLIC_PRODUCTS_PAGE_SIZE;
        }

        return min($resolvedPerPage, self::MAX_PUBLIC_PRODUCTS_PAGE_SIZE);
    }

    private function distanceFormula(string $table): string
    {
        return '('.self::EARTH_RADIUS_KM.' * acos(
            LEAST(
                1.0,
                GREATEST(
                    -1.0,
                    cos(radians(?))
                    * cos(radians('.$table.'.latitude))
                    * cos(radians('.$table.'.longitude) - radians(?))
                    + sin(radians(?))
                    * sin(radians('.$table.'.latitude))
                )
            )
        ))';
    }
}
