<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HarvestListingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'crop' => $this->crop?->name,

            'farm' => $this->farm?->farm_name,

            'farmer' => $this->farmer?->name,

            'district' => $this->farm?->district,

            'quantity' => $this->quantity,

            'unit' => $this->unit,

            'price_per_unit' => $this->price_per_unit,

            'quality_grade' => $this->quality_grade,

            'harvest_date' => $this->harvest_date,

            'available_until' => $this->available_until,

            'status' => $this->status,

            'description' => $this->description,

        ];
    }
}
