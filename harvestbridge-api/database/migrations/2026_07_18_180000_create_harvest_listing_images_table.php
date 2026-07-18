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
        Schema::create('harvest_listing_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('harvest_listing_id')
                ->constrained('harvest_listings')
                ->cascadeOnDelete();
            $table->string('image_path');
            $table->unsignedInteger('sort_order')->default(1);
            $table->timestamps();

            $table->index(['harvest_listing_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('harvest_listing_images');
    }
};
