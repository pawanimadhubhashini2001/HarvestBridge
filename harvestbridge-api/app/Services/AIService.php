<?php

namespace App\Services;

use App\Models\Crop;
use App\Models\PredictionHistory;
use App\Support\MediaStorage;
use Illuminate\Support\Facades\Http;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class AIService
{
    private const DISEASE_IMAGE_DIRECTORY = 'ai/disease-detection';

    private const HISTORICAL_SCORE_FIELDS = [
        'Rainfall(mm)',
        'Temperature(C)',
        'Humidity(%)',
        'Soil pH',
    ];

    private ?array $historicalRows = null;

    private array $historicalScales = [];

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

    public function normalizePrediction(array $payload, array $prediction): array
    {
        return $this->normalizeRecommendation($payload, $prediction);
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
            $normalized['prediction'],
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

            'season' => $input['Plant_Month'] ?? $input['Plant Month'] ?? $input['Season'] ?? null,

            'soil_type' => $input['Soil_Type'] ?? 'Dataset model',

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
                'plant_month' => $history->season,
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
        $imagePath = MediaStorage::storeUploadedFile(
            $image,
            self::DISEASE_IMAGE_DIRECTORY.'/'.$user->id
        );
        $imageUrl = MediaStorage::url($imagePath, $request);

        $this->auditLogService->log(
            'ai.disease.prediction.requested',
            $user->id,
            null,
            [
                'disease_name' => $normalized['disease_name'],
                'confidence' => $normalized['confidence'],
                'image_name' => $image->getClientOriginalName(),
                'image_path' => $imagePath,
                'image_url' => $imageUrl,
            ],
            $request
        );

        return [
            ...$normalized,
            'image_path' => $imagePath,
            'image_url' => $imageUrl,
        ];
    }

    private function buildPredictionPayload(array $data): array
    {
        $weather = $this->weatherService->getWeather($data['District']);

        return [
            'District' => $data['District'],
            'Plant_Month' => $data['Plant_Month'] ?? $data['Plant Month'] ?? $data['Season'],
            'Temperature_C' => $data['Temperature_C'] ?? $weather['temperature'],
            'Rainfall_mm' => $data['Rainfall_mm'] ?? $weather['rainfall'],
            'Humidity_pct' => $data['Humidity_pct'] ?? $weather['humidity'],
            'pH' => $data['pH'] ?? null,
        ];
    }

    private function normalizeRecommendation(array $payload, array $prediction): array
    {
        $prediction = $this->calibrateRecommendationScores($payload, $prediction);
        $recommendedCropName = (string) ($prediction['recommended_crop'] ?? '');
        $confidenceScore = round((float) ($prediction['confidence'] ?? 0), 4);
        $modelProbability = round((float) (
            $prediction['model_probability']
            ?? $prediction['raw_confidence']
            ?? $confidenceScore
        ), 4);
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
                'plant_month' => $payload['Plant_Month'] ?? $payload['Plant Month'] ?? $payload['Season'] ?? null,
                'temperature' => round((float) $payload['Temperature_C'], 2),
                'rainfall' => round((float) $payload['Rainfall_mm'], 2),
                'humidity' => round((float) $payload['Humidity_pct'], 2),
                'ph' => isset($payload['pH']) ? round((float) $payload['pH'], 2) : null,
            ],
            'prediction' => [
                'recommended_crop' => $recommendedCropName,
                'recommended_crops' => $rankedRecommendations,
                'confidence' => $confidenceScore,
                'confidence_score' => $confidenceScore,
                'confidence_percentage' => round($confidenceScore * 100, 2),
                'model_probability' => $modelProbability,
                'raw_confidence' => $modelProbability,
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
                '%s is suitable for planting in %s.',
                $recommendedCropName,
                $payload['Plant_Month'] ?? $payload['Plant Month'] ?? $payload['Season'] ?? 'the selected month'
            );
        }

        if ($crop?->ideal_soil) {
            $tips[] = sprintf(
                'Ideal soil type: %s.',
                $crop->ideal_soil
            );
        } else {
            $tips[] = sprintf(
                'Plan around the entered soil pH of %s.',
                isset($payload['pH']) ? round((float) $payload['pH'], 2) : 'not provided'
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
                $modelProbability = round((float) (
                    $item['model_probability']
                    ?? $item['raw_confidence']
                    ?? $confidence
                ), 4);
                $historicalConfidence = isset($item['historical_confidence'])
                    ? round((float) $item['historical_confidence'], 4)
                    : null;

                return [
                    'id' => $crop?->id,
                    'name' => $name,
                    'category' => $crop?->category,
                    'description' => $crop?->description,
                    'confidence' => $confidence,
                    'confidence_percentage' => round($confidence * 100, 2),
                    'model_probability' => $modelProbability,
                    'raw_confidence' => $modelProbability,
                    'historical_confidence' => $historicalConfidence,
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
                'model_probability' => $fallbackConfidence,
                'raw_confidence' => $fallbackConfidence,
            ]];
        }

        return $normalized->all();
    }

    private function calibrateRecommendationScores(array $payload, array $prediction): array
    {
        $recommendations = $prediction['recommended_crops'] ?? [];

        if ($recommendations === [] && ! empty($prediction['recommended_crop'])) {
            $recommendations = [[
                'name' => $prediction['recommended_crop'],
                'confidence' => $prediction['confidence'] ?? 0,
            ]];
        }

        $cropNames = collect($recommendations)
            ->map(fn ($item) => is_array($item)
                ? trim((string) ($item['name'] ?? $item['recommended_crop'] ?? ''))
                : '')
            ->filter()
            ->values()
            ->all();

        if ($cropNames === []) {
            return $prediction;
        }

        $historicalScores = $this->historicalSuitabilityScores($payload, $cropNames);

        if ($historicalScores === []) {
            return $prediction;
        }

        $calibratedRecommendations = collect($recommendations)
            ->map(function ($item) use ($historicalScores) {
                if (! is_array($item)) {
                    return null;
                }

                $name = trim((string) ($item['name'] ?? $item['recommended_crop'] ?? ''));

                if ($name === '') {
                    return null;
                }

                $lookupKey = mb_strtolower($name);
                $modelProbability = round((float) (
                    $item['model_probability']
                    ?? $item['raw_confidence']
                    ?? $item['confidence']
                    ?? 0
                ), 4);
                $historicalConfidence = $historicalScores[$lookupKey] ?? null;

                if ($historicalConfidence === null) {
                    return array_merge($item, [
                        'name' => $name,
                        'model_probability' => $modelProbability,
                        'raw_confidence' => $modelProbability,
                    ]);
                }

                return array_merge($item, [
                    'name' => $name,
                    'confidence' => $historicalConfidence,
                    'model_probability' => $modelProbability,
                    'raw_confidence' => $modelProbability,
                    'historical_confidence' => $historicalConfidence,
                ]);
            })
            ->filter()
            ->sort(function (array $left, array $right) {
                return [
                    (float) ($right['confidence'] ?? 0),
                    (float) ($right['model_probability'] ?? 0),
                ] <=> [
                    (float) ($left['confidence'] ?? 0),
                    (float) ($left['model_probability'] ?? 0),
                ];
            })
            ->values()
            ->all();

        if ($calibratedRecommendations === []) {
            return $prediction;
        }

        $topRecommendation = $calibratedRecommendations[0];

        $prediction['recommended_crop'] = $topRecommendation['name'];
        $prediction['confidence'] = round((float) $topRecommendation['confidence'], 4);
        $prediction['model_probability'] = round((float) ($topRecommendation['model_probability'] ?? 0), 4);
        $prediction['raw_confidence'] = $prediction['model_probability'];
        $prediction['recommended_crops'] = $calibratedRecommendations;
        $prediction['top_3_crops'] = $calibratedRecommendations;

        return $prediction;
    }

    private function historicalSuitabilityScores(array $payload, array $cropNames): array
    {
        $rows = $this->loadHistoricalRows();

        if ($rows === []) {
            return [];
        }

        $district = $this->normalizedText($payload['District'] ?? null);
        $plantMonth = $this->normalizedText(
            $payload['Plant_Month']
            ?? $payload['Plant Month']
            ?? $payload['Season']
            ?? null
        );
        $numericInputs = [];

        foreach (self::HISTORICAL_SCORE_FIELDS as $field) {
            $value = $this->payloadFieldValue($payload, $field);

            if (is_numeric($value)) {
                $numericInputs[$field] = (float) $value;
            }
        }

        if ($district === '' || $plantMonth === '' || $numericInputs === []) {
            return [];
        }

        $scores = [];

        foreach ($cropNames as $cropName) {
            $cropKey = $this->normalizedText($cropName);
            $cropRows = array_values(array_filter(
                $rows,
                fn (array $row) => $this->normalizedText($row['Crop'] ?? null) === $cropKey
            ));

            if ($cropRows === []) {
                continue;
            }

            $contextRows = array_values(array_filter(
                $cropRows,
                fn (array $row) =>
                    $this->normalizedText($row['District'] ?? null) === $district
                    && $this->normalizedText($row['Plant Month'] ?? null) === $plantMonth
            ));
            $comparisonRows = count($contextRows) >= 3 ? $contextRows : $cropRows;
            $similarities = [];

            foreach ($comparisonRows as $row) {
                $distance = 0.0;
                $usedFields = 0;

                foreach ($numericInputs as $field => $inputValue) {
                    if (! isset($row[$field]) || ! is_numeric($row[$field])) {
                        continue;
                    }

                    $scale = $this->historicalScales[$field] ?? 1.0;
                    $distance += (((float) $row[$field] - $inputValue) / $scale) ** 2;
                    $usedFields++;
                }

                if ($usedFields > 0) {
                    $similarities[] = exp(-0.5 * ($distance / $usedFields));
                }
            }

            if ($similarities !== []) {
                $scores[$cropKey] = round(max(0.0, min($this->percentile($similarities, 0.9), 0.99)), 4);
            }
        }

        return $scores;
    }

    private function loadHistoricalRows(): array
    {
        if ($this->historicalRows !== null) {
            return $this->historicalRows;
        }

        $path = base_path('../HarvestBridge-AI/dataset/HarvestBridge.csv');

        if (! file_exists($path)) {
            $this->historicalRows = [];
            $this->historicalScales = [];

            return $this->historicalRows;
        }

        $file = new \SplFileObject($path);
        $file->setFlags(\SplFileObject::READ_CSV | \SplFileObject::SKIP_EMPTY);
        $headers = null;
        $rows = [];

        foreach ($file as $row) {
            if ($row === [null] || $row === false) {
                continue;
            }

            if ($headers === null) {
                $headers = array_map(fn ($header) => trim((string) $header), $row);
                continue;
            }

            $record = [];

            foreach ($headers as $index => $header) {
                $record[$header] = isset($row[$index]) ? trim((string) $row[$index]) : null;
            }

            if (($record['Crop'] ?? '') !== '') {
                $rows[] = $record;
            }
        }

        $this->historicalRows = $rows;
        $this->historicalScales = $this->calculateHistoricalScales($rows);

        return $this->historicalRows;
    }

    private function calculateHistoricalScales(array $rows): array
    {
        $scales = [];

        foreach (self::HISTORICAL_SCORE_FIELDS as $field) {
            $values = collect($rows)
                ->map(fn (array $row) => $row[$field] ?? null)
                ->filter(fn ($value) => is_numeric($value))
                ->map(fn ($value) => (float) $value)
                ->values()
                ->all();

            if ($values === []) {
                continue;
            }

            $mean = array_sum($values) / count($values);
            $variance = collect($values)
                ->map(fn (float $value) => ($value - $mean) ** 2)
                ->sum() / count($values);

            $scales[$field] = max(sqrt($variance), 1.0);
        }

        return $scales;
    }

    private function payloadFieldValue(array $payload, string $canonicalField): mixed
    {
        $aliases = [
            'Rainfall(mm)' => ['Rainfall(mm)', 'Rainfall_mm', 'rainfall'],
            'Temperature(C)' => ['Temperature(C)', 'Temperature_C', 'temperature'],
            'Humidity(%)' => ['Humidity(%)', 'Humidity_pct', 'humidity'],
            'Soil pH' => ['Soil pH', 'Soil_pH', 'pH', 'ph'],
        ];

        foreach ($aliases[$canonicalField] ?? [$canonicalField] as $key) {
            if (array_key_exists($key, $payload) && $payload[$key] !== null) {
                return $payload[$key];
            }
        }

        return null;
    }

    private function normalizedText(mixed $value): string
    {
        return mb_strtolower(trim((string) $value));
    }

    private function percentile(array $values, float $percentile): float
    {
        sort($values);
        $count = count($values);

        if ($count === 1) {
            return (float) $values[0];
        }

        $position = ($count - 1) * $percentile;
        $lower = (int) floor($position);
        $upper = (int) ceil($position);

        if ($lower === $upper) {
            return (float) $values[$lower];
        }

        $weight = $position - $lower;

        return ((float) $values[$lower] * (1 - $weight))
            + ((float) $values[$upper] * $weight);
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
