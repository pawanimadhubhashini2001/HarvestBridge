<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PreOrderRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $product = $this->product;
        $store = $product?->farm;

        return [
            'id' => $this->id,
            'pre_order_product_id' => $this->pre_order_product_id,
            'consumer_id' => $this->consumer_id,
            'quantity' => $this->quantity,
            'price' => $this->price,
            'subtotal' => $this->subtotal,
            'preferred_pickup_date' => $this->preferred_pickup_date,
            'notes' => $this->notes,
            'status' => $this->status,
            'accepted_at' => $this->accepted_at,
            'ready_at' => $this->ready_at,
            'completed_at' => $this->completed_at,
            'product' => $product ? PreOrderProductResource::make($product) : null,
            'consumer' => $this->whenLoaded('consumer', fn () => [
                'id' => $this->consumer?->id,
                'name' => $this->consumer?->name,
                'email' => $this->consumer?->email,
                'phone' => $this->consumer?->phone,
            ]),
            'actions' => [
                'phone' => $store?->contactPhone() ?? $product?->farmer?->phone,
                'google_maps_url' => $store?->googleMapsUrl(),
                'open_maps_action' => $store?->openMapsAction(),
            ],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
