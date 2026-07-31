<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prediction_histories', function (Blueprint $table) {
            $table->decimal('ph', 4, 2)->nullable()->change();
            $table->string('market_demand')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('prediction_histories', function (Blueprint $table) {
            $table->decimal('ph', 4, 2)->nullable(false)->change();
            $table->string('market_demand')->nullable(false)->change();
        });
    }
};
