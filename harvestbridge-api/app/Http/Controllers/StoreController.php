<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\ShowPublicStoreRequest;
use App\Http\Requests\StoreFarmRequest;
use App\Http\Requests\UploadStoreCoverImageRequest;
use App\Http\Requests\UploadStoreLogoRequest;
use App\Http\Requests\UpdateStoreLocationRequest;
use App\Http\Requests\UpdateStoreStatusRequest;
use App\Http\Requests\UpdateFarmRequest;
use App\Http\Resources\HarvestListingResource;
use App\Http\Resources\PublicStoreResource;
use App\Http\Resources\StoreLocationResource;
use App\Http\Resources\StoreResource;
use App\Http\Resources\StoreStatusResource;
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

    public function publicShow(ShowPublicStoreRequest $request, Farm $store)
    {
        return ApiResponse::success(
            new PublicStoreResource(
                $this->farmService->getPublicStoreDetails(
                    $store,
                    $request->validated()
                )
            ),
            'Public store retrieved successfully'
        );
    }

    public function publicProducts(ShowPublicStoreRequest $request, Farm $store)
    {
        $products = $this->farmService->getPublicStoreProducts(
            $store,
            $request->validated()
        );

        $productCollection = HarvestListingResource::collection($products)
            ->response()
            ->getData(true);

        return ApiResponse::success(
            [
                'products' => $productCollection['data'],
                'pagination' => [
                    'links' => $productCollection['links'] ?? null,
                    'meta' => $productCollection['meta'] ?? null,
                ],
            ],
            'Public store products retrieved successfully'
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

    public function updateLocation(UpdateStoreLocationRequest $request, Farm $store)
    {
        $this->authorize('update', $store);

        return ApiResponse::success(
            new StoreLocationResource(
                $this->farmService->updateStoreLocation(
                    $store,
                    $request->validated()
                )
            ),
            'Store location updated successfully'
        );
    }

    public function status(Request $request, Farm $store)
    {
        $this->authorize('view', $store);

        return ApiResponse::success(
            new StoreStatusResource(
                $this->farmService->getStoreStatus($store)
            ),
            'Store status retrieved successfully'
        );
    }

    public function updateStatus(UpdateStoreStatusRequest $request, Farm $store)
    {
        $this->authorize('update', $store);

        return ApiResponse::success(
            new StoreStatusResource(
                $this->farmService->updateStoreStatus(
                    $store,
                    $request->validated()
                )
            ),
            'Store status updated successfully'
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

    public function uploadLogo(UploadStoreLogoRequest $request, Farm $store)
    {
        $this->authorize('update', $store);

        return ApiResponse::success(
            new StoreResource(
                $this->farmService->uploadLogo(
                    $store,
                    $request->file('store_logo')
                )
            ),
            'Store logo uploaded successfully'
        );
    }

    public function uploadCover(UploadStoreCoverImageRequest $request, Farm $store)
    {
        $this->authorize('update', $store);

        return ApiResponse::success(
            new StoreResource(
                $this->farmService->uploadCover(
                    $store,
                    $request->file('store_cover_image')
                )
            ),
            'Store cover image uploaded successfully'
        );
    }

    public function deleteLogo(Request $request, Farm $store)
    {
        $this->authorize('update', $store);

        return ApiResponse::success(
            new StoreResource(
                $this->farmService->deleteLogo($store)
            ),
            'Store logo deleted successfully'
        );
    }

    public function deleteCover(Request $request, Farm $store)
    {
        $this->authorize('update', $store);

        return ApiResponse::success(
            new StoreResource(
                $this->farmService->deleteCover($store)
            ),
            'Store cover image deleted successfully'
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
