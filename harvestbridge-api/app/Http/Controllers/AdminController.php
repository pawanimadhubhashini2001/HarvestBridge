<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\AdminCropIndexRequest;
use App\Http\Requests\AdminFarmIndexRequest;
use App\Http\Requests\AdminLogFilterRequest;
use App\Http\Requests\AdminMarketPriceFilterRequest;
use App\Http\Requests\AdminUpdateUserStatusRequest;
use App\Http\Requests\AdminUserIndexRequest;
use App\Http\Requests\StoreMarketPriceRequest;
use App\Http\Requests\UpdateHarvestListingFeaturedRequest;
use App\Http\Requests\UpdateMarketPriceRequest;
use App\Http\Resources\AdminUserProfileResource;
use App\Http\Resources\AdminUserResource;
use App\Http\Resources\AuditLogResource;
use App\Http\Resources\CropResource;
use App\Http\Resources\FarmResource;
use App\Http\Resources\HarvestListingResource;
use App\Http\Resources\MarketPriceResource;
use App\Http\Resources\WeatherAlertResource;
use App\Models\HarvestListing;
use App\Models\MarketPrice;
use App\Models\User;
use App\Services\AdminService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function __construct(
        protected AdminService $adminService,
        protected AuditLogService $auditLogService
    ) {}

    public function dashboard()
    {
        return ApiResponse::success(
            $this->adminService->dashboard(),
            'Admin dashboard retrieved successfully.'
        );
    }

    public function users(AdminUserIndexRequest $request)
    {
        return ApiResponse::success(
            AdminUserResource::collection(
                $this->adminService->users($request->validated())
            ),
            'Users retrieved successfully.'
        );
    }

    public function showUser(User $user)
    {
        return ApiResponse::success(
            new AdminUserProfileResource(
                $this->adminService->userProfile($user)
            ),
            'User profile retrieved successfully.'
        );
    }

    public function updateUserStatus(AdminUpdateUserStatusRequest $request, User $user)
    {
        $updatedUser = $this->adminService->updateUserStatus(
            $user,
            $request->validated('status')
        );

        $this->auditLogService->log(
            'admin.user.status.updated',
            $request->user()->id,
            $updatedUser,
            [
                'status' => $updatedUser->status,
            ],
            $request
        );

        return ApiResponse::success(
            new AdminUserResource($updatedUser),
            'User status updated successfully.'
        );
    }

    public function suspendUser(Request $request, User $user)
    {
        $updatedUser = $this->adminService->suspendUser($user);

        $this->auditLogService->log(
            'admin.user.suspended',
            $request->user()->id,
            $updatedUser,
            [
                'status' => $updatedUser->status,
            ],
            $request
        );

        return ApiResponse::success(
            new AdminUserResource($updatedUser),
            'User suspended successfully.'
        );
    }

    public function activateUser(Request $request, User $user)
    {
        $updatedUser = $this->adminService->activateUser($user);

        $this->auditLogService->log(
            'admin.user.activated',
            $request->user()->id,
            $updatedUser,
            [
                'status' => $updatedUser->status,
            ],
            $request
        );

        return ApiResponse::success(
            new AdminUserResource($updatedUser),
            'User activated successfully.'
        );
    }

    public function farms(AdminFarmIndexRequest $request)
    {
        return ApiResponse::success(
            FarmResource::collection(
                $this->adminService->farms($request->validated())
            ),
            'Farms retrieved successfully.'
        );
    }

    public function crops(AdminCropIndexRequest $request)
    {
        return ApiResponse::success(
            CropResource::collection(
                $this->adminService->crops($request->validated())
            ),
            'Crops retrieved successfully.'
        );
    }

    public function aiLogs(AdminLogFilterRequest $request)
    {
        return ApiResponse::success(
            AuditLogResource::collection(
                $this->adminService->aiLogs($request->validated())
            ),
            'AI logs retrieved successfully.'
        );
    }

    public function weatherLogs(AdminLogFilterRequest $request)
    {
        return ApiResponse::success(
            WeatherAlertResource::collection(
                $this->adminService->weatherLogs($request->validated())
            ),
            'Weather logs retrieved successfully.'
        );
    }

    public function marketPrices(AdminMarketPriceFilterRequest $request)
    {
        return ApiResponse::success(
            MarketPriceResource::collection(
                $this->adminService->marketPrices($request->validated())
            ),
            'Market prices retrieved successfully.'
        );
    }

    public function storeMarketPrice(StoreMarketPriceRequest $request)
    {
        $marketPrice = $this->adminService->createMarketPrice(
            $request->validated()
        );

        $this->auditLogService->log(
            'admin.market-price.created',
            $request->user()->id,
            $marketPrice,
            $request->validated(),
            $request
        );

        return ApiResponse::success(
            new MarketPriceResource($marketPrice->load('crop')),
            'Market price created successfully.',
            201
        );
    }

    public function updateMarketPrice(UpdateMarketPriceRequest $request, MarketPrice $marketPrice)
    {
        $marketPrice = $this->adminService->updateMarketPrice(
            $marketPrice,
            $request->validated()
        );

        $this->auditLogService->log(
            'admin.market-price.updated',
            $request->user()->id,
            $marketPrice,
            $request->validated(),
            $request
        );

        return ApiResponse::success(
            new MarketPriceResource($marketPrice),
            'Market price updated successfully.'
        );
    }

    public function updateHarvestListingFeatured(
        UpdateHarvestListingFeaturedRequest $request,
        HarvestListing $harvestListing
    )
    {
        $updatedListing = $this->adminService->updateHarvestListingFeatured(
            $harvestListing,
            $request->validated()
        );

        $this->auditLogService->log(
            'admin.harvest-listing.featured.updated',
            $request->user()->id,
            $updatedListing,
            $request->validated(),
            $request
        );

        return ApiResponse::success(
            new HarvestListingResource($updatedListing),
            'Harvest listing featured status updated successfully.'
        );
    }

    public function analytics()
    {
        return ApiResponse::success(
            $this->adminService->analytics(),
            'Admin analytics retrieved successfully.'
        );
    }

    public function auditLogs(AdminLogFilterRequest $request)
    {
        return ApiResponse::success(
            AuditLogResource::collection(
                $this->adminService->auditLogs($request->validated())
            ),
            'Audit logs retrieved successfully.'
        );
    }

    public function reports()
    {
        return ApiResponse::success(
            $this->adminService->reports(),
            'Admin reports retrieved successfully.'
        );
    }
}
