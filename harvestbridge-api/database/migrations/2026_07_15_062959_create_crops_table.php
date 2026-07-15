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
        Schema::create('crops', function (Blueprint $table) {

            $table->id();

            // Basic Information
            $table->string('name')->unique();

            $table->string('category');

            $table->text('description')->nullable();

            // Growing Information
            $table->string('growing_season');

            $table->string('ideal_soil');

            $table->decimal('ideal_temperature_min', 5, 2);

            $table->decimal('ideal_temperature_max', 5, 2);

            $table->decimal('ideal_rainfall_min', 8, 2);

            $table->decimal('ideal_rainfall_max', 8, 2);

            $table->integer('average_growth_days');

            // Status
            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crops');
    }
};
