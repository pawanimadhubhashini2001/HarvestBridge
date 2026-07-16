<?php

namespace App\Services;

use App\Models\HarvestListing;

class MarketplaceService
{
    public function getAvailableHarvests(array $filters = [])
    {
        $query = HarvestListing::with([
            'crop',
            'farm',
            'farmer'
        ])
        ->where('status', 'available');

        /*
        |--------------------------------------------------------------------------
        | Search by Crop
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['search'])) {

            $query->whereHas('crop', function ($q) use ($filters) {

                $q->where(
                    'name',
                    'ILIKE',
                    '%' . $filters['search'] . '%'
                );

            });

        }

        /*
        |--------------------------------------------------------------------------
        | District
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['district'])) {

            $query->whereHas('farm', function ($q) use ($filters) {

                $q->where(
                    'district',
                    $filters['district']
                );

            });

        }

        /*
        |--------------------------------------------------------------------------
        | Minimum Price
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['min_price'])) {

            $query->where(
                'price_per_unit',
                '>=',
                $filters['min_price']
            );

        }

        /*
        |--------------------------------------------------------------------------
        | Maximum Price
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['max_price'])) {

            $query->where(
                'price_per_unit',
                '<=',
                $filters['max_price']
            );

        }

        /*
        |--------------------------------------------------------------------------
        | Sorting
        |--------------------------------------------------------------------------
        */

        switch ($filters['sort'] ?? 'latest') {

            case 'oldest':

                $query->oldest();

                break;

            case 'price_low':

                $query->orderBy('price_per_unit');

                break;

            case 'price_high':

                $query->orderByDesc('price_per_unit');

                break;

            default:

                $query->latest();

        }

        return $query->paginate(10);
    }
}
