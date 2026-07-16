<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\StoreCompostRequestRequest;
use App\Http\Resources\CompostRequestResource;
use App\Services\CompostRequestService;
use App\Models\CompostRequest;
use App\Http\Requests\UpdateCompostRequestStatusRequest;
use App\Http\Resources\DonationRequestResource;
use Illuminate\Http\Request;
use App\Http\Requests\UpdateCompostPickupRequest;

class CompostRequestController extends Controller
{
    public function __construct(

        protected CompostRequestService $service

    ) {}

    public function store(

        StoreCompostRequestRequest $request

    ) {
        $requestData = $this->service->create(

            $request->user(),

            $request->validated()

        );

        return ApiResponse::success(

            new CompostRequestResource(

                $requestData

            ),

            'Compost request submitted successfully.',

            201

        );
    }
    public function updateStatus(

        UpdateCompostRequestStatusRequest $request,

        CompostRequest $compostRequest

    ) {
        $updated = $this->service->updateStatus(

            $compostRequest,

            $request->validated()['status'],

            $request->user()

        );

        return ApiResponse::success(

            new DonationRequestResource($updated),

            'Compost request updated successfully.'

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

            'Compost requests retrieved successfully.'

        );
    }
    public function collect(

        UpdateCompostPickupRequest $request,

        CompostRequest $compostRequest

    ) {
        $updated = $this->service->collect(

            $compostRequest,

            $request->validated(),

            $request->user()

        );

        return ApiResponse::success(

            new CompostRequestResource($updated),

            'Pickup confirmed successfully.'

        );
    }
    public function complete(

        Request $request,

        CompostRequest $compostRequest

    ) {
        $listing = $this->service->complete(

            $compostRequest,

            $request->user()

        );

        return ApiResponse::success(

            $listing,

            'Compost transaction completed.'

        );
    }
    public function dashboard(Request $request)
    {
        return ApiResponse::success(

            $this->service->businessDashboard(

                $request->user()

            ),

            'Dashboard retrieved successfully.'

        );
    }
    public function businessRequests(Request $request)
    {
        return ApiResponse::success(

            CompostRequestResource::collection(

                $this->service->businessRequests(

                    $request->user(),

                    $request->query('status')

                )

            ),

            'Business requests retrieved successfully.'

        );
    }
}
