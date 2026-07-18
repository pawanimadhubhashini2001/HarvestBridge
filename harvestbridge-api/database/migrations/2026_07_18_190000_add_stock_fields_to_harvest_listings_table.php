<?php

use App\Models\HarvestListing;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('harvest_listings', function (Blueprint $table) {
            $table->decimal('available_quantity', 10, 2)
                ->default(0)
                ->after('quantity');
            $table->decimal('reserved_quantity', 10, 2)
                ->default(0)
                ->after('available_quantity');
            $table->decimal('sold_quantity', 10, 2)
                ->default(0)
                ->after('reserved_quantity');
        });

        DB::table('harvest_listings')->update([
            'available_quantity' => DB::raw('quantity'),
            'reserved_quantity' => 0,
            'sold_quantity' => 0,
        ]);

        DB::table('harvest_listings')
            ->whereNotNull('available_until')
            ->whereDate('available_until', '<', now()->toDateString())
            ->whereIn('status', [
                HarvestListing::STATUS_AVAILABLE,
                HarvestListing::STATUS_RESERVED,
            ])
            ->update([
                'status' => HarvestListing::STATUS_EXPIRED,
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('harvest_listings', function (Blueprint $table) {
            $table->dropColumn([
                'available_quantity',
                'reserved_quantity',
                'sold_quantity',
            ]);
        });
    }
};
