<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NearbyProductSuggestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'crop_id' => $this->crop_id,
            'crop' => $this->crop?->name,
            'crop_category' => $this->crop?->category,
            'description' => $this->description,
            'available_quantity' => $this->available_quantity,
            'unit' => $this->unit,
            'price_per_unit' => $this->price_per_unit,
            'quality_grade' => $this->quality_grade,
            'status' => $this->status,
            'distance' => $this->when(
                isset($this->distance_km),
                fn () => round((float) $this->distance_km, 2)
            ),
            'distance_km' => $this->when(
                isset($this->distance_km),
                fn () => round((float) $this->distance_km, 2)
            ),
            'store' => $this->whenLoaded('farm', function () {
                return [
                    'id' => $this->farm?->id,
                    'store_name' => $this->farm?->farm_name,
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
        ];
    }
}
