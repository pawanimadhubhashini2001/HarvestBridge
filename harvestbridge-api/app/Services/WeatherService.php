<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;
use Exception;

class WeatherService
{
    public function getWeather(string $city)
    {
        $response = Http::get(
            config('services.weather.url'),
            [
                'q' => $city,
                'appid' => config('services.weather.key'),
                'units' => 'metric'
            ]
        );

        if ($response->failed()) {
            throw new Exception('Unable to retrieve weather data.');
        }

        $data = $response->json();

        return [
            'temperature' => $data['main']['temp'],
            'humidity' => $data['main']['humidity'],
            'rainfall' => $data['rain']['1h'] ?? 0,
            'condition' => data_get($data, 'weather.0.main'),
            'condition_description' => data_get($data, 'weather.0.description'),
            'wind_speed' => data_get($data, 'wind.speed'),
            'rain_probability' => $this->extractRainProbability($data),
            'location' => $this->formatLocation($data, $city),
            'last_updated' => $this->formatLastUpdated($data),
        ];
    }

    private function extractRainProbability(array $data): ?int
    {
        $value = data_get($data, 'pop');

        if (!is_numeric($value)) {
            return null;
        }

        $percentage = $value > 1 ? $value : $value * 100;

        return (int) round(max(0, min(100, $percentage)));
    }

    private function formatLocation(array $data, string $fallbackCity): string
    {
        $parts = array_filter([
            data_get($data, 'name') ?? $fallbackCity,
            data_get($data, 'sys.country'),
        ]);

        return implode(', ', $parts);
    }

    private function formatLastUpdated(array $data): string
    {
        $timestamp = data_get($data, 'dt');

        if (!is_numeric($timestamp)) {
            return now()->toIso8601String();
        }

        return CarbonImmutable::createFromTimestampUTC((int) $timestamp)->toIso8601String();
    }
}
