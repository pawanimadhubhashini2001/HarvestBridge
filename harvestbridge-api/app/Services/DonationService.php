<?php

namespace App\Services;

use App\Models\Donation;
use App\Models\HarvestListing;
use App\Models\User;
use Exception;

class DonationService
{
    public function getAll(User $farmer)
    {
        return Donation::with([
            'harvestListing',
            'ngo'
        ])
            ->where('farmer_id', $farmer->id)
            ->latest()
            ->get();
    }

    public function create(User $farmer, array $data)
    {
        $listing = HarvestListing::findOrFail(
            $data['harvest_listing_id']
        );

        /*
        |--------------------------------------------------------------------------
        | Ownership Check
        |--------------------------------------------------------------------------
        */

        if ($listing->user_id != $farmer->id) {

            throw new Exception(
                'You can only donate your own harvest listings.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Listing Availability
        |--------------------------------------------------------------------------
        */

        if ($listing->status !== 'available') {

            throw new Exception(
                'Harvest listing is not available.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Prevent Duplicate Donation
        |--------------------------------------------------------------------------
        */

        if ($listing->donation()->exists()) {

            throw new Exception(
                'This harvest has already been donated.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Quantity Validation
        |--------------------------------------------------------------------------
        */

        if ($data['quantity'] > $listing->quantity) {

            throw new Exception(
                'Donation quantity exceeds available stock.'
            );
        }

        $data['farmer_id'] = $farmer->id;

        $data['status'] = 'available';

        return Donation::create($data);
    }

    public function update(
        Donation $donation,
        array $data
    ) {
        $donation->update($data);

        return $donation;
    }

    public function delete(
        Donation $donation
    ) {
        $donation->delete();
    }
    public function schedulePickup(
        Donation $donation,
        array $data,
        User $ngo
    ) {
        if ($donation->ngo_id != $ngo->id) {

            throw new \Exception(
                'This donation is not assigned to you.'
            );
        }

        if ($donation->status !== 'approved') {

            throw new \Exception(
                'Donation is not ready for pickup.'
            );
        }

        $donation->update([

            'pickup_date' => $data['pickup_date'],

            'pickup_time' => $data['pickup_time'],

            'status' => 'picked_up'

        ]);

        return $donation;
    }

    public function complete(
        Donation $donation,
        User $ngo
    ) {
        if ($donation->ngo_id != $ngo->id) {

            throw new \Exception(
                'Unauthorized.'
            );
        }

        if ($donation->status !== 'picked_up') {

            throw new \Exception(
                'Donation has not been picked up.'
            );
        }

        $donation->update([

            'status' => 'completed'

        ]);

        return $donation;
    }
}
