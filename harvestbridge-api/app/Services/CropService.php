<?php

namespace App\Services;

use App\Models\Crop;
use App\Models\HarvestListing;
use Illuminate\Support\Collection;

class CropService
{
    public function getAll()
    {
        return Crop::orderBy('name')->get();
    }

    public function getCategories(): Collection
    {
        $activeListingsByCategory = HarvestListing::query()
            ->select('crops.category')
            ->join('crops', 'crops.id', '=', 'harvest_listings.crop_id')
            ->whereIn('harvest_listings.status', HarvestListing::marketplaceVisibleStatuses())
            ->where('harvest_listings.available_quantity', '>', 0)
            ->get()
            ->groupBy(fn ($listing) => Crop::normalizeCategory($listing->category));

        $cropsByCategory = Crop::query()
            ->select('id', 'category')
            ->get()
            ->groupBy(fn (Crop $crop) => Crop::normalizeCategory($crop->category));

        $discoveredCategories = $cropsByCategory
            ->keys()
            ->merge($activeListingsByCategory->keys())
            ->filter()
            ->values();

        return collect(Crop::supportedCategories())
            ->merge(
                $discoveredCategories->reject(
                    fn (?string $category) => in_array($category, Crop::supportedCategories(), true)
                )
            )
            ->unique()
            ->values()
            ->map(function (string $category) use ($cropsByCategory, $activeListingsByCategory) {
                return [
                    'name' => $category,
                    'slug' => Crop::categorySlug($category),
                    'crops_count' => $cropsByCategory->get($category, collect())->count(),
                    'active_listings_count' => $activeListingsByCategory->get($category, collect())->count(),
                ];
            });
    }

    public function create(array $data)
    {
        $data['category'] = Crop::normalizeCategory($data['category'] ?? null);

        return Crop::create($data);
    }

    public function update(Crop $crop, array $data)
    {
        if (array_key_exists('category', $data)) {
            $data['category'] = Crop::normalizeCategory($data['category']);
        }

        $crop->update($data);

        return $crop->fresh();
    }

    public function delete(Crop $crop)
    {
        $crop->delete();
    }
}
