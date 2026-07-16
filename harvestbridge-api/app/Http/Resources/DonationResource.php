<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DonationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        return [

            'id' => $this->id,

            'harvest_listing_id'
            => $this->harvest_listing_id,

            'quantity'
            => $this->quantity,

            'unit'
            => $this->unit,

            'pickup_date'
            => $this->pickup_date,

            'pickup_time'
            => $this->pickup_time,

            'status'
            => $this->status,

            'notes'
            => $this->notes,

            'created_at'
            => $this->created_at

        ];
    }
}
