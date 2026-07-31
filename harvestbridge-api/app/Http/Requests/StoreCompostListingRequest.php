<?php

namespace App\Http\Requests;

use App\Models\Crop;
use Illuminate\Foundation\Http\FormRequest;

class StoreCompostListingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'harvest_listing_id' =>
                'nullable|exists:harvest_listings,id',
            'waste_type' =>
                'required|string|max:255',
            'crop_category' =>
                'required|string|max:100',
            'quantity' =>
                'required|numeric|min:1',
            'unit' =>
                'required|string|max:20',
            'price_per_unit' =>
                'nullable|numeric|min:0',
            'pickup_location' =>
                'required|string|max:255',
            'available_from' =>
                'required|date',
            'available_until' =>
                'nullable|date|after_or_equal:available_from',
            'description' =>
                'required|string|max:2000',
            'images' =>
                ['nullable', 'array', 'min:1', 'max:5'],
            'images.*' =>
                ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'notes' =>
                'nullable|string|max:2000',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('crop_category')) {
            $this->merge([
                'crop_category' => Crop::normalizeCategory($this->input('crop_category')),
            ]);
        }
    }
}
