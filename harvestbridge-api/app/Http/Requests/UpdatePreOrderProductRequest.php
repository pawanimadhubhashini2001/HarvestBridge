<?php

namespace App\Http\Requests;

use App\Models\Crop;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePreOrderProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'crop_id' => 'sometimes|nullable|required_without:crop_name|exists:crops,id',
            'crop_name' => 'sometimes|nullable|required_without:crop_id|string|max:255',
            'crop_category' => 'sometimes|nullable|string|max:100',
            'expected_quantity' => 'sometimes|required|numeric|min:0.01',
            'unit' => 'sometimes|required|string|max:20',
            'price_per_unit' => 'sometimes|required|numeric|min:0',
            'quality_grade' => ['nullable', 'string', 'max:50', Rule::in(['Premium', 'Second Grade'])],
            'expected_harvest_date' => 'sometimes|required|date|after:today',
            'order_deadline' => 'nullable|date|before_or_equal:expected_harvest_date|after_or_equal:today',
            'status' => ['sometimes', Rule::in(['open', 'closed', 'cancelled'])],
            'description' => 'nullable|string',
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
