<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            $table->decimal('price_per_unit', 10, 2)
                ->nullable()
                ->after('unit');
        });

        Schema::table('compost_listings', function (Blueprint $table) {
            $table->decimal('price_per_unit', 10, 2)
                ->nullable()
                ->after('unit');
        });
    }

    public function down(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            $table->dropColumn('price_per_unit');
        });

        Schema::table('compost_listings', function (Blueprint $table) {
            $table->dropColumn('price_per_unit');
        });
    }
};
