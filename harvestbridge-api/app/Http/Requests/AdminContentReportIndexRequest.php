<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdminContentReportIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:open,reviewed,resolved,dismissed'],
            'content_type' => ['nullable', 'in:product,store,story,donation,compost_listing'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
