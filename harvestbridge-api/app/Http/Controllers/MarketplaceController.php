<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Resources\HarvestListingResource;
use App\Services\MarketplaceService;
use App\Http\Requests\MarketplaceFilterRequest;

class MarketplaceController extends Controller
{
    public function __construct(
        protected MarketplaceService $service
    ) {}

    public function index(MarketplaceFilterRequest $request)
    {
        $harvests = $this->service->getAvailableHarvests(
            $request->validated()
        );

        return ApiResponse::success(
            HarvestListingResource::collection($harvests),
            'Marketplace loaded successfully'
        );
    }
}
