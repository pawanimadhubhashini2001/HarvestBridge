<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HarvestListing extends Model
{
    protected $fillable = [

        'user_id',

        'farm_id',

        'crop_id',

        'quantity',

        'unit',

        'price_per_unit',

        'quality_grade',

        'harvest_date',

        'available_until',

        'status',

        'description'

    ];

    public function farmer()
    {
        return $this->belongsTo(User::class,'user_id');
    }

    public function farm()
    {
        return $this->belongsTo(Farm::class);
    }

    public function crop()
    {
        return $this->belongsTo(Crop::class);
    }
}
