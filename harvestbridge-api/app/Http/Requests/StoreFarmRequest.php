<?php

namespace App\Http\Requests;

use App\Models\Farm;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFarmRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'farm_name' => 'nullable|string|max:255',

            'store_name' => 'required_without:farm_name|string|max:255',

            'district' => 'required|string|max:100',

            'address' => 'required|string',

            'latitude' => 'nullable|numeric',

            'longitude' => 'nullable|numeric',

            'farm_size' => 'nullable|numeric|min:0.1',

            'farm_size_unit' => 'nullable|in:acres,hectares',

            'soil_type' => [
                'nullable',
                'string',
                Rule::in([
                    'Clay',
                    'Loam',
                    'Sandy',
                    'Silt',
                    'Peat',
                    'Chalk',
                ]),
            ],

            'irrigation_method' => [
                'nullable',
                'string',
                Rule::in([
                    'Rain Fed',
                    'Canal',
                    'Tube Well',
                    'Drip',
                    'Sprinkler',
                ]),
            ],

            'description' => 'nullable|string',

            'store_description' => 'nullable|string',

            'store_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',

            'store_logo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',

            'store_cover_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',

            'phone_number' => 'required|string|max:30',

            'whatsapp_number' => 'nullable|string|max:30',

            'email' => 'nullable|email|max:255',

            'business_hours' => 'nullable|string|max:1000',

            'business_status' => [
                'sometimes',
                'string',
                Rule::in([
                    Farm::BUSINESS_STATUS_OPEN,
                    Farm::BUSINESS_STATUS_CLOSED,
                ]),
            ],

        ];
    }

    public function after(): array
    {
        return [
            function ($validator) {
                $latitude = $this->input('latitude');
                $longitude = $this->input('longitude');

                if (($latitude === null) xor ($longitude === null)) {
                    $validator->errors()->add(
                        'coordinates',
                        'Latitude and longitude must both be provided together.'
                    );
                }

                if ($latitude !== null && ((float) $latitude < -90 || (float) $latitude > 90)) {
                    $validator->errors()->add(
                        'latitude',
                        'Latitude must be between -90 and 90.'
                    );
                }

                if ($longitude !== null && ((float) $longitude < -180 || (float) $longitude > 180)) {
                    $validator->errors()->add(
                        'longitude',
                        'Longitude must be between -180 and 180.'
                    );
                }
            },
        ];
    }
}
