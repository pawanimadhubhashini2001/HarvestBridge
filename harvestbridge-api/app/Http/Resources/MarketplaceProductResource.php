<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class MarketplaceProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'product' => [
                'id' => $this->id,
                'crop_id' => $this->crop_id,
                'crop_name' => $this->crop?->name,
                'crop_category' => $this->crop?->category,
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
                'is_featured' => $this->isCurrentlyFeatured(),
                'featured_until' => $this->featured_until,
                'images' => HarvestListingImageResource::collection(
                    $this->whenLoaded('images')
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
                    ? Storage::disk('public')->url($this->farm->store_logo_path)
                    : null,
                'store_cover_image_url' => $this->farm->store_cover_image_path
                    ? Storage::disk('public')->url($this->farm->store_cover_image_path)
                    : null,
                'phone_number' => $this->farm->phone_number,
                'whatsapp_number' => $this->farm->whatsapp_number,
                'business_hours' => $this->farm->business_hours,
                'business_status' => $this->farm->business_status,
            ]),
            'store_location' => $this->whenLoaded('farm', fn () => [
                'district' => $this->farm->district,
                'address' => $this->farm->address,
                'latitude' => $this->farm->latitude,
                'longitude' => $this->farm->longitude,
                'google_maps_url' => $this->farm->googleMapsUrl(),
                'open_maps_action' => $this->farm->openMapsAction(),
            ]),
        ];
    }
}
