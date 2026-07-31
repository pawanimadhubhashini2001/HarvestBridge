<?php

namespace App\Http\Resources;

use App\Support\MediaStorage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $firstListing = $this->items
            ?->first()
            ?->harvestListing;
        $store = $firstListing?->farm;

        return [

            'id' => $this->id,

            'consumer' => [

                'id' => $this->consumer?->id,

                'name' => $this->consumer?->name,

                'email' => $this->consumer?->email,

                'phone' => $this->consumer?->phone,

            ],

            'total_amount' => $this->total_amount,

            'order_status' => $this->order_status,

            'payment_status' => $this->payment_status,

            'delivery_address' => $this->delivery_address,

            'visit_date' => $this->delivery_date,

            'notes' => $this->notes,

            'created_at' => $this->created_at,

            'store' => $store ? [
                'id' => $store->id,
                'store_name' => $store->farm_name,
                'district' => $store->district,
                'address' => $store->address,
                'phone_number' => $store->phone_number,
                'latitude' => $store->latitude,
                'longitude' => $store->longitude,
                'google_maps_url' => $store->googleMapsUrl(),
                'open_maps_action' => $store->openMapsAction(),
            ] : null,

            'items' => $this->items?->map(function ($item) use ($request) {
                $listing = $item->harvestListing;

                return [
                    'id' => $item->id,
                    'harvest_listing_id' => $item->harvest_listing_id,
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                    'subtotal' => $item->subtotal,
                    'product' => $listing ? [
                        'id' => $listing->id,
                        'crop_name' => $listing->crop?->name ?? $listing->crop_name,
                        'crop_category' => $listing->crop?->category ?? $listing->crop_category,
                        'unit' => $listing->unit,
                        'price_per_unit' => $listing->price_per_unit,
                        'status' => $listing->status,
                        'available_quantity' => $listing->available_quantity,
                        'image_url' => $listing->images?->first()
                            ? MediaStorage::url($listing->images->first()->image_path, $request)
                            : null,
                    ] : null,
                ];
            })->values() ?? [],

        ];
    }
}
