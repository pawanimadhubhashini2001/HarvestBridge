<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\AdminContentReportIndexRequest;
use App\Http\Requests\AdminModerationIndexRequest;
use App\Http\Resources\CompostListingResource;
use App\Http\Resources\ContentReportResource;
use App\Http\Resources\DonationResource;
use App\Http\Resources\HarvestListingResource;
use App\Http\Resources\StoreResource;
use App\Http\Resources\StoreStoryResource;
use App\Models\CompostListing;
use App\Models\Donation;
use App\Models\Farm;
use App\Models\HarvestListing;
use App\Models\StoreStory;
use App\Services\AdminModerationService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;

class AdminModerationController extends Controller
{
    public function __construct(
        protected AdminModerationService $service,
        protected AuditLogService $auditLogService
    ) {}

    public function products(AdminModerationIndexRequest $request)
    {
        return ApiResponse::success(
            HarvestListingResource::collection(
                $this->service->products($request->validated())
            ),
            'Products retrieved successfully.'
        );
    }

    public function stores(AdminModerationIndexRequest $request)
    {
        return ApiResponse::success(
            StoreResource::collection(
                $this->service->stores($request->validated())
            ),
            'Stores retrieved successfully.'
        );
    }

    public function stories(AdminModerationIndexRequest $request)
    {
        return ApiResponse::success(
            StoreStoryResource::collection(
                $this->service->stories($request->validated())
            ),
            'Stories retrieved successfully.'
        );
    }

    public function donations(AdminModerationIndexRequest $request)
    {
        return ApiResponse::success(
            DonationResource::collection(
                $this->service->donations($request->validated())
            ),
            'Donation listings retrieved successfully.'
        );
    }

    public function compostListings(AdminModerationIndexRequest $request)
    {
        return ApiResponse::success(
            CompostListingResource::collection(
                $this->service->compostListings($request->validated())
            ),
            'Compost listings retrieved successfully.'
        );
    }

    public function reports(AdminContentReportIndexRequest $request)
    {
        return ApiResponse::success(
            ContentReportResource::collection(
                $this->service->reports($request->validated())
            ),
            'Content reports retrieved successfully.'
        );
    }

    public function hideProduct(Request $request, HarvestListing $harvestListing)
    {
        $listing = $this->service->hideProduct($harvestListing);

        $this->auditLogService->log(
            'admin.moderation.product.hidden',
            $request->user()->id,
            $listing,
            ['status' => $listing->status],
            $request
        );

        return ApiResponse::success(
            new HarvestListingResource($listing),
            'Product hidden successfully.'
        );
    }

    public function deleteProduct(Request $request, HarvestListing $harvestListing)
    {
        $this->auditLogService->log(
            'admin.moderation.product.deleted',
            $request->user()->id,
            $harvestListing,
            [],
            $request
        );

        $this->service->deleteProduct($harvestListing);

        return ApiResponse::success(
            null,
            'Product deleted successfully.'
        );
    }

    public function suspendStore(Request $request, Farm $store)
    {
        $updatedStore = $this->service->suspendStore($store);

        $this->auditLogService->log(
            'admin.moderation.store.suspended',
            $request->user()->id,
            $updatedStore,
            ['is_suspended' => true],
            $request
        );

        return ApiResponse::success(
            new StoreResource($updatedStore),
            'Store suspended successfully.'
        );
    }

    public function hideStory(Request $request, StoreStory $story)
    {
        $updatedStory = $this->service->hideStory($story);

        $this->auditLogService->log(
            'admin.moderation.story.hidden',
            $request->user()->id,
            $updatedStory,
            ['is_hidden' => true],
            $request
        );

        return ApiResponse::success(
            new StoreStoryResource($updatedStory),
            'Story hidden successfully.'
        );
    }

    public function deleteStory(Request $request, StoreStory $story)
    {
        $this->auditLogService->log(
            'admin.moderation.story.deleted',
            $request->user()->id,
            $story,
            [],
            $request
        );

        $this->service->deleteStory($story);

        return ApiResponse::success(
            null,
            'Story deleted successfully.'
        );
    }

    public function hideDonation(Request $request, Donation $donation)
    {
        $updatedDonation = $this->service->hideDonation($donation);

        $this->auditLogService->log(
            'admin.moderation.donation.hidden',
            $request->user()->id,
            $updatedDonation,
            ['status' => $updatedDonation->status],
            $request
        );

        return ApiResponse::success(
            new DonationResource($updatedDonation),
            'Donation listing hidden successfully.'
        );
    }

    public function deleteDonation(Request $request, Donation $donation)
    {
        $this->auditLogService->log(
            'admin.moderation.donation.deleted',
            $request->user()->id,
            $donation,
            [],
            $request
        );

        $this->service->deleteDonation($donation);

        return ApiResponse::success(
            null,
            'Donation listing deleted successfully.'
        );
    }

    public function hideCompostListing(Request $request, CompostListing $compostListing)
    {
        $updatedListing = $this->service->hideCompostListing($compostListing);

        $this->auditLogService->log(
            'admin.moderation.compost-listing.hidden',
            $request->user()->id,
            $updatedListing,
            ['status' => $updatedListing->status],
            $request
        );

        return ApiResponse::success(
            new CompostListingResource($updatedListing),
            'Compost listing hidden successfully.'
        );
    }

    public function deleteCompostListing(Request $request, CompostListing $compostListing)
    {
        $this->auditLogService->log(
            'admin.moderation.compost-listing.deleted',
            $request->user()->id,
            $compostListing,
            [],
            $request
        );

        $this->service->deleteCompostListing($compostListing);

        return ApiResponse::success(
            null,
            'Compost listing deleted successfully.'
        );
    }
}
