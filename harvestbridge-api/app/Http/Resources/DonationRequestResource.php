<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DonationRequestResource extends JsonResource
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

            'donation_id' => $this->donation_id,

            'ngo_id' => $this->ngo_id,

            'status' => $this->status,

            'message' => $this->message,

            'created_at' => $this->created_at

        ];
    }
}
