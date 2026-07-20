<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('donation_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('donation_id')
                ->constrained('donations')
                ->cascadeOnDelete();
            $table->string('image_path');
            $table->unsignedInteger('sort_order')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('donation_images');
    }
};
