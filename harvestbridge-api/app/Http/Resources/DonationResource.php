<?php

namespace App\Http\Resources;

use App\Support\MediaStorage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DonationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $cropName = $this->harvestListing?->crop?->name
            ?? $this->harvestListing?->crop_name
            ?? $this->crop_name;
        $cropCategory = $this->harvestListing?->crop?->category
            ?? $this->harvestListing?->crop_category
            ?? $this->crop_category;
        $store = $this->harvestListing?->farm ?? $this->farmerStore;
        $phone = $store?->contactPhone() ?? $this->farmer?->phone;

        return [
            'id' => $this->id,
            'status' => $this->status,
            'collection_status' => $this->collectionStatus(),
            'collected_date' => $this->when(
                $this->collected_at !== null,
                fn () => $this->collected_at
            ),
            'collected_at' => $this->collected_at,
            'quantity' => $this->quantity,
            'unit' => $this->unit,
            'price_per_unit' => $this->price_per_unit,
            'description' => $this->description,
            'notes' => $this->notes,
            'pickup_location' => $this->pickup_location,
            'pickup_date' => $this->pickup_date,
            'pickup_time' => $this->pickup_time,
            'available_until' => $this->available_until,
            'images' => DonationImageResource::collection(
                $this->whenLoaded('images')
            ),
            'primary_image' => $this->whenLoaded(
                'images',
                fn () => $this->images->isNotEmpty()
                    ? DonationImageResource::make($this->images->first())->resolve()
                    : null
            ),
            'distance' => $this->when(
                isset($this->distance_km),
                fn () => round((float) $this->distance_km, 2)
            ),
            'distance_km' => $this->when(
                isset($this->distance_km),
                fn () => round((float) $this->distance_km, 2)
            ),
            'product' => $this->whenLoaded('harvestListing', fn () => [
                'id' => $this->harvestListing?->id,
                'crop_id' => $this->harvestListing?->crop_id,
                'crop_name' => $cropName,
                'crop_category' => $cropCategory,
                'listing_description' => $this->harvestListing?->description,
                'available_quantity' => $this->harvestListing?->available_quantity,
                'listing_unit' => $this->harvestListing?->unit,
                'listing_price_per_unit' => $this->harvestListing?->price_per_unit,
                'listing_status' => $this->harvestListing?->status,
            ]),
            'farmer' => $this->whenLoaded('farmer', fn () => [
                'id' => $this->farmer?->id,
                'name' => $this->farmer?->name,
                'email' => $this->farmer?->email,
                'phone' => $phone,
            ]),
            'ngo' => $this->whenLoaded('ngo', fn () => [
                'id' => $this->ngo?->id,
                'name' => $this->ngo?->name,
                'email' => $this->ngo?->email,
                'phone' => $this->ngo?->phone,
            ]),
            'store' => $this->when($store !== null, fn () => [
                'id' => $store?->id,
                'store_name' => $store?->farm_name,
                'district' => $store?->district,
                'address' => $store?->address,
                'phone_number' => $store?->phone_number,
                'business_status' => $store?->business_status,
                'store_logo_url' => $store?->store_logo_path
                    ? MediaStorage::url($store->store_logo_path, $request)
                    : null,
            ]),
            'location' => $this->when($store !== null, fn () => [
                'pickup_location' => $this->pickup_location,
                'district' => $store?->district,
                'address' => $store?->address,
                'latitude' => $store?->latitude,
                'longitude' => $store?->longitude,
                'google_maps_url' => $store?->googleMapsUrl(),
                'open_maps_action' => $store?->openMapsAction(),
            ]),
            'actions' => $this->when($store !== null, fn () => [
                'phone' => $phone,
                'open_maps_action' => $store?->openMapsAction(),
                'google_maps_url' => $store?->googleMapsUrl(),
                'can_mark_collected' => $this->collectionStatus() !== 'collected'
                    && in_array($this->status, ['approved', 'picked_up'], true),
            ]),
            'collection' => [
                'status' => $this->collectionStatus(),
                'collected_date' => $this->collected_at,
            ],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
