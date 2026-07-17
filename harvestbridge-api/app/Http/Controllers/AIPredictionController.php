<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\CropPredictionRequest;
use App\Services\AIService;
use App\Http\Resources\PredictionHistoryResource;
use App\Models\PredictionHistory;
use Illuminate\Http\Request;
use App\Http\Requests\SmartPredictionRequest;
use App\Services\WeatherService;

class AIPredictionController extends Controller
{
    public function __construct(
        protected AIService $service
    ) {}

    public function predict(
        CropPredictionRequest $request
    ) {
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
    public function dashboard(Request $request)
    {
        return ApiResponse::success(

            [

                'overview' =>

                $this->service->dashboard(
                    $request->user()
                ),

                'monthly' =>

                $this->service->monthlyPredictions(
                    $request->user()
                ),

                'recent_predictions' =>

                PredictionHistoryResource::collection(

                    $this->service->recentPredictions(
                        $request->user()
                    )

                )

            ],

            'AI dashboard retrieved successfully.'

        );
    }
    public function smartPredict(
        SmartPredictionRequest $request,
        WeatherService $weatherService
    ) {
        $weather = $weatherService->getWeather(
            $request->District
        );

        $input = array_merge(
            $request->validated(),
            [
                'Temperature_C' => $weather['temperature'],
                'Rainfall_mm' => $weather['rainfall'],
                'Humidity_pct' => $weather['humidity']
            ]
        );

        $prediction = $this->service->predict($input);

        $this->service->savePrediction(
            $request->user(),
            $input,
            $prediction
        );

        return response()->json([
            'weather' => $weather,
            'prediction' => $prediction
        ]);
    }
}
