<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\StoreStoryFeedRequest;
use App\Http\Requests\StoreStoreStoryRequest;
use App\Http\Requests\UpdateStoreStoryRequest;
use App\Http\Resources\StoreStoryResource;
use App\Models\Farm;
use App\Models\StoreStory;
use App\Services\StoreStoryService;
use Illuminate\Http\Request;

class StoreStoryController extends Controller
{
    public function __construct(
        protected StoreStoryService $service
    ) {}

    public function feed(StoreStoryFeedRequest $request)
    {
        $stories = $this->service->getFeed($request->validated());
        $storyCollection = StoreStoryResource::collection($stories)
            ->response()
            ->getData(true);

        return ApiResponse::success(
            [
                'stories' => $storyCollection['data'],
                'pagination' => [
                    'links' => $storyCollection['links'] ?? null,
                    'meta' => $storyCollection['meta'] ?? null,
                ],
                'sort' => $request->validated('sort') ?? 'newest',
            ],
            'Story feed retrieved successfully'
        );
    }

    public function index(Request $request)
    {
        return ApiResponse::success(
            StoreStoryResource::collection(
                $this->service->getMyStories($request->user())
            ),
            'My stories retrieved successfully'
        );
    }

    public function recordView(Request $request, StoreStory $story)
    {
        return ApiResponse::success(
            new StoreStoryResource(
                $this->service->recordView($request->user(), $story)
            ),
            'Story view recorded successfully'
        );
    }

    public function store(StoreStoreStoryRequest $request, Farm $store)
    {
        $this->authorize('update', $store);

        return ApiResponse::success(
            new StoreStoryResource(
                $this->service->create($store, $request->validated())
            ),
            'Story created successfully',
            201
        );
    }

    public function update(
        UpdateStoreStoryRequest $request,
        Farm $store,
        StoreStory $story
    ) {
        $this->authorize('update', $store);

        return ApiResponse::success(
            new StoreStoryResource(
                $this->service->update(
                    $store,
                    $story,
                    $request->validated()
                )
            ),
            'Story updated successfully'
        );
    }

    public function destroy(Request $request, Farm $store, StoreStory $story)
    {
        $this->authorize('update', $store);

        $this->service->delete($store, $story);

        return ApiResponse::success(
            null,
            'Story deleted successfully'
        );
    }
}
