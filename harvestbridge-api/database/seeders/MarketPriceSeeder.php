<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Crop;
use App\Models\MarketPrice;

class MarketPriceSeeder extends Seeder
{
    public function run(): void
    {
        $prices = [
            [
                'crop' => 'Rice',
                'price_per_unit' => 180,
                'market_name' => 'Dambulla',
                'district' => 'Matale',
            ],
            [
                'crop' => 'Maize',
                'price_per_unit' => 210,
                'market_name' => 'Dambulla',
                'district' => 'Matale',
            ],
            [
                'crop' => 'Tomato',
                'price_per_unit' => 320,
                'market_name' => 'Dambulla',
                'district' => 'Matale',
            ],
            [
                'crop' => 'Beans',
                'price_per_unit' => 450,
                'market_name' => 'Dambulla',
                'district' => 'Matale',
            ],
        ];

        foreach ($prices as $price) {

            $crop = Crop::where('name', $price['crop'])->first();

            if (!$crop) {
                continue;
            }

            MarketPrice::create([
                'crop_id'        => $crop->id,
                'market_name'    => $price['market_name'],
                'district'       => $price['district'],
                'price_per_unit' => $price['price_per_unit'],
                'unit'           => 'kg',
                'price_date'     => now(),
                'source'         => 'Department of Agriculture',
                'is_active'      => true,
            ]);
        }
    }
}
