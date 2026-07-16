<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCompostRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'compost_listing_id' =>

            'required|exists:compost_listings,id',

            'pickup_date' =>

            'required|date',

            'pickup_time' =>

            'required',

            'notes' =>

            'nullable|string'

        ];
    }
}
