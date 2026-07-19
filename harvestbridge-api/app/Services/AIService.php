<?php

namespace App\Services;

use App\Models\Crop;
use App\Models\PredictionHistory;
use Illuminate\Support\Facades\Http;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
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

        if (! array_key_exists('recommended_crops', $payload) || ! is_array($payload['recommended_crops'])) {
            $payload['recommended_crops'] = [];
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

    public function detectPlantDisease(
        User $user,
        UploadedFile $image,
        ?Request $request = null
    ): array {
        $endpoint = (string) config('services.ai.disease_url');

        if ($endpoint === '') {
            throw new \Exception(
                'Plant disease detection service is not configured. Set AI_DISEASE_API_URL first.'
            );
        }

        $fieldName = (string) config('services.ai.disease_field', 'image');
        $response = Http::timeout(60)
            ->attach(
                $fieldName,
                file_get_contents($image->getRealPath()),
                $image->getClientOriginalName()
            )
            ->post($endpoint);

        if ($response->failed()) {
            throw new \Exception(
                'Unable to connect to plant disease detection service.'
            );
        }

        $payload = $response->json();

        if (! is_array($payload)) {
            throw new \Exception(
                'Disease detection service returned an invalid response.'
            );
        }

        $normalized = $this->normalizeDiseasePrediction($payload);

        $this->auditLogService->log(
            'ai.disease.prediction.requested',
            $user->id,
            null,
            [
                'disease_name' => $normalized['disease_name'],
                'confidence' => $normalized['confidence'],
                'image_name' => $image->getClientOriginalName(),
            ],
            $request
        );

        return $normalized;
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
            'pH' => $data['pH'] ?? null,
            'Previous_Crop' => $data['Previous_Crop'] ?? null,
            'Previous_Yield_t_ha' => $data['Previous_Yield_t_ha'] ?? null,
            'Market_Demand' => $data['Market_Demand'] ?? null,
        ];
    }

    private function normalizeRecommendation(array $payload, array $prediction): array
    {
        $recommendedCropName = (string) ($prediction['recommended_crop'] ?? '');
        $confidenceScore = round((float) ($prediction['confidence'] ?? 0), 4);
        $crop = $this->findCropByName($recommendedCropName);
        $rankedRecommendations = $this->normalizeRankedRecommendations(
            $prediction['recommended_crops'] ?? [],
            $recommendedCropName,
            $confidenceScore,
            $crop
        );

        return [
            'input' => [
                'district' => $payload['District'],
                'soil_type' => $payload['Soil_Type'],
                'season' => $payload['Season'],
                'temperature' => round((float) $payload['Temperature_C'], 2),
                'rainfall' => round((float) $payload['Rainfall_mm'], 2),
                'humidity' => round((float) $payload['Humidity_pct'], 2),
                'ph' => isset($payload['pH']) ? round((float) $payload['pH'], 2) : null,
                'previous_crop' => $payload['Previous_Crop'] ?? null,
                'market_demand' => $payload['Market_Demand'] ?? null,
            ],
            'prediction' => [
                'recommended_crop' => $recommendedCropName,
                'recommended_crops' => $rankedRecommendations,
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

    private function normalizeRankedRecommendations(
        array $recommendations,
        string $fallbackCropName,
        float $fallbackConfidence,
        ?Crop $fallbackCrop
    ): array {
        $normalized = collect($recommendations)
            ->map(function ($item) {
                if (! is_array($item)) {
                    return null;
                }

                $name = trim((string) ($item['name'] ?? $item['recommended_crop'] ?? ''));

                if ($name === '') {
                    return null;
                }

                $crop = $this->findCropByName($name);
                $confidence = round((float) ($item['confidence'] ?? 0), 4);

                return [
                    'id' => $crop?->id,
                    'name' => $name,
                    'category' => $crop?->category,
                    'description' => $crop?->description,
                    'confidence' => $confidence,
                    'confidence_percentage' => round($confidence * 100, 2),
                ];
            })
            ->filter()
            ->values();

        if ($normalized->isEmpty()) {
            return [[
                'id' => $fallbackCrop?->id,
                'name' => $fallbackCropName,
                'category' => $fallbackCrop?->category,
                'description' => $fallbackCrop?->description,
                'confidence' => $fallbackConfidence,
                'confidence_percentage' => round($fallbackConfidence * 100, 2),
            ]];
        }

        return $normalized->all();
    }

    private function normalizeDiseasePrediction(array $payload): array
    {
        $diseaseName = $this->firstFilledValue($payload, [
            'disease_name',
            'disease',
            'predicted_disease',
            'predicted_class',
            'class_name',
            'label',
            'prediction',
        ]);

        if ($diseaseName === null) {
            throw new \Exception(
                'Disease detection service response does not include a disease name.'
            );
        }

        $confidenceRaw = $this->firstFilledValue($payload, [
            'confidence',
            'confidence_score',
            'probability',
            'score',
        ]);
        $confidence = is_numeric($confidenceRaw)
            ? round((float) $confidenceRaw, 4)
            : 0.0;
        $confidencePercentage = $confidence <= 1
            ? round($confidence * 100, 2)
            : round($confidence, 2);

        $description = $this->firstFilledValue($payload, [
            'description',
            'disease_description',
            'summary',
            'details',
        ]) ?? sprintf(
            'The AI service detected %s from the uploaded plant image.',
            $diseaseName
        );

        $treatmentSuggestions = $this->normalizeTreatmentSuggestions($payload);

        if ($treatmentSuggestions === []) {
            $treatmentSuggestions = [
                'Inspect nearby leaves and isolate affected plants if symptoms are spreading.',
                'Remove heavily damaged plant parts and keep tools clean between plants.',
                'Consult a local agricultural officer or agronomist before applying treatment.',
            ];
        }

        return [
            'disease_name' => $diseaseName,
            'confidence' => $confidence,
            'confidence_percentage' => $confidencePercentage,
            'description' => $description,
            'treatment_suggestions' => $treatmentSuggestions,
            'raw_response' => $payload,
        ];
    }

    private function normalizeTreatmentSuggestions(array $payload): array
    {
        $value = null;

        foreach ([
            'treatment_suggestions',
            'treatments',
            'suggestions',
            'recommendations',
            'remedies',
        ] as $key) {
            if (array_key_exists($key, $payload) && $payload[$key] !== null) {
                $value = $payload[$key];
                break;
            }
        }

        if (is_string($value)) {
            return collect(preg_split('/\r\n|\r|\n|;/', $value) ?: [])
                ->map(fn (string $item) => trim($item))
                ->filter()
                ->values()
                ->all();
        }

        if (is_array($value)) {
            return collect($value)
                ->map(function ($item) {
                    if (is_string($item)) {
                        return trim($item);
                    }

                    if (is_array($item)) {
                        return $this->firstFilledValue($item, [
                            'message',
                            'text',
                            'suggestion',
                            'title',
                        ]);
                    }

                    return null;
                })
                ->filter(fn (?string $item) => $item !== null && $item !== '')
                ->values()
                ->all();
        }

        return [];
    }

    private function firstFilledValue(array $payload, array $keys): ?string
    {
        foreach ($keys as $key) {
            $value = data_get($payload, $key);

            if (is_string($value) && trim($value) !== '') {
                return trim($value);
            }

            if (is_numeric($value)) {
                return (string) $value;
            }
        }

        return null;
    }
}
