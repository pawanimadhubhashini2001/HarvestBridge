<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\OrderItem;

class HarvestListing extends Model
{
    protected $fillable = [

        'user_id',

        'farm_id',

        'crop_id',

        'title',

        'description',

        'harvest_date',

        'quantity',

        'available_quantity',

        'unit',

        'price_per_unit',

        'quality_grade',

        'donation_available',

        'compost_available',

        'status'

    ];

    public function farmer()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function farm()
    {
        return $this->belongsTo(Farm::class);
    }

    public function crop()
    {
        return $this->belongsTo(Crop::class);
    }
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }
    public function donation()
    {
        return $this->hasOne(Donation::class);
    }
    public function compostListing()
    {
        return $this->hasOne(CompostListing::class);
    }
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
