<?php

namespace App\Http\Requests;

use App\Models\Crop;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePreOrderProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'farm_id' => [
                'required',
                Rule::exists('farms', 'id')->where(
                    fn ($query) => $query->where('user_id', $this->user()?->id)
                ),
            ],
            'crop_id' => 'nullable|required_without:crop_name|exists:crops,id',
            'crop_name' => 'nullable|required_without:crop_id|string|max:255',
            'crop_category' => 'nullable|string|max:100',
            'expected_quantity' => 'required|numeric|min:0.01',
            'unit' => 'required|string|max:20',
            'price_per_unit' => 'required|numeric|min:0',
            'quality_grade' => ['nullable', 'string', 'max:50', Rule::in(['Premium', 'Second Grade'])],
            'expected_harvest_date' => 'required|date|after:today',
            'order_deadline' => 'nullable|date|before_or_equal:expected_harvest_date|after_or_equal:today',
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
