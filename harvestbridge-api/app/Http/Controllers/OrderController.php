<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(

        protected OrderService $service

    ) {}

    public function store(
        StoreOrderRequest $request
    ) {
        $order = $this->service->createOrder(

            $request->user(),

            $request->validated()

        );

        return ApiResponse::success(

            new OrderResource($order),

            'Order placed successfully.',

            201

        );
    }
    public function index(Request $request)
    {
        $orders = $this->service->getConsumerOrders(
            $request->user()
        );

        return ApiResponse::success(
            OrderResource::collection($orders),
            'Orders retrieved successfully'
        );
    }

    public function farmerOrders(Request $request)
    {
        $orders = $this->service->getFarmerOrders(
            $request->user()
        );

        return ApiResponse::success(
            OrderResource::collection($orders),
            'Orders retrieved successfully'
        );
    }
    public function updateStatus(
        UpdateOrderStatusRequest $request,
        Order $order
    ) {
        $updated = $this->service->updateStatus(
            $order,
            $request->validated()['status'],
            $request->user()
        );

        return ApiResponse::success(
            new OrderResource($updated),
            'Order updated successfully'
        );
    }
}
