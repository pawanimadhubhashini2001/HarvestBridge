<?php

namespace App\Http\Resources;

use App\Support\MediaStorage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicStoreResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'store_name' => $this->farm_name,
            'store_description' => $this->description,
            'store_logo_url' => $this->store_logo_path
                ? MediaStorage::url($this->store_logo_path, $request)
                : null,
            'store_cover_image_url' => $this->store_cover_image_path
                ? MediaStorage::url($this->store_cover_image_path, $request)
                : null,
            'phone_number' => $this->phone_number,
            'district' => $this->district,
            'address' => $this->address,
            'business_status' => $this->business_status,
            'distance_km' => isset($this->distance_km)
                ? round((float) $this->distance_km, 2)
                : null,
            'active_products_count' => $this->whenLoaded(
                'activeHarvestListings',
                fn () => $this->activeHarvestListings->count(),
                0
            ),
            'owner' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'phone' => $this->user->phone,
            ]),
            'location' => [
                'district' => $this->district,
                'address' => $this->address,
                'latitude' => $this->latitude,
                'longitude' => $this->longitude,
                'google_maps_url' => $this->googleMapsUrl(),
                'open_maps_action' => $this->openMapsAction(),
            ],
            'actions' => [
                'phone' => $this->contactPhone(),
                'whatsapp' => $this->whatsappLink(),
                'google_maps_url' => $this->googleMapsUrl(),
                'open_maps_action' => $this->openMapsAction(),
                'share_url' => url('/api/stores/public/'.$this->getKey()),
            ],
            'reviews' => [
                'average_rating' => isset($this->visible_reviews_average_rating)
                    && $this->visible_reviews_average_rating !== null
                    ? round((float) $this->visible_reviews_average_rating, 2)
                    : null,
                'review_count' => (int) ($this->visible_reviews_count ?? 0),
                'total_ratings' => (int) ($this->visible_reviews_count ?? 0),
                'rating_breakdown' => [
                    'five_star_count' => (int) ($this->visible_reviews_five_star_count ?? 0),
                    'four_star_count' => (int) ($this->visible_reviews_four_star_count ?? 0),
                    'three_star_count' => (int) ($this->visible_reviews_three_star_count ?? 0),
                    'two_star_count' => (int) ($this->visible_reviews_two_star_count ?? 0),
                    'one_star_count' => (int) ($this->visible_reviews_one_star_count ?? 0),
                ],
            ],
            'is_favorite' => (bool) ($this->is_favorite ?? false),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
