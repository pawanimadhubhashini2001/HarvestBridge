<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_ACCEPTED = 'accepted';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_COMPLETED = 'completed';

    protected $fillable = [

        'consumer_id',

        'total_amount',

        'payment_method',

        'payment_status',

        'order_status',

        'delivery_address',

        'delivery_date',

        'notes',

    ];

    protected function casts(): array
    {
        return [
            'delivery_date' => 'date',
            'total_amount' => 'decimal:2',
        ];
    }

    public function consumer()
    {
        return $this->belongsTo(User::class, 'consumer_id');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function review()
    {
        return $this->hasOne(Review::class);
    }

    public function isPending()
    {
        return $this->order_status === self::STATUS_PENDING;
    }

    public function isAccepted()
    {
        return $this->order_status === self::STATUS_ACCEPTED;
    }

    public function isCompleted()
    {
        return $this->order_status === self::STATUS_COMPLETED;
    }

    public function isRejected()
    {
        return $this->order_status === self::STATUS_REJECTED;
    }
}
