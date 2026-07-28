<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\StorePreOrderProductRequest;
use App\Http\Requests\UpdatePreOrderProductRequest;
use App\Http\Resources\PreOrderProductResource;
use App\Models\PreOrderProduct;
use App\Services\PreOrderService;
use Illuminate\Http\Request;

class PreOrderProductController extends Controller
{
    public function __construct(
        protected PreOrderService $service
    ) {}

    public function index(Request $request)
    {
        return ApiResponse::success(
            PreOrderProductResource::collection(
                $this->service->farmerProducts($request->user())
            ),
            'Pre-order products retrieved successfully.'
        );
    }

    public function available()
    {
        return ApiResponse::success(
            PreOrderProductResource::collection(
                $this->service->availableProducts()
            ),
            'Available pre-order products retrieved successfully.'
        );
    }

    public function store(StorePreOrderProductRequest $request)
    {
        return ApiResponse::success(
            new PreOrderProductResource(
                $this->service->createProduct($request->user(), $request->validated())
            ),
            'Pre-order product created successfully.',
            201
        );
    }

    public function update(UpdatePreOrderProductRequest $request, PreOrderProduct $preOrderProduct)
    {
        return ApiResponse::success(
            new PreOrderProductResource(
                $this->service->updateProduct($preOrderProduct, $request->user(), $request->validated())
            ),
            'Pre-order product updated successfully.'
        );
    }

    public function destroy(Request $request, PreOrderProduct $preOrderProduct)
    {
        $this->service->deleteProduct($preOrderProduct, $request->user());

        return ApiResponse::success(null, 'Pre-order product deleted successfully.');
    }
}
