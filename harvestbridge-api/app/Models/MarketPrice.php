<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MarketPrice extends Model
{
    protected $fillable = [
        'crop_id',
        'market_name',
        'district',
        'price_per_unit',
        'unit',
        'price_date',
        'source',
        'is_active',
    ];

    public function crop()
    {
        return $this->belongsTo(Crop::class);
    }

    protected function casts(): array
    {
        return [
            'price_per_unit' => 'float',
            'price_date' => 'date',
            'is_active' => 'boolean',
        ];
    }
}
