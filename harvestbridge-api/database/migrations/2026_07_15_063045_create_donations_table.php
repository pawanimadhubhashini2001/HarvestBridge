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
        Schema::create('donations', function (Blueprint $table) {

            $table->id();

            /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

            // Farmer who created the donation
            $table->foreignId('farmer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Harvest listing being donated
            $table->foreignId('harvest_listing_id')
                ->unique()
                ->constrained('harvest_listings')
                ->cascadeOnDelete();

            // NGO that accepts the donation
            $table->foreignId('ngo_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            /*
    |--------------------------------------------------------------------------
    | Donation Information
    |--------------------------------------------------------------------------
    */

            $table->decimal('quantity', 10, 2);

            $table->string('unit')->default('kg');

            /*
    |--------------------------------------------------------------------------
    | Pickup
    |--------------------------------------------------------------------------
    */

            $table->date('pickup_date')->nullable();

            $table->time('pickup_time')->nullable();

            /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

            $table->enum('status', [
                'available',
                'requested',
                'approved',
                'picked_up',
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
        Schema::dropIfExists('donations');
    }
};
