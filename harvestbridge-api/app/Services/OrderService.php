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
    public function __construct(
        protected HarvestListingService $harvestListingService
    ) {}

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

            $listing = HarvestListing::with('farm')->findOrFail(
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

            $listing = $this->harvestListingService->reserveStock(
                $listing,
                (float) $data['quantity']
            );

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

                'delivery_address' => $data['delivery_address']
                    ?? $listing->farm?->address
                    ?? $listing->farm?->district
                    ?? 'Store visit',

                'delivery_date' => $data['visit_date'],

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

            return $this->loadOrderDetails($order);
        });
    }
    public function getConsumerOrders(User $consumer)
    {
        return Order::query()
            ->with([
                'consumer',
                'items.harvestListing.crop',
                'items.harvestListing.farm',
                'items.harvestListing.images',
                'items.harvestListing.farmer',
            ])
            ->where('consumer_id', $consumer->id)
            ->latest()
            ->get();
    }

    public function getFarmerOrders(User $farmer)
    {
        return Order::with([
            'consumer',
            'items.harvestListing.crop',
            'items.harvestListing.farm',
            'items.harvestListing.images',
            'items.harvestListing.farmer',
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
        return DB::transaction(function () use ($order, $status, $farmer) {
            /** @var Order $lockedOrder */
            $lockedOrder = Order::with([
                'items.harvestListing',
                'items.harvestListing.crop',
                'items.harvestListing.farm',
                'items.harvestListing.images',
                'items.harvestListing.farmer',
                'consumer',
            ])
                ->lockForUpdate()
                ->findOrFail($order->id);

            $belongsToFarmer = $lockedOrder->items
                ->contains(fn (OrderItem $item) => $item->harvestListing?->user_id === $farmer->id);

            if (! $belongsToFarmer) {
                throw new Exception(
                    'You are not authorized to update this order.'
                );
            }

            $current = $lockedOrder->order_status;

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
                    $allowedTransitions[$current],
                    true
                )
            ) {
                throw new Exception(
                    "Cannot change order from {$current} to {$status}."
                );
            }

            foreach ($lockedOrder->items as $item) {
                if (! $item->harvestListing || $item->harvestListing->user_id !== $farmer->id) {
                    continue;
                }

                if ($current === 'pending' && $status === 'rejected') {
                    $this->harvestListingService->releaseReservedStock(
                        $item->harvestListing,
                        (float) $item->quantity
                    );
                }

                if ($current === 'accepted' && $status === 'completed') {
                    $this->harvestListingService->completeReservedStock(
                        $item->harvestListing,
                        (float) $item->quantity
                    );
                }
            }

            $lockedOrder->update([
                'order_status' => $status
            ]);

            return $this->loadOrderDetails($lockedOrder->fresh());
        });
    }

    private function loadOrderDetails(Order $order): Order
    {
        return $order->load([
            'consumer',
            'items.harvestListing.crop',
            'items.harvestListing.farm',
            'items.harvestListing.images',
            'items.harvestListing.farmer',
        ]);
    }
}
