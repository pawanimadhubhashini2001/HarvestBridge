<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'district',
        'address',
        'latitude',
        'longitude',
        'farm_name',
        'organization_name',
        'company_name',
        'profile_photo',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
    public function farms()
    {
        return $this->hasMany(Farm::class);
    }
    public function harvestListings()
    {
        return $this->hasMany(HarvestListing::class);
    }
    public function orders()
    {
        return $this->hasMany(Order::class, 'consumer_id');
    }
    public function donations()
    {
        return $this->hasMany(Donation::class, 'farmer_id');
    }

    public function ngoDonations()
    {
        return $this->hasMany(Donation::class, 'ngo_id');
    }
    public function compostListings()
    {
        return $this->hasMany(CompostListing::class, 'farmer_id');
    }

    public function compostRequests()
    {
        return $this->hasMany(CompostRequest::class, 'business_id');
    }
    public function predictions()
    {
        return $this->hasMany(Prediction::class, 'farmer_id');
    }
    public function reviewsWritten()
    {
        return $this->hasMany(Review::class, 'reviewer_id');
    }

    public function reviewsReceived()
    {
        return $this->hasMany(Review::class, 'reviewed_user_id');
    }
}
