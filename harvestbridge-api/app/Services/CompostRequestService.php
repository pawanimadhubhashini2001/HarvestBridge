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

            if ($listing->farmer_id != $farmer->id) {
                throw new Exception(
                    'You cannot manage this request.'
                );
            }

            if ($status === 'approved') {

                // Approve selected request
                $request->update([
                    'status' => 'approved'
                ]);

                // Reserve compost listing
                $listing->update([
                    'status' => 'reserved'
                ]);

                // Reject all other pending requests
                CompostRequest::where(
                    'compost_listing_id',
                    $listing->id
                )
                    ->where('id', '!=', $request->id)
                    ->where('status', 'pending')
                    ->update([
                        'status' => 'rejected'
                    ]);
            } else {

                $request->update([
                    'status' => 'rejected'
                ]);
            }

            return $request->fresh()->load([
                'business',
                'compostListing'
            ]);
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
    public function collect(
        CompostRequest $request,
        array $data,
        User $business
    ) {
        if ($request->business_id != $business->id) {

            throw new Exception(
                'Unauthorized.'
            );
        }

        if ($request->status != 'approved') {

            throw new Exception(
                'Request has not been approved.'
            );
        }

        $request->update([

            'pickup_date' => $data['pickup_date'],

            'pickup_time' => $data['pickup_time'],

            'status' => 'completed'

        ]);

        $request->compostListing->update([

            'status' => 'collected'

        ]);

        return $request->fresh();
    }
    public function complete(
        CompostRequest $request,
        User $farmer
    ) {
        if (
            $request->compostListing->farmer_id !=
            $farmer->id
        ) {

            throw new Exception(
                'Unauthorized.'
            );
        }

        $request->compostListing->update([

            'status' => 'completed'

        ]);

        return $request->compostListing->fresh();
    }
    public function businessDashboard(User $business)
    {
        return [

            'statistics' => [

                'total_requests' => CompostRequest::where(
                    'business_id',
                    $business->id
                )->count(),

                'pending_requests' => CompostRequest::where(
                    'business_id',
                    $business->id
                )
                    ->where('status', 'pending')
                    ->count(),

                'approved_requests' => CompostRequest::where(
                    'business_id',
                    $business->id
                )
                    ->where('status', 'approved')
                    ->count(),

                'completed_requests' => CompostRequest::where(
                    'business_id',
                    $business->id
                )
                    ->where('status', 'completed')
                    ->count()

            ],

            'requests' => CompostRequest::with([
                'compostListing'
            ])
                ->where(
                    'business_id',
                    $business->id
                )
                ->latest()
                ->get()

        ];
    }
    public function businessRequests(
        User $business,
        ?string $status = null
    ) {
        $query = CompostRequest::with([
            'compostListing'
        ])
            ->where(
                'business_id',
                $business->id
            );

        if ($status) {

            $query->where(
                'status',
                $status
            );
        }

        return $query
            ->latest()
            ->get();
    }
}
