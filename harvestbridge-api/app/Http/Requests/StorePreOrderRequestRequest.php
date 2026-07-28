<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePreOrderRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'pre_order_product_id' => 'required|exists:pre_order_products,id',
            'quantity' => 'required|numeric|min:0.01',
            'preferred_pickup_date' => 'nullable|date|after_or_equal:today',
            'notes' => 'nullable|string|max:2000',
        ];
    }
}
