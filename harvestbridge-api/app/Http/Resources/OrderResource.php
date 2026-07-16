<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray($request): array
    {
        return [

            'id' => $this->id,

            'consumer' => [

                'id' => $this->consumer?->id,

                'name' => $this->consumer?->name,

                'email' => $this->consumer?->email,

            ],

            'total_amount' => $this->total_amount,

            'order_status' => $this->order_status,

            'payment_status' => $this->payment_status,

            'delivery_address' => $this->delivery_address,

            'notes' => $this->notes,

            'created_at' => $this->created_at,

            'items' => $this->items,

        ];
    }
}
