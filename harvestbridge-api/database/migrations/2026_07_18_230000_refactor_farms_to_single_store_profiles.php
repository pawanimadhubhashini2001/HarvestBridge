<?php

use App\Models\Farm;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('farms')
            ->where('business_status', 'active')
            ->update(['business_status' => Farm::BUSINESS_STATUS_OPEN]);

        DB::table('farms')
            ->where('business_status', 'inactive')
            ->update(['business_status' => Farm::BUSINESS_STATUS_CLOSED]);

        Schema::table('farms', function (Blueprint $table) {
            $table->decimal('farm_size', 8, 2)->nullable()->change();
            $table->enum('farm_size_unit', ['acres', 'hectares'])->nullable()->change();
            $table->enum('soil_type', ['Clay', 'Loam', 'Sandy', 'Silt', 'Peat', 'Chalk'])->nullable()->change();
            $table->enum('irrigation_method', ['Rain Fed', 'Canal', 'Tube Well', 'Drip', 'Sprinkler'])->nullable()->change();
            $table->string('business_status', 50)->default(Farm::BUSINESS_STATUS_OPEN)->change();
        });
    }

    public function down(): void
    {
        DB::table('farms')
            ->where('business_status', Farm::BUSINESS_STATUS_OPEN)
            ->update(['business_status' => 'active']);

        DB::table('farms')
            ->where('business_status', Farm::BUSINESS_STATUS_CLOSED)
            ->update(['business_status' => 'inactive']);

        Schema::table('farms', function (Blueprint $table) {
            $table->decimal('farm_size', 8, 2)->nullable(false)->change();
            $table->enum('farm_size_unit', ['acres', 'hectares'])->nullable(false)->change();
            $table->enum('soil_type', ['Clay', 'Loam', 'Sandy', 'Silt', 'Peat', 'Chalk'])->nullable(false)->change();
            $table->enum('irrigation_method', ['Rain Fed', 'Canal', 'Tube Well', 'Drip', 'Sprinkler'])->nullable()->change();
            $table->string('business_status', 50)->default('active')->change();
        });
    }
};
