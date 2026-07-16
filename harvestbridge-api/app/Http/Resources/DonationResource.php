<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DonationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray($request): array
    {
        return [

            'id' => $this->id,

            /*
            |--------------------------------------------------------------------------
            | Farmer
            |--------------------------------------------------------------------------
            */

            'farmer' => $this->whenLoaded('farmer', function () {
                return [
                    'id' => $this->farmer->id,
                    'name' => $this->farmer->name,
                    'email' => $this->farmer->email,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | NGO
            |--------------------------------------------------------------------------
            */

            'ngo' => $this->whenLoaded('ngo', function () {
                return [
                    'id' => $this->ngo->id,
                    'name' => $this->ngo->name,
                    'email' => $this->ngo->email,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | Harvest Listing
            |--------------------------------------------------------------------------
            */

            'harvest_listing_id' => $this->harvest_listing_id,

            /*
            |--------------------------------------------------------------------------
            | Donation Details
            |--------------------------------------------------------------------------
            */

            'quantity' => $this->quantity,

            'unit' => $this->unit,

            'status' => $this->status,

            'pickup_date' => $this->pickup_date,

            'pickup_time' => $this->pickup_time,

            'notes' => $this->notes,

            /*
            |--------------------------------------------------------------------------
            | Timestamps
            |--------------------------------------------------------------------------
            */

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,

        ];
    }
}
