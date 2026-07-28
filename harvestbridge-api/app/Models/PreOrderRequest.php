<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PreOrderRequest extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_ACCEPTED = 'accepted';

    public const STATUS_READY = 'ready';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_COMPLETED = 'completed';

    protected $fillable = [
        'pre_order_product_id',
        'consumer_id',
        'quantity',
        'price',
        'subtotal',
        'preferred_pickup_date',
        'notes',
        'status',
        'accepted_at',
        'ready_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'price' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'preferred_pickup_date' => 'date',
            'accepted_at' => 'datetime',
            'ready_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(PreOrderProduct::class, 'pre_order_product_id');
    }

    public function consumer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'consumer_id');
    }
}
