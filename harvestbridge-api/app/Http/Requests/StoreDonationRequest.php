<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDonationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'harvest_listing_id' =>
                'required|exists:harvest_listings,id',
            'quantity' =>
                'required|numeric|min:0.01',
            'unit' =>
                'required|string|max:20',
            'description' =>
                'required|string|max:2000',
            'pickup_location' =>
                'required|string|max:255',
            'pickup_date' =>
                'nullable|date',
            'pickup_time' =>
                'nullable',
            'available_until' =>
                'required|date|after_or_equal:today',
            'notes' =>
                'nullable|string|max:2000',
        ];
    }
}
