<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Resources\FarmerMarketplaceDashboardResource;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function __construct(

        protected AnalyticsService $service

    ) {}

    public function compost(Request $request)
    {
        return ApiResponse::success(

            [
                'overview' =>

                    $this->service->compostAnalytics(
                        $request->user()
                    ),

                'waste_types' =>

                    $this->service->wasteTypeSummary(
                        $request->user()
                    ),

                'monthly' =>

                    $this->service->monthlySummary(
                        $request->user()
                    )
            ],

            'Analytics retrieved successfully.'

        );
    }

    public function farmerMarketplaceDashboard(Request $request)
    {
        return ApiResponse::success(
            new FarmerMarketplaceDashboardResource(
                $this->service->farmerMarketplaceDashboard($request->user())
            ),
            'Farmer marketplace dashboard retrieved successfully.'
        );
    }
}
