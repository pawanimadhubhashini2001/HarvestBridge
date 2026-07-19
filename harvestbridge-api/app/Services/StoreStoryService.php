<?php

namespace App\Services;

use App\Models\Farm;
use App\Models\StoreStory;
use App\Models\StoreStoryView;
use App\Support\MediaStorage;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class StoreStoryService
{
    private const MEDIA_DIRECTORY = 'stores/stories';
    private const EARTH_RADIUS_KM = 6371;
    private const DEFAULT_PAGE_SIZE = 20;
    private const MAX_PAGE_SIZE = 50;
    private const DEFAULT_RADIUS_KM = 50;
    private const MAX_RADIUS_KM = 200;

    public function getMyStories(User $user): Collection
    {
        $store = $this->getOwnedStore($user);

        return StoreStory::query()
            ->with([
                'store:id,farm_name,store_logo_path',
                'views.user:id,name',
            ])
            ->withCount('views')
            ->where('farm_id', $store->id)
            ->active()
            ->latest()
            ->get();
    }

    public function getFeed(array $filters = []): LengthAwarePaginator
    {
        $sort = $this->normalizeSortOption(
            $filters['sort'] ?? null,
            $this->hasLocationSearch($filters)
        );

        $query = StoreStory::query()
            ->active()
            ->whereHas('store', fn ($storeQuery) => $storeQuery->where('is_suspended', false))
            ->with([
                'store:id,farm_name,store_logo_path,district,address,latitude,longitude,phone_number',
            ]);

        $this->applyLocationSearch($query, $filters);
        $this->applySorting($query, $sort);

        return $query
            ->withCount('views')
            ->paginate($this->resolvePerPage($filters['per_page'] ?? null))
            ->withQueryString();
    }

    public function create(Farm $store, array $data): StoreStory
    {
        /** @var UploadedFile $media */
        $media = $data['media'];

        $story = DB::transaction(function () use ($store, $data, $media) {
            return StoreStory::query()->create([
                'farm_id' => $store->id,
                'media_type' => $this->resolveMediaType($media),
                'media_path' => MediaStorage::storeUploadedFile(
                    $media,
                    self::MEDIA_DIRECTORY.'/'.$store->id
                ),
                'caption' => $data['caption'] ?? null,
                'expires_at' => now()->addDay(),
            ]);
        });

        return $this->hydrateStory($story);
    }

    public function update(
        Farm $store,
        StoreStory $story,
        array $data
    ): StoreStory {
        $this->assertStoryBelongsToStore($store, $story);

        $story = DB::transaction(function () use ($story, $data, $store) {
            $payload = [];

            if (array_key_exists('caption', $data)) {
                $payload['caption'] = $data['caption'];
            }

            if (($data['media'] ?? null) instanceof UploadedFile) {
                /** @var UploadedFile $media */
                $media = $data['media'];

                MediaStorage::delete($story->media_path);

                $payload['media_type'] = $this->resolveMediaType($media);
                $payload['media_path'] = MediaStorage::storeUploadedFile(
                    $media,
                    self::MEDIA_DIRECTORY.'/'.$store->id
                );
            }

            $story->update($payload);

            return $story->fresh();
        });

        return $this->hydrateStory($story);
    }

    public function delete(Farm $store, StoreStory $story): void
    {
        $this->assertStoryBelongsToStore($store, $story);

        DB::transaction(function () use ($story) {
            MediaStorage::delete($story->media_path);
            $story->delete();
        });
    }

    public function recordView(User $user, StoreStory $story): StoreStory
    {
        $story->loadMissing('store');

        if ($story->isExpired() || $story->is_hidden) {
            throw ValidationException::withMessages([
                'story' => ['The selected story is no longer active.'],
            ]);
        }

        if ($story->store?->is_suspended) {
            throw ValidationException::withMessages([
                'story' => ['The selected story is no longer available.'],
            ]);
        }

        if ($user->store()->value('id') !== $story->farm_id) {
            StoreStoryView::query()->updateOrCreate(
                [
                    'store_story_id' => $story->id,
                    'user_id' => $user->id,
                ],
                [
                    'viewed_at' => now(),
                ]
            );
        }

        return $this->hydrateStory($story->fresh() ?? $story);
    }

    private function getOwnedStore(User $user): Farm
    {
        $store = $user->store()->first();

        if ($store !== null) {
            return $store;
        }

        throw ValidationException::withMessages([
            'store' => ['Please create your Store Profile before managing stories.'],
        ]);
    }

    private function assertStoryBelongsToStore(
        Farm $store,
        StoreStory $story
    ): void {
        if ($story->farm_id !== $store->id) {
            throw ValidationException::withMessages([
                'story' => ['The selected story does not belong to this store.'],
            ]);
        }
    }

    private function resolveMediaType(UploadedFile $media): string
    {
        $mimeType = (string) $media->getMimeType();

        return str_starts_with($mimeType, 'video/')
            ? StoreStory::MEDIA_TYPE_VIDEO
            : StoreStory::MEDIA_TYPE_IMAGE;
    }

    private function hydrateStory(StoreStory $story): StoreStory
    {
        return $story->load([
            'store:id,farm_name,store_logo_path,district,address,latitude,longitude,phone_number',
        ])->loadCount('views');
    }

    private function applyLocationSearch($query, array $filters): void
    {
        if (! $this->hasLocationSearch($filters)) {
            return;
        }

        $latitude = (float) $filters['latitude'];
        $longitude = (float) $filters['longitude'];
        $radius = $this->resolveRadius($filters['radius'] ?? null);
        $distanceFormula = $this->distanceFormula();
        $bindings = [
            $latitude,
            $longitude,
            $latitude,
        ];

        $query->join(
            'farms as story_feed_stores',
            'story_feed_stores.id',
            '=',
            'store_stories.farm_id'
        )
            ->select('store_stories.*')
            ->selectRaw("ROUND(($distanceFormula)::numeric, 2) as distance_km", $bindings)
            ->whereNotNull('story_feed_stores.latitude')
            ->whereNotNull('story_feed_stores.longitude')
            ->whereRaw("($distanceFormula) <= ?", [
                ...$bindings,
                $radius,
            ]);
    }

    private function applySorting($query, string $sort): void
    {
        if ($sort === 'distance') {
            $query->orderBy('distance_km')
                ->latest();

            return;
        }

        $query->latest();
    }

    private function normalizeSortOption(
        ?string $sort,
        bool $hasLocationSearch
    ): string {
        if ($sort === 'distance' && $hasLocationSearch) {
            return 'distance';
        }

        return 'newest';
    }

    private function hasLocationSearch(array $filters): bool
    {
        return array_key_exists('latitude', $filters)
            && array_key_exists('longitude', $filters)
            && $filters['latitude'] !== null
            && $filters['longitude'] !== null;
    }

    private function resolveRadius(mixed $radius): float
    {
        if ($radius === null) {
            return self::DEFAULT_RADIUS_KM;
        }

        $resolvedRadius = (float) $radius;

        if ($resolvedRadius < 1) {
            return self::DEFAULT_RADIUS_KM;
        }

        return min($resolvedRadius, self::MAX_RADIUS_KM);
    }

    private function resolvePerPage(mixed $perPage): int
    {
        if ($perPage === null) {
            return self::DEFAULT_PAGE_SIZE;
        }

        $resolvedPerPage = (int) $perPage;

        if ($resolvedPerPage < 1) {
            return self::DEFAULT_PAGE_SIZE;
        }

        return min($resolvedPerPage, self::MAX_PAGE_SIZE);
    }

    private function distanceFormula(string $tableAlias = 'story_feed_stores'): string
    {
        return '('.self::EARTH_RADIUS_KM.' * acos(
            LEAST(
                1.0,
                GREATEST(
                    -1.0,
                    cos(radians(?))
                    * cos(radians('.$tableAlias.'.latitude))
                    * cos(radians('.$tableAlias.'.longitude) - radians(?))
                    + sin(radians(?))
                    * sin(radians('.$tableAlias.'.latitude))
                )
            )
        ))';
    }
}
