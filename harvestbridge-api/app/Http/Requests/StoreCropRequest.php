<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCropRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'name' => 'required|string|max:255|unique:crops,name',

            'category' => 'required|string|max:100',

            'description' => 'nullable|string',

            'growing_season' => 'required|string|max:100',

            'ideal_soil' => 'required|string|max:100',

            'ideal_temperature_min' => 'required|numeric',

            'ideal_temperature_max' => 'required|numeric',

            'ideal_rainfall_min' => 'required|numeric',

            'ideal_rainfall_max' => 'required|numeric',

            'average_growth_days' => 'required|integer|min:1'

        ];
    }
}
