<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prediction_histories', function (Blueprint $table) {

            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('district');

            $table->string('season');

            $table->string('soil_type');

            $table->decimal('temperature',5,2);

            $table->decimal('rainfall',8,2);

            $table->decimal('humidity',5,2);

            $table->decimal('ph',4,2);

            $table->string('previous_crop')->nullable();

            $table->decimal('previous_yield',8,2)->nullable();

            $table->string('market_demand');

            $table->string('recommended_crop');

            $table->decimal('confidence',5,4);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prediction_histories');
    }
};
