<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

class CompostListing extends Model
{
    public const STATUS_AVAILABLE = 'available';
    public const STATUS_REQUESTED = 'requested';
    public const STATUS_RESERVED = 'reserved';
    public const STATUS_COLLECTED = 'collected';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'farmer_id',
        'harvest_listing_id',
        'waste_type',
        'quantity',
        'unit',
        'pickup_location',
        'available_from',
        'available_until',
        'collected_at',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'available_from' => 'date',
            'available_until' => 'date',
            'collected_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function farmer()
    {
        return $this->belongsTo(User::class, 'farmer_id');
    }

    public function harvestListing()
    {
        return $this->belongsTo(HarvestListing::class);
    }

    public function requests()
    {
        return $this->hasMany(
            CompostRequest::class
        );
    }

    public function farmerStore(): HasOne
    {
        return $this->hasOne(Farm::class, 'user_id', 'farmer_id')
            ->latestOfMany();
    }

    public function images()
    {
        return $this->hasMany(CompostListingImage::class)
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function collectionStatus(): string
    {
        if (in_array($this->status, [
            self::STATUS_COLLECTED,
            self::STATUS_COMPLETED,
        ], true) || $this->collected_at !== null) {
            return 'collected';
        }

        if ($this->status === self::STATUS_RESERVED) {
            return 'reserved';
        }

        return 'available';
    }

    public function isMarketplaceVisible(): bool
    {
        if ($this->status !== self::STATUS_AVAILABLE) {
            return false;
        }

        $today = now()->startOfDay();

        if ($this->available_from !== null) {
            $availableFrom = $this->available_from instanceof Carbon
                ? $this->available_from
                : Carbon::parse($this->available_from);

            if ($availableFrom->isAfter($today)) {
                return false;
            }
        }

        if ($this->available_until === null) {
            return true;
        }

        $availableUntil = $this->available_until instanceof Carbon
            ? $this->available_until
            : Carbon::parse($this->available_until);

        return ! $availableUntil->isBefore($today);
    }
}
