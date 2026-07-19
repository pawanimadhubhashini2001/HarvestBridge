<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCompostListingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'harvest_listing_id' => 'sometimes|nullable|exists:harvest_listings,id',
            'waste_type' => 'sometimes|string|max:255',
            'quantity' => 'sometimes|numeric|min:1',
            'unit' => 'sometimes|string|max:20',
            'pickup_location' => 'sometimes|string|max:255',
            'available_from' => 'sometimes|date',
            'available_until' => 'sometimes|nullable|date',
            'description' => 'sometimes|string|max:2000',
            'images' => ['sometimes', 'array', 'min:1', 'max:5'],
            'images.*' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'notes' => 'sometimes|nullable|string|max:2000',
        ];
    }

    public function after(): array
    {
        return [
            function ($validator) {
                $existingListing = $this->route('compostListing');
                $availableFrom = $this->input('available_from')
                    ?? $existingListing?->available_from?->toDateString();
                $availableUntil = $this->input('available_until');

                if (
                    $availableFrom !== null
                    && $availableUntil !== null
                    && strtotime((string) $availableUntil) < strtotime((string) $availableFrom)
                ) {
                    $validator->errors()->add(
                        'available_until',
                        'The available until date must be after or equal to the available from date.'
                    );
                }
            },
        ];
    }
}
