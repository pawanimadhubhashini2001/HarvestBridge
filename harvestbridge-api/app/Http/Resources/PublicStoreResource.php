<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class PublicStoreResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'store_name' => $this->farm_name,
            'store_description' => $this->description,
            'store_logo_url' => $this->store_logo_path
                ? Storage::disk('public')->url($this->store_logo_path)
                : null,
            'store_cover_image_url' => $this->store_cover_image_path
                ? Storage::disk('public')->url($this->store_cover_image_path)
                : null,
            'phone_number' => $this->phone_number,
            'district' => $this->district,
            'address' => $this->address,
            'business_status' => $this->business_status,
            'distance_km' => isset($this->distance_km)
                ? round((float) $this->distance_km, 2)
                : null,
            'active_products_count' => $this->whenLoaded(
                'activeHarvestListings',
                fn () => $this->activeHarvestListings->count(),
                0
            ),
            'owner' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'phone' => $this->user->phone,
            ]),
            'location' => [
                'district' => $this->district,
                'address' => $this->address,
                'latitude' => $this->latitude,
                'longitude' => $this->longitude,
                'google_maps_url' => $this->googleMapsUrl(),
                'open_maps_action' => $this->openMapsAction(),
            ],
            'actions' => [
                'phone' => $this->contactPhone(),
                'whatsapp' => $this->whatsappLink(),
                'google_maps_url' => $this->googleMapsUrl(),
                'open_maps_action' => $this->openMapsAction(),
                'share_url' => url('/api/stores/public/'.$this->getKey()),
            ],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
