<?php

namespace App\Policies;

use App\Models\Crop;
use App\Models\User;

class CropPolicy
{
    public function create(User $user): bool
    {
        return $user->role === 'admin';
    }

    public function update(User $user, Crop $crop): bool
    {
        return $user->role === 'admin';
    }

    public function delete(User $user, Crop $crop): bool
    {
        return $user->role === 'admin';
    }
}
