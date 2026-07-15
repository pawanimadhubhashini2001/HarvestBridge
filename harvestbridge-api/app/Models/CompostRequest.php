<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompostRequest extends Model
{
    protected $fillable = [

        'compost_listing_id',

        'business_id',

        'pickup_date',

        'pickup_time',

        'status',

        'notes'

    ];

    public function compostListing()
    {
        return $this->belongsTo(CompostListing::class);
    }

    public function business()
    {
        return $this->belongsTo(User::class,'business_id');
    }
}
