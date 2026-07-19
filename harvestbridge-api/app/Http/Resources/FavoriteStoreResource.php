<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class FavoriteStoreResource extends JsonResource
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
            'google_maps_url' => $this->googleMapsUrl(),
            'open_maps_action' => $this->openMapsAction(),
            'is_favorite' => true,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
