<?php

namespace App\Services;

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

            'rainfall' => $data['rain']['1h'] ?? 0

        ];
    }
}
