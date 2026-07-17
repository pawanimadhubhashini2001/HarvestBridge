<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WeatherAlertDispatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'district' => ['required', 'string', 'max:100'],
            'severity' => ['required', 'in:info,warning,critical'],
            'message' => ['required', 'string'],
            'weather_data' => ['nullable', 'array'],
        ];
    }
}
