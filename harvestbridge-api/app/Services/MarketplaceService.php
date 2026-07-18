<?php

namespace App\Services;

use App\Models\Crop;
use App\Models\HarvestListing;

class MarketplaceService
{
    private const DEFAULT_PAGE_SIZE = 10;
    private const MAX_PAGE_SIZE = 50;
    private const DEFAULT_SORT = 'newest';
    private const ACTIVE_STATUSES = [
        HarvestListing::STATUS_AVAILABLE,
        HarvestListing::STATUS_RESERVED,
    ];

    public function __construct(
        protected HarvestListingService $harvestListingService
    ) {}

    public function getAvailableHarvests(array $filters = [])
    {
        $this->harvestListingService->expireElapsedListings();
        $this->harvestListingService->expireElapsedFeaturedListings();

        $sort = $this->normalizeSortOption($filters['sort'] ?? null);
        $perPage = $this->resolvePerPage($filters['per_page'] ?? null);

        $query = HarvestListing::with([
            'crop',
            'farm',
            'farmer',
            'images',
        ]);

        $this->applyStatusScope($query, $filters);
        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);
        $this->applySorting($query, $sort);

        return $query
            ->paginate($perPage)
            ->withQueryString();
    }

    private function applyStatusScope($query, array $filters): void
    {
        $status = $filters['status'] ?? null;

        if ($status) {
            $query->where('status', $status);

            if (in_array($status, self::ACTIVE_STATUSES, true)) {
                $query->where('available_quantity', '>', 0);
            }

            return;
        }

        $query->whereIn('status', self::ACTIVE_STATUSES)
            ->where('available_quantity', '>', 0);
    }

    private function applySearch($query, array $filters): void
    {
        $search = $filters['search'] ?? null;

        if ($search) {
            $query->where(function ($nestedQuery) use ($search) {
                $nestedQuery->where('description', 'ILIKE', '%'.$search.'%')
                    ->orWhereHas('crop', function ($cropQuery) use ($search) {
                        $cropQuery->where('name', 'ILIKE', '%'.$search.'%');
                    })
                    ->orWhereHas('farmer', function ($farmerQuery) use ($search) {
                        $farmerQuery->where('name', 'ILIKE', '%'.$search.'%');
                    })
                    ->orWhereHas('farm', function ($farmQuery) use ($search) {
                        $farmQuery->where('farm_name', 'ILIKE', '%'.$search.'%')
                            ->orWhere('district', 'ILIKE', '%'.$search.'%');
                    });
            });
        }

        if (!empty($filters['crop_name'])) {
            $query->whereHas('crop', function ($cropQuery) use ($filters) {
                $cropQuery->where('name', 'ILIKE', '%'.$filters['crop_name'].'%');
            });
        }

        if (!empty($filters['farmer_name'])) {
            $query->whereHas('farmer', function ($farmerQuery) use ($filters) {
                $farmerQuery->where('name', 'ILIKE', '%'.$filters['farmer_name'].'%');
            });
        }

        if (!empty($filters['farm_name'])) {
            $query->whereHas('farm', function ($farmQuery) use ($filters) {
                $farmQuery->where('farm_name', 'ILIKE', '%'.$filters['farm_name'].'%');
            });
        }

        if (!empty($filters['description'])) {
            $query->where('description', 'ILIKE', '%'.$filters['description'].'%');
        }
    }

    private function applyFilters($query, array $filters): void
    {
        if (!empty($filters['district'])) {
            $query->whereHas('farm', function ($farmQuery) use ($filters) {
                $farmQuery->where('district', 'ILIKE', '%'.$filters['district'].'%');
            });
        }

        if (array_key_exists('min_price', $filters) && $filters['min_price'] !== null) {
            $query->where('price_per_unit', '>=', $filters['min_price']);
        }

        if (array_key_exists('max_price', $filters) && $filters['max_price'] !== null) {
            $query->where('price_per_unit', '<=', $filters['max_price']);
        }

        if (!empty($filters['quality_grade'])) {
            $query->where('quality_grade', 'ILIKE', $filters['quality_grade']);
        }

        if (!empty($filters['crop_category'])) {
            $query->whereHas('crop', function ($cropQuery) use ($filters) {
                $cropQuery->where('category', 'ILIKE', $filters['crop_category']);
            });
        }

        if (!empty($filters['harvest_date'])) {
            $query->whereDate('harvest_date', $filters['harvest_date']);
        }

        if (!empty($filters['available_until'])) {
            $query->whereDate('available_until', $filters['available_until']);
        }

        if (array_key_exists('featured', $filters) && $filters['featured'] !== null) {
            $featured = filter_var(
                $filters['featured'],
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            );

            if ($featured === true) {
                $query->currentlyFeatured();
            }

            if ($featured === false) {
                $query->notCurrentlyFeatured();
            }
        }

        if (!empty($filters['unit'])) {
            $query->where('unit', 'ILIKE', $filters['unit']);
        }
    }

    private function applySorting($query, string $sort): void
    {
        switch ($sort) {
            case 'oldest':
                $query->oldest();
                break;

            case 'lowest_price':
                $query->orderBy('price_per_unit');
                break;

            case 'highest_price':
                $query->orderByDesc('price_per_unit');
                break;

            case 'featured':
            case 'featured_first':
                $query->orderByRaw(
                    "CASE
                        WHEN is_featured = true
                            AND (featured_until IS NULL OR featured_until >= CURRENT_DATE)
                        THEN 0
                        ELSE 1
                    END"
                )->latest();
                break;

            case 'harvest_date':
                $query->orderByDesc('harvest_date')
                    ->orderByDesc('id');
                break;

            case 'alphabetical':
                $query->orderBy(
                    Crop::select('name')
                        ->whereColumn('crops.id', 'harvest_listings.crop_id')
                )->orderByDesc('id');
                break;

            case 'newest':
            default:
                $query->latest();
                break;
        }
    }

    private function normalizeSortOption(?string $sort): string
    {
        return match ($sort) {
            'latest', 'newest', null => 'newest',
            'price_low', 'lowest_price' => 'lowest_price',
            'price_high', 'highest_price' => 'highest_price',
            'featured', 'featured_first', 'oldest', 'harvest_date', 'alphabetical' => $sort,
            default => self::DEFAULT_SORT,
        };
    }

    private function resolvePerPage(mixed $perPage): int
    {
        if ($perPage === null) {
            return self::DEFAULT_PAGE_SIZE;
        }

        $resolved = (int) $perPage;

        if ($resolved < 1) {
            return self::DEFAULT_PAGE_SIZE;
        }

        return min($resolved, self::MAX_PAGE_SIZE);
    }
}
