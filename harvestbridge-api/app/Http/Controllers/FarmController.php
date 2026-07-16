<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\StoreFarmRequest;
use App\Http\Requests\UpdateFarmRequest;
use App\Http\Resources\FarmResource;
use App\Models\Farm;
use App\Services\FarmService;
use Illuminate\Http\Request;

class FarmController extends Controller
{
    public function __construct(
        protected FarmService $farmService
    ) {}

    public function index(Request $request)
    {
        $farms = $this->farmService->getAll($request->user());

        return ApiResponse::success(
            FarmResource::collection($farms),
            'Farms retrieved successfully'
        );
    }

    public function store(StoreFarmRequest $request)
    {
        $farm = $this->farmService->create(
            $request->user(),
            $request->validated()
        );

        return ApiResponse::success(
            new FarmResource($farm),
            'Farm created successfully',
            201
        );
    }

    public function update(UpdateFarmRequest $request, Farm $farm)
    {
        $this->authorize('update', $farm);

        $farm = $this->farmService->update(
            $farm,
            $request->validated()
        );

        return ApiResponse::success(
            new FarmResource($farm),
            'Farm updated successfully'
        );
    }

    public function destroy(Request $request, Farm $farm)
    {
        $this->authorize('delete', $farm);

        $this->farmService->delete($farm);

        return ApiResponse::success(
            null,
            'Farm deleted successfully'
        );
    }
}
