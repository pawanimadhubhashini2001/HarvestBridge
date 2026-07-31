<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('farms', function (Blueprint $table) {
            $table->string('store_logo_path')->nullable();
            $table->string('store_cover_image_path')->nullable();
            $table->string('phone_number', 30)->nullable();
            $table->string('whatsapp_number', 30)->nullable();
            $table->string('email')->nullable();
            $table->text('business_hours')->nullable();
            $table->string('business_status', 50)->default('active');
        });
    }

    public function down(): void
    {
        Schema::table('farms', function (Blueprint $table) {
            $table->dropColumn([
                'store_logo_path',
                'store_cover_image_path',
                'phone_number',
                'whatsapp_number',
                'email',
                'business_hours',
                'business_status',
            ]);
        });
    }
};
