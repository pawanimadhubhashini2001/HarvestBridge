<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_stories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farm_id')
                ->constrained('farms')
                ->cascadeOnDelete();
            $table->string('media_type', 20);
            $table->string('media_path');
            $table->string('caption', 500)->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->index(['farm_id', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_stories');
    }
};
