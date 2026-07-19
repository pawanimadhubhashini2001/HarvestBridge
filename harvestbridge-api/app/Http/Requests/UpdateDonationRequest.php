<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDonationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'harvest_listing_id' => 'sometimes|exists:harvest_listings,id',
            'quantity' => 'sometimes|numeric|min:0.01',
            'unit' => 'sometimes|string|max:20',
            'description' => 'sometimes|string|max:2000',
            'pickup_location' => 'sometimes|string|max:255',
            'pickup_date' => 'sometimes|nullable|date',
            'pickup_time' => 'sometimes|nullable',
            'available_until' => 'sometimes|date|after_or_equal:today',
            'notes' => 'sometimes|nullable|string|max:2000',
        ];
    }
}
