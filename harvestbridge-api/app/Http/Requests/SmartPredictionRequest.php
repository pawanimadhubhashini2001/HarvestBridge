<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SmartPredictionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'District' => 'required|string',

            'Season' => 'required|string',

            'Soil_Type' => 'required|string',

            'pH' => 'required|numeric',

            'Previous_Crop' => 'nullable|string',

            'Previous_Yield_t_ha' => 'nullable|numeric',

            'Market_Demand' => 'required|string',

        ];
    }
}
