<?php

namespace App\Http\Requests;

use App\Models\Crop;
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
                'nullable|required_without:crop_name|exists:harvest_listings,id',
            'crop_name' =>
                'nullable|required_without:harvest_listing_id|string|max:255',
            'crop_category' =>
                'nullable|string|max:100',
            'quantity' =>
                'required|numeric|min:0.01',
            'unit' =>
                'required|string|max:20',
            'price_per_unit' =>
                'nullable|numeric|min:0',
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
