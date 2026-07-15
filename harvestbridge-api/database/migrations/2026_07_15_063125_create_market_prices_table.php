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
        Schema::create('market_prices', function (Blueprint $table) {

            $table->id();

            /*
    |--------------------------------------------------------------------------
    | Crop
    |--------------------------------------------------------------------------
    */

            $table->foreignId('crop_id')
                ->constrained('crops')
                ->cascadeOnDelete();

            /*
    |--------------------------------------------------------------------------
    | Market Information
    |--------------------------------------------------------------------------
    */

            $table->string('market_name');

            $table->string('district');

            /*
    |--------------------------------------------------------------------------
    | Price
    |--------------------------------------------------------------------------
    */

            $table->decimal('price_per_unit', 10, 2);

            $table->string('unit')->default('kg');

            /*
    |--------------------------------------------------------------------------
    | Date
    |--------------------------------------------------------------------------
    */

            $table->date('price_date');

            /*
    |--------------------------------------------------------------------------
    | Source
    |--------------------------------------------------------------------------
    */

            $table->string('source')->nullable();

            /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('market_prices');
    }
};
