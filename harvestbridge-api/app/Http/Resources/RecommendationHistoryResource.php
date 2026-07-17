<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecommendationHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'recommended_crop' => $this->recommended_crop,

            'confidence' => $this->confidence,

            'district' => $this->district,

            'season' => $this->season,

            'soil_type' => $this->soil_type,

            'market_demand' => $this->market_demand,

            'created_at' => $this->created_at->format('Y-m-d H:i'),

        ];
    }
}
