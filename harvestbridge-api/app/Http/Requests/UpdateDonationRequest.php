<?php

namespace App\Http\Requests;

use App\Models\Crop;
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
            'harvest_listing_id' => 'sometimes|nullable|required_without:crop_name|exists:harvest_listings,id',
            'crop_name' => 'sometimes|nullable|required_without:harvest_listing_id|string|max:255',
            'crop_category' => 'sometimes|nullable|string|max:100',
            'quantity' => 'sometimes|numeric|min:0.01',
            'unit' => 'sometimes|string|max:20',
            'price_per_unit' => 'sometimes|nullable|numeric|min:0',
            'description' => 'sometimes|string|max:2000',
            'pickup_location' => 'sometimes|string|max:255',
            'pickup_date' => 'sometimes|nullable|date',
            'pickup_time' => 'sometimes|nullable',
            'available_until' => 'sometimes|date|after_or_equal:today',
            'notes' => 'sometimes|nullable|string|max:2000',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('crop_name')) {
            $this->merge([
                'crop_name' => trim((string) $this->input('crop_name')),
            ]);
        }

        if ($this->filled('crop_category')) {
            $this->merge([
                'crop_category' => Crop::normalizeCategory($this->input('crop_category')),
            ]);
        }
    }
}
