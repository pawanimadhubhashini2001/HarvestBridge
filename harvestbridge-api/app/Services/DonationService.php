<?php

namespace App\Services;

use App\Models\Donation;
use App\Models\HarvestListing;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DonationService
{
    private const EARTH_RADIUS_KM = 6371;
    private const DEFAULT_RADIUS_KM = 50;
    private const MAX_RADIUS_KM = 200;
    private const DEFAULT_PAGE_SIZE = 15;
    private const MAX_PAGE_SIZE = 50;

    public function getAll(User $farmer)
    {
        return Donation::query()
            ->with($this->resourceRelations())
            ->where('farmer_id', $farmer->id)
            ->latest()
            ->get();
    }

    public function getAvailableForNgo(array $filters): LengthAwarePaginator
    {
        $sort = $this->normalizeMarketplaceSort(
            $filters['sort'] ?? null,
            $this->hasLocationSearch($filters)
        );

        $query = Donation::query()
            ->with($this->resourceRelations())
            ->where('status', Donation::STATUS_AVAILABLE)
            ->where(function (Builder $builder) {
                $builder
                    ->whereHas('harvestListing.farm', fn ($farmQuery) => $farmQuery->where('is_suspended', false))
                    ->orWhereHas('farmerStore', fn ($storeQuery) => $storeQuery->where('is_suspended', false));
            })
            ->where(function (Builder $builder) {
                $builder->whereNull('available_until')
                    ->orWhereDate('available_until', '>=', now()->toDateString());
            });

        $this->applyMarketplaceJoins($query, $filters);
        $this->applySearch($query, $filters['search'] ?? null);
        $this->applyLocationFilter($query, $filters);
        $this->applyMarketplaceSorting($query, $sort);

        return $query
            ->paginate($this->resolvePerPage($filters['per_page'] ?? null))
            ->withQueryString();
    }

    public function create(User $farmer, array $data): Donation
    {
        $listing = null;

        if (! empty($data['harvest_listing_id'])) {
            $listing = HarvestListing::query()
                ->with(['crop', 'farm', 'farmer'])
                ->findOrFail($data['harvest_listing_id']);

            $this->assertListingOwnership($listing, $farmer);
            $this->assertListingAvailableForDonation($listing);
            $this->assertDonationQuantityWithinAvailableStock($listing, (float) $data['quantity']);
        }

        $payload = [
            'farmer_id' => $farmer->id,
            'harvest_listing_id' => $listing?->id,
            'crop_name' => $listing?->crop?->name ?? $listing?->crop_name ?? $data['crop_name'] ?? null,
            'crop_category' => $listing?->crop?->category ?? $listing?->crop_category ?? $data['crop_category'] ?? null,
            'quantity' => $data['quantity'],
            'unit' => $data['unit'],
            'price_per_unit' => $data['price_per_unit'] ?? null,
            'description' => $data['description'],
            'pickup_location' => $data['pickup_location'],
            'pickup_date' => $data['pickup_date'] ?? null,
            'pickup_time' => $data['pickup_time'] ?? null,
            'available_until' => $data['available_until'],
            'collected_at' => null,
            'status' => Donation::STATUS_AVAILABLE,
            'notes' => $data['notes'] ?? null,
        ];

        return Donation::query()->create($payload)->load($this->resourceRelations());
    }

    public function update(Donation $donation, array $data): Donation
    {
        $listing = $donation->harvestListing;

        if (array_key_exists('harvest_listing_id', $data)) {
            $nextHarvestListingId = $data['harvest_listing_id'];

            if ($nextHarvestListingId === null) {
                $listing = null;
            } elseif ((int) $nextHarvestListingId !== (int) $donation->harvest_listing_id) {
                $listing = HarvestListing::query()
                    ->with(['crop', 'farm', 'farmer'])
                    ->findOrFail($nextHarvestListingId);

                $this->assertListingOwnership($listing, $donation->farmer);
                $this->assertListingAvailableForDonation($listing);
            }
        }

        if (array_key_exists('quantity', $data) && $listing !== null) {
            $this->assertDonationQuantityWithinAvailableStock($listing, (float) $data['quantity']);
        }

        if ($listing !== null) {
            $data['crop_name'] = $listing->crop?->name ?? $listing->crop_name;
            $data['crop_category'] = $listing->crop?->category ?? $listing->crop_category;
        }

        $donation->update($data);

        return $donation->fresh()->load($this->resourceRelations());
    }

    public function delete(Donation $donation): void
    {
        $donation->delete();
    }

    public function schedulePickup(Donation $donation, array $data, User $ngo): Donation
    {
        if ((int) $donation->ngo_id !== (int) $ngo->id) {
            throw ValidationException::withMessages([
                'donation' => ['This donation is not assigned to you.'],
            ]);
        }

        if ($donation->status !== Donation::STATUS_APPROVED) {
            throw ValidationException::withMessages([
                'donation' => ['Donation is not ready for pickup.'],
            ]);
        }

        $donation->update([
            'pickup_date' => $data['pickup_date'],
            'pickup_time' => $data['pickup_time'],
            'status' => Donation::STATUS_PICKED_UP,
        ]);

        return $donation->fresh()->load($this->resourceRelations());
    }

    public function complete(Donation $donation, User $ngo): Donation
    {
        if ((int) $donation->ngo_id !== (int) $ngo->id) {
            throw ValidationException::withMessages([
                'donation' => ['Unauthorized.'],
            ]);
        }

        if ($donation->collectionStatus() === 'collected') {
            return $donation->fresh()->load($this->resourceRelations());
        }

        if (! in_array($donation->status, [Donation::STATUS_APPROVED, Donation::STATUS_PICKED_UP], true)) {
            throw ValidationException::withMessages([
                'donation' => ['Donation is not ready to be marked as collected.'],
            ]);
        }

        $donation->update([
            'status' => Donation::STATUS_COMPLETED,
            'collected_at' => now(),
        ]);

        return $donation->fresh()->load($this->resourceRelations());
    }

    private function resourceRelations(): array
    {
        return [
            'farmer:id,name,email,phone',
            'ngo:id,name,email,phone',
            'farmerStore:id,user_id,farm_name,store_logo_path,phone_number,district,address,latitude,longitude,business_status',
            'harvestListing:id,user_id,farm_id,crop_id,crop_name,crop_category,description,quantity,available_quantity,unit,available_until,status',
            'harvestListing.crop:id,name,category',
            'harvestListing.farm:id,farm_name,store_logo_path,phone_number,district,address,latitude,longitude,business_status',
        ];
    }

    private function assertListingOwnership(HarvestListing $listing, User $farmer): void
    {
        if ((int) $listing->user_id !== (int) $farmer->id) {
            throw ValidationException::withMessages([
                'harvest_listing_id' => ['You can only donate your own harvest listings.'],
            ]);
        }
    }

    private function assertListingAvailableForDonation(HarvestListing $listing): void
    {
        if ($listing->status !== HarvestListing::STATUS_AVAILABLE) {
            throw ValidationException::withMessages([
                'harvest_listing_id' => ['Harvest listing is not available.'],
            ]);
        }

        if ($listing->donation()->exists()) {
            throw ValidationException::withMessages([
                'harvest_listing_id' => ['This harvest listing already has a donation listing.'],
            ]);
        }
    }

    private function assertDonationQuantityWithinAvailableStock(HarvestListing $listing, float $quantity): void
    {
        $availableQuantity = $listing->available_quantity !== null
            ? (float) $listing->available_quantity
            : (float) $listing->quantity;

        if ($quantity > $availableQuantity) {
            throw ValidationException::withMessages([
                'quantity' => ['Donation quantity exceeds the available stock of this listing.'],
            ]);
        }
    }

    private function applyMarketplaceJoins(Builder $query, array $filters): void
    {
        if (
            ! $this->hasLocationSearch($filters)
            && empty($filters['search'])
        ) {
            return;
        }

        $query->leftJoin('harvest_listings as donation_listings', 'donation_listings.id', '=', 'donations.harvest_listing_id')
            ->leftJoin('farms as donation_farms', 'donation_farms.id', '=', 'donation_listings.farm_id')
            ->join('users as donation_farmers', 'donation_farmers.id', '=', 'donations.farmer_id')
            ->leftJoin('crops as donation_crops', 'donation_crops.id', '=', 'donation_listings.crop_id')
            ->leftJoinSub(
                DB::table('farms')
                    ->selectRaw('MAX(id) as id, user_id')
                    ->groupBy('user_id'),
                'latest_donation_stores',
                fn ($join) => $join->on('latest_donation_stores.user_id', '=', 'donations.farmer_id')
            )
            ->leftJoin('farms as donation_store_profiles', 'donation_store_profiles.id', '=', 'latest_donation_stores.id')
            ->select('donations.*');
    }

    private function applySearch(Builder $query, ?string $search): void
    {
        $search = trim((string) $search);

        if ($search === '') {
            return;
        }

        $query->where(function (Builder $builder) use ($search) {
            $pattern = '%'.$search.'%';

            $builder->where('donations.description', 'like', $pattern)
                ->orWhere('donations.notes', 'like', $pattern)
                ->orWhere('donations.pickup_location', 'like', $pattern)
                ->orWhere('donations.crop_name', 'like', $pattern)
                ->orWhere('donation_crops.name', 'like', $pattern)
                ->orWhere('donation_farms.farm_name', 'like', $pattern)
                ->orWhere('donation_store_profiles.farm_name', 'like', $pattern)
                ->orWhere('donation_farms.district', 'like', $pattern)
                ->orWhere('donation_store_profiles.district', 'like', $pattern)
                ->orWhere('donation_farmers.name', 'like', $pattern);
        });
    }

    private function applyLocationFilter(Builder $query, array $filters): void
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

        $query->whereNotNull('donation_store_profiles.latitude')
            ->whereNotNull('donation_store_profiles.longitude')
            ->selectRaw("ROUND(($distanceFormula)::numeric, 2) as distance_km", $bindings)
            ->whereRaw("($distanceFormula) <= ?", [
                ...$bindings,
                $radius,
            ]);
    }

    private function applyMarketplaceSorting(Builder $query, string $sort): void
    {
        match ($sort) {
            'nearest' => $query->orderBy('distance_km')
                ->orderByDesc('quantity')
                ->latest('donations.created_at'),
            'quantity' => $query->orderByDesc('quantity')
                ->orderBy('available_until')
                ->latest('donations.created_at'),
            default => $query->latest('donations.created_at'),
        };
    }

    private function normalizeMarketplaceSort(?string $sort, bool $hasLocationSearch): string
    {
        if ($sort === 'nearest' && $hasLocationSearch) {
            return 'nearest';
        }

        if ($sort === 'quantity') {
            return 'quantity';
        }

        return $hasLocationSearch ? 'nearest' : 'newest';
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

    private function resolvePerPage(mixed $perPage): int
    {
        if ($perPage === null) {
            return self::DEFAULT_PAGE_SIZE;
        }

        $resolvedPerPage = (int) $perPage;

        if ($resolvedPerPage < 1) {
            return self::DEFAULT_PAGE_SIZE;
        }

        return min($resolvedPerPage, self::MAX_PAGE_SIZE);
    }

    private function distanceFormula(string $tableAlias = 'donation_store_profiles'): string
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
