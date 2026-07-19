<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('farms', function (Blueprint $table) {
            $table->boolean('is_suspended')
                ->default(false)
                ->after('business_status');
        });

        Schema::table('store_stories', function (Blueprint $table) {
            $table->boolean('is_hidden')
                ->default(false)
                ->after('caption');
        });
    }

    public function down(): void
    {
        Schema::table('store_stories', function (Blueprint $table) {
            $table->dropColumn('is_hidden');
        });

        Schema::table('farms', function (Blueprint $table) {
            $table->dropColumn('is_suspended');
        });
    }
};
