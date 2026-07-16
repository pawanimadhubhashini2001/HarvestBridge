<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFarmRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'farm_name' => 'sometimes|required|string|max:255',

            'district' => 'sometimes|required|string|max:100',

            'address' => 'sometimes|required|string',

            'latitude' => 'sometimes|required|numeric',

            'longitude' => 'sometimes|required|numeric',

            'farm_size' => 'sometimes|required|numeric|min:0.1',

            'farm_size_unit' => 'sometimes|required|in:acres,hectares',

            'soil_type' => 'sometimes|required|string|max:100'

        ];
    }
}
