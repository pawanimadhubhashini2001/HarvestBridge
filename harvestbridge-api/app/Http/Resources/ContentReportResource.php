<?php

namespace App\Http\Resources;

use App\Models\CompostListing;
use App\Models\Donation;
use App\Models\Farm;
use App\Models\HarvestListing;
use App\Models\StoreStory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContentReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'content_type' => $this->contentTypeLabel(),
            'reason' => $this->reason,
            'description' => $this->description,
            'status' => $this->status,
            'reporter' => $this->whenLoaded('reporter', fn () => [
                'id' => $this->reporter?->id,
                'name' => $this->reporter?->name,
                'email' => $this->reporter?->email,
            ]),
            'reviewer' => $this->whenLoaded('reviewer', fn () => [
                'id' => $this->reviewer?->id,
                'name' => $this->reviewer?->name,
                'email' => $this->reviewer?->email,
            ]),
            'reportable' => $this->reportableSummary(),
            'reviewed_at' => $this->reviewed_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    private function contentTypeLabel(): string
    {
        return match ($this->reportable_type) {
            HarvestListing::class => 'product',
            Farm::class => 'store',
            StoreStory::class => 'story',
            Donation::class => 'donation',
            CompostListing::class => 'compost_listing',
            default => 'unknown',
        };
    }

    private function reportableSummary(): ?array
    {
        $reportable = $this->reportable;

        if ($reportable instanceof HarvestListing) {
            return [
                'id' => $reportable->id,
                'title' => $reportable->crop?->name ?? $reportable->crop_name ?? 'Harvest Listing',
                'status' => $reportable->status,
                'store_id' => $reportable->farm_id,
            ];
        }

        if ($reportable instanceof Farm) {
            return [
                'id' => $reportable->id,
                'title' => $reportable->farm_name,
                'status' => $reportable->business_status,
                'is_suspended' => (bool) $reportable->is_suspended,
            ];
        }

        if ($reportable instanceof StoreStory) {
            return [
                'id' => $reportable->id,
                'title' => $reportable->caption ?: 'Store Story',
                'status' => $reportable->is_hidden ? 'hidden' : 'active',
                'store_id' => $reportable->farm_id,
            ];
        }

        if ($reportable instanceof Donation) {
            return [
                'id' => $reportable->id,
                'title' => $reportable->description ?: 'Donation Listing',
                'status' => $reportable->status,
                'harvest_listing_id' => $reportable->harvest_listing_id,
            ];
        }

        if ($reportable instanceof CompostListing) {
            return [
                'id' => $reportable->id,
                'title' => $reportable->waste_type ?: 'Compost Listing',
                'status' => $reportable->status,
            ];
        }

        return null;
    }
}
