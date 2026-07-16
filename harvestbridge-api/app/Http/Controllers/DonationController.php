<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\StoreDonationRequest;
use App\Http\Requests\UpdateDonationPickupRequest;
use App\Http\Requests\UpdateDonationRequest;
use App\Http\Resources\DonationResource;
use App\Models\Donation;
use App\Services\DonationService;
use Illuminate\Http\Request;

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
    public function available()
    {
        return ApiResponse::success(

            DonationResource::collection(

                Donation::where(
                    'status',
                    'available'
                )
                    ->latest()
                    ->get()

            ),

            'Available donations.'

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

            'Donation completed successfully.'

        );
    }
}
