<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class StoreStory extends Model
{
    public const MEDIA_TYPE_IMAGE = 'image';
    public const MEDIA_TYPE_VIDEO = 'video';

    protected $fillable = [
        'farm_id',
        'media_type',
        'media_path',
        'caption',
        'is_hidden',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'is_hidden' => 'boolean',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Farm::class, 'farm_id');
    }

    public function views(): HasMany
    {
        return $this->hasMany(StoreStoryView::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query
            ->where('expires_at', '>', now())
            ->where('is_hidden', false);
    }

    public function isExpired(): bool
    {
        return $this->expires_at instanceof Carbon
            ? $this->expires_at->isPast()
            : Carbon::parse($this->expires_at)->isPast();
    }

    public static function supportedMediaTypes(): array
    {
        return [
            self::MEDIA_TYPE_IMAGE,
            self::MEDIA_TYPE_VIDEO,
        ];
    }
}
