<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Farm extends Model
{
    public const BUSINESS_STATUS_OPEN = 'open';
    public const BUSINESS_STATUS_CLOSED = 'closed';
    public const BUSINESS_STATUS_TEMPORARILY_CLOSED = 'temporarily_closed';

    protected $fillable = [
        'user_id',
        'farm_name',
        'store_logo_path',
        'store_cover_image_path',
        'phone_number',
        'whatsapp_number',
        'email',
        'farm_size',
        'farm_size_unit',
        'district',
        'address',
        'latitude',
        'longitude',
        'soil_type',
        'irrigation_method',
        'description',
        'business_hours',
        'business_status',
        'is_suspended',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'farm_size' => 'decimal:2',
            'is_suspended' => 'boolean',
        ];
    }

    public function hasCoordinates(): bool
    {
        return $this->latitude !== null && $this->longitude !== null;
    }

    public function googleMapsUrl(): ?string
    {
        if (! $this->hasCoordinates()) {
            return null;
        }

        return sprintf(
            'https://www.google.com/maps/dir/?api=1&destination=%s,%s&travelmode=driving',
            $this->latitude,
            $this->longitude
        );
    }

    public function openMapsAction(): ?array
    {
        $googleMapsUrl = $this->googleMapsUrl();

        if ($googleMapsUrl === null) {
            return null;
        }

        return [
            'type' => 'open_url',
            'label' => 'Directions',
            'url' => $googleMapsUrl,
        ];
    }

    public function contactPhone(): ?string
    {
        return $this->phone_number ?: null;
    }

    public function whatsappLink(): ?string
    {
        $phone = $this->whatsapp_number ?: $this->phone_number;

        if (! $phone) {
            return null;
        }

        $normalizedPhone = preg_replace('/\D+/', '', $phone);

        if (! $normalizedPhone) {
            return null;
        }

        return 'https://wa.me/'.$normalizedPhone;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function harvestListings(): HasMany
    {
        return $this->hasMany(HarvestListing::class);
    }

    public function activeHarvestListings(): HasMany
    {
        return $this->hasMany(HarvestListing::class)
            ->whereIn('status', HarvestListing::marketplaceVisibleStatuses())
            ->where('available_quantity', '>', 0);
    }

    public function predictions(): HasMany
    {
        return $this->hasMany(Prediction::class);
    }

    public function stories(): HasMany
    {
        return $this->hasMany(StoreStory::class);
    }

    public function activeStories(): HasMany
    {
        return $this->hasMany(StoreStory::class)
            ->where('expires_at', '>', now())
            ->where('is_hidden', false);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function visibleReviews(): HasMany
    {
        return $this->hasMany(Review::class)
            ->where('is_visible', true);
    }

    public function favoritedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'favorite_stores',
            'farm_id',
            'user_id'
        )->withTimestamps();
    }

    public function scopeOwnedBy($query, User $user)
    {
        return $query->where('user_id', $user->id);
    }

    public static function businessStatuses(): array
    {
        return [
            self::BUSINESS_STATUS_OPEN,
            self::BUSINESS_STATUS_CLOSED,
            self::BUSINESS_STATUS_TEMPORARILY_CLOSED,
        ];
    }
}
