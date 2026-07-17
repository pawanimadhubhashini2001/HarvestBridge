<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PredictionHistory extends Model
{
    protected $fillable = [

        'user_id',

        'district',

        'season',

        'soil_type',

        'temperature',

        'rainfall',

        'humidity',

        'ph',

        'previous_crop',

        'previous_yield',

        'market_demand',

        'recommended_crop',

        'confidence',

        'is_favorite'

    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
