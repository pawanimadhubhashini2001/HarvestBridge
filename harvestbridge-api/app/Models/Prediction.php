<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prediction extends Model
{
    protected $fillable = [

        'farmer_id',

        'farm_id',

        'recommended_crop_id',

        'season',

        'soil_type',

        'temperature',

        'rainfall',

        'humidity',

        'ph',

        'previous_crop',

        'previous_yield',

        'market_demand',

        'confidence_score',

        'model_version'

    ];

    public function farmer()
    {
        return $this->belongsTo(User::class,'farmer_id');
    }

    public function farm()
    {
        return $this->belongsTo(Farm::class);
    }

    public function crop()
    {
        return $this->belongsTo(Crop::class,'recommended_crop_id');
    }
}
