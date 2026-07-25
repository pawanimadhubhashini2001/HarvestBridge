<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('compost_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('compost_requests', 'pickup_date')) {
                $table->date('pickup_date')->nullable()->after('quantity');
            }

            if (! Schema::hasColumn('compost_requests', 'pickup_time')) {
                $table->time('pickup_time')->nullable()->after('pickup_date');
            }

            if (! Schema::hasColumn('compost_requests', 'notes')) {
                $table->text('notes')->nullable()->after('pickup_time');
            }
        });
    }

    public function down(): void
    {
        Schema::table('compost_requests', function (Blueprint $table) {
            foreach (['notes', 'pickup_time', 'pickup_date'] as $column) {
                if (Schema::hasColumn('compost_requests', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
