<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\AnalyticsFilterRequest;
use App\Services\AIAnalyticsService;
use Illuminate\Http\Request;

class AIAnalyticsController extends Controller
{
    public function __construct(
        protected AIAnalyticsService $analyticsService
    ) {}

    public function dashboard(AnalyticsFilterRequest $request)
    {
        $data = $request->validated();

        return ApiResponse::success(
            $this->analyticsService->dashboard(
                $request->user(),
                $data['from'] ?? null,
                $data['to'] ?? null
            ),
            'AI analytics dashboard retrieved successfully.'
        );
    }

    public function mostRecommendedCrops(AnalyticsFilterRequest $request)
    {
        $data = $request->validated();

        return ApiResponse::success(
            $this->analyticsService->mostRecommendedCrops(
                $request->user(),
                $data['from'] ?? null,
                $data['to'] ?? null,
                $data['limit'] ?? 10
            ),
            'Most recommended crops retrieved successfully.'
        );
    }

    public function confidence(AnalyticsFilterRequest $request)
    {
        $data = $request->validated();

        return ApiResponse::success(
            $this->analyticsService->confidenceAnalytics(
                $request->user(),
                $data['from'] ?? null,
                $data['to'] ?? null
            ),
            'Confidence analytics retrieved successfully.'
        );
    }

    public function seasonal(AnalyticsFilterRequest $request)
    {
        $data = $request->validated();

        return ApiResponse::success(
            $this->analyticsService->seasonalAnalytics(
                $request->user(),
                $data['from'] ?? null,
                $data['to'] ?? null
            ),
            'Seasonal analytics retrieved successfully.'
        );
    }

    public function favorites(AnalyticsFilterRequest $request)
    {
        $data = $request->validated();

        return ApiResponse::success(
            $this->analyticsService->favoriteStatistics(
                $request->user(),
                $data['from'] ?? null,
                $data['to'] ?? null
            ),
            'Favorite statistics retrieved successfully.'
        );
    }

    public function trends(AnalyticsFilterRequest $request)
    {
        $data = $request->validated();

        return ApiResponse::success(
            $this->analyticsService->recommendationTrends(
                $request->user(),
                $data['from'] ?? null,
                $data['to'] ?? null,
                $data['granularity'] ?? 'month'
            ),
            'Recommendation trends retrieved successfully.'
        );
    }

    public function farmerDashboard(Request $request)
    {
        return ApiResponse::success(
            $this->analyticsService->farmerDashboard($request->user()),
            'Farmer analytics dashboard retrieved successfully.'
        );
    }
}
