<?php

namespace App\Http\Requests;

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
            'quantity' =>
                'required|numeric|min:1',
            'unit' =>
                'required|string|max:20',
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
}
