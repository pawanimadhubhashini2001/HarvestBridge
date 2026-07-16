<?php

namespace App\Services;

use App\Models\CompostListing;
use App\Models\CompostRequest;
use App\Models\User;
use Exception;

class CompostRequestService
{
    public function create(
        User $business,
        array $data
    ) {
        $listing = CompostListing::findOrFail(

            $data['compost_listing_id']

        );

        if ($listing->status != 'available') {

            throw new Exception(

                'Compost is unavailable.'

            );
        }

        return CompostRequest::create([

            'compost_listing_id' => $listing->id,

            'business_id' => $business->id,

            'pickup_date' => $data['pickup_date'],

            'pickup_time' => $data['pickup_time'],

            'notes' => $data['notes'] ?? null,

            'status' => 'pending'

        ]);
    }
}
