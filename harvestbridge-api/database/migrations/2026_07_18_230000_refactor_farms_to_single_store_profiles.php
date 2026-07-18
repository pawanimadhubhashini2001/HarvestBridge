<?php

use App\Models\Farm;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

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

        DB::statement('ALTER TABLE farms ALTER COLUMN farm_size DROP NOT NULL');
        DB::statement('ALTER TABLE farms ALTER COLUMN farm_size_unit DROP NOT NULL');
        DB::statement('ALTER TABLE farms ALTER COLUMN farm_size_unit DROP DEFAULT');
        DB::statement('ALTER TABLE farms ALTER COLUMN soil_type DROP NOT NULL');
        DB::statement(sprintf(
            "ALTER TABLE farms ALTER COLUMN business_status SET DEFAULT '%s'",
            Farm::BUSINESS_STATUS_OPEN
        ));
    }

    public function down(): void
    {
        DB::table('farms')
            ->where('business_status', Farm::BUSINESS_STATUS_OPEN)
            ->update(['business_status' => 'active']);

        DB::table('farms')
            ->where('business_status', Farm::BUSINESS_STATUS_CLOSED)
            ->update(['business_status' => 'inactive']);

        DB::table('farms')
            ->whereNull('farm_size')
            ->update(['farm_size' => 0]);

        DB::table('farms')
            ->whereNull('farm_size_unit')
            ->update(['farm_size_unit' => 'acres']);

        DB::table('farms')
            ->whereNull('soil_type')
            ->update(['soil_type' => 'Loam']);

        DB::statement('ALTER TABLE farms ALTER COLUMN farm_size SET NOT NULL');
        DB::statement('ALTER TABLE farms ALTER COLUMN farm_size_unit SET DEFAULT \'acres\'');
        DB::statement('ALTER TABLE farms ALTER COLUMN farm_size_unit SET NOT NULL');
        DB::statement('ALTER TABLE farms ALTER COLUMN soil_type SET NOT NULL');
        DB::statement("ALTER TABLE farms ALTER COLUMN business_status SET DEFAULT 'active'");
    }
};
