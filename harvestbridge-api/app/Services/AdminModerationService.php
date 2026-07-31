<?php

namespace App\Services;

use App\Models\CompostListing;
use App\Models\ContentReport;
use App\Models\Donation;
use App\Models\Farm;
use App\Models\HarvestListing;
use App\Models\StoreStory;
use App\Support\MediaStorage;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AdminModerationService
{
    public function __construct(
        protected HarvestListingService $harvestListingService,
        protected DonationService $donationService,
        protected CompostListingService $compostListingService
    ) {}

    public function products(array $filters): LengthAwarePaginator
    {
        return HarvestListing::query()
            ->with(['crop', 'farm', 'farmer', 'images'])
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($builder) use ($search) {
                    $builder->where('description', 'ILIKE', "%{$search}%")
                        ->orWhereHas('crop', fn ($cropQuery) => $cropQuery->where('name', 'ILIKE', "%{$search}%"))
                        ->orWhereHas('farm', fn ($farmQuery) => $farmQuery
                            ->where('farm_name', 'ILIKE', "%{$search}%")
                            ->orWhere('district', 'ILIKE', "%{$search}%"))
                        ->orWhereHas('farmer', fn ($userQuery) => $userQuery->where('name', 'ILIKE', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate($filters['per_page'] ?? 15);
    }

    public function stores(array $filters): LengthAwarePaginator
    {
        return Farm::query()
            ->with(['user'])
            ->withCount(['harvestListings', 'stories'])
            ->when(isset($filters['is_suspended']), fn ($query) => $query->where('is_suspended', filter_var($filters['is_suspended'], FILTER_VALIDATE_BOOLEAN)))
            ->when($filters['business_status'] ?? null, fn ($query, $status) => $query->where('business_status', $status))
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($builder) use ($search) {
                    $builder->where('farm_name', 'ILIKE', "%{$search}%")
                        ->orWhere('district', 'ILIKE', "%{$search}%")
                        ->orWhere('address', 'ILIKE', "%{$search}%")
                        ->orWhereHas('user', fn ($userQuery) => $userQuery
                            ->where('name', 'ILIKE', "%{$search}%")
                            ->orWhere('email', 'ILIKE', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate($filters['per_page'] ?? 15);
    }

    public function stories(array $filters): LengthAwarePaginator
    {
        return StoreStory::query()
            ->with(['store', 'views'])
            ->when($filters['state'] ?? null, function ($query, $state) {
                return match ($state) {
                    'hidden' => $query->where('is_hidden', true),
                    'expired' => $query->where('expires_at', '<=', now())->where('is_hidden', false),
                    default => $query->where('expires_at', '>', now())->where('is_hidden', false),
                };
            })
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($builder) use ($search) {
                    $builder->where('caption', 'ILIKE', "%{$search}%")
                        ->orWhereHas('store', fn ($storeQuery) => $storeQuery
                            ->where('farm_name', 'ILIKE', "%{$search}%")
                            ->orWhere('district', 'ILIKE', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate($filters['per_page'] ?? 15);
    }

    public function donations(array $filters): LengthAwarePaginator
    {
        return Donation::query()
            ->with([
                'farmer',
                'ngo',
                'harvestListing.crop',
                'harvestListing.farm',
            ])
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($builder) use ($search) {
                    $builder->where('description', 'ILIKE', "%{$search}%")
                        ->orWhere('pickup_location', 'ILIKE', "%{$search}%")
                        ->orWhereHas('harvestListing.crop', fn ($cropQuery) => $cropQuery->where('name', 'ILIKE', "%{$search}%"))
                        ->orWhereHas('harvestListing.farm', fn ($storeQuery) => $storeQuery
                            ->where('farm_name', 'ILIKE', "%{$search}%")
                            ->orWhere('district', 'ILIKE', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate($filters['per_page'] ?? 15);
    }

    public function compostListings(array $filters): LengthAwarePaginator
    {
        return CompostListing::query()
            ->with(['farmer', 'harvestListing.farm', 'farmerStore', 'images'])
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($builder) use ($search) {
                    $builder->where('waste_type', 'ILIKE', "%{$search}%")
                        ->orWhere('notes', 'ILIKE', "%{$search}%")
                        ->orWhere('pickup_location', 'ILIKE', "%{$search}%")
                        ->orWhereHas('farmerStore', fn ($storeQuery) => $storeQuery
                            ->where('farm_name', 'ILIKE', "%{$search}%")
                            ->orWhere('district', 'ILIKE', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate($filters['per_page'] ?? 15);
    }

    public function reports(array $filters): LengthAwarePaginator
    {
        $query = ContentReport::query()
            ->with(['reporter', 'reviewer', 'reportable'])
            ->when($filters['status'] ?? null, fn ($builder, $status) => $builder->where('status', $status))
            ->when($filters['content_type'] ?? null, function ($builder, $contentType) {
                $builder->where('reportable_type', $this->resolveReportableType($contentType));
            })
            ->when($filters['search'] ?? null, function ($builder, $search) {
                $builder->where(function ($reportQuery) use ($search) {
                    $reportQuery->where('reason', 'ILIKE', "%{$search}%")
                        ->orWhere('description', 'ILIKE', "%{$search}%")
                        ->orWhereHas('reporter', fn ($userQuery) => $userQuery
                            ->where('name', 'ILIKE', "%{$search}%")
                            ->orWhere('email', 'ILIKE', "%{$search}%"));
                });
            })
            ->latest();

        $paginator = $query->paginate($filters['per_page'] ?? 15);

        $paginator->getCollection()->loadMorph('reportable', [
            HarvestListing::class => ['crop', 'farm'],
            Farm::class => ['user'],
            StoreStory::class => ['store'],
            Donation::class => ['harvestListing.crop', 'harvestListing.farm'],
            CompostListing::class => ['farmerStore', 'harvestListing.farm'],
        ]);

        return $paginator;
    }

    public function hideProduct(HarvestListing $listing): HarvestListing
    {
        return $this->harvestListingService->updateAvailability($listing, [
            'status' => HarvestListing::STATUS_HIDDEN,
        ]);
    }

    public function deleteProduct(HarvestListing $listing): void
    {
        $this->harvestListingService->delete($listing);
    }

    public function suspendStore(Farm $store): Farm
    {
        $store->update([
            'is_suspended' => true,
            'business_status' => Farm::BUSINESS_STATUS_CLOSED,
        ]);

        return $store->fresh(['user', 'activeHarvestListings']);
    }

    public function hideStory(StoreStory $story): StoreStory
    {
        $story->update([
            'is_hidden' => true,
        ]);

        return $story->fresh(['store'])->loadCount('views');
    }

    public function deleteStory(StoreStory $story): void
    {
        DB::transaction(function () use ($story) {
            MediaStorage::delete($story->media_path);
            $story->delete();
        });
    }

    public function hideDonation(Donation $donation): Donation
    {
        $donation->update([
            'status' => Donation::STATUS_CANCELLED,
        ]);

        return $donation->fresh([
            'farmer',
            'ngo',
            'harvestListing.crop',
            'harvestListing.farm',
        ]);
    }

    public function deleteDonation(Donation $donation): void
    {
        $this->donationService->delete($donation);
    }

    public function hideCompostListing(CompostListing $listing): CompostListing
    {
        $listing->update([
            'status' => CompostListing::STATUS_CANCELLED,
        ]);

        return $listing->fresh(['farmer', 'harvestListing.farm', 'farmerStore', 'images']);
    }

    public function deleteCompostListing(CompostListing $listing): void
    {
        $this->compostListingService->delete($listing);
    }

    private function resolveReportableType(string $contentType): string
    {
        return match ($contentType) {
            'product' => HarvestListing::class,
            'store' => Farm::class,
            'story' => StoreStory::class,
            'donation' => Donation::class,
            'compost_listing' => CompostListing::class,
        };
    }
}
