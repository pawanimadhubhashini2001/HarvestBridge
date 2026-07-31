<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStoreLocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'district' => 'required|string|max:100',
            'address' => 'required|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
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
