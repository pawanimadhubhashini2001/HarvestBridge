<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class StoreStoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'store_id' => $this->farm_id,
            'store' => $this->whenLoaded('store', fn () => [
                'id' => $this->store?->id,
                'store_name' => $this->store?->farm_name,
                'district' => $this->store?->district,
                'address' => $this->store?->address,
                'latitude' => $this->store?->latitude,
                'longitude' => $this->store?->longitude,
                'phone_number' => $this->store?->phone_number,
                'store_logo_url' => $this->store?->store_logo_path
                    ? Storage::disk('public')->url($this->store->store_logo_path)
                    : null,
                'actions' => [
                    'phone' => $this->store?->contactPhone(),
                    'whatsapp' => $this->store?->whatsappLink(),
                    'google_maps_url' => $this->store?->googleMapsUrl(),
                    'open_maps_action' => $this->store?->openMapsAction(),
                ],
            ]),
            'media_type' => $this->media_type,
            'media_url' => Storage::disk('public')->url($this->media_path),
            'caption' => $this->caption,
            'distance' => $this->when(
                isset($this->distance_km),
                fn () => round((float) $this->distance_km, 2)
            ),
            'distance_km' => $this->when(
                isset($this->distance_km),
                fn () => round((float) $this->distance_km, 2)
            ),
            'view_count' => $this->when(
                isset($this->views_count),
                fn () => (int) $this->views_count
            ),
            'viewed_users_count' => $this->when(
                isset($this->views_count),
                fn () => (int) $this->views_count
            ),
            'viewed_users' => $this->whenLoaded(
                'views',
                fn () => $this->views
                    ->filter(fn ($view) => $view->user !== null)
                    ->map(fn ($view) => [
                        'id' => $view->user?->id,
                        'name' => $view->user?->name,
                        'viewed_at' => $view->viewed_at,
                    ])
                    ->values()
            ),
            'created_at' => $this->created_at,
            'expires_at' => $this->expires_at,
        ];
    }
}
