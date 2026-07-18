<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\ShowMarketplaceProductRequest;
use App\Http\Resources\HarvestListingResource;
use App\Http\Resources\MarketplaceProductResource;
use App\Http\Resources\NearbyProductSuggestionResource;
use App\Models\HarvestListing;
use App\Services\MarketplaceService;
use App\Http\Requests\MarketplaceFilterRequest;

class MarketplaceController extends Controller
{
    public function __construct(
        protected MarketplaceService $service
    ) {}

    public function index(MarketplaceFilterRequest $request)
    {
        $marketplace = $this->service->searchMarketplace(
            $request->validated()
        );

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
        return ApiResponse::success(
            new MarketplaceProductResource(
                $this->service->getMarketplaceProduct(
                    $harvestListing,
                    $request->validated()
                )
            ),
            'Marketplace product retrieved successfully'
        );
    }
}
