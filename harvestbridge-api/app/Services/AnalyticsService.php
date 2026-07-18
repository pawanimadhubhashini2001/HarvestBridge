<?php

namespace App\Services;

use App\Models\CompostListing;
use App\Models\CompostRequest;
use App\Models\HarvestListing;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    private const RECENT_LIMIT = 5;
    private const LOW_STOCK_THRESHOLD = 10;

    public function __construct(
        protected HarvestListingService $harvestListingService
    ) {}

    public function compostAnalytics(User $user)
    {
        return [

            'total_listings' =>
            CompostListing::where(
                'farmer_id',
                $user->id
            )->count(),

            'available_listings' =>
            CompostListing::where(
                'farmer_id',
                $user->id
            )
                ->where('status', 'available')
                ->count(),

            'completed_listings' =>
            CompostListing::where(
                'farmer_id',
                $user->id
            )
                ->where('status', 'completed')
                ->count(),

            'total_requests' =>
            CompostRequest::whereHas(
                'compostListing',
                function ($query) use ($user) {
                    $query->where(
                        'farmer_id',
                        $user->id
                    );
                }
            )->count()

        ];
    }
    public function wasteTypeSummary(User $user)
    {
        return CompostListing::select(

            'waste_type',

            DB::raw('COUNT(*) as total')

        )
            ->where(
                'farmer_id',
                $user->id
            )
            ->groupBy('waste_type')
            ->orderByDesc('total')
            ->get();
    }
    public function monthlySummary(User $user)
    {
        return CompostListing::selectRaw(

            "DATE_TRUNC('month', created_at) as month,
         COUNT(*) as total"

        )
            ->where(
                'farmer_id',
                $user->id
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();
    }

    public function farmerMarketplaceDashboard(User $user): array
    {
        $this->harvestListingService->expireElapsedListings();
        $this->harvestListingService->expireElapsedFeaturedListings();

        $listingsSummary = HarvestListing::query()
            ->where('user_id', $user->id)
            ->selectRaw('COUNT(*) as total_listings')
            ->selectRaw(
                "COUNT(*) FILTER (WHERE status = ?) as available_listings",
                [HarvestListing::STATUS_AVAILABLE]
            )
            ->selectRaw(
                "COUNT(*) FILTER (WHERE status = ?) as reserved_listings",
                [HarvestListing::STATUS_RESERVED]
            )
            ->selectRaw(
                "COUNT(*) FILTER (WHERE status = ?) as sold_listings",
                [HarvestListing::STATUS_SOLD]
            )
            ->selectRaw(
                "COUNT(*) FILTER (WHERE status = ?) as expired_listings",
                [HarvestListing::STATUS_EXPIRED]
            )
            ->selectRaw(
                'ROUND(COALESCE(AVG(price_per_unit), 0)::numeric, 2) as average_listing_price'
            )
            ->first();

        $salesSummary = OrderItem::query()
            ->join('harvest_listings', 'harvest_listings.id', '=', 'order_items.harvest_listing_id')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('harvest_listings.user_id', $user->id)
            ->where('orders.order_status', 'completed')
            ->selectRaw('COUNT(DISTINCT orders.id) as total_sales')
            ->selectRaw(
                'ROUND(COALESCE(SUM(order_items.subtotal), 0)::numeric, 2) as total_revenue'
            )
            ->selectRaw(
                'ROUND(COALESCE(SUM(order_items.quantity), 0)::numeric, 2) as total_quantity_sold'
            )
            ->first();

        return [
            'statistics' => [
                'total_listings' => (int) ($listingsSummary->total_listings ?? 0),
                'available_listings' => (int) ($listingsSummary->available_listings ?? 0),
                'reserved_listings' => (int) ($listingsSummary->reserved_listings ?? 0),
                'sold_listings' => (int) ($listingsSummary->sold_listings ?? 0),
                'expired_listings' => (int) ($listingsSummary->expired_listings ?? 0),
                'donation_listings' => $this->donationListingCount($user),
                'compost_listings' => $this->compostListingCount($user),
                'total_revenue' => (float) ($salesSummary->total_revenue ?? 0),
                'total_sales' => (int) ($salesSummary->total_sales ?? 0),
                'total_quantity_sold' => (float) ($salesSummary->total_quantity_sold ?? 0),
                'average_listing_price' => (float) ($listingsSummary->average_listing_price ?? 0),
            ],
            'low_stock_threshold' => self::LOW_STOCK_THRESHOLD,
            'recent_listings' => $this->recentListings($user),
            'recent_orders' => $this->recentOrders($user),
            'low_stock_listings' => $this->lowStockListings($user),
        ];
    }

    private function donationListingCount(User $user): int
    {
        return HarvestListing::query()
            ->where('user_id', $user->id)
            ->whereHas('donation')
            ->count();
    }

    private function compostListingCount(User $user): int
    {
        return HarvestListing::query()
            ->where('user_id', $user->id)
            ->whereHas('compostListing')
            ->count();
    }

    private function recentListings(User $user): Collection
    {
        return HarvestListing::query()
            ->with([
                'crop:id,name',
                'farm:id,farm_name,district',
            ])
            ->where('user_id', $user->id)
            ->latest()
            ->limit(self::RECENT_LIMIT)
            ->get();
    }

    private function recentOrders(User $user): Collection
    {
        return OrderItem::query()
            ->select('order_items.*')
            ->join('harvest_listings', 'harvest_listings.id', '=', 'order_items.harvest_listing_id')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('harvest_listings.user_id', $user->id)
            ->with([
                'order.consumer:id,name,email',
                'harvestListing.crop:id,name',
                'harvestListing.farm:id,farm_name,district',
            ])
            ->orderByDesc('orders.created_at')
            ->orderByDesc('order_items.id')
            ->limit(self::RECENT_LIMIT)
            ->get();
    }

    private function lowStockListings(User $user): Collection
    {
        return HarvestListing::query()
            ->with([
                'crop:id,name',
                'farm:id,farm_name,district',
            ])
            ->where('user_id', $user->id)
            ->whereIn('status', [
                HarvestListing::STATUS_AVAILABLE,
                HarvestListing::STATUS_RESERVED,
            ])
            ->where('available_quantity', '>', 0)
            ->where('available_quantity', '<=', self::LOW_STOCK_THRESHOLD)
            ->orderBy('available_quantity')
            ->orderByDesc('updated_at')
            ->limit(self::RECENT_LIMIT)
            ->get();
    }
}
