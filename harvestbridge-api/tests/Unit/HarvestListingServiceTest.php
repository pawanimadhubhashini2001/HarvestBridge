<?php

namespace Tests\Unit;

use App\Models\HarvestListing;
use App\Services\HarvestListingService;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

class HarvestListingServiceTest extends TestCase
{
    public function test_partially_reserved_listing_stays_available_when_stock_remains(): void
    {
        $this->assertSame(
            HarvestListing::STATUS_AVAILABLE,
            $this->determineStockStatus(
                totalQuantity: 1000,
                availableQuantity: 900,
                reservedQuantity: 100,
                soldQuantity: 0,
                currentStatus: HarvestListing::STATUS_AVAILABLE,
            )
        );
    }

    public function test_fully_reserved_listing_is_reserved_until_order_completion(): void
    {
        $this->assertSame(
            HarvestListing::STATUS_RESERVED,
            $this->determineStockStatus(
                totalQuantity: 1000,
                availableQuantity: 0,
                reservedQuantity: 1000,
                soldQuantity: 0,
                currentStatus: HarvestListing::STATUS_AVAILABLE,
            )
        );
    }

    public function test_listing_without_available_or_reserved_stock_is_sold(): void
    {
        $this->assertSame(
            HarvestListing::STATUS_SOLD,
            $this->determineStockStatus(
                totalQuantity: 1000,
                availableQuantity: 0,
                reservedQuantity: 0,
                soldQuantity: 1000,
                currentStatus: HarvestListing::STATUS_AVAILABLE,
            )
        );
    }

    private function determineStockStatus(
        float $totalQuantity,
        float $availableQuantity,
        float $reservedQuantity,
        float $soldQuantity,
        string $currentStatus
    ): string {
        $method = new ReflectionMethod(HarvestListingService::class, 'determineStockStatus');

        return $method->invoke(
            new HarvestListingService,
            $totalQuantity,
            $availableQuantity,
            $reservedQuantity,
            $soldQuantity,
            null,
            $currentStatus
        );
    }
}
