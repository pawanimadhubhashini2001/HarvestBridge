<?php

namespace App\Services;

class ExplainableAIService
{
    public function explain(array $input, array $prediction): array
    {
        $crop = $prediction['recommended_crop'];

        return [

            'soil' => $this->soilExplanation(
                $crop,
                $input['pH'] ?? null
            ),

            'weather' => $this->weatherExplanation(
                $input
            ),

            'season' => $this->seasonExplanation(
                $crop,
                $input['Plant_Month'] ?? $input['Plant Month'] ?? $input['Season'] ?? 'the selected month'
            ),

        ];
    }

    private function soilExplanation(
        string $crop,
        mixed $soilPh
    ): string {

        if ($soilPh === null || $soilPh === '') {
            return "Soil pH was not provided, so {$crop} was ranked using district, planting month, and weather.";
        }

        return "Soil pH {$soilPh} was used when ranking {$crop}.";
    }

    private function weatherExplanation(
        array $input
    ): string {

        return "Temperature ({$input['Temperature_C']}°C), humidity ({$input['Humidity_pct']}%), and rainfall ({$input['Rainfall_mm']} mm) are favorable.";
    }

    private function seasonExplanation(
        string $crop,
        string $season
    ): string {

        return "{$season} planting month was used when ranking {$crop}.";
    }
}
