<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFarmRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'farm_name' => 'required|string|max:255',

            'district' => 'required|string|max:100',

            'address' => 'required|string',

            'latitude' => 'required|numeric',

            'longitude' => 'required|numeric',

            'farm_size' => 'required|numeric|min:0.1',

            'farm_size_unit' => 'required|in:acres,hectares',

            'soil_type' => 'required|string|max:100',

            'description' => 'nullable|string'

        ];
    }
}
