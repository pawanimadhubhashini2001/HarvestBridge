<?php

namespace App\Models;

use App\Models\DonationRequest;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Donation extends Model
{
    public const STATUS_AVAILABLE = 'available';
    public const STATUS_REQUESTED = 'requested';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_PICKED_UP = 'picked_up';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'farmer_id',
        'harvest_listing_id',
        'ngo_id',
        'quantity',
        'unit',
        'description',
        'pickup_location',
        'pickup_date',
        'pickup_time',
        'available_until',
        'collected_at',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'pickup_date' => 'date',
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

    public function ngo()
    {
        return $this->belongsTo(User::class, 'ngo_id');
    }

    public function harvestListing()
    {
        return $this->belongsTo(HarvestListing::class);
    }

    public function requests()
    {
        return $this->hasMany(DonationRequest::class);
    }

    public function isMarketplaceVisible(): bool
    {
        if ($this->status !== self::STATUS_AVAILABLE) {
            return false;
        }

        if ($this->available_until === null) {
            return true;
        }

        $availableUntil = $this->available_until instanceof Carbon
            ? $this->available_until
            : Carbon::parse($this->available_until);

        return ! $availableUntil->isBefore(now()->startOfDay());
    }

    public function collectionStatus(): string
    {
        return $this->collected_at !== null || $this->status === self::STATUS_COMPLETED
            ? 'collected'
            : 'available';
    }
}
