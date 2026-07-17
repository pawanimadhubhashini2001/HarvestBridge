<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WeatherAlert extends Model
{
    protected $fillable = ['user_id', 'district', 'alert_type', 'severity', 'message', 'weather_data', 'sent_at'];

    protected function casts(): array
    {
        return ['weather_data' => 'array', 'sent_at' => 'datetime'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
