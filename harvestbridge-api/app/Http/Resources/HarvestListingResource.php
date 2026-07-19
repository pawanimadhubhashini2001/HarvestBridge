<?php

namespace App\Http\Resources;

use App\Models\Crop;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HarvestListingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isDetailedResponse =
            $this->relationLoaded('donation')
            || $this->relationLoaded('compostListing')
            || $this->relationLoaded('orderItems');

        return [

            'id' => $this->id,

            'user_id' => $this->user_id,

            'farm_id' => $this->farm_id,

            'crop_id' => $this->crop_id,

            'crop' => $this->crop?->name,

            'crop_category' => $this->crop?->category,

            'category' => $this->whenLoaded('crop', fn () => [
                'name' => $this->crop?->category,
                'slug' => Crop::categorySlug($this->crop?->category),
            ]),

            'farm' => $this->farm?->farm_name,

            'farmer' => $this->farmer?->name,

            'district' => $this->farm?->district,

            'matched_field' => $this->when(
                isset($this->matched_field),
                fn () => $this->matched_field
            ),

            'distance' => $this->when(
                isset($this->distance_km),
                fn () => round((float) $this->distance_km, 2)
            ),

            'distance_km' => $this->when(
                isset($this->distance_km),
                fn () => round((float) $this->distance_km, 2)
            ),

            'quantity' => $this->quantity,

            'total_quantity' => $this->quantity,

            'available_quantity' => $this->available_quantity,

            'reserved_quantity' => $this->reserved_quantity,

            'sold_quantity' => $this->sold_quantity,

            'unit' => $this->unit,

            'price_per_unit' => $this->price_per_unit,

            'quality_grade' => $this->quality_grade,

            'harvest_date' => $this->harvest_date,

            'available_until' => $this->available_until,

            'status' => $this->status,

            'status_label' => $this->statusLabel(),

            'is_featured' => $this->isCurrentlyFeatured(),

            'is_available' => $this->isAvailableForConsumers(),

            'is_favorite' => (bool) ($this->is_favorite ?? false),

            'featured_until' => $this->featured_until,

            'description' => $this->description,

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,

            'images' => HarvestListingImageResource::collection($this->whenLoaded('images')),

            'primary_image' => $this->whenLoaded(
                'images',
                fn () => $this->images->isNotEmpty()
                    ? HarvestListingImageResource::make($this->images->first())->resolve()
                    : null
            ),

            'store' => $this->whenLoaded('farm', function () {
                return [
                    'id' => $this->farm?->id,
                    'store_name' => $this->farm?->farm_name,
                    'phone_number' => $this->farm?->phone_number,
                    'business_status' => $this->farm?->business_status,
                    'district' => $this->farm?->district,
                    'address' => $this->farm?->address,
                ];
            }),

            'coordinates' => $this->whenLoaded('farm', function () {
                return [
                    'latitude' => $this->farm?->latitude,
                    'longitude' => $this->farm?->longitude,
                ];
            }),

            'google_maps_url' => $this->whenLoaded(
                'farm',
                fn () => $this->farm?->googleMapsUrl()
            ),

            'open_maps_action' => $this->whenLoaded(
                'farm',
                fn () => $this->farm?->openMapsAction()
            ),

            $this->mergeWhen($isDetailedResponse, [
                'details' => [
                    'listing' => [
                        'id' => $this->id,
                        'user_id' => $this->user_id,
                        'farm_id' => $this->farm_id,
                        'crop_id' => $this->crop_id,
                        'crop_category' => $this->crop?->category,
                        'quantity' => $this->quantity,
                        'total_quantity' => $this->quantity,
                        'available_quantity' => $this->available_quantity,
                        'reserved_quantity' => $this->reserved_quantity,
                        'sold_quantity' => $this->sold_quantity,
                        'unit' => $this->unit,
                        'price_per_unit' => $this->price_per_unit,
                        'quality_grade' => $this->quality_grade,
                        'harvest_date' => $this->harvest_date,
                        'available_until' => $this->available_until,
                        'status' => $this->status,
                        'status_label' => $this->statusLabel(),
                        'is_available' => $this->isAvailableForConsumers(),
                        'is_featured' => $this->isCurrentlyFeatured(),
                        'featured_until' => $this->featured_until,
                        'description' => $this->description,
                        'created_at' => $this->created_at,
                        'updated_at' => $this->updated_at,
                        'images' => HarvestListingImageResource::collection($this->whenLoaded('images')),
                        'primary_image' => $this->whenLoaded(
                            'images',
                            fn () => $this->images->isNotEmpty()
                                ? HarvestListingImageResource::make($this->images->first())->resolve()
                                : null
                        ),
                    ],
                    'farmer' => $this->whenLoaded('farmer', function () {
                        return [
                            'id' => $this->farmer->id,
                            'name' => $this->farmer->name,
                            'email' => $this->farmer->email,
                            'phone' => $this->farmer->phone,
                            'district' => $this->farmer->district,
                        ];
                    }),
                    'farm' => FarmResource::make($this->whenLoaded('farm')),
                    'crop' => CropResource::make($this->whenLoaded('crop')),
                    'donation' => DonationResource::make($this->whenLoaded('donation')),
                    'compost_listing' => CompostListingResource::make($this->whenLoaded('compostListing')),
                    'order_summary' => $this->whenLoaded('orderItems', function () {
                        $latestOrderItem = $this->orderItems
                            ->filter(fn ($item) => $item->order !== null)
                            ->sortByDesc(fn ($item) => $item->order->created_at?->getTimestamp() ?? 0)
                            ->first();

                        return [
                            'order_items_count' => $this->orderItems->count(),
                            'orders_count' => $this->orderItems->pluck('order_id')->filter()->unique()->count(),
                            'total_quantity_ordered' => $this->orderItems->sum('quantity'),
                            'total_revenue' => $this->orderItems->sum('subtotal'),
                            'latest_order' => $latestOrderItem?->order ? [
                                'id' => $latestOrderItem->order->id,
                                'order_status' => $latestOrderItem->order->order_status,
                                'payment_status' => $latestOrderItem->order->payment_status,
                                'quantity' => $latestOrderItem->quantity,
                                'subtotal' => $latestOrderItem->subtotal,
                                'consumer' => $latestOrderItem->order->consumer ? [
                                    'id' => $latestOrderItem->order->consumer->id,
                                    'name' => $latestOrderItem->order->consumer->name,
                                    'email' => $latestOrderItem->order->consumer->email,
                                ] : null,
                                'created_at' => $latestOrderItem->order->created_at,
                            ] : null,
                        ];
                    }),
                ],
            ]),

        ];
    }
}
