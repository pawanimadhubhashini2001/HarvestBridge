<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\CropPredictionRequest;
use App\Services\AIService;
use App\Http\Resources\PredictionHistoryResource;
use App\Models\PredictionHistory;
use Illuminate\Http\Request;

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
}
