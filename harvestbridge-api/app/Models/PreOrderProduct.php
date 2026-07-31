<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class PreOrderProduct extends Model
{
    public const STATUS_OPEN = 'open';

    public const STATUS_CLOSED = 'closed';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_COMPLETED = 'completed';

    protected $fillable = [
        'farmer_id',
        'farm_id',
        'crop_id',
        'crop_name',
        'crop_category',
        'description',
        'expected_quantity',
        'available_quantity',
        'reserved_quantity',
        'fulfilled_quantity',
        'unit',
        'price_per_unit',
        'quality_grade',
        'expected_harvest_date',
        'order_deadline',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'expected_quantity' => 'decimal:2',
            'available_quantity' => 'decimal:2',
            'reserved_quantity' => 'decimal:2',
            'fulfilled_quantity' => 'decimal:2',
            'price_per_unit' => 'decimal:2',
            'expected_harvest_date' => 'date',
            'order_deadline' => 'date',
        ];
    }

    public function farmer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'farmer_id');
    }

    public function farm(): BelongsTo
    {
        return $this->belongsTo(Farm::class);
    }

    public function crop(): BelongsTo
    {
        return $this->belongsTo(Crop::class);
    }

    public function requests(): HasMany
    {
        return $this->hasMany(PreOrderRequest::class);
    }

    public function isOpenForRequests(): bool
    {
        return $this->status === self::STATUS_OPEN
            && (float) $this->available_quantity > 0
            && ! $this->isPastDeadline();
    }

    public function isPastDeadline(): bool
    {
        if ($this->order_deadline === null) {
            return false;
        }

        $deadline = $this->order_deadline instanceof CarbonInterface
            ? $this->order_deadline
            : Carbon::parse($this->order_deadline);

        return $deadline->isBefore(now()->startOfDay());
    }

    public function statusLabel(): string
    {
        return match ($this->status) {
            self::STATUS_CLOSED => 'Closed',
            self::STATUS_CANCELLED => 'Cancelled',
            self::STATUS_COMPLETED => 'Completed',
            default => 'Open',
        };
    }
}
