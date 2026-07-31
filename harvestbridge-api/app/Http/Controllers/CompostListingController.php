<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\CompostMarketplaceFilterRequest;
use App\Http\Requests\StoreCompostListingRequest;
use App\Http\Requests\UpdateCompostListingRequest;
use App\Http\Resources\CompostListingResource;
use App\Models\CompostListing;
use App\Services\CompostListingService;
use Illuminate\Http\Request;

class CompostListingController extends Controller
{
    public function __construct(
        protected CompostListingService $service
    ) {}

    public function index(Request $request)
    {
        return ApiResponse::success(

            CompostListingResource::collection(

                $this->service->getAll(
                    $request->user()
                )

            ),

            'Compost listings retrieved successfully.'

        );
    }

    public function store(StoreCompostListingRequest $request)
    {
        $listing = $this->service->create(
            $request->user(),
            $request->validated()
        );

        return ApiResponse::success(
            new CompostListingResource($listing),
            'Compost listing created successfully.',
            201
        );
    }

    public function update(
        UpdateCompostListingRequest $request,
        CompostListing $compostListing
    ) {
        if ($compostListing->farmer_id != $request->user()->id) {

            return ApiResponse::error(
                'Unauthorized',
                403
            );
        }

        $listing = $this->service->update(
            $compostListing,
            $request->validated()
        );

        return ApiResponse::success(
            new CompostListingResource($listing),
            'Compost listing updated successfully.'
        );
    }

    public function destroy(
        Request $request,
        CompostListing $compostListing
    ) {
        if ($compostListing->farmer_id != $request->user()->id) {

            return ApiResponse::error(
                'Unauthorized',
                403
            );
        }

        $this->service->delete($compostListing);

        return ApiResponse::success(
            null,
            'Compost listing deleted successfully.'
        );
    }
    public function marketplace(CompostMarketplaceFilterRequest $request)
    {
        $validated = $request->validated();
        $hasCoordinates =
            array_key_exists('latitude', $validated)
            && array_key_exists('longitude', $validated)
            && $validated['latitude'] !== null
            && $validated['longitude'] !== null;
        $listings = $this->service->marketplace($validated);
        $resourceCollection = CompostListingResource::collection($listings)
            ->response()
            ->getData(true);

        return ApiResponse::success(
            [
                'listings' => $resourceCollection['data'],
                'radius' => $hasCoordinates ? ($validated['radius'] ?? 50) : null,
            ],
            'Marketplace listings retrieved successfully.'
        );
    }
}
