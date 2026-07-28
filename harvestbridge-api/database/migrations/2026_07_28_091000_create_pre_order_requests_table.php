<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pre_order_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pre_order_product_id')
                ->constrained('pre_order_products')
                ->cascadeOnDelete();
            $table->foreignId('consumer_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('quantity', 10, 2);
            $table->decimal('price', 10, 2);
            $table->decimal('subtotal', 10, 2);
            $table->date('preferred_pickup_date')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('pending');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('ready_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['consumer_id', 'status']);
            $table->index(['pre_order_product_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pre_order_requests');
    }
};
