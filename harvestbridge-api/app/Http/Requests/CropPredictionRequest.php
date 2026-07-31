<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CropPredictionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [

            'District' => 'required|string|max:100',

            'Season' => 'required|string|max:100',

            'Soil_Type' => 'required|string|max:100',

            'Temperature_C' => 'nullable|numeric',

            'Rainfall_mm' => 'nullable|numeric|min:0',

            'Humidity_pct' => 'nullable|numeric|min:0|max:100',

        ];
    }
}
