<?php

namespace App\Services;

use App\Models\HarvestListing;
use App\Models\User;

class HarvestListingService
{
    public function getAll(User $user)
    {
        return HarvestListing::where('user_id',$user->id)
            ->latest()
            ->get();
    }

    public function create(User $user,array $data)
    {
        $data['user_id']=$user->id;

        return HarvestListing::create($data);
    }

    public function update(HarvestListing $listing,array $data)
    {
        $listing->update($data);

        return $listing->fresh();
    }

    public function delete(HarvestListing $listing)
    {
        $listing->delete();
    }
}
