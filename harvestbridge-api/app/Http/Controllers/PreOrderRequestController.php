<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\StorePreOrderRequestRequest;
use App\Http\Requests\UpdatePreOrderRequestStatusRequest;
use App\Http\Resources\PreOrderRequestResource;
use App\Models\PreOrderRequest;
use App\Services\PreOrderService;
use Illuminate\Http\Request;

class PreOrderRequestController extends Controller
{
    public function __construct(
        protected PreOrderService $service
    ) {}

    public function store(StorePreOrderRequestRequest $request)
    {
        return ApiResponse::success(
            new PreOrderRequestResource(
                $this->service->createRequest($request->user(), $request->validated())
            ),
            'Pre-order request submitted successfully.',
            201
        );
    }

    public function consumerRequests(Request $request)
    {
        return ApiResponse::success(
            PreOrderRequestResource::collection(
                $this->service->consumerRequests($request->user())
            ),
            'Pre-order requests retrieved successfully.'
        );
    }

    public function farmerRequests(Request $request)
    {
        return ApiResponse::success(
            PreOrderRequestResource::collection(
                $this->service->farmerRequests($request->user())
            ),
            'Farmer pre-order requests retrieved successfully.'
        );
    }

    public function updateStatus(UpdatePreOrderRequestStatusRequest $request, PreOrderRequest $preOrderRequest)
    {
        return ApiResponse::success(
            new PreOrderRequestResource(
                $this->service->updateRequestStatus(
                    $preOrderRequest,
                    $request->validated()['status'],
                    $request->user()
                )
            ),
            'Pre-order request updated successfully.'
        );
    }
}
