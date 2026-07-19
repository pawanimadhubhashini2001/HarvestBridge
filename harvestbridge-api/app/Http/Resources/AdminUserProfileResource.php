<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminUserProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'status' => $this->status,
            'phone' => $this->phone,
            'district' => $this->district,
            'address' => $this->address,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'organization_name' => $this->organization_name,
            'company_name' => $this->company_name,
            'profile_photo' => $this->profile_photo,
            'email_verified_at' => $this->email_verified_at,
            'counts' => [
                'stores' => (int) ($this->farms_count ?? 0),
                'harvest_listings' => (int) ($this->harvest_listings_count ?? 0),
                'donations' => (int) ($this->donations_count ?? 0),
                'compost_listings' => (int) ($this->compost_listings_count ?? 0),
                'consumer_orders' => (int) ($this->consumer_orders_count ?? 0),
                'favorite_stores' => (int) ($this->favorite_stores_count ?? 0),
                'favorite_products' => (int) ($this->favorite_products_count ?? 0),
                'reviews_written' => (int) ($this->reviews_written_count ?? 0),
                'donation_requests' => (int) ($this->donation_requests_count ?? 0),
                'compost_requests' => (int) ($this->compost_requests_count ?? 0),
            ],
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
