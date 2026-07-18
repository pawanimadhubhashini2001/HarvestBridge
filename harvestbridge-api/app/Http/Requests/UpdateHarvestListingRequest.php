<?php

namespace App\Http\Requests;

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

            'crop_id' => 'sometimes|required|exists:crops,id',

            'quantity' => 'sometimes|required|numeric|min:0.01',

            'unit' => 'sometimes|required|string|max:20',

            'price_per_unit' => 'sometimes|required|numeric|min:0',

            'quality_grade' => 'nullable|string|max:50',

            'harvest_date' => 'sometimes|required|date',

            'available_until' => 'nullable|date|after_or_equal:harvest_date',

            'description' => 'nullable|string',

        ];
    }
}
