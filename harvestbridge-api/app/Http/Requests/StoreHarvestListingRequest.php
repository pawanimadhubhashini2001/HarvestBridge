<?php

namespace App\Http\Requests;

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

            'farm_id' => 'required|exists:farms,id',

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
}
