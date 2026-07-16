<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [

        'consumer_id',

        'total_amount',

        'payment_method',

        'payment_status',

        'order_status',

        'delivery_address',

        'delivery_date',

        'notes'

    ];

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
        return $this->order_status === 'pending';
    }

    public function isAccepted()
    {
        return $this->order_status === 'accepted';
    }

    public function isCompleted()
    {
        return $this->order_status === 'completed';
    }

    public function isRejected()
    {
        return $this->order_status === 'rejected';
    }
}
