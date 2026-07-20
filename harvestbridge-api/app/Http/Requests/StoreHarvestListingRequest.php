<?php

namespace App\Http\Requests;

use App\Models\Crop;
use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class StoreHarvestListingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation Rules
     */
    public function rules(): array
    {
        return [

            'farm_id' => [
                'required',
                Rule::exists('farms', 'id')->where(function ($query) {
                    $query->where('user_id', $this->user()?->id);
                }),
            ],

            'crop_id' => 'nullable|required_without:crop_name|exists:crops,id',

            'crop_name' => 'nullable|required_without:crop_id|string|max:255',

            'crop_category' => 'nullable|string|max:100',

            'quantity' => 'required|numeric|min:0.01',

            'unit' => 'required|string|max:20',

            'price_per_unit' => 'required|numeric|min:0',

            'quality_grade' => ['nullable', 'string', 'max:50', Rule::in(['Premium', 'Second Grade'])],

            'harvest_date' => 'required|date',

            'available_until' => 'nullable|date|after_or_equal:harvest_date',

            'description' => 'nullable|string',

        ];
    }

    public function messages(): array
    {
        return [
            'farm_id.required' => 'Please create your Store Profile before adding products.',
            'farm_id.exists' => 'Please create your Store Profile before adding products.',
            'crop_id.required_without' => 'Enter a crop name.',
            'crop_name.required_without' => 'Enter a crop name.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('crop_name')) {
            $this->merge([
                'crop_name' => trim((string) $this->input('crop_name')),
            ]);
        }

        if ($this->filled('crop_category')) {
            $this->merge([
                'crop_category' => Crop::normalizeCategory($this->input('crop_category')),
            ]);
        }
    }
}
