<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Models\PredictionHistory;
use App\Models\User;
use Illuminate\Support\Facades\DB;

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
    public function dashboard(User $user)
    {
        return [

            'total_predictions' => PredictionHistory::where(
                'user_id',
                $user->id
            )->count(),

            'average_confidence' => round(
                PredictionHistory::where(
                    'user_id',
                    $user->id
                )->avg('confidence'),
                4
            ),

            'most_recommended_crop' => PredictionHistory::select(
                'recommended_crop',
                DB::raw('COUNT(*) as total')
            )
                ->where('user_id', $user->id)
                ->groupBy('recommended_crop')
                ->orderByDesc('total')
                ->first()

        ];
    }
    public function monthlyPredictions(User $user)
    {
        return PredictionHistory::selectRaw(
            "DATE_TRUNC('month', created_at) as month,
         COUNT(*) as total"
        )
            ->where('user_id', $user->id)
            ->groupBy('month')
            ->orderBy('month')
            ->get();
    }
    public function recentPredictions(User $user)
    {
        return PredictionHistory::latest()
            ->where('user_id', $user->id)
            ->take(5)
            ->get();
    }
}
