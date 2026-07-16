<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CompostListingResource extends JsonResource
{
    public function toArray($request): array
    {
        return [

            'id' => $this->id,

            'waste_type' => $this->waste_type,

            'quantity' => $this->quantity,

            'unit' => $this->unit,

            'pickup_location' => $this->pickup_location,

            'available_from' => $this->available_from,

            'available_until' => $this->available_until,

            'status' => $this->status,

            'notes' => $this->notes,

            'farmer' => $this->whenLoaded(
                'farmer',
                fn() => [

                    'id' => $this->farmer->id,

                    'name' => $this->farmer->name

                ]
            ),

            'created_at' => $this->created_at

        ];
    }
}
