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
        Schema::create('predictions', function (Blueprint $table) {

            $table->id();

            /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

            $table->foreignId('farmer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('farm_id')
                ->constrained('farms')
                ->cascadeOnDelete();

            $table->foreignId('recommended_crop_id')
                ->constrained('crops')
                ->cascadeOnDelete();

            /*
    |--------------------------------------------------------------------------
    | AI Inputs
    |--------------------------------------------------------------------------
    */

            $table->string('season');

            $table->string('soil_type');

            $table->decimal('temperature', 5, 2);

            $table->decimal('rainfall', 8, 2);

            $table->decimal('humidity', 5, 2);

            $table->decimal('ph', 4, 2);

            $table->string('previous_crop')->nullable();

            $table->decimal('previous_yield', 10, 2)->nullable();

            $table->string('market_demand');

            /*
    |--------------------------------------------------------------------------
    | AI Output
    |--------------------------------------------------------------------------
    */

            $table->decimal('confidence_score', 5, 2);

            /*
    |--------------------------------------------------------------------------
    | Metadata
    |--------------------------------------------------------------------------
    */

            $table->string('model_version')->default('1.0');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('predictions');
    }
};
