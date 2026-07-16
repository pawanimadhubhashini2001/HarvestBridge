<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\HarvestListing;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Exception;

class OrderService
{
    public function createOrder(
        User $consumer,
        array $data
    ) {
        return DB::transaction(function () use (
            $consumer,
            $data
        ) {

            /*
            |--------------------------------------------------------------------------
            | Get Harvest Listing
            |--------------------------------------------------------------------------
            */

            $listing = HarvestListing::findOrFail(
                $data['harvest_listing_id']
            );

            /*
            |--------------------------------------------------------------------------
            | Consumer cannot buy own harvest
            |--------------------------------------------------------------------------
            */

            if ($listing->user_id == $consumer->id) {

                throw new Exception(
                    'You cannot purchase your own harvest listing.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Check Status
            |--------------------------------------------------------------------------
            */

            if ($listing->status !== 'available') {

                throw new Exception(
                    'Harvest is no longer available.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Quantity Check
            |--------------------------------------------------------------------------
            */

            if ($data['quantity'] > $listing->quantity) {

                throw new Exception(
                    'Requested quantity exceeds available stock.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Calculate Total
            |--------------------------------------------------------------------------
            */

            $subtotal =
                $data['quantity']
                *
                $listing->price_per_unit;

            /*
            |--------------------------------------------------------------------------
            | Create Order
            |--------------------------------------------------------------------------
            */

            $order = Order::create([

                'consumer_id' => $consumer->id,

                'total_amount' => $subtotal,

                'payment_method' => null,

                'payment_status' => 'pending',

                'order_status' => 'pending',

                'delivery_address' => $data['delivery_address'],

                'notes' => $data['notes'] ?? null

            ]);

            /*
            |--------------------------------------------------------------------------
            | Create Order Item
            |--------------------------------------------------------------------------
            */

            OrderItem::create([

                'order_id' => $order->id,

                'harvest_listing_id'
                => $listing->id,

                'quantity'
                => $data['quantity'],

                'price'
                => $listing->price_per_unit,

                'subtotal'
                => $subtotal

            ]);

            return $order->load('items');
        });
    }
    public function getFarmerOrders(User $farmer)
    {
        return Order::with([
            'consumer',
            'items.harvestListing.crop'
        ])
            ->whereHas('items.harvestListing', function ($query) use ($farmer) {

                $query->where('user_id', $farmer->id);
            })
            ->latest()
            ->get();
    }
    public function updateStatus(
        Order $order,
        string $status,
        User $farmer
    ) {
        $belongsToFarmer = $order->items()
            ->whereHas('harvestListing', function ($query) use ($farmer) {
                $query->where('user_id', $farmer->id);
            })
            ->exists();

        if (! $belongsToFarmer) {
            throw new Exception(
                'You are not authorized to update this order.'
            );
        }

        $current = $order->order_status;

        $allowedTransitions = [

            'pending' => [
                'accepted',
                'rejected'
            ],

            'accepted' => [
                'completed'
            ],

            'completed' => [],

            'rejected' => []

        ];

        if (
            ! in_array(
                $status,
                $allowedTransitions[$current]
            )
        ) {
            throw new Exception(
                "Cannot change order from {$current} to {$status}."
            );
        }

        $order->update([
            'order_status' => $status
        ]);

        return $order->fresh()->load([
            'consumer',
            'items.harvestListing.crop'
        ]);
    }
}
