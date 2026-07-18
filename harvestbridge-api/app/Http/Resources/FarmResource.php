<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FarmResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'farm_name' => $this->farm_name,
            'district' => $this->district,
            'address' => $this->address,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'farm_size' => $this->farm_size,
            'farm_size_unit' => $this->farm_size_unit,
            'soil_type' => $this->soil_type,
            'active_crop_count' => $this->whenLoaded(
                'activeHarvestListings',
                fn () => $this->activeHarvestListings->pluck('crop_id')->filter()->unique()->count(),
                0
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
