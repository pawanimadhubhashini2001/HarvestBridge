<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class FarmResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'store_name' => $this->farm_name,
            'farm_name' => $this->farm_name,
            'store_description' => $this->description,
            'store_image_url' => $this->store_logo_path
                ? Storage::disk('public')->url($this->store_logo_path)
                : null,
            'district' => $this->district,
            'address' => $this->address,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'google_maps_location' => $this->googleMapsUrl(),
            'google_maps_url' => $this->googleMapsUrl(),
            'store_logo_url' => $this->store_logo_path
                ? Storage::disk('public')->url($this->store_logo_path)
                : null,
            'store_cover_image_url' => $this->store_cover_image_path
                ? Storage::disk('public')->url($this->store_cover_image_path)
                : null,
            'phone_number' => $this->phone_number,
            'whatsapp_number' => $this->whatsapp_number,
            'email' => $this->email,
            'business_hours' => $this->business_hours,
            'business_status' => $this->business_status,
            'is_suspended' => (bool) ($this->is_suspended ?? false),
            'farm_size' => $this->farm_size,
            'farm_size_unit' => $this->farm_size_unit,
            'soil_type' => $this->soil_type,
            'irrigation_method' => $this->irrigation_method,
            'description' => $this->description,
            'active_crop_count' => $this->whenLoaded(
                'activeHarvestListings',
                fn () => $this->activeHarvestListings->pluck('crop_id')->filter()->unique()->count(),
                0
            ),
            'owner' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'phone' => $this->user->phone,
            ]),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
