<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CompostRequestResource extends JsonResource
{
    public function toArray($request): array
    {
        return [

            'id' => $this->id,

            'compost_listing_id' => $this->compost_listing_id,

            'business_id' => $this->business_id,

            'pickup_date' => $this->pickup_date,

            'pickup_time' => $this->pickup_time,

            'status' => $this->status,

            'notes' => $this->notes

        ];
    }
}
