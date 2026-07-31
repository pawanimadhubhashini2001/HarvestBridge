<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('compost_listings', function (Blueprint $table) {
            $table->timestamp('collected_at')->nullable()->after('available_until');
        });
    }

    public function down(): void
    {
        Schema::table('compost_listings', function (Blueprint $table) {
            $table->dropColumn('collected_at');
        });
    }
};
