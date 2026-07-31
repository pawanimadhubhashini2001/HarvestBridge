<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pre_order_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farmer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('farm_id')->constrained('farms')->cascadeOnDelete();
            $table->foreignId('crop_id')->nullable()->constrained('crops')->nullOnDelete();
            $table->string('crop_name')->nullable();
            $table->string('crop_category')->nullable();
            $table->text('description')->nullable();
            $table->decimal('expected_quantity', 10, 2);
            $table->decimal('available_quantity', 10, 2);
            $table->decimal('reserved_quantity', 10, 2)->default(0);
            $table->decimal('fulfilled_quantity', 10, 2)->default(0);
            $table->string('unit')->default('kg');
            $table->decimal('price_per_unit', 10, 2);
            $table->string('quality_grade')->nullable();
            $table->date('expected_harvest_date');
            $table->date('order_deadline')->nullable();
            $table->string('status')->default('open');
            $table->timestamps();

            $table->index(['status', 'expected_harvest_date']);
            $table->index(['farmer_id', 'farm_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pre_order_products');
    }
};
