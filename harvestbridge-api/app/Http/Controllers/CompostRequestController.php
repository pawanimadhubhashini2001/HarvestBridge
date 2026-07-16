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
}
