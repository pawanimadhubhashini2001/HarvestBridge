<?php

namespace App\Http\Requests;

use App\Models\Crop;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCropRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('crops', 'name')->ignore($this->crop?->id),
            ],

            'category' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::in(Crop::supportedCategories()),
            ],

            'description' => 'nullable|string',

            'growing_season' => 'sometimes|required|string|max:100',

            'ideal_soil' => 'sometimes|required|string|max:100',

            'ideal_temperature_min' => 'sometimes|required|numeric',

            'ideal_temperature_max' => 'sometimes|required|numeric',

            'ideal_rainfall_min' => 'sometimes|required|numeric',

            'ideal_rainfall_max' => 'sometimes|required|numeric',

            'average_growth_days' => 'sometimes|required|integer|min:1',

            'is_active' => 'sometimes|boolean',

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
