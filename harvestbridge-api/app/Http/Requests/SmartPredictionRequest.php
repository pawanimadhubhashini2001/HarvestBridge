<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SmartPredictionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'District' => 'required|string',

            'Plant_Month' => 'required|string',

            'pH' => 'required|numeric|min:0|max:14',

        ];
    }
}
