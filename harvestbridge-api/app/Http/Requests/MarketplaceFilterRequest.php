<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MarketplaceFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'search' => 'nullable|string|max:255',

            'district' => 'nullable|string|max:255',

            'min_price' => 'nullable|numeric|min:0',

            'max_price' => 'nullable|numeric|min:0',

            'sort' => 'nullable|in:latest,oldest,price_low,price_high'

        ];
    }
}
