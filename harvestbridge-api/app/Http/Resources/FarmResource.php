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

            'created_at' => $this->created_at

        ];
    }
}
