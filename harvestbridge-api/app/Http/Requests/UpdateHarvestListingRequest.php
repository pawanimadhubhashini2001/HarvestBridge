<?php

namespace App\Http\Requests;

use App\Models\Crop;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateHarvestListingRequest extends FormRequest
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

            'farm_id' => [
                'sometimes',
                'required',
                Rule::exists('farms', 'id')->where(function ($query) {
                    $query->where('user_id', $this->user()?->id);
                }),
            ],

            'crop_id' => 'sometimes|nullable|required_without:crop_name|exists:crops,id',

            'crop_name' => 'sometimes|nullable|required_without:crop_id|string|max:255',

            'crop_category' => 'sometimes|nullable|string|max:100',

            'quantity' => 'sometimes|required|numeric|min:0.01',

            'unit' => 'sometimes|required|string|max:20',

            'price_per_unit' => 'sometimes|required|numeric|min:0',

            'quality_grade' => ['nullable', 'string', 'max:50', Rule::in(['Premium', 'Second Grade'])],

            'harvest_date' => 'sometimes|required|date',

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
