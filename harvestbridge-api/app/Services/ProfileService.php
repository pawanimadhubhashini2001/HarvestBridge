<?php

namespace App\Services;

use App\Models\User;

class ProfileService
{
    public function getProfile(User $user)
    {
        return $user;
    }

    public function updateProfile(User $user, array $data)
    {
        $user->update($data);

        return $user->fresh();
    }
}
