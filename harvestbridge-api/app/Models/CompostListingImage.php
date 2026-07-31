<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompostListingImage extends Model
{
    protected $fillable = [
        'compost_listing_id',
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

    public function compostListing()
    {
        return $this->belongsTo(CompostListing::class);
    }
}
