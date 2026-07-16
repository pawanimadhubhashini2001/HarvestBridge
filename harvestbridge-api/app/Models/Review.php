<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $fillable = [

        'reviewer_id',

        'reviewed_user_id',

        'order_id',

        'rating',

        'comment',

        'is_visible'

    ];

    public function reviewer()
    {
        return $this->belongsTo(User::class,'reviewer_id');
    }

    public function reviewedUser()
    {
        return $this->belongsTo(User::class,'reviewed_user_id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
