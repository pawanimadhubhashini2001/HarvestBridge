<?php

namespace App\Services;

use App\Models\Crop;
use App\Models\PredictionHistory;
use Illuminate\Support\Facades\Http;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AIService
{
    public function __construct(
        protected AuditLogService $auditLogService,
        protected WeatherService $weatherService
    ) {}

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

        $payload = $response->json();

        if (
            ! is_array($payload)
            || ! array_key_exists('recommended_crop', $payload)
            || ! array_key_exists('confidence', $payload)
        ) {
            throw new \Exception(
                'AI service returned an invalid recommendation response.'
            );
        }

        return $payload;
    }

    public function recommendCrops(
        User $user,
        array $data,
        ?Request $request = null
    ): array {
        $payload = $this->buildPredictionPayload($data);
        $prediction = $this->predict($payload);
        $normalized = $this->normalizeRecommendation($payload, $prediction);

        $this->savePrediction(
            $user,
            $payload,
            $prediction,
            $request
        );

        return $normalized;
    }

    public function savePrediction(
        User $user,
        array $input,
        array $prediction,
        ?Request $request = null
    ) {
        $history = PredictionHistory::create([

            'user_id' => $user->id,

            'district' => $input['District'],

            'season' => $input['Season'],

            'soil_type' => $input['Soil_Type'],

            'temperature' => $input['Temperature_C'] ?? null,

            'rainfall' => $input['Rainfall_mm'] ?? null,

            'humidity' => $input['Humidity_pct'] ?? null,

            'ph' => $input['pH'] ?? null,

            'previous_crop' => $input['Previous_Crop'] ?? null,

            'previous_yield' => $input['Previous_Yield_t_ha'] ?? null,

            'market_demand' => $input['Market_Demand'] ?? null,

            'recommended_crop' => $prediction['recommended_crop'],

            'confidence' => $prediction['confidence']

        ]);

        $this->auditLogService->log(
            'ai.prediction.saved',
            $user->id,
            $history,
            [
                'district' => $history->district,
                'season' => $history->season,
                'recommended_crop' => $history->recommended_crop,
                'confidence' => $history->confidence,
            ],
            $request
        );

        return $history;
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
    public function smartPredict(
        array $data,
        WeatherService $weatherService
    ) {
        $weather = $weatherService->getWeather(
            $data['District']
        );

        $payload = array_merge(
            $data,
            [
                'Temperature_C' => $weather['temperature'],
                'Rainfall_mm' => $weather['rainfall'],
                'Humidity_pct' => $weather['humidity'],
            ]
        );

        return $this->predict($payload);
    }
    public function history($user)
    {
        return PredictionHistory::where(
            'user_id',
            $user->id
        )
            ->latest()
            ->paginate(10);
    }
    public function searchHistory($user, array $filters)
    {
        $query = PredictionHistory::where(
            'user_id',
            $user->id
        );

        if (!empty($filters['crop'])) {
            $query->where(
                'recommended_crop',
                'ILIKE',
                '%' . $filters['crop'] . '%'
            );
        }

        if (!empty($filters['season'])) {
            $query->where(
                'season',
                $filters['season']
            );
        }

        if (!empty($filters['from'])) {
            $query->whereDate(
                'created_at',
                '>=',
                $filters['from']
            );
        }

        if (!empty($filters['to'])) {
            $query->whereDate(
                'created_at',
                '<=',
                $filters['to']
            );
        }

        return $query
            ->latest()
            ->paginate(10);
    }
    public function favoriteRecommendations($user)
    {
        return PredictionHistory::where(
            'user_id',
            $user->id
        )
            ->where('is_favorite', true)
            ->latest()
            ->paginate(10);
    }
    public function toggleFavorite(PredictionHistory $history)
    {
        $history->update([
            'is_favorite' => !$history->is_favorite,
        ]);

        return $history;
    }

    private function buildPredictionPayload(array $data): array
    {
        $weather = $this->weatherService->getWeather($data['District']);

        return [
            'District' => $data['District'],
            'Season' => $data['Season'],
            'Soil_Type' => $data['Soil_Type'],
            'Temperature_C' => $data['Temperature_C'] ?? $weather['temperature'],
            'Rainfall_mm' => $data['Rainfall_mm'] ?? $weather['rainfall'],
            'Humidity_pct' => $data['Humidity_pct'] ?? $weather['humidity'],
        ];
    }

    private function normalizeRecommendation(array $payload, array $prediction): array
    {
        $recommendedCropName = (string) ($prediction['recommended_crop'] ?? '');
        $confidenceScore = round((float) ($prediction['confidence'] ?? 0), 4);
        $crop = $this->findCropByName($recommendedCropName);

        return [
            'input' => [
                'district' => $payload['District'],
                'soil_type' => $payload['Soil_Type'],
                'season' => $payload['Season'],
                'temperature' => round((float) $payload['Temperature_C'], 2),
                'rainfall' => round((float) $payload['Rainfall_mm'], 2),
                'humidity' => round((float) $payload['Humidity_pct'], 2),
            ],
            'prediction' => [
                'recommended_crop' => $recommendedCropName,
                'recommended_crops' => [
                    [
                        'id' => $crop?->id,
                        'name' => $recommendedCropName,
                        'category' => $crop?->category,
                        'description' => $crop?->description,
                    ],
                ],
                'confidence' => $confidenceScore,
                'confidence_score' => $confidenceScore,
                'confidence_percentage' => round($confidenceScore * 100, 2),
                'growing_tips' => $this->buildGrowingTips($crop, $payload, $recommendedCropName),
            ],
        ];
    }

    private function findCropByName(string $cropName): ?Crop
    {
        if ($cropName === '') {
            return null;
        }

        return Crop::query()
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($cropName)])
            ->orWhere('name', 'ILIKE', $cropName)
            ->first();
    }

    private function buildGrowingTips(
        ?Crop $crop,
        array $payload,
        string $recommendedCropName
    ): array {
        $tips = [];

        if ($crop?->description) {
            $tips[] = trim($crop->description);
        }

        if ($crop?->growing_season) {
            $tips[] = sprintf(
                'Best planted during the %s season.',
                $crop->growing_season
            );
        } else {
            $tips[] = sprintf(
                '%s is suitable for the %s season.',
                $recommendedCropName,
                $payload['Season']
            );
        }

        if ($crop?->ideal_soil) {
            $tips[] = sprintf(
                'Ideal soil type: %s.',
                $crop->ideal_soil
            );
        } else {
            $tips[] = sprintf(
                'Use well-prepared %s soil with good drainage.',
                $payload['Soil_Type']
            );
        }

        if (
            $crop?->ideal_temperature_min !== null
            && $crop?->ideal_temperature_max !== null
        ) {
            $tips[] = sprintf(
                'Target a temperature range of %s°C to %s°C.',
                $crop->ideal_temperature_min,
                $crop->ideal_temperature_max
            );
        } else {
            $tips[] = sprintf(
                'Current planning temperature is %s°C.',
                round((float) $payload['Temperature_C'], 2)
            );
        }

        if (
            $crop?->ideal_rainfall_min !== null
            && $crop?->ideal_rainfall_max !== null
        ) {
            $tips[] = sprintf(
                'Recommended rainfall range: %s mm to %s mm.',
                $crop->ideal_rainfall_min,
                $crop->ideal_rainfall_max
            );
        } else {
            $tips[] = sprintf(
                'Expected rainfall for this recommendation is %s mm.',
                round((float) $payload['Rainfall_mm'], 2)
            );
        }

        return collect($tips)
            ->filter(fn (?string $tip) => $tip !== null && trim($tip) !== '')
            ->values()
            ->all();
    }
}
