<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PredictionHistoryResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'district' => $this->district,
            'season' => $this->season,
            'recommended_crop' => $this->recommended_crop,
            'confidence' => $this->confidence,
            'market_demand' => $this->market_demand,
            'temperature' => $this->temperature,
            'rainfall' => $this->rainfall,
            'humidity' => $this->humidity,
            'created_at' => $this->created_at,
        ];
    }
}
