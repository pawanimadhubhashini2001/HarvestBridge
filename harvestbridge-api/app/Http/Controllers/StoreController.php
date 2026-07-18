<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\StoreFarmRequest;
use App\Http\Requests\UpdateFarmRequest;
use App\Http\Resources\StoreLocationResource;
use App\Http\Resources\StoreResource;
use App\Models\Farm;
use App\Services\FarmService;
use Illuminate\Http\Request;

class StoreController extends Controller
{
    public function __construct(
        protected FarmService $farmService
    ) {}

    public function index(Request $request)
    {
        return ApiResponse::success(
            StoreResource::collection(
                $this->farmService->getAll($request->user())
            ),
            'Stores retrieved successfully'
        );
    }

    public function me(Request $request)
    {
        return ApiResponse::success(
            new StoreResource(
                $this->farmService->getMyStore($request->user())
            ),
            'My store retrieved successfully'
        );
    }

    public function show(Request $request, Farm $store)
    {
        $this->authorize('view', $store);

        return ApiResponse::success(
            new StoreResource(
                $this->farmService->getDetails($store)
            ),
            'Store retrieved successfully'
        );
    }

    public function location(Farm $store)
    {
        return ApiResponse::success(
            new StoreLocationResource(
                $this->farmService->getStoreLocation($store)
            ),
            'Store location retrieved successfully'
        );
    }

    public function store(StoreFarmRequest $request)
    {
        return ApiResponse::success(
            new StoreResource(
                $this->farmService->create(
                    $request->user(),
                    $request->validated()
                )
            ),
            'Store created successfully',
            201
        );
    }

    public function update(UpdateFarmRequest $request, Farm $store)
    {
        $this->authorize('update', $store);

        return ApiResponse::success(
            new StoreResource(
                $this->farmService->update(
                    $store,
                    $request->validated()
                )
            ),
            'Store updated successfully'
        );
    }

    public function destroy(Request $request, Farm $store)
    {
        $this->authorize('delete', $store);

        $this->farmService->delete($store);

        return ApiResponse::success(
            null,
            'Store deleted successfully'
        );
    }
}
