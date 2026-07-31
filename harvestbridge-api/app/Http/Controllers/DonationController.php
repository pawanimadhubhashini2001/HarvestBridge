<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\DonationMarketplaceFilterRequest;
use App\Http\Requests\StoreDonationRequest;
use App\Http\Requests\UpdateDonationPickupRequest;
use App\Http\Requests\UpdateDonationRequest;
use App\Http\Resources\DonationResource;
use App\Models\Donation;
use Illuminate\Http\Request;
use App\Services\DonationService;

class DonationController extends Controller
{
    public function __construct(
        protected DonationService $service
    ) {}

    public function index(Request $request)
    {
        return ApiResponse::success(

            DonationResource::collection(

                $this->service->getAll(
                    $request->user()
                )

            ),

            'Donations retrieved successfully.'

        );
    }

    public function store(
        StoreDonationRequest $request
    ) {
        $donation = $this->service->create(

            $request->user(),

            $request->validated()

        );

        return ApiResponse::success(

            new DonationResource($donation),

            'Donation created successfully.',

            201

        );
    }

    public function update(
        UpdateDonationRequest $request,
        Donation $donation
    ) {
        if (
            $donation->farmer_id !=
            $request->user()->id
        ) {

            return ApiResponse::error(
                'Unauthorized',
                403
            );
        }

        $donation = $this->service->update(

            $donation,

            $request->validated()

        );

        return ApiResponse::success(

            new DonationResource($donation),

            'Donation updated successfully.'

        );
    }

    public function destroy(
        Request $request,
        Donation $donation
    ) {
        if (
            $donation->farmer_id !=
            $request->user()->id
        ) {

            return ApiResponse::error(
                'Unauthorized',
                403
            );
        }

        $this->service->delete(
            $donation
        );

        return ApiResponse::success(

            null,

            'Donation deleted successfully.'

        );
    }
    public function available(DonationMarketplaceFilterRequest $request)
    {
        $validated = $request->validated();
        $hasCoordinates =
            array_key_exists('latitude', $validated)
            && array_key_exists('longitude', $validated)
            && $validated['latitude'] !== null
            && $validated['longitude'] !== null;
        $resolvedSort = $validated['sort'] ?? ($hasCoordinates ? 'nearest' : 'newest');
        $resolvedRadius = $hasCoordinates ? ($validated['radius'] ?? 50) : null;
        $donations = $this->service->getAvailableForNgo($validated);
        $resourceCollection = DonationResource::collection($donations)
            ->response()
            ->getData(true);

        return ApiResponse::success(
            [
                'donations' => $resourceCollection['data'],
                'sort' => $resolvedSort,
                'radius' => $resolvedRadius,
                'pagination' => [
                    'links' => $resourceCollection['links'] ?? null,
                    'meta' => $resourceCollection['meta'] ?? null,
                ],
            ],
            'Available donations retrieved successfully.'
        );
    }
    public function schedulePickup(

        UpdateDonationPickupRequest $request,

        Donation $donation

    ) {
        $donation = $this->service->schedulePickup(

            $donation,

            $request->validated(),

            $request->user()

        );

        return ApiResponse::success(

            new DonationResource($donation),

            'Pickup scheduled successfully.'

        );
    }

    public function complete(

        Request $request,

        Donation $donation

    ) {
        $donation = $this->service->complete(

            $donation,

            $request->user()

        );

        return ApiResponse::success(

            new DonationResource($donation),

            'Donation marked as collected successfully.'

        );
    }
}
