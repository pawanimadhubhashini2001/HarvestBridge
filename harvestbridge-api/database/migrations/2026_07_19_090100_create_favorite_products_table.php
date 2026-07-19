<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('favorite_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->foreignId('harvest_listing_id')
                ->constrained('harvest_listings')
                ->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'harvest_listing_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('favorite_products');
    }
};
