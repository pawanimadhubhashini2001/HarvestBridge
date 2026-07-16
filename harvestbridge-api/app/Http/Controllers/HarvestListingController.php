<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\StoreHarvestListingRequest;
use App\Http\Requests\UpdateHarvestListingRequest;
use App\Http\Resources\HarvestListingResource;
use App\Models\HarvestListing;
use App\Services\HarvestListingService;
use Illuminate\Http\Request;

class HarvestListingController extends Controller
{
    public function __construct(
        protected HarvestListingService $service
    ) {}

    public function index(Request $request)
    {
        $listings = $this->service->getAll($request->user());

        return ApiResponse::success(
            HarvestListingResource::collection($listings),
            'Harvest listings retrieved successfully'
        );
    }

    public function store(StoreHarvestListingRequest $request)
    {
        $listing = $this->service->create(
            $request->user(),
            $request->validated()
        );

        return ApiResponse::success(
            new HarvestListingResource($listing),
            'Harvest listing created successfully',
            201
        );
    }

    public function update(
        UpdateHarvestListingRequest $request,
        HarvestListing $harvestListing
    )
    {
        $this->authorize('update', $harvestListing);

        $listing = $this->service->update(
            $harvestListing,
            $request->validated()
        );

        return ApiResponse::success(
            new HarvestListingResource($listing),
            'Harvest listing updated successfully'
        );
    }

    public function destroy(HarvestListing $harvestListing)
    {
        $this->authorize('delete', $harvestListing);

        $this->service->delete($harvestListing);

        return ApiResponse::success(
            null,
            'Harvest listing deleted successfully'
        );
    }
}
