<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DonationImage extends Model
{
    protected $fillable = [
        'donation_id',
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

    public function donation()
    {
        return $this->belongsTo(Donation::class);
    }
}
