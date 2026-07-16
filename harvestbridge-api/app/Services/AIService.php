<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Models\PredictionHistory;
use App\Models\User;

class AIService
{
    public function predict(array $data)
    {
        $response = Http::timeout(30)
            ->post(
                config('services.ai.url') . '/predict',
                $data
            );

        if ($response->failed()) {
            throw new \Exception(
                'Unable to connect to AI service.'
            );
        }

        return $response->json();
    }
    public function savePrediction(
        User $user,
        array $input,
        array $prediction
    ) {
        return PredictionHistory::create([

            'user_id' => $user->id,

            'district' => $input['District'],

            'season' => $input['Season'],

            'soil_type' => $input['Soil_Type'],

            'temperature' => $input['Temperature_C'],

            'rainfall' => $input['Rainfall_mm'],

            'humidity' => $input['Humidity_pct'],

            'ph' => $input['pH'],

            'previous_crop' => $input['Previous_Crop'],

            'previous_yield' => $input['Previous_Yield_t_ha'],

            'market_demand' => $input['Market_Demand'],

            'recommended_crop' => $prediction['recommended_crop'],

            'confidence' => $prediction['confidence']

        ]);
    }
}
