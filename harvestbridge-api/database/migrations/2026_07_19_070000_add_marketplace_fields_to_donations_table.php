<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            $table->text('description')->nullable()->after('unit');
            $table->string('pickup_location')->nullable()->after('description');
            $table->date('available_until')->nullable()->after('pickup_time');
        });
    }

    public function down(): void
    {
        Schema::table('donations', function (Blueprint $table) {
            $table->dropColumn([
                'description',
                'pickup_location',
                'available_until',
            ]);
        });
    }
};
