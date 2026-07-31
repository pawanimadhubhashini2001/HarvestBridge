<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('harvest_listings', function (Blueprint $table) {
            $table->boolean('is_featured')->default(false);
            $table->date('featured_until')->nullable();
            $table->index(
                ['is_featured', 'featured_until'],
                'harvest_listings_featured_lookup_index'
            );
        });
    }

    public function down(): void
    {
        Schema::table('harvest_listings', function (Blueprint $table) {
            $table->dropIndex('harvest_listings_featured_lookup_index');
            $table->dropColumn([
                'is_featured',
                'featured_until',
            ]);
        });
    }
};
