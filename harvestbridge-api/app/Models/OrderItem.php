<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = [

        'order_id',

        'harvest_listing_id',

        'quantity',

        'price',

        'subtotal'

    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function harvestListing()
    {
        return $this->belongsTo(HarvestListing::class);
    }
}
