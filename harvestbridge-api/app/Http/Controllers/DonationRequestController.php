<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\StoreDonationRequestRequest;
use App\Http\Resources\DonationRequestResource;
use App\Services\DonationRequestService;
use Illuminate\Http\Request;
use App\Http\Requests\UpdateDonationRequestStatusRequest;
use App\Models\DonationRequest;

class DonationRequestController extends Controller
{
    public function __construct(
        protected DonationRequestService $service
    ) {}

    public function index(Request $request)
    {
        return ApiResponse::success(

            DonationRequestResource::collection(

                $this->service->getNgoRequests(
                    $request->user()
                )

            ),

            'Donation requests retrieved successfully.'

        );
    }

    public function store(
        StoreDonationRequestRequest $request
    ) {

        $donationRequest = $this->service->create(

            $request->user(),

            $request->validated()

        );

        return ApiResponse::success(

            new DonationRequestResource(
                $donationRequest
            ),

            'Donation request submitted successfully.',

            201

        );
    }

    public function farmerRequests(Request $request)
    {
        return ApiResponse::success(

            DonationRequestResource::collection(

                $this->service->getFarmerRequests(

                    $request->user()

                )

            ),

            'Donation requests retrieved successfully.'

        );
    }

    public function updateStatus(

        UpdateDonationRequestStatusRequest $request,

        DonationRequest $donationRequest

    ) {
        $updated = $this->service->updateStatus(

            $donationRequest,

            $request->validated()['status'],

            $request->user()

        );

        return ApiResponse::success(

            new DonationRequestResource($updated),

            'Donation request updated successfully.'

        );
    }
}
