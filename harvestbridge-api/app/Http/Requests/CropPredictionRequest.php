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

            'District' => 'required|string',

            'Season' => 'required|string',

            'Soil_Type' => 'required|string',

            'Temperature_C' => 'required|numeric',

            'Rainfall_mm' => 'required|numeric',

            'Humidity_pct' => 'required|numeric',

            'pH' => 'required|numeric',

            'Previous_Crop' => 'nullable|string',

            'Previous_Yield_t_ha' => 'nullable|numeric',

            'Market_Demand' => 'required|string',

        ];
    }
}
