<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Crop extends Model
{
    public const CATEGORY_VEGETABLES = 'Vegetables';
    public const CATEGORY_FRUITS = 'Fruits';
    public const CATEGORY_GRAINS = 'Grains';
    public const CATEGORY_SPICES = 'Spices';
    public const CATEGORY_HERBS = 'Herbs';
    public const CATEGORY_LEAFY_GREENS = 'Leafy Greens';
    public const CATEGORY_ROOT_CROPS = 'Root Crops';
    public const CATEGORY_OTHER = 'Other';

    protected $fillable = [

        'name',

        'category',

        'description',

        'growing_season',

        'ideal_soil',

        'ideal_temperature_min',

        'ideal_temperature_max',

        'ideal_rainfall_min',

        'ideal_rainfall_max',

        'average_growth_days',

        'is_active'

    ];

    public function harvestListings()
    {
        return $this->hasMany(HarvestListing::class);
    }

    public static function supportedCategories(): array
    {
        return [
            self::CATEGORY_VEGETABLES,
            self::CATEGORY_FRUITS,
            self::CATEGORY_GRAINS,
            self::CATEGORY_SPICES,
            self::CATEGORY_HERBS,
            self::CATEGORY_LEAFY_GREENS,
            self::CATEGORY_ROOT_CROPS,
            self::CATEGORY_OTHER,
        ];
    }

    public static function normalizeCategory(?string $category): ?string
    {
        if ($category === null) {
            return null;
        }

        $normalized = Str::of($category)
            ->replace(['_', '-'], ' ')
            ->squish()
            ->lower()
            ->value();

        return match ($normalized) {
            'vegetable', 'vegetables' => self::CATEGORY_VEGETABLES,
            'fruit', 'fruits' => self::CATEGORY_FRUITS,
            'grain', 'grains' => self::CATEGORY_GRAINS,
            'spice', 'spices' => self::CATEGORY_SPICES,
            'herb', 'herbs' => self::CATEGORY_HERBS,
            'leafy green', 'leafy greens' => self::CATEGORY_LEAFY_GREENS,
            'root crop', 'root crops' => self::CATEGORY_ROOT_CROPS,
            'other' => self::CATEGORY_OTHER,
            default => Str::of($normalized)->title()->value(),
        };
    }

    public static function categorySlug(?string $category): ?string
    {
        $normalized = self::normalizeCategory($category);

        return $normalized ? Str::slug($normalized) : null;
    }

    public function predictions()
    {
        return $this->hasMany(Prediction::class, 'recommended_crop_id');
    }
    public function marketPrices()
    {
        return $this->hasMany(MarketPrice::class);
    }
}
