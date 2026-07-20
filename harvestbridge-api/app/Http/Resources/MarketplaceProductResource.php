<?php

namespace App\Http\Resources;

use App\Support\MediaStorage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MarketplaceProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $cropName = $this->crop?->name ?? $this->crop_name;
        $cropCategory = $this->crop?->category ?? $this->crop_category;

        return [
            'product' => [
                'id' => $this->id,
                'crop_id' => $this->crop_id,
                'crop_name' => $cropName,
                'crop_category' => $cropCategory,
                'description' => $this->description,
                'quantity' => $this->quantity,
                'available_quantity' => $this->available_quantity,
                'reserved_quantity' => $this->reserved_quantity,
                'sold_quantity' => $this->sold_quantity,
                'unit' => $this->unit,
                'price_per_unit' => $this->price_per_unit,
                'quality_grade' => $this->quality_grade,
                'harvest_date' => $this->harvest_date,
                'available_until' => $this->available_until,
                'status' => $this->status,
                'status_label' => $this->statusLabel(),
                'is_available' => $this->isAvailableForConsumers(),
                'is_featured' => $this->isCurrentlyFeatured(),
                'is_favorite' => (bool) ($this->is_favorite ?? false),
                'featured_until' => $this->featured_until,
                'images' => HarvestListingImageResource::collection(
                    $this->whenLoaded('images')
                ),
                'primary_image' => $this->whenLoaded(
                    'images',
                    fn () => $this->images->isNotEmpty()
                        ? HarvestListingImageResource::make($this->images->first())->resolve()
                        : null
                ),
                'created_at' => $this->created_at,
                'updated_at' => $this->updated_at,
            ],
            'contact' => [
                'phone' => $this->farm?->contactPhone(),
                'whatsapp' => $this->farm?->whatsappLink(),
                'share_url' => $this->shareUrl(),
            ],
            'farmer' => $this->whenLoaded('farmer', fn () => [
                'id' => $this->farmer->id,
                'name' => $this->farmer->name,
            ]),
            'store' => $this->whenLoaded('farm', fn () => [
                'id' => $this->farm->id,
                'store_name' => $this->farm->farm_name,
                'store_description' => $this->farm->description,
                'store_logo_url' => $this->farm->store_logo_path
                    ? MediaStorage::url($this->farm->store_logo_path, $request)
                    : null,
                'store_cover_image_url' => $this->farm->store_cover_image_path
                    ? MediaStorage::url($this->farm->store_cover_image_path, $request)
                    : null,
                'phone_number' => $this->farm->phone_number,
                'whatsapp_number' => $this->farm->whatsapp_number,
                'business_hours' => $this->farm->business_hours,
                'business_status' => $this->farm->business_status,
                'is_favorite' => (bool) ($this->farm?->is_favorite ?? false),
            ]),
            'store_location' => $this->whenLoaded('farm', fn () => [
                'district' => $this->farm->district,
                'address' => $this->farm->address,
                'latitude' => $this->farm->latitude,
                'longitude' => $this->farm->longitude,
                'distance_km' => isset($this->distance_km)
                    ? round((float) $this->distance_km, 2)
                    : null,
                'google_maps_url' => $this->farm->googleMapsUrl(),
                'open_maps_action' => $this->farm->openMapsAction(),
            ]),
            'recommended_products' => HarvestListingResource::collection(
                $this->whenLoaded('recommendedProducts')
            ),
            'related_products' => HarvestListingResource::collection(
                $this->whenLoaded('relatedProducts')
            ),
        ];
    }
}
