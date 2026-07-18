<?php

namespace App\Services;

use App\Models\Farm;
use App\Models\User;

class FarmService
{
    public function getAll(User $user)
    {
        return $user
            ->farms()
            ->with([
                'activeHarvestListings:id,farm_id,crop_id',
            ])
            ->latest()
            ->get();
    }

    public function create(User $user,array $data)
    {
        return $user->farms()->create($data);
    }

    public function update(Farm $farm,array $data)
    {
        $farm->update($data);

        return $farm->fresh();
    }

    public function delete(Farm $farm)
    {
        $farm->delete();
    }
}
