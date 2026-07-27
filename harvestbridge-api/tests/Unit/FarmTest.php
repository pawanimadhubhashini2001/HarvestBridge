<?php

namespace Tests\Unit;

use App\Models\Farm;
use App\Models\HarvestListing;
use Illuminate\Database\Eloquent\Collection;
use PHPUnit\Framework\TestCase;

class FarmTest extends TestCase
{
    public function test_active_crop_count_includes_free_text_crop_names(): void
    {
        $farm = new Farm;
        $farm->setRelation('activeHarvestListings', new Collection([
            new HarvestListing([
                'crop_id' => null,
                'crop_name' => 'Rice',
            ]),
            new HarvestListing([
                'crop_id' => null,
                'crop_name' => ' rice ',
            ]),
            new HarvestListing([
                'crop_id' => null,
                'crop_name' => 'Tomato',
            ]),
        ]));

        $this->assertSame(2, $farm->activeCropCount());
    }

    public function test_active_crop_count_deduplicates_crop_ids(): void
    {
        $farm = new Farm;
        $farm->setRelation('activeHarvestListings', new Collection([
            new HarvestListing([
                'crop_id' => 1,
                'crop_name' => 'Rice',
            ]),
            new HarvestListing([
                'crop_id' => 1,
                'crop_name' => 'Rice',
            ]),
            new HarvestListing([
                'crop_id' => 2,
                'crop_name' => 'Tomato',
            ]),
        ]));

        $this->assertSame(2, $farm->activeCropCount());
    }
}
