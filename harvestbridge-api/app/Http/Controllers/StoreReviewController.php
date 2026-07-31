<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\ListStoreReviewsRequest;
use App\Http\Requests\StoreStoreReviewRequest;
use App\Http\Requests\UpdateStoreReviewRequest;
use App\Http\Resources\StoreReviewResource;
use App\Models\Farm;
use App\Models\Review;
use App\Services\StoreReviewService;
use Illuminate\Http\Request;

class StoreReviewController extends Controller
{
    public function __construct(
        protected StoreReviewService $service
    ) {}

    public function index(ListStoreReviewsRequest $request, Farm $store)
    {
        $reviews = $this->service->getStoreReviews($store, $request->validated());
        $reviewCollection = StoreReviewResource::collection($reviews)
            ->response()
            ->getData(true);

        $currentUserReview = $request->user()?->role === 'consumer'
            ? $this->service->getCurrentUserReview($store, $request->user())
            : null;

        return ApiResponse::success(
            [
                'summary' => $this->service->getStoreReviewSummary($store),
                'current_user_review' => $currentUserReview
                    ? (new StoreReviewResource($currentUserReview))->resolve($request)
                    : null,
                'reviews' => $reviewCollection['data'],
                'pagination' => [
                    'links' => $reviewCollection['links'] ?? null,
                    'meta' => $reviewCollection['meta'] ?? null,
                ],
            ],
            'Store reviews retrieved successfully'
        );
    }

    public function store(StoreStoreReviewRequest $request, Farm $store)
    {
        return ApiResponse::success(
            new StoreReviewResource(
                $this->service->create(
                    $store,
                    $request->user(),
                    $request->validated()
                )
            ),
            'Store review created successfully',
            201
        );
    }

    public function update(UpdateStoreReviewRequest $request, Farm $store, Review $review)
    {
        return ApiResponse::success(
            new StoreReviewResource(
                $this->service->update(
                    $store,
                    $review,
                    $request->user(),
                    $request->validated()
                )
            ),
            'Store review updated successfully'
        );
    }

    public function destroy(Request $request, Farm $store, Review $review)
    {
        $this->service->delete($store, $review, $request->user());

        return ApiResponse::success(
            null,
            'Store review deleted successfully'
        );
    }
}
