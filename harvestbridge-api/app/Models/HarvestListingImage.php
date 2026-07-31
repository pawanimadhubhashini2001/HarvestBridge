<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HarvestListingImage extends Model
{
    protected $fillable = [
        'harvest_listing_id',
        'image_path',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function isPrimary(): bool
    {
        return (int) $this->sort_order === 1;
    }

    public function harvestListing()
    {
        return $this->belongsTo(HarvestListing::class);
    }
}
