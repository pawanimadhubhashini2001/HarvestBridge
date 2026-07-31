<?php

namespace App\Http\Requests;

use App\Models\Crop;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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

            'category' => [
                'required',
                'string',
                'max:100',
                Rule::in(Crop::supportedCategories()),
            ],

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

    protected function prepareForValidation(): void
    {
        if ($this->has('category')) {
            $this->merge([
                'category' => Crop::normalizeCategory($this->input('category')),
            ]);
        }
    }
}
