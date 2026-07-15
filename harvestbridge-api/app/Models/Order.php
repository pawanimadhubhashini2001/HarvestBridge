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
}
