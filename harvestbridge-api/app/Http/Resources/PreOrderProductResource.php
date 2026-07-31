<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PreOrderProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $cropName = $this->crop?->name ?? $this->crop_name;
        $cropCategory = $this->crop?->category ?? $this->crop_category;

        return [
            'id' => $this->id,
            'farmer_id' => $this->farmer_id,
            'farm_id' => $this->farm_id,
            'crop_id' => $this->crop_id,
            'crop_name' => $cropName,
            'crop' => $cropName,
            'crop_category' => $cropCategory,
            'description' => $this->description,
            'expected_quantity' => $this->expected_quantity,
            'available_quantity' => $this->available_quantity,
            'reserved_quantity' => $this->reserved_quantity,
            'fulfilled_quantity' => $this->fulfilled_quantity,
            'unit' => $this->unit,
            'price_per_unit' => $this->price_per_unit,
            'quality_grade' => $this->quality_grade,
            'expected_harvest_date' => $this->expected_harvest_date,
            'order_deadline' => $this->order_deadline,
            'status' => $this->status,
            'status_label' => $this->statusLabel(),
            'is_available' => $this->isOpenForRequests(),
            'farmer' => $this->whenLoaded('farmer', fn () => [
                'id' => $this->farmer?->id,
                'name' => $this->farmer?->name,
                'phone' => $this->farmer?->phone,
            ]),
            'store' => $this->whenLoaded('farm', fn () => [
                'id' => $this->farm?->id,
                'store_name' => $this->farm?->farm_name,
                'district' => $this->farm?->district,
                'address' => $this->farm?->address,
                'phone_number' => $this->farm?->phone_number,
                'business_status' => $this->farm?->business_status,
                'google_maps_url' => $this->farm?->googleMapsUrl(),
                'open_maps_action' => $this->farm?->openMapsAction(),
            ]),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
