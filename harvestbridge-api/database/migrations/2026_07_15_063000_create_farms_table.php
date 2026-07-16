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
        Schema::create('farms', function (Blueprint $table) {

            $table->id();

            // Farm owner
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Farm details
            $table->string('farm_name');

            $table->decimal('farm_size', 8, 2);

            $table->enum('farm_size_unit', [
                'acres',
                'hectares'
            ])->default('acres');

            // Location
            $table->string('district');

            $table->text('address')->nullable();

            $table->decimal('latitude', 10, 7)->nullable();

            $table->decimal('longitude', 10, 7)->nullable();

            // Soil
            $table->enum('soil_type', [
                'Clay',
                'Loam',
                'Sandy',
                'Silt',
                'Peat',
                'Chalk'
            ]);

            // Water
            $table->enum('irrigation_method', [
                'Rain Fed',
                'Canal',
                'Tube Well',
                'Drip',
                'Sprinkler'
            ])->nullable();

            // Extra Information
            $table->text('description')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('farms');
    }
};
