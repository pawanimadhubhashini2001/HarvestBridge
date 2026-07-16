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
        Schema::create('harvest_listings', function (Blueprint $table) {

            $table->id();

            /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('farm_id')
                ->constrained('farms')
                ->cascadeOnDelete();

            $table->foreignId('crop_id')
                ->constrained('crops')
                ->cascadeOnDelete();

            /*
    |--------------------------------------------------------------------------
    | Harvest Information
    |--------------------------------------------------------------------------
    */

            $table->decimal('quantity', 10, 2);

            $table->string('unit')->default('kg');

            $table->decimal('price_per_unit', 10, 2);

            /*
    |--------------------------------------------------------------------------
    | Quality
    |--------------------------------------------------------------------------
    */

            $table->string('quality_grade')->nullable();

            /*
    |--------------------------------------------------------------------------
    | Dates
    |--------------------------------------------------------------------------
    */

            $table->date('harvest_date');

            $table->date('available_until')->nullable();

            /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

            $table->enum('status', [
                'available',
                'reserved',
                'sold',
                'expired',
                'donated'
            ])->default('available');

            /*
    |--------------------------------------------------------------------------
    | Description
    |--------------------------------------------------------------------------
    */

            $table->text('description')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('harvest_listings');
    }
};
