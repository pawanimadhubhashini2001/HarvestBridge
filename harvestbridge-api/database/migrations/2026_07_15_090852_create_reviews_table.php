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
        Schema::create('reviews', function (Blueprint $table) {

            $table->id();

            /*
    |--------------------------------------------------------------------------
    | Reviewer
    |--------------------------------------------------------------------------
    */

            $table->foreignId('reviewer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            /*
    |--------------------------------------------------------------------------
    | Review Target
    |--------------------------------------------------------------------------
    */

            $table->foreignId('reviewed_user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            /*
    |--------------------------------------------------------------------------
    | Related Order (Optional)
    |--------------------------------------------------------------------------
    */

            $table->foreignId('order_id')
                ->nullable()
                ->constrained('orders')
                ->nullOnDelete();

            /*
    |--------------------------------------------------------------------------
    | Rating
    |--------------------------------------------------------------------------
    */

            $table->unsignedTinyInteger('rating');

            /*
    |--------------------------------------------------------------------------
    | Review
    |--------------------------------------------------------------------------
    */

            $table->text('comment')->nullable();

            /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

            $table->boolean('is_visible')->default(true);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
