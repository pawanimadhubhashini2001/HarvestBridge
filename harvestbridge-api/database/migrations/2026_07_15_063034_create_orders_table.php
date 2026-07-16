<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {

            $table->id();

            /*
    |--------------------------------------------------------------------------
    | Customer
    |--------------------------------------------------------------------------
    */

            $table->foreignId('consumer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            /*
    |--------------------------------------------------------------------------
    | Order Information
    |--------------------------------------------------------------------------
    */

            $table->decimal('total_amount', 10, 2);

            $table->string('payment_method')->nullable();

            $table->string('payment_status')->default('pending');

            $table->string('order_status')->default('pending');

            /*
    |--------------------------------------------------------------------------
    | Delivery
    |--------------------------------------------------------------------------
    */

            $table->text('delivery_address');

            $table->date('delivery_date')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
