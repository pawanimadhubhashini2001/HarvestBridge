<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Crop extends Model
{
    protected $fillable = [

        'name',

        'category',

        'description',

        'growing_season',

        'ideal_soil',

        'ideal_temperature_min',

        'ideal_temperature_max',

        'ideal_rainfall_min',

        'ideal_rainfall_max',

        'average_growth_days',

        'is_active'

    ];

    public function harvestListings()
    {
        return $this->hasMany(HarvestListing::class);
    }
    public function predictions()
    {
        return $this->hasMany(Prediction::class, 'recommended_crop_id');
    }
}
