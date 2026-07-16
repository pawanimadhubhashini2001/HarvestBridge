<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Resources\HarvestListingResource;
use App\Services\MarketplaceService;

class MarketplaceController extends Controller
{
    public function __construct(
        protected MarketplaceService $service
    ) {}

    public function index()
    {
        $harvests = $this->service->getAvailableHarvests();

        return ApiResponse::success(
            HarvestListingResource::collection($harvests),
            'Marketplace loaded successfully'
        );
    }
}
