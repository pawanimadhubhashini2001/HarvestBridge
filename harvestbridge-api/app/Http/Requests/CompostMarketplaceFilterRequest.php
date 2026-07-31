<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CompostMarketplaceFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'radius' => 'nullable|numeric|min:1|max:200',
            'waste_type' => 'nullable|string|max:255',
            'pickup_location' => 'nullable|string|max:255',
            'date' => 'nullable|date',
        ];
    }

    public function after(): array
    {
        return [
            function ($validator) {
                $latitude = $this->input('latitude');
                $longitude = $this->input('longitude');
                $radius = $this->input('radius');

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

                if ($radius !== null && ($latitude === null || $longitude === null)) {
                    $validator->errors()->add(
                        'radius',
                        'Radius may only be used when latitude and longitude are provided.'
                    );
                }
            },
        ];
    }
}
