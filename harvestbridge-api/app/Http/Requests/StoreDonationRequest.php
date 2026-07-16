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

            'pickup_date' =>

                'nullable|date',

            'pickup_time' =>

                'nullable',

            'notes' =>

                'nullable|string'

        ];
    }
}
