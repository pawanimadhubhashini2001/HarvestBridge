<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Donation extends Model
{
    protected $fillable = [

        'farmer_id',

        'harvest_listing_id',

        'ngo_id',

        'quantity',

        'unit',

        'pickup_date',

        'pickup_time',

        'status',

        'notes'

    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function farmer()
    {
        return $this->belongsTo(User::class,'farmer_id');
    }

    public function ngo()
    {
        return $this->belongsTo(User::class,'ngo_id');
    }

    public function harvestListing()
    {
        return $this->belongsTo(HarvestListing::class);
    }
}
