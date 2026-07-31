<?php

namespace App\Http\Requests;

use App\Models\Farm;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFarmRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'farm_name' => 'sometimes|nullable|string|max:255',

            'store_name' => 'sometimes|nullable|string|max:255',

            'district' => 'sometimes|required|string|max:100',

            'address' => 'sometimes|required|string',

            'latitude' => 'sometimes|nullable|numeric',

            'longitude' => 'sometimes|nullable|numeric',

            'farm_size' => 'sometimes|nullable|numeric|min:0.1',

            'farm_size_unit' => 'sometimes|nullable|in:acres,hectares',

            'soil_type' => [
                'sometimes',
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
                'sometimes',
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

            'store_description' => 'sometimes|nullable|string',

            'store_image' => 'sometimes|nullable|image|mimes:jpg,jpeg,png,webp|max:2048',

            'store_logo' => 'sometimes|nullable|image|mimes:jpg,jpeg,png,webp|max:2048',

            'store_cover_image' => 'sometimes|nullable|image|mimes:jpg,jpeg,png,webp|max:4096',

            'phone_number' => 'sometimes|nullable|string|max:30',

            'whatsapp_number' => 'sometimes|nullable|string|max:30',

            'email' => 'sometimes|nullable|email|max:255',

            'business_hours' => 'sometimes|nullable|string|max:1000',

            'business_status' => [
                'sometimes',
                'string',
                Rule::in(Farm::businessStatuses()),
            ],

            'description' => 'sometimes|nullable|string'

        ];
    }

    public function after(): array
    {
        return [
            function ($validator) {
                $hasLatitude = $this->exists('latitude');
                $hasLongitude = $this->exists('longitude');
                $latitude = $this->input('latitude');
                $longitude = $this->input('longitude');

                if ($hasLatitude xor $hasLongitude) {
                    $validator->errors()->add(
                        'coordinates',
                        'Latitude and longitude must be updated together.'
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
