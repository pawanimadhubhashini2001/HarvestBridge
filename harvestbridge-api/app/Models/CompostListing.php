<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompostListing extends Model
{
    protected $fillable = [

        'farmer_id',

        'harvest_listing_id',

        'waste_type',

        'quantity',

        'unit',

        'pickup_location',

        'available_from',

        'available_until',

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

    public function harvestListing()
    {
        return $this->belongsTo(HarvestListing::class);
    }
}
