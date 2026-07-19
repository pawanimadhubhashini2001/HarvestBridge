<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompostRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $listing = $this->compostListing;

        return [
            'id' => $this->id,
            'compost_listing_id' => $this->compost_listing_id,
            'business_id' => $this->business_id,
            'pickup_date' => $this->pickup_date,
            'pickup_time' => $this->pickup_time,
            'status' => $this->status,
            'notes' => $this->notes,
            'business' => $this->whenLoaded('business', fn () => [
                'id' => $this->business?->id,
                'name' => $this->business?->name,
                'email' => $this->business?->email,
            ]),
            'compost_listing' => $listing
                ? CompostListingResource::make($listing)
                : null,
            'collection' => [
                'status' => $listing?->collectionStatus(),
                'collected_date' => $listing?->collected_at,
                'can_mark_collected' => $this->status === 'approved'
                    && $listing?->collectionStatus() !== 'collected',
            ],
            'actions' => [
                'phone' => $listing?->farmerStore?->contactPhone()
                    ?? $listing?->harvestListing?->farm?->contactPhone()
                    ?? $listing?->farmer?->phone,
                'google_maps_url' => $listing?->farmerStore?->googleMapsUrl()
                    ?? $listing?->harvestListing?->farm?->googleMapsUrl(),
                'open_maps_action' => $listing?->farmerStore?->openMapsAction()
                    ?? $listing?->harvestListing?->farm?->openMapsAction(),
            ],
        ];
    }
}
