<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStoryFeedRequest extends FormRequest
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
            'sort' => [
                'nullable',
                'string',
                Rule::in([
                    'distance',
                    'newest',
                ]),
            ],
            'per_page' => 'nullable|integer|min:1|max:50',
        ];
    }

    public function after(): array
    {
        return [
            function ($validator) {
                $latitude = $this->input('latitude');
                $longitude = $this->input('longitude');
                $radius = $this->input('radius');
                $sort = $this->input('sort');

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

                if ($sort === 'distance' && ($latitude === null || $longitude === null)) {
                    $validator->errors()->add(
                        'sort',
                        'Distance sorting requires latitude and longitude.'
                    );
                }
            },
        ];
    }
}
