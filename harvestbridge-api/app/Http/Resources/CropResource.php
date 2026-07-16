<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CropResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'name' => $this->name,

            'category' => $this->category,

            'description' => $this->description,

            'growing_season' => $this->growing_season,

            'ideal_soil' => $this->ideal_soil,

            'ideal_temperature_min' => $this->ideal_temperature_min,

            'ideal_temperature_max' => $this->ideal_temperature_max,

            'ideal_rainfall_min' => $this->ideal_rainfall_min,

            'ideal_rainfall_max' => $this->ideal_rainfall_max,

            'average_growth_days' => $this->average_growth_days,

            'is_active' => $this->is_active,

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,

        ];
    }
}
