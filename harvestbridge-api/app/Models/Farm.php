<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Farm extends Model
{
    protected $fillable = [
        'user_id',
        'farm_name',
        'farm_size',
        'farm_size_unit',
        'district',
        'address',
        'latitude',
        'longitude',
        'soil_type',
        'irrigation_method',
        'description',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function harvestListings()
    {
        return $this->hasMany(HarvestListing::class);
    }
    public function predictions()
    {
        return $this->hasMany(Prediction::class);
    }
}
