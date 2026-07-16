<?php

namespace App\Services;

use App\Models\Donation;
use App\Models\DonationRequest;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;

class DonationRequestService
{
    public function create(
        User $ngo,
        array $data
    ) {
        return DB::transaction(function () use ($ngo, $data) {

            $donation = Donation::findOrFail(
                $data['donation_id']
            );

            /*
            |--------------------------------------------------------------------------
            | Donation Availability
            |--------------------------------------------------------------------------
            */

            if ($donation->status !== 'available') {

                throw new Exception(
                    'Donation is not available.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Prevent Duplicate Request
            |--------------------------------------------------------------------------
            */

            if (
                DonationRequest::where(
                    'donation_id',
                    $donation->id
                )
                ->where(
                    'ngo_id',
                    $ngo->id
                )
                ->exists()
            ) {

                throw new Exception(
                    'You have already requested this donation.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Create Request
            |--------------------------------------------------------------------------
            */

            $request = DonationRequest::create([

                'donation_id' => $donation->id,

                'ngo_id' => $ngo->id,

                'message' => $data['message'] ?? null,

                'status' => 'pending'

            ]);

            /*
            |--------------------------------------------------------------------------
            | Update Donation Status
            |--------------------------------------------------------------------------
            */

            $donation->update([

                'status' => 'requested'

            ]);

            return $request->load([
                'donation',
                'ngo'
            ]);
        });
    }

    public function getNgoRequests(User $ngo)
    {
        return DonationRequest::with([
            'donation.harvestListing',
            'ngo'
        ])
            ->where('ngo_id', $ngo->id)
            ->latest()
            ->get();
    }
    public function getFarmerRequests(User $farmer)
    {
        return DonationRequest::with([
            'ngo',
            'donation.harvestListing'
        ])
            ->whereHas('donation', function ($query) use ($farmer) {

                $query->where('farmer_id', $farmer->id);
            })
            ->latest()
            ->get();
    }
    public function updateStatus(
        DonationRequest $request,
        string $status,
        User $farmer
    ) {
        if ($request->donation->farmer_id != $farmer->id) {

            throw new \Exception(
                'Unauthorized.'
            );
        }

        if ($status === 'approved') {

            DB::transaction(function () use ($request) {

                /*
            |--------------------------------------------------------------------------
            | Approve Selected Request
            |--------------------------------------------------------------------------
            */

                $request->update([

                    'status' => 'approved'

                ]);

                /*
            |--------------------------------------------------------------------------
            | Update Donation
            |--------------------------------------------------------------------------
            */

                $request->donation->update([

                    'ngo_id' => $request->ngo_id,

                    'status' => 'approved'

                ]);

                /*
            |--------------------------------------------------------------------------
            | Reject Other Requests
            |--------------------------------------------------------------------------
            */

                DonationRequest::where(

                    'donation_id',

                    $request->donation_id

                )
                    ->where(

                        'id',

                        '!=',

                        $request->id

                    )
                    ->update([

                        'status' => 'rejected'

                    ]);
            });
        } else {

            $request->update([

                'status' => 'rejected'

            ]);
        }

        return $request->fresh()->load([
            'ngo',
            'donation'
        ]);
    }
}
