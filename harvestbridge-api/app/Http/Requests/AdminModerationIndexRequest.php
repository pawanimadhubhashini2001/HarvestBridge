<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdminModerationIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:50'],
            'business_status' => ['nullable', 'string', 'max:50'],
            'is_suspended' => ['nullable', 'boolean'],
            'state' => ['nullable', 'in:active,expired,hidden'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
