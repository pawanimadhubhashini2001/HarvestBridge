<?php

namespace App\Http\Requests;

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

            'crop_name' => 'nullable|string|max:255',

            'farmer_name' => 'nullable|string|max:255',

            'farm_name' => 'nullable|string|max:255',

            'district' => 'nullable|string|max:255',

            'description' => 'nullable|string|max:1000',

            'min_price' => 'nullable|numeric|min:0',

            'max_price' => 'nullable|numeric|min:0',

            'quality_grade' => 'nullable|string|max:50',

            'crop_category' => 'nullable|string|max:100',

            'harvest_date' => 'nullable|date',

            'available_until' => 'nullable|date',

            'featured' => 'nullable|boolean',

            'status' => [
                'nullable',
                'string',
                Rule::in([
                    'available',
                    'reserved',
                    'sold',
                    'expired',
                    'donated',
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
            },
        ];
    }
}
