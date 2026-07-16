<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

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
}
