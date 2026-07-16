<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\StoreCropRequest;
use App\Http\Requests\UpdateCropRequest;
use App\Http\Resources\CropResource;
use App\Models\Crop;
use App\Services\CropService;
use Illuminate\Http\Request;

class CropController extends Controller
{
    public function __construct(
        protected CropService $cropService
    ) {}

    public function index()
    {
        return ApiResponse::success(
            CropResource::collection(
                $this->cropService->getAll()
            ),
            'Crops retrieved successfully'
        );
    }

    public function store(StoreCropRequest $request)
    {
        $this->authorize('create', Crop::class);

        $crop = $this->cropService->create(
            $request->validated()
        );

        return ApiResponse::success(
            new CropResource($crop),
            'Crop created successfully',
            201
        );
    }

    public function update(UpdateCropRequest $request, Crop $crop)
    {
        $this->authorize('update', $crop);

        $crop = $this->cropService->update(
            $crop,
            $request->validated()
        );

        return ApiResponse::success(
            new CropResource($crop),
            'Crop updated successfully'
        );
    }

    public function destroy(Crop $crop)
    {
        $this->authorize('delete', $crop);

        $this->cropService->delete($crop);

        return ApiResponse::success(
            null,
            'Crop deleted successfully'
        );
    }
}
