<?php

namespace App\Policies;

use App\Models\HarvestListing;
use App\Models\User;

class HarvestListingPolicy
{
    /**
     * View all harvest listings.
     * Farmers can only view their own listings.
     */
    public function viewAny(User $user): bool
    {
        return $user->role === 'farmer';
    }

    /**
     * View a specific harvest listing.
     */
    public function view(User $user, HarvestListing $harvestListing): bool
    {
        return $user->id === $harvestListing->user_id;
    }

    /**
     * Create a harvest listing.
     */
    public function create(User $user): bool
    {
        return $user->role === 'farmer';
    }

    /**
     * Update a harvest listing.
     */
    public function update(User $user, HarvestListing $harvestListing): bool
    {
        return $user->id === $harvestListing->user_id;
    }

    /**
     * Delete a harvest listing.
     */
    public function delete(User $user, HarvestListing $harvestListing): bool
    {
        return $user->id === $harvestListing->user_id;
    }

    /**
     * Restore a deleted harvest listing.
     */
    public function restore(User $user, HarvestListing $harvestListing): bool
    {
        return false;
    }

    /**
     * Permanently delete a harvest listing.
     */
    public function forceDelete(User $user, HarvestListing $harvestListing): bool
    {
        return false;
    }
}
