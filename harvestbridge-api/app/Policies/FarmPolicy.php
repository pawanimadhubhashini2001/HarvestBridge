<?php

namespace App\Policies;

use App\Models\Farm;
use App\Models\User;

class FarmPolicy
{
    /**
     * Farmer can view only own farm.
     */
    public function view(User $user, Farm $farm): bool
    {
        return $user->id === $farm->user_id;
    }

    /**
     * Farmer can update only own farm.
     */
    public function update(User $user, Farm $farm): bool
    {
        return $user->id === $farm->user_id;
    }

    /**
     * Farmer can delete only own farm.
     */
    public function delete(User $user, Farm $farm): bool
    {
        return $user->id === $farm->user_id;
    }
}
