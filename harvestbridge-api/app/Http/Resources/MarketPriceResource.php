<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MarketPriceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'crop' => $this->crop?->name,
            'market_name' => $this->market_name,
            'district' => $this->district,
            'price_per_unit' => $this->price_per_unit,
            'unit' => $this->unit,
            'price_date' => $this->price_date,
            'source' => $this->source,
        ];
    }
}
