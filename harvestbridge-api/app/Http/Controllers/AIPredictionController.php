<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\CropPredictionRequest;
use App\Http\Requests\SmartPredictionRequest;
use App\Http\Resources\MarketPriceResource;
use App\Http\Resources\PredictionHistoryResource;
use App\Models\PredictionHistory;
use App\Services\AIService;
use App\Services\ExplainableAIService;
use App\Services\MarketPriceService;
use App\Services\WeatherService;
use Illuminate\Http\Request;

class AIPredictionController extends Controller
{
    public function __construct(
        protected AIService $service
    ) {}

    /**
     * Standard AI Prediction
     */
    public function predict(CropPredictionRequest $request)
    {
        $prediction = $this->service->predict(
            $request->validated()
        );

        $this->service->savePrediction(
            $request->user(),
            $request->validated(),
            $prediction
        );

        return ApiResponse::success(
            $prediction,
            'Crop recommendation generated successfully.'
        );
    }

    /**
     * Prediction History
     */
    public function history(Request $request)
    {
        $history = PredictionHistory::where(
            'user_id',
            $request->user()->id
        )
            ->latest()
            ->get();

        return ApiResponse::success(
            PredictionHistoryResource::collection($history),
            'Prediction history retrieved successfully.'
        );
    }

    /**
     * AI Dashboard
     */
    public function dashboard(Request $request)
    {
        return ApiResponse::success(
            [

                'overview' => $this->service->dashboard(
                    $request->user()
                ),

                'monthly' => $this->service->monthlyPredictions(
                    $request->user()
                ),

                'recent_predictions' => PredictionHistoryResource::collection(
                    $this->service->recentPredictions(
                        $request->user()
                    )
                ),

            ],
            'AI dashboard retrieved successfully.'
        );
    }

    /**
     * Smart Prediction
     */
    public function smartPredict(
        SmartPredictionRequest $request,
        WeatherService $weatherService,
        MarketPriceService $marketService,
        ExplainableAIService $explainService
    ) {

        // Retrieve weather
        $weather = $weatherService->getWeather(
            $request->District
        );

        // Build AI input
        $input = array_merge(
            $request->validated(),
            [
                'Temperature_C' => $weather['temperature'],
                'Rainfall_mm'   => $weather['rainfall'],
                'Humidity_pct'  => $weather['humidity'],
            ]
        );

        // AI Prediction
        $prediction = $this->service->predict($input);

        // Generate explanation
        $explanation = $explainService->explain(
            $input,
            $prediction
        );

        // Latest market price
        $market = $marketService->latestPrice(
            $prediction['recommended_crop']
        );

        // Save prediction history
        $this->service->savePrediction(
            $request->user(),
            $input,
            $prediction
        );

        return response()->json([

            'weather' => $weather,

            'prediction' => [

                'recommended_crop' => $prediction['recommended_crop'],

                'confidence' => $prediction['confidence'],

                'explanation' => $explanation,

            ],

            'market_price' => $market
                ? new MarketPriceResource($market)
                : null,

        ]);
    }
}
