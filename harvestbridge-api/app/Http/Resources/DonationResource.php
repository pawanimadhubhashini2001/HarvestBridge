<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class DonationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
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
            'description' => $this->description,
            'notes' => $this->notes,
            'pickup_location' => $this->pickup_location,
            'pickup_date' => $this->pickup_date,
            'pickup_time' => $this->pickup_time,
            'available_until' => $this->available_until,
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
                'crop_name' => $this->harvestListing?->crop?->name,
                'crop_category' => $this->harvestListing?->crop?->category,
                'listing_description' => $this->harvestListing?->description,
                'available_quantity' => $this->harvestListing?->available_quantity,
                'listing_unit' => $this->harvestListing?->unit,
                'listing_status' => $this->harvestListing?->status,
            ]),
            'farmer' => $this->whenLoaded('farmer', fn () => [
                'id' => $this->farmer?->id,
                'name' => $this->farmer?->name,
                'email' => $this->farmer?->email,
                'phone' => $this->harvestListing?->farm?->contactPhone() ?? $this->farmer?->phone,
            ]),
            'ngo' => $this->whenLoaded('ngo', fn () => [
                'id' => $this->ngo?->id,
                'name' => $this->ngo?->name,
                'email' => $this->ngo?->email,
                'phone' => $this->ngo?->phone,
            ]),
            'store' => $this->whenLoaded('harvestListing', fn () => [
                'id' => $this->harvestListing?->farm?->id,
                'store_name' => $this->harvestListing?->farm?->farm_name,
                'district' => $this->harvestListing?->farm?->district,
                'address' => $this->harvestListing?->farm?->address,
                'phone_number' => $this->harvestListing?->farm?->phone_number,
                'business_status' => $this->harvestListing?->farm?->business_status,
                'store_logo_url' => $this->harvestListing?->farm?->store_logo_path
                    ? Storage::disk('public')->url($this->harvestListing->farm->store_logo_path)
                    : null,
            ]),
            'location' => $this->whenLoaded('harvestListing', fn () => [
                'pickup_location' => $this->pickup_location,
                'district' => $this->harvestListing?->farm?->district,
                'address' => $this->harvestListing?->farm?->address,
                'latitude' => $this->harvestListing?->farm?->latitude,
                'longitude' => $this->harvestListing?->farm?->longitude,
                'google_maps_url' => $this->harvestListing?->farm?->googleMapsUrl(),
                'open_maps_action' => $this->harvestListing?->farm?->openMapsAction(),
            ]),
            'actions' => $this->whenLoaded('harvestListing', fn () => [
                'phone' => $this->harvestListing?->farm?->contactPhone() ?? $this->farmer?->phone,
                'open_maps_action' => $this->harvestListing?->farm?->openMapsAction(),
                'google_maps_url' => $this->harvestListing?->farm?->googleMapsUrl(),
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
