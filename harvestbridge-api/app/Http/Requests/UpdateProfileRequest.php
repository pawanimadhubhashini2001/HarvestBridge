<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'name' => 'sometimes|required|string|max:255',

            'phone' => 'nullable|string|max:20',

            'district' => 'nullable|string|max:100',

            'address' => 'nullable|string',

            'latitude' => 'nullable|numeric',

            'longitude' => 'nullable|numeric',

            'organization_name' => 'nullable|string|max:255',

            'company_name' => 'nullable|string|max:255',

            'profile_photo' => 'nullable|string'

        ];
    }
}
