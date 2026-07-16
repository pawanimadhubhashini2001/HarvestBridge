<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDonationRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'donation_id' =>

                'required|exists:donations,id',

            'message' =>

                'nullable|string|max:1000'

        ];
    }
}
