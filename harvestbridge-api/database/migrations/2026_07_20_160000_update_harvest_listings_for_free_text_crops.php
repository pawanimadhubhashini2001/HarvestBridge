<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('harvest_listings', function (Blueprint $table) {
            $table->dropForeign(['crop_id']);

            $table->foreignId('crop_id')
                ->nullable()
                ->change();

            $table->string('crop_name')
                ->nullable()
                ->after('crop_id');

            $table->string('crop_category')
                ->nullable()
                ->after('crop_name');

            $table->foreign('crop_id')
                ->references('id')
                ->on('crops')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('harvest_listings', function (Blueprint $table) {
            $table->dropForeign(['crop_id']);
            $table->dropColumn(['crop_name', 'crop_category']);

            $table->foreignId('crop_id')
                ->nullable(false)
                ->change();

            $table->foreign('crop_id')
                ->references('id')
                ->on('crops')
                ->cascadeOnDelete();
        });
    }
};
