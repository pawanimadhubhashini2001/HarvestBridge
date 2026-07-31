<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->foreignId('farm_id')
                ->nullable()
                ->after('reviewed_user_id')
                ->constrained('farms')
                ->cascadeOnDelete();

            $table->string('title', 120)
                ->nullable()
                ->after('rating');

            $table->unique(
                ['reviewer_id', 'farm_id'],
                'reviews_reviewer_id_farm_id_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropUnique('reviews_reviewer_id_farm_id_unique');
            $table->dropConstrainedForeignId('farm_id');
            $table->dropColumn('title');
        });
    }
};
