<?php

namespace App\Services;

use App\Models\Farm;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class FarmService
{
    private const MEDIA_DISK = 'public';
    private const STORE_LOGO_DIRECTORY = 'stores/logos';
    private const STORE_COVER_DIRECTORY = 'stores/covers';

    public function getAll(User $user): Collection
    {
        return $user
            ->farms()
            ->with([
                'user:id,name,email,phone',
                'activeHarvestListings:id,farm_id,crop_id',
            ])
            ->latest()
            ->get();
    }

    public function getMyStore(User $user): Farm
    {
        $store = $user
            ->store()
            ->with([
                'user:id,name,email,phone',
                'activeHarvestListings:id,farm_id,crop_id',
            ])
            ->first();

        if ($store === null) {
            throw (new ModelNotFoundException())->setModel(Farm::class);
        }

        return $store;
    }

    public function getDetails(Farm $farm): Farm
    {
        return $farm->load([
            'user:id,name,email,phone',
            'activeHarvestListings:id,farm_id,crop_id',
        ]);
    }

    public function getStoreLocation(Farm $farm): Farm
    {
        return $farm->loadMissing([
            'user:id,name,email,phone',
        ]);
    }

    public function create(User $user, array $data)
    {
        $farm = DB::transaction(function () use ($user, $data) {
            $existingStoreId = Farm::query()
                ->ownedBy($user)
                ->lockForUpdate()
                ->value('id');

            if ($existingStoreId !== null) {
                throw ValidationException::withMessages([
                    'store' => ['A farmer can only create one store profile.'],
                ]);
            }

            return $user->farms()->create(
                $this->preparePayload($data)
            );
        });

        return $this->getDetails($farm->fresh());
    }

    public function update(Farm $farm, array $data)
    {
        $farm->update(
            $this->preparePayload($data, $farm)
        );

        return $this->getDetails($farm->fresh());
    }

    public function delete(Farm $farm)
    {
        if ($farm->harvestListings()->exists()) {
            throw ValidationException::withMessages([
                'store' => ['This store cannot be deleted because harvest listings are linked to it.'],
            ]);
        }

        if ($farm->predictions()->exists()) {
            throw ValidationException::withMessages([
                'store' => ['This store cannot be deleted because prediction records are linked to it.'],
            ]);
        }

        $this->deleteStoredMedia($farm->store_logo_path);
        $this->deleteStoredMedia($farm->store_cover_image_path);
        $farm->delete();
    }

    private function preparePayload(array $data, ?Farm $farm = null): array
    {
        if (! empty($data['store_name'] ?? null)) {
            $data['farm_name'] = $data['store_name'];
        }

        if (array_key_exists('store_description', $data)) {
            $data['description'] = $data['store_description'];
        }

        if (array_key_exists('business_status', $data)) {
            $data['business_status'] = $this->normalizeBusinessStatus(
                $data['business_status']
            );
        }

        if (($data['store_logo'] ?? null) instanceof UploadedFile) {
            $data['store_logo_path'] = $data['store_logo']->store(
                self::STORE_LOGO_DIRECTORY,
                self::MEDIA_DISK
            );

            if ($farm?->store_logo_path) {
                $this->deleteStoredMedia($farm->store_logo_path);
            }
        }

        if (($data['store_image'] ?? null) instanceof UploadedFile) {
            $data['store_logo_path'] = $data['store_image']->store(
                self::STORE_LOGO_DIRECTORY,
                self::MEDIA_DISK
            );

            if ($farm?->store_logo_path) {
                $this->deleteStoredMedia($farm->store_logo_path);
            }
        }

        if (($data['store_cover_image'] ?? null) instanceof UploadedFile) {
            $data['store_cover_image_path'] = $data['store_cover_image']->store(
                self::STORE_COVER_DIRECTORY,
                self::MEDIA_DISK
            );

            if ($farm?->store_cover_image_path) {
                $this->deleteStoredMedia($farm->store_cover_image_path);
            }
        }

        unset(
            $data['store_name'],
            $data['store_description'],
            $data['store_image'],
            $data['store_logo'],
            $data['store_cover_image']
        );

        return $data;
    }

    private function normalizeBusinessStatus(mixed $status): string
    {
        $normalizedStatus = strtolower(trim((string) $status));

        return match ($normalizedStatus) {
            'active' => Farm::BUSINESS_STATUS_OPEN,
            'inactive' => Farm::BUSINESS_STATUS_CLOSED,
            Farm::BUSINESS_STATUS_CLOSED => Farm::BUSINESS_STATUS_CLOSED,
            default => Farm::BUSINESS_STATUS_OPEN,
        };
    }

    private function deleteStoredMedia(?string $path): void
    {
        if (! $path) {
            return;
        }

        Storage::disk(self::MEDIA_DISK)->delete($path);
    }
}
