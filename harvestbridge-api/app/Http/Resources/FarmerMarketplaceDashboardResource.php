<?php

namespace App\Http\Resources;

use App\Models\HarvestListing;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

class FarmerMarketplaceDashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'statistics' => $this->resource['statistics'],
            'low_stock_threshold' => $this->resource['low_stock_threshold'],
            'recent_listings' => $this->mapListings(
                $this->resource['recent_listings'] ?? collect()
            ),
            'recent_orders' => $this->mapOrders(
                $this->resource['recent_orders'] ?? collect()
            ),
            'low_stock_listings' => $this->mapListings(
                $this->resource['low_stock_listings'] ?? collect()
            ),
        ];
    }

    private function mapListings(iterable $listings): Collection
    {
        return collect($listings)
            ->map(function (HarvestListing $listing) {
                return [
                    'id' => $listing->id,
                    'crop' => $listing->crop?->name ?? $listing->crop_name,
                    'farm' => $listing->farm?->farm_name,
                    'district' => $listing->farm?->district,
                    'quantity' => $listing->quantity,
                    'available_quantity' => $listing->available_quantity,
                    'unit' => $listing->unit,
                    'price_per_unit' => $listing->price_per_unit,
                    'status' => $listing->status,
                    'is_featured' => $listing->isCurrentlyFeatured(),
                    'created_at' => $listing->created_at,
                    'updated_at' => $listing->updated_at,
                ];
            })
            ->values();
    }

    private function mapOrders(iterable $orders): Collection
    {
        return collect($orders)
            ->map(function (OrderItem $item) {
                return [
                    'order_id' => $item->order_id,
                    'order_status' => $item->order?->order_status,
                    'payment_status' => $item->order?->payment_status,
                    'consumer' => [
                        'id' => $item->order?->consumer?->id,
                        'name' => $item->order?->consumer?->name,
                        'email' => $item->order?->consumer?->email,
                    ],
                    'listing' => [
                        'id' => $item->harvest_listing_id,
                        'crop' => $item->harvestListing?->crop?->name ?? $item->harvestListing?->crop_name,
                        'farm' => $item->harvestListing?->farm?->farm_name,
                        'district' => $item->harvestListing?->farm?->district,
                    ],
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                    'subtotal' => $item->subtotal,
                    'created_at' => $item->order?->created_at ?? $item->created_at,
                ];
            })
            ->values();
    }
}
