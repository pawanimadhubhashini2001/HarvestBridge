<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\CropPredictionRequest;
use App\Services\AIService;

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

        return ApiResponse::success(

            $prediction,

            'Crop recommendation generated successfully.'

        );
    }
}
