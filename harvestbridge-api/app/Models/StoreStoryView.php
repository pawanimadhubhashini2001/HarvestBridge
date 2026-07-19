<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreStoryView extends Model
{
    protected $fillable = [
        'store_story_id',
        'user_id',
        'viewed_at',
    ];

    protected function casts(): array
    {
        return [
            'viewed_at' => 'datetime',
        ];
    }

    public function story(): BelongsTo
    {
        return $this->belongsTo(StoreStory::class, 'store_story_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
