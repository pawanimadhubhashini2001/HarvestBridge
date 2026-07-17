<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WeatherAlertResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'district' => $this->district,
            'alert_type' => $this->alert_type,
            'severity' => $this->severity,
            'message' => $this->message,
            'weather_data' => $this->weather_data,
            'sent_at' => $this->sent_at?->toDateTimeString(),
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}
