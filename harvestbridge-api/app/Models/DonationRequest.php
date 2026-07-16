<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DonationRequest extends Model
{
    protected $fillable = [

        'donation_id',

        'ngo_id',

        'message',

        'status'

    ];

    public function donation()
    {
        return $this->belongsTo(Donation::class);
    }

    public function ngo()
    {
        return $this->belongsTo(User::class,'ngo_id');
    }
}
