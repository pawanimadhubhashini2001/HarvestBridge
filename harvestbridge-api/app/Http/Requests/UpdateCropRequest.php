<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCropRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'crop_name' => 'sometimes|required|string|max:255|unique:crops,crop_name,' . $this->crop?->id,

            'category' => 'sometimes|required|string|max:100',

            'description' => 'nullable|string'

        ];
    }
}
