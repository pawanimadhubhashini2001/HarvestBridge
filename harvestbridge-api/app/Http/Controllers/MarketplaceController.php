<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\ShowMarketplaceProductRequest;
use App\Http\Resources\HarvestListingResource;
use App\Http\Resources\MarketplaceProductResource;
use App\Http\Resources\NearbyProductSuggestionResource;
use App\Models\HarvestListing;
use App\Services\AuditLogService;
use App\Services\MarketplaceService;
use App\Http\Requests\MarketplaceFilterRequest;

class MarketplaceController extends Controller
{
    public function __construct(
        protected MarketplaceService $service,
        protected AuditLogService $auditLogService
    ) {}

    public function index(MarketplaceFilterRequest $request)
    {
        $filters = $request->validated();
        $filters['user_id'] = $request->user()?->role === 'consumer'
            ? $request->user()?->id
            : null;

        $marketplace = $this->service->searchMarketplace($filters);

        if ($this->hasNearbySearchFilters($filters)) {
            $this->auditLogService->log(
                'marketplace.nearby_search.performed',
                $request->user()?->id,
                null,
                [
                    'search' => $filters['search'] ?? null,
                    'radius' => $filters['radius'] ?? null,
                    'used_radius' => $marketplace['used_radius'],
                    'results_found' => (int) $marketplace['results_found'],
                    'expanded' => (bool) $marketplace['expanded'],
                ],
                $request
            );
        }

        $listingCollection = HarvestListingResource::collection(
            $marketplace['listings']
        )->response()->getData(true);

        return ApiResponse::success(
            [
                'listings' => $listingCollection['data'],
                'pagination' => [
                    'links' => $listingCollection['links'] ?? null,
                    'meta' => $listingCollection['meta'] ?? null,
                ],
                'nearby_suggestions' => NearbyProductSuggestionResource::collection(
                    $marketplace['nearby_suggestions']
                )->resolve(),
                'recommended_for_you' => NearbyProductSuggestionResource::collection(
                    $marketplace['recommended_for_you']
                )->resolve(),
                'used_radius' => $marketplace['used_radius'],
                'results_found' => $marketplace['results_found'],
                'expanded' => $marketplace['expanded'],
                'search_scope' => $marketplace['search_scope'],
                'message' => $marketplace['message'],
            ],
            'Marketplace loaded successfully'
        );
    }

    public function show(
        ShowMarketplaceProductRequest $request,
        HarvestListing $harvestListing
    )
    {
        $filters = $request->validated();
        $filters['user_id'] = $request->user()?->role === 'consumer'
            ? $request->user()?->id
            : null;

        return ApiResponse::success(
            new MarketplaceProductResource(
                $this->service->getMarketplaceProduct(
                    $harvestListing,
                    $filters
                )
            ),
            'Marketplace product retrieved successfully'
        );
    }

    private function hasNearbySearchFilters(array $filters): bool
    {
        return array_key_exists('latitude', $filters)
            && array_key_exists('longitude', $filters)
            && $filters['latitude'] !== null
            && $filters['longitude'] !== null;
    }
}
