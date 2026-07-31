<?php

namespace App\Http\Resources;

use App\Support\MediaStorage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompostListingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $store = $this->farmerStore ?? $this->harvestListing?->farm;
        $phone = $store?->contactPhone() ?? $this->farmer?->phone;

        return [
            'id' => $this->id,
            'waste_type' => $this->waste_type,
            'crop_category' => $this->crop_category,
            'quantity' => $this->quantity,
            'unit' => $this->unit,
            'price_per_unit' => $this->price_per_unit,
            'description' => $this->notes,
            'notes' => $this->notes,
            'pickup_location' => $this->pickup_location,
            'available_from' => $this->available_from,
            'available_until' => $this->available_until,
            'collected_date' => $this->collected_at,
            'collected_at' => $this->collected_at,
            'status' => $this->status,
            'collection_status' => $this->collectionStatus(),
            'status_label' => ucfirst($this->collectionStatus()),
            'distance' => $this->when(
                isset($this->distance_km),
                fn () => round((float) $this->distance_km, 2)
            ),
            'distance_km' => $this->when(
                isset($this->distance_km),
                fn () => round((float) $this->distance_km, 2)
            ),
            'images' => CompostListingImageResource::collection(
                $this->whenLoaded('images')
            ),
            'primary_image' => $this->whenLoaded(
                'images',
                fn () => $this->images->isNotEmpty()
                    ? CompostListingImageResource::make($this->images->first())->resolve()
                    : null
            ),
            'farmer' => $this->whenLoaded(
                'farmer',
                fn () => [
                    'id' => $this->farmer->id,
                    'name' => $this->farmer->name,
                    'phone' => $phone,
                ]
            ),
            'store' => $this->when(
                $store !== null,
                fn () => [
                    'id' => $store?->id,
                    'store_name' => $store?->farm_name,
                    'district' => $store?->district,
                    'address' => $store?->address,
                    'phone_number' => $store?->phone_number,
                    'store_logo_url' => $store?->store_logo_path
                    ? MediaStorage::url($store->store_logo_path, $request)
                    : null,
                ]
            ),
            'actions' => [
                'phone' => $phone,
                'google_maps_url' => $store?->googleMapsUrl(),
                'open_maps_action' => $store?->openMapsAction(),
                'can_mark_collected' => $this->collectionStatus() === 'reserved',
            ],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
