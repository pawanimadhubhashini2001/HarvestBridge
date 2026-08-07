<?php

namespace App\Services;

use App\Models\User;
use App\Support\MediaStorage;
use Illuminate\Http\UploadedFile;

class ProfileService
{
    private const PROFILE_PHOTO_DIRECTORY = 'users/profile-photos';

    public function getProfile(User $user)
    {
        return $user;
    }

    public function updateProfile(User $user, array $data)
    {
        if (($data['profile_photo'] ?? null) instanceof UploadedFile) {
            $this->deleteStoredProfilePhoto($user->profile_photo);

            $data['profile_photo'] = MediaStorage::storeUploadedFile(
                $data['profile_photo'],
                self::PROFILE_PHOTO_DIRECTORY.'/'.$user->id
            );
        } elseif (array_key_exists('profile_photo', $data) && $data['profile_photo'] === null) {
            $this->deleteStoredProfilePhoto($user->profile_photo);
        }

        $user->update($data);

        return $user->fresh();
    }

    private function deleteStoredProfilePhoto(?string $path): void
    {
        if ($path === null || trim($path) === '' || preg_match('#^https?://#i', $path)) {
            return;
        }

        MediaStorage::delete($path);
    }
}
