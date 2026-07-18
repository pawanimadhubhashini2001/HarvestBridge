<?php

namespace App\Services;

use App\Models\Crop;
use App\Models\HarvestListing;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Builder;

class MarketplaceService
{
    private const EARTH_RADIUS_KM = 6371;
    private const COUNTRYWIDE_SCOPE = 'countrywide';
    private const DEFAULT_PAGE_SIZE = 10;
    private const MAX_PAGE_SIZE = 50;
    private const DEFAULT_SORT = 'newest';
    private const DEFAULT_RADIUS_KM = 50;
    private const MAX_RADIUS_KM = 200;
    private const AUTO_EXPANSION_RADII = [50, 75, 100];
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
        $hasLocationSearch = $this->hasLocationSearch($filters);
        $hasSearch = $this->hasSearch($filters);

        $query = $this->marketplaceIndexQuery();

        $this->applyStatusScope($query, $filters);
        $this->applyLocationSearch($query, $filters);
        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);
        $this->applySorting($query, $sort, $hasLocationSearch);

        if ($hasSearch) {
            $this->applySearchRanking($query, $hasLocationSearch);
        }

        return $query
            ->paginate($perPage)
            ->withQueryString();
    }

    public function searchMarketplace(array $filters = []): array
    {
        $searchContext = $this->resolveMarketplaceSearchContext($filters);
        $listings = $this->getAvailableHarvests(
            $searchContext['effective_filters']
        );

        return [
            'listings' => $listings,
            'nearby_suggestions' => $this->getNearbySuggestions(
                $searchContext['effective_filters']
            ),
            'used_radius' => $searchContext['used_radius'],
            'results_found' => $listings->total(),
            'expanded' => $searchContext['expanded'],
            'search_scope' => $searchContext['search_scope'],
            'message' => $this->buildExpansionMessage(
                $filters,
                $searchContext,
                $listings->total()
            ),
        ];
    }

    public function getMarketplaceProduct(HarvestListing $harvestListing): HarvestListing
    {
        $this->harvestListingService->expireElapsedListings();
        $this->harvestListingService->expireElapsedFeaturedListings();

        return HarvestListing::query()
            ->whereKey($harvestListing->getKey())
            ->whereIn('status', self::ACTIVE_STATUSES)
            ->where('available_quantity', '>', 0)
            ->with([
                'crop:id,name,category',
                'farmer:id,name',
                'farm:id,user_id,farm_name,description,store_logo_path,store_cover_image_path,phone_number,whatsapp_number,email,district,address,latitude,longitude,business_hours,business_status,updated_at',
                'farm.user:id,name,phone',
                'images:id,harvest_listing_id,image_path,sort_order',
            ])
            ->firstOrFail();
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
            $search = trim($search);

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

            $this->applyMatchedFieldMetadata($query, $search);
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

    private function applyLocationSearch($query, array $filters): void
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

        $query->join(
            'farms as marketplace_farms',
            'marketplace_farms.id',
            '=',
            'harvest_listings.farm_id'
        )
            ->select('harvest_listings.*')
            ->selectRaw("ROUND(($distanceFormula)::numeric, 2) as distance_km", $bindings)
            ->whereNotNull('marketplace_farms.latitude')
            ->whereNotNull('marketplace_farms.longitude');

        if (! $this->isCountrywideSearch($filters)) {
            $query->whereRaw("($distanceFormula) <= ?", [
                ...$bindings,
                $radius,
            ]);
        }
    }

    private function applySorting($query, string $sort, bool $hasLocationSearch): void
    {
        if ($hasLocationSearch && in_array($sort, ['newest', 'distance'], true)) {
            $this->applyNearbyDefaultSorting($query);

            return;
        }

        switch ($sort) {
            case 'oldest':
                $query->oldest();
                break;

            case 'availability':
                $query->orderByDesc('available_quantity');

                if ($hasLocationSearch) {
                    $query->orderBy('distance_km');
                }

                $query->orderByRaw($this->qualityGradeSortExpression())
                    ->orderBy('price_per_unit')
                    ->orderByDesc('id');
                break;

            case 'lowest_price':
                $query->orderBy('price_per_unit');
                break;

            case 'highest_price':
                $query->orderByDesc('price_per_unit');
                break;

            case 'quality_grade':
                $query->orderByRaw($this->qualityGradeSortExpression())
                    ->orderByRaw('quality_grade ASC NULLS LAST');

                if ($hasLocationSearch) {
                    $query->orderBy('distance_km');
                }

                $query->orderByDesc('available_quantity')
                    ->orderBy('price_per_unit')
                    ->orderByDesc('id');
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
            'distance', 'availability', 'quality_grade' => $sort,
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

    private function hasLocationSearch(array $filters): bool
    {
        return array_key_exists('latitude', $filters)
            && array_key_exists('longitude', $filters)
            && $filters['latitude'] !== null
            && $filters['longitude'] !== null;
    }

    private function hasSearch(array $filters): bool
    {
        return isset($filters['search'])
            && Str::of((string) $filters['search'])->trim()->isNotEmpty();
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

    private function resolveMarketplaceSearchContext(array $filters): array
    {
        if (! $this->hasLocationSearch($filters)) {
            return [
                'effective_filters' => $filters,
                'used_radius' => null,
                'expanded' => false,
                'search_scope' => null,
            ];
        }

        $requestedRadius = $filters['radius'] ?? null;

        if ($requestedRadius !== null) {
            return [
                'effective_filters' => [
                    ...$filters,
                    'radius' => $this->resolveRadius($requestedRadius),
                ],
                'used_radius' => $this->resolveRadius($requestedRadius),
                'expanded' => false,
                'search_scope' => 'radius',
            ];
        }

        foreach (self::AUTO_EXPANSION_RADII as $radius) {
            $effectiveFilters = [
                ...$filters,
                'radius' => $radius,
            ];

            if ($this->countMarketplaceResults($effectiveFilters) > 0) {
                return [
                    'effective_filters' => $effectiveFilters,
                    'used_radius' => $radius,
                    'expanded' => $radius !== self::DEFAULT_RADIUS_KM,
                    'search_scope' => 'radius',
                ];
            }
        }

        return [
            'effective_filters' => [
                ...$filters,
                'radius' => null,
                '_countrywide' => true,
            ],
            'used_radius' => self::COUNTRYWIDE_SCOPE,
            'expanded' => true,
            'search_scope' => self::COUNTRYWIDE_SCOPE,
        ];
    }

    private function distanceFormula(): string
    {
        return '('.self::EARTH_RADIUS_KM.' * acos(
            LEAST(
                1.0,
                GREATEST(
                    -1.0,
                    cos(radians(?))
                    * cos(radians(marketplace_farms.latitude))
                    * cos(radians(marketplace_farms.longitude) - radians(?))
                    + sin(radians(?))
                    * sin(radians(marketplace_farms.latitude))
                )
            )
        ))';
    }

    private function applyNearbyDefaultSorting($query): void
    {
        $query->orderBy('distance_km')
            ->orderByDesc('available_quantity')
            ->orderByRaw($this->qualityGradeSortExpression())
            ->orderByRaw('quality_grade ASC NULLS LAST')
            ->orderBy('price_per_unit')
            ->orderByDesc('id');
    }

    private function qualityGradeSortExpression(): string
    {
        return "CASE UPPER(COALESCE(quality_grade, ''))
            WHEN 'A+' THEN 1
            WHEN 'A' THEN 2
            WHEN 'B+' THEN 3
            WHEN 'B' THEN 4
            WHEN 'C+' THEN 5
            WHEN 'C' THEN 6
            ELSE 99
        END";
    }

    private function applySearchRanking($query, bool $hasLocationSearch): void
    {
        if ($hasLocationSearch) {
            $query->reorder()
                ->orderBy('distance_km')
                ->orderByDesc('available_quantity')
                ->orderByRaw($this->qualityGradeSortExpression())
                ->orderByRaw('quality_grade ASC NULLS LAST')
                ->orderBy('price_per_unit')
                ->orderByDesc('id');

            return;
        }

        $query->reorder()
            ->orderByDesc('available_quantity')
            ->orderByRaw($this->qualityGradeSortExpression())
            ->orderByRaw('quality_grade ASC NULLS LAST')
            ->orderBy('price_per_unit')
            ->orderByDesc('id');
    }

    private function applyMatchedFieldMetadata($query, string $search): void
    {
        $trimmedSearch = trim($search);
        $exactSearch = mb_strtolower($trimmedSearch);
        $partialSearch = '%'.$trimmedSearch.'%';

        $query->selectRaw(
            "CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM crops
                    WHERE crops.id = harvest_listings.crop_id
                        AND LOWER(crops.name) = ?
                ) THEN 'crop_name'
                WHEN EXISTS (
                    SELECT 1
                    FROM crops
                    WHERE crops.id = harvest_listings.crop_id
                        AND crops.name ILIKE ?
                ) THEN 'crop_name'
                WHEN EXISTS (
                    SELECT 1
                    FROM users
                    WHERE users.id = harvest_listings.user_id
                        AND users.name ILIKE ?
                ) THEN 'farmer_name'
                WHEN EXISTS (
                    SELECT 1
                    FROM farms
                    WHERE farms.id = harvest_listings.farm_id
                        AND farms.farm_name ILIKE ?
                ) THEN 'store_name'
                WHEN EXISTS (
                    SELECT 1
                    FROM farms
                    WHERE farms.id = harvest_listings.farm_id
                        AND farms.district ILIKE ?
                ) THEN 'district'
                WHEN harvest_listings.description ILIKE ? THEN 'description'
                ELSE NULL
            END as matched_field",
            [
                $exactSearch,
                $partialSearch,
                $partialSearch,
                $partialSearch,
                $partialSearch,
                $partialSearch,
            ]
        );
    }

    private function getNearbySuggestions(array $filters): Collection
    {
        if (! $this->shouldSuggestNearbyProducts($filters)) {
            return collect();
        }

        $search = trim((string) $filters['search']);
        $relatedContext = $this->resolveRelatedCropContext($search);

        if ($relatedContext['categories']->isEmpty()) {
            return collect();
        }

        $query = HarvestListing::query()
            ->with([
                'crop:id,name,category',
                'farm:id,farm_name,district,address,latitude,longitude',
            ]);

        $this->applyStatusScope($query, []);
        $this->applyLocationSearch($query, $filters);

        $query->whereHas('crop', function ($cropQuery) use ($relatedContext, $search) {
            $cropQuery->whereIn('category', $relatedContext['categories']->all())
                ->where('name', 'NOT ILIKE', '%'.$search.'%');

            if ($relatedContext['crop_ids']->isNotEmpty()) {
                $cropQuery->whereNotIn('id', $relatedContext['crop_ids']->all());
            }
        });

        $query->orderByRaw(
            "CASE
                WHEN status = ? THEN 0
                WHEN status = ? THEN 1
                ELSE 2
            END",
            [
                HarvestListing::STATUS_AVAILABLE,
                HarvestListing::STATUS_RESERVED,
            ]
        )
            ->orderBy('distance_km')
            ->orderByDesc('available_quantity')
            ->orderByRaw($this->qualityGradeSortExpression())
            ->orderByRaw('quality_grade ASC NULLS LAST')
            ->orderBy('price_per_unit')
            ->orderByDesc('id');

        return $query
            ->limit(25)
            ->get()
            ->unique('crop_id')
            ->take(5)
            ->values();
    }

    private function shouldSuggestNearbyProducts(array $filters): bool
    {
        return $this->hasLocationSearch($filters)
            && $this->hasSearch($filters);
    }

    private function countMarketplaceResults(array $filters): int
    {
        $sort = $this->normalizeSortOption($filters['sort'] ?? null);
        $hasLocationSearch = $this->hasLocationSearch($filters);
        $hasSearch = $this->hasSearch($filters);

        $query = $this->marketplaceIndexQuery(false);

        $this->applyStatusScope($query, $filters);
        $this->applyLocationSearch($query, $filters);
        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);
        $this->applySorting($query, $sort, $hasLocationSearch);

        if ($hasSearch) {
            $this->applySearchRanking($query, $hasLocationSearch);
        }

        return $query->count();
    }

    private function isCountrywideSearch(array $filters): bool
    {
        return (bool) ($filters['_countrywide'] ?? false);
    }

    private function buildExpansionMessage(
        array $originalFilters,
        array $searchContext,
        int $resultsFound
    ): ?string {
        if (! $this->hasLocationSearch($originalFilters)) {
            return null;
        }

        if (! $searchContext['expanded'] || $resultsFound <= 0) {
            return null;
        }

        $searchTerm = trim((string) ($originalFilters['search'] ?? ''));
        $subject = $searchTerm !== ''
            ? sprintf('No %s were found', $searchTerm)
            : 'No products were found';

        if ($searchContext['search_scope'] === self::COUNTRYWIDE_SCOPE) {
            return sprintf(
                '%s within 100 km. Showing products across Sri Lanka.',
                $subject
            );
        }

        return sprintf(
            '%s within 50 km. Showing products within %s km.',
            $subject,
            $searchContext['used_radius']
        );
    }

    private function resolveRelatedCropContext(string $search): array
    {
        $matchedCrops = Crop::query()
            ->select('id', 'category')
            ->where('name', 'ILIKE', '%'.$search.'%')
            ->get();

        return [
            'crop_ids' => $matchedCrops->pluck('id')->values(),
            'categories' => $matchedCrops
                ->pluck('category')
                ->filter()
                ->unique()
                ->values(),
        ];
    }

    private function marketplaceIndexQuery(bool $withRelations = true): Builder
    {
        $query = HarvestListing::query();

        if (! $withRelations) {
            return $query;
        }

        return $query->with([
            'crop:id,name,category',
            'farm:id,farm_name,district,address,latitude,longitude',
            'farmer:id,name',
            'images:id,harvest_listing_id,image_path,sort_order',
        ]);
    }
}
