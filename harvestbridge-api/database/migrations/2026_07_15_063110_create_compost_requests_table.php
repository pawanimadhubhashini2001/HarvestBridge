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
        Schema::create('compost_requests', function (Blueprint $table) {

            $table->id();

            /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

            $table->foreignId('compost_listing_id')
                ->constrained('compost_listings')
                ->cascadeOnDelete();

            $table->foreignId('business_id')
                ->constrained('users')
                ->cascadeOnDelete();

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
                'pending',
                'approved',
                'rejected',
                'completed'
            ])->default('pending');

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
        Schema::dropIfExists('compost_requests');
    }
};
