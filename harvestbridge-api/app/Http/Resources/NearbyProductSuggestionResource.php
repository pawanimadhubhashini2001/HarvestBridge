<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NearbyProductSuggestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $cropName = $this->crop?->name ?? $this->crop_name;
        $cropCategory = $this->crop?->category ?? $this->crop_category;

        return [
            'id' => $this->id,
            'crop_id' => $this->crop_id,
            'crop' => $cropName,
            'crop_name' => $cropName,
            'crop_category' => $cropCategory,
            'description' => $this->description,
            'available_quantity' => $this->available_quantity,
            'unit' => $this->unit,
            'price_per_unit' => $this->price_per_unit,
            'quality_grade' => $this->quality_grade,
            'status' => $this->status,
            'recommendation_reason' => $this->when(
                isset($this->recommendation_reason),
                fn () => $this->recommendation_reason
            ),
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
        ];
    }
}
