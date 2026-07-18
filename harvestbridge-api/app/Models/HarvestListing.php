<?php

namespace App\Models;

use App\Models\OrderItem;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class HarvestListing extends Model
{
    public const STATUS_AVAILABLE = 'available';
    public const STATUS_RESERVED = 'reserved';
    public const STATUS_SOLD = 'sold';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_DONATED = 'donated';

    protected $fillable = [

        'user_id',

        'farm_id',

        'crop_id',

        'description',

        'harvest_date',

        'quantity',

        'available_quantity',

        'reserved_quantity',

        'sold_quantity',

        'available_until',

        'unit',

        'price_per_unit',

        'quality_grade',

        'status',

        'is_featured',

        'featured_until',

    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'available_quantity' => 'decimal:2',
            'reserved_quantity' => 'decimal:2',
            'sold_quantity' => 'decimal:2',
            'price_per_unit' => 'decimal:2',
            'harvest_date' => 'date',
            'available_until' => 'date',
            'is_featured' => 'boolean',
            'featured_until' => 'date',
        ];
    }

    public function scopeCurrentlyFeatured(Builder $query): Builder
    {
        return $query
            ->where('is_featured', true)
            ->where(function (Builder $featuredQuery) {
                $featuredQuery->whereNull('featured_until')
                    ->orWhereDate('featured_until', '>=', now()->toDateString());
            });
    }

    public function scopeNotCurrentlyFeatured(Builder $query): Builder
    {
        return $query->where(function (Builder $featuredQuery) {
            $featuredQuery->where('is_featured', false)
                ->orWhere(function (Builder $expiredFeaturedQuery) {
                    $expiredFeaturedQuery->where('is_featured', true)
                        ->whereNotNull('featured_until')
                        ->whereDate('featured_until', '<', now()->toDateString());
                });
        });
    }

    public function isCurrentlyFeatured(): bool
    {
        if (! $this->is_featured) {
            return false;
        }

        if ($this->featured_until === null) {
            return true;
        }

        $featuredUntil = $this->featured_until instanceof CarbonInterface
            ? $this->featured_until
            : Carbon::parse($this->featured_until);

        return ! $featuredUntil->isBefore(now()->startOfDay());
    }

    public function shareUrl(): string
    {
        return url('/api/marketplace/'.$this->getKey());
    }

    public function farmer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function farm(): BelongsTo
    {
        return $this->belongsTo(Farm::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Farm::class, 'farm_id');
    }

    public function crop(): BelongsTo
    {
        return $this->belongsTo(Crop::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function donation()
    {
        return $this->hasOne(Donation::class);
    }

    public function compostListing()
    {
        return $this->hasOne(CompostListing::class);
    }

    public function images()
    {
        return $this->hasMany(HarvestListingImage::class)
            ->orderBy('sort_order')
            ->orderBy('id');
    }
}
