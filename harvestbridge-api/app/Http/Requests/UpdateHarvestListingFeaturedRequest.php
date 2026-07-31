<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHarvestListingFeaturedRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'is_featured' => 'required|boolean',
            'featured_until' => 'nullable|date|after_or_equal:today',
        ];
    }
}
