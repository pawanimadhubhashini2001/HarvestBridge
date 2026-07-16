<?php

namespace App\Services;

use App\Models\CompostListing;
use App\Models\User;

class CompostListingService
{
    public function getAll(User $farmer)
    {
        return CompostListing::where(
            'farmer_id',
            $farmer->id
        )
            ->latest()
            ->get();
    }

    public function create(
        User $farmer,
        array $data
    ) {
        $data['farmer_id'] = $farmer->id;

        $data['status'] = 'available';

        return CompostListing::create($data);
    }

    public function update(
        CompostListing $listing,
        array $data
    ) {
        $listing->update($data);

        return $listing;
    }

    public function delete(
        CompostListing $listing
    ) {
        $listing->delete();
    }

    public function marketplace(array $filters = [])
    {
        $query = CompostListing::query()
            ->where('status', 'available')
            ->with([
                'farmer',
                'harvestListing'
            ]);

        /*
    |--------------------------------------------------------------------------
    | Waste Type
    |--------------------------------------------------------------------------
    */

        if (!empty($filters['waste_type'])) {

            $query->where(
                'waste_type',
                'ILIKE',
                '%' . $filters['waste_type'] . '%'
            );
        }

        /*
    |--------------------------------------------------------------------------
    | Pickup Location
    |--------------------------------------------------------------------------
    */

        if (!empty($filters['pickup_location'])) {

            $query->where(
                'pickup_location',
                'ILIKE',
                '%' . $filters['pickup_location'] . '%'
            );
        }

        /*
    |--------------------------------------------------------------------------
    | Available Date
    |--------------------------------------------------------------------------
    */

        if (!empty($filters['date'])) {

            $query->whereDate(
                'available_from',
                '<=',
                $filters['date']
            );

            $query->where(function ($q) use ($filters) {

                $q->whereNull('available_until')
                    ->orWhereDate(
                        'available_until',
                        '>=',
                        $filters['date']
                    );
            });
        }

        return $query
            ->latest()
            ->get();
    }
}
