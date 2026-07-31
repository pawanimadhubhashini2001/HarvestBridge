<?php

namespace App\Services;

use App\Models\Farm;
use App\Models\Review;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StoreReviewService
{
    private const DEFAULT_PAGE_SIZE = 10;
    private const MAX_PAGE_SIZE = 50;

    public function getStoreReviews(Farm $store, array $filters = []): LengthAwarePaginator
    {
        return Review::query()
            ->with([
                'reviewer:id,name,profile_photo',
            ])
            ->where('farm_id', $store->id)
            ->where('is_visible', true)
            ->latest()
            ->paginate($this->resolvePerPage($filters['per_page'] ?? null))
            ->withQueryString();
    }

    public function getStoreReviewSummary(Farm $store): array
    {
        $query = Review::query()
            ->where('farm_id', $store->id)
            ->where('is_visible', true);

        $reviewCount = (clone $query)->count();
        $averageRating = $reviewCount > 0
            ? round((float) (clone $query)->avg('rating'), 2)
            : null;
        $breakdown = (clone $query)
            ->selectRaw('rating, COUNT(*) as aggregate_count')
            ->groupBy('rating')
            ->pluck('aggregate_count', 'rating');

        return [
            'average_rating' => $averageRating,
            'review_count' => $reviewCount,
            'total_ratings' => $reviewCount,
            'rating_breakdown' => [
                'five_star_count' => (int) ($breakdown[5] ?? 0),
                'four_star_count' => (int) ($breakdown[4] ?? 0),
                'three_star_count' => (int) ($breakdown[3] ?? 0),
                'two_star_count' => (int) ($breakdown[2] ?? 0),
                'one_star_count' => (int) ($breakdown[1] ?? 0),
            ],
        ];
    }

    public function getCurrentUserReview(Farm $store, User $user): ?Review
    {
        return Review::query()
            ->with([
                'reviewer:id,name,profile_photo',
            ])
            ->where('farm_id', $store->id)
            ->where('reviewer_id', $user->id)
            ->first();
    }

    public function create(Farm $store, User $user, array $data): Review
    {
        $this->assertConsumer($user);

        $review = DB::transaction(function () use ($store, $user, $data) {
            $existingReview = Review::query()
                ->where('farm_id', $store->id)
                ->where('reviewer_id', $user->id)
                ->lockForUpdate()
                ->first();

            if ($existingReview !== null) {
                throw ValidationException::withMessages([
                    'review' => ['You have already reviewed this store. You can edit your existing review instead.'],
                ]);
            }

            return Review::query()->create([
                'reviewer_id' => $user->id,
                'reviewed_user_id' => $store->user_id,
                'farm_id' => $store->id,
                'rating' => $data['rating'],
                'title' => trim($data['title']),
                'comment' => trim($data['comment']),
                'is_visible' => true,
            ]);
        });

        return $review->load('reviewer:id,name,profile_photo');
    }

    public function update(Farm $store, Review $review, User $user, array $data): Review
    {
        $this->assertConsumer($user);
        $this->assertBelongsToStore($store, $review);
        $this->assertOwnedByUser($review, $user);

        $review->update([
            'reviewed_user_id' => $store->user_id,
            'rating' => $data['rating'],
            'title' => trim($data['title']),
            'comment' => trim($data['comment']),
        ]);

        return $review->fresh()->load('reviewer:id,name,profile_photo');
    }

    public function delete(Farm $store, Review $review, User $user): void
    {
        $this->assertConsumer($user);
        $this->assertBelongsToStore($store, $review);
        $this->assertOwnedByUser($review, $user);

        $review->delete();
    }

    private function assertConsumer(User $user): void
    {
        if ($user->role !== 'consumer') {
            throw ValidationException::withMessages([
                'review' => ['Only authenticated consumers can review stores.'],
            ]);
        }
    }

    private function assertBelongsToStore(Farm $store, Review $review): void
    {
        if ((int) $review->farm_id !== (int) $store->id) {
            throw ValidationException::withMessages([
                'review' => ['The selected review does not belong to this store.'],
            ]);
        }
    }

    private function assertOwnedByUser(Review $review, User $user): void
    {
        if ((int) $review->reviewer_id !== (int) $user->id) {
            throw ValidationException::withMessages([
                'review' => ['You can only update or delete your own review.'],
            ]);
        }
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
}
