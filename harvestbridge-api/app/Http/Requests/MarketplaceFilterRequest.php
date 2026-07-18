<?php

namespace App\Http\Requests;

use App\Models\Crop;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MarketplaceFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'search' => 'nullable|string|max:255',

            'latitude' => 'nullable|numeric',

            'longitude' => 'nullable|numeric',

            'radius' => 'nullable|numeric|min:1|max:200',

            'crop_name' => 'nullable|string|max:255',

            'farmer_name' => 'nullable|string|max:255',

            'farm_name' => 'nullable|string|max:255',

            'district' => 'nullable|string|max:255',

            'description' => 'nullable|string|max:1000',

            'min_price' => 'nullable|numeric|min:0',

            'max_price' => 'nullable|numeric|min:0',

            'quality_grade' => 'nullable|string|max:50',

            'crop_category' => [
                'nullable',
                'string',
                'max:100',
                Rule::in(Crop::supportedCategories()),
            ],

            'harvest_date' => 'nullable|date',

            'available_until' => 'nullable|date',

            'featured' => 'nullable|boolean',

            'status' => [
                'nullable',
                'string',
                Rule::in([
                    'available',
                ]),
            ],

            'unit' => 'nullable|string|max:20',

            'per_page' => 'nullable|integer|min:1|max:50',

            'sort' => [
                'nullable',
                'string',
                Rule::in([
                    'latest',
                    'newest',
                    'oldest',
                    'price_low',
                    'lowest_price',
                    'price_high',
                    'highest_price',
                    'distance',
                    'availability',
                    'quality_grade',
                    'featured',
                    'featured_first',
                    'harvest_date',
                    'alphabetical',
                ]),
            ],

        ];
    }

    public function after(): array
    {
        return [
            function ($validator) {
                $minPrice = $this->input('min_price');
                $maxPrice = $this->input('max_price');

                if (
                    $minPrice !== null
                    && $maxPrice !== null
                    && (float) $minPrice > (float) $maxPrice
                ) {
                    $validator->errors()->add(
                        'max_price',
                        'The maximum price must be greater than or equal to the minimum price.'
                    );
                }

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

    protected function prepareForValidation(): void
    {
        if ($this->filled('crop_category')) {
            $this->merge([
                'crop_category' => Crop::normalizeCategory($this->input('crop_category')),
            ]);
        }
    }
}
