<?php

namespace App\Services;

use App\Models\CompostListing;
use App\Models\CompostRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
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
    public function updateStatus(
        CompostRequest $request,
        string $status,
        $farmer
    ) {
        return DB::transaction(function () use (
            $request,
            $status,
            $farmer
        ) {

            $listing = $request->compostListing;

            /*
        |--------------------------------------------------------------------------
        | Ownership Check
        |--------------------------------------------------------------------------
        */

            if ($listing->farmer_id != $farmer->id) {

                throw new Exception(
                    'You cannot manage this request.'
                );
            }

            /*
        |--------------------------------------------------------------------------
        | Update Request
        |--------------------------------------------------------------------------
        */

            $request->update([

                'status' => $status

            ]);

            /*
        |--------------------------------------------------------------------------
        | Update Compost Listing
        |--------------------------------------------------------------------------
        */

            if ($status == 'approved') {

                $listing->update([

                    'status' => 'reserved'

                ]);
            }

            return $request->fresh();
        });
    }
    public function getFarmerRequests($farmer)
    {
        return CompostRequest::with([

            'business',

            'compostListing'

        ])

            ->whereHas(

                'compostListing',

                function ($query) use ($farmer) {

                    $query->where(

                        'farmer_id',

                        $farmer->id

                    );
                }

            )

            ->latest()

            ->get();
    }
}
