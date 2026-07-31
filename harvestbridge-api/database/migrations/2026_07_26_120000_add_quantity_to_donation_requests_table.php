<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('donation_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('donation_requests', 'quantity')) {
                $table->decimal('quantity', 10, 2)
                    ->nullable()
                    ->after('ngo_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('donation_requests', function (Blueprint $table) {
            if (Schema::hasColumn('donation_requests', 'quantity')) {
                $table->dropColumn('quantity');
            }
        });
    }
};
