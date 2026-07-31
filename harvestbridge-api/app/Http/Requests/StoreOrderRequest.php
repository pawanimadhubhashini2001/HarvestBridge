<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules.
     */
    public function rules(): array
    {
        return [

            'harvest_listing_id' => 'required|exists:harvest_listings,id',

            'quantity' => 'required|numeric|min:0.01',

            'visit_date' => 'required|date|after_or_equal:today',

            'delivery_address' => 'nullable|string|max:1000',

            'notes' => 'nullable|string'

        ];
    }
}
