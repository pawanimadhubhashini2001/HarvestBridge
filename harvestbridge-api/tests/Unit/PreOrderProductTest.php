<?php

namespace Tests\Unit;

use App\Models\PreOrderProduct;
use Tests\TestCase;

class PreOrderProductTest extends TestCase
{
    public function test_open_product_with_stock_accepts_requests(): void
    {
        $product = new PreOrderProduct([
            'status' => PreOrderProduct::STATUS_OPEN,
            'available_quantity' => 50,
            'order_deadline' => now()->addDay()->toDateString(),
        ]);

        $this->assertTrue($product->isOpenForRequests());
    }

    public function test_product_after_deadline_does_not_accept_requests(): void
    {
        $product = new PreOrderProduct([
            'status' => PreOrderProduct::STATUS_OPEN,
            'available_quantity' => 50,
            'order_deadline' => now()->subDay()->toDateString(),
        ]);

        $this->assertFalse($product->isOpenForRequests());
    }
}
