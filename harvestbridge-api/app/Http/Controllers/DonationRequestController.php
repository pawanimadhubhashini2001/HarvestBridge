<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\StoreDonationRequestRequest;
use App\Http\Resources\DonationRequestResource;
use App\Services\DonationRequestService;
use Illuminate\Http\Request;

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
}
