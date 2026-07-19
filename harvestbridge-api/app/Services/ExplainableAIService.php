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
                $input['Soil_Type']
            ),

            'weather' => $this->weatherExplanation(
                $input
            ),

            'season' => $this->seasonExplanation(
                $crop,
                $input['Season']
            ),

            'market' => $this->marketExplanation(
                $input['Market_Demand'] ?? null
            ),

        ];
    }

    private function soilExplanation(
        string $crop,
        string $soil
    ): string {

        return "{$soil} soil is suitable for growing {$crop}.";
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

        return "{$season} season is appropriate for cultivating {$crop}.";
    }

    private function marketExplanation(
        ?string $demand
    ): string {
        if ($demand === null || trim($demand) === '') {
            return 'Current market demand data was not provided for this recommendation.';
        }

        return "Current market demand is {$demand}.";
    }
}
