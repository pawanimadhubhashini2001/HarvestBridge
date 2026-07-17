<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Services\WeatherService;
use Illuminate\Http\Request;

class WeatherController extends Controller
{
    public function __construct(
        protected WeatherService $service
    ) {}

    public function current(Request $request)
    {
        $weather = $this->service->getWeather(
            $request->query('city')
        );

        return ApiResponse::success(

            $weather,

            'Weather retrieved successfully.'

        );
    }
}
