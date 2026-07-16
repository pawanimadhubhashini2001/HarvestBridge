<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
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
    public function marketplace(Request $request)
    {
        $listings = $this->service->marketplace(
            $request->only([
                'waste_type',
                'pickup_location',
                'date'
            ])
        );

        return ApiResponse::success(

            CompostListingResource::collection(
                $listings
            ),

            'Marketplace listings retrieved successfully.'

        );
    }
}
