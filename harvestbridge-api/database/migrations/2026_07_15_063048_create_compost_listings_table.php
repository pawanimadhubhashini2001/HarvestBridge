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
        Schema::create('compost_listings', function (Blueprint $table) {

            $table->id();

            /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

            $table->foreignId('farmer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Optional link to a harvest listing
            $table->foreignId('harvest_listing_id')
                ->nullable()
                ->constrained('harvest_listings')
                ->nullOnDelete();

            /*
    |--------------------------------------------------------------------------
    | Waste Details
    |--------------------------------------------------------------------------
    */

            $table->string('waste_type');

            $table->decimal('quantity', 10, 2);

            $table->string('unit')->default('kg');

            /*
    |--------------------------------------------------------------------------
    | Pickup Information
    |--------------------------------------------------------------------------
    */

            $table->string('pickup_location');

            $table->date('available_from');

            $table->date('available_until')->nullable();

            /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

            $table->enum('status', [
                'available',
                'requested',
                'reserved',
                'collected',
                'completed',
                'cancelled'
            ])->default('available');

            /*
    |--------------------------------------------------------------------------
    | Notes
    |--------------------------------------------------------------------------
    */

            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('compost_listings');
    }
};
