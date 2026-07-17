<?php

namespace App\Services;

use App\Models\Crop;
use App\Models\MarketPrice;

class MarketPriceService
{
    public function latestPrice(string $cropName)
    {
        $crop = Crop::where('name', $cropName)->first();

        if (!$crop) {
            return null;
        }

        return MarketPrice::where('crop_id', $crop->id)
            ->where('is_active', true)
            ->latest('price_date')
            ->first();
    }
}
