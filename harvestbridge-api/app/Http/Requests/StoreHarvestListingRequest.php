<?php

namespace App\Http\Requests;

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

            'crop_id' => 'required|exists:crops,id',

            'quantity' => 'required|numeric|min:0.01',

            'unit' => 'required|string|max:20',

            'price_per_unit' => 'required|numeric|min:0',

            'quality_grade' => 'nullable|string|max:50',

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
        ];
    }
}
