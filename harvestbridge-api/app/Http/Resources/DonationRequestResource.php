<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DonationRequestResource extends JsonResource
{
    public function toArray($request): array
    {
        $donation = $this->donation;
        $store = $donation?->harvestListing?->farm ?? $donation?->farmerStore;

        return [

            'id' => $this->id,

            'donation_id' => $this->donation_id,

            'ngo_id' => $this->ngo_id,

            'quantity' => $this->quantity,

            'status' => $this->status,

            'message' => $this->message,

            'donation' => $donation
                ? DonationResource::make($donation)
                : null,

            'actions' => [
                'phone' => $store?->contactPhone() ?? $donation?->farmer?->phone,
                'google_maps_url' => $store?->googleMapsUrl(),
                'open_maps_action' => $store?->openMapsAction(),
            ],

            'created_at' => $this->created_at

        ];
    }
}
