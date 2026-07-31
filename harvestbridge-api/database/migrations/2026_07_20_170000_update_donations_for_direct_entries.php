<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            $table->dropForeign(['harvest_listing_id']);

            $table->foreignId('harvest_listing_id')
                ->nullable()
                ->change();

            $table->string('crop_name')
                ->nullable()
                ->after('harvest_listing_id');

            $table->string('crop_category')
                ->nullable()
                ->after('crop_name');

            $table->foreign('harvest_listing_id')
                ->references('id')
                ->on('harvest_listings')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            $table->dropForeign(['harvest_listing_id']);
            $table->dropColumn(['crop_name', 'crop_category']);

            $table->foreignId('harvest_listing_id')
                ->nullable(false)
                ->change();

            $table->foreign('harvest_listing_id')
                ->references('id')
                ->on('harvest_listings')
                ->cascadeOnDelete();
        });
    }
};
