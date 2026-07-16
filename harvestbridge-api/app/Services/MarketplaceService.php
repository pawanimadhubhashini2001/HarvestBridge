<?php

namespace App\Services;

use App\Models\HarvestListing;

class MarketplaceService
{
    public function getAvailableHarvests()
    {
        return HarvestListing::with([
                'crop',
                'farm',
                'farmer'
            ])
            ->where('status', 'available')
            ->latest()
            ->get();
    }
}
