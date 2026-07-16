<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCropRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'crop_name' => 'required|string|max:255|unique:crops,crop_name',

            'category' => 'required|string|max:100',

            'description' => 'nullable|string'

        ];
    }
}
