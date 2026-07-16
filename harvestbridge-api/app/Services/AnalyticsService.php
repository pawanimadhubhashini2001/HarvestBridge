<?php

namespace App\Services;

use App\Models\CompostListing;
use App\Models\CompostRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    public function compostAnalytics(User $user)
    {
        return [

            'total_listings' =>
            CompostListing::where(
                'farmer_id',
                $user->id
            )->count(),

            'available_listings' =>
            CompostListing::where(
                'farmer_id',
                $user->id
            )
                ->where('status', 'available')
                ->count(),

            'completed_listings' =>
            CompostListing::where(
                'farmer_id',
                $user->id
            )
                ->where('status', 'completed')
                ->count(),

            'total_requests' =>
            CompostRequest::whereHas(
                'compostListing',
                function ($query) use ($user) {
                    $query->where(
                        'farmer_id',
                        $user->id
                    );
                }
            )->count()

        ];
    }
    public function wasteTypeSummary(User $user)
    {
        return CompostListing::select(

            'waste_type',

            DB::raw('COUNT(*) as total')

        )
            ->where(
                'farmer_id',
                $user->id
            )
            ->groupBy('waste_type')
            ->orderByDesc('total')
            ->get();
    }
    public function monthlySummary(User $user)
    {
        return CompostListing::selectRaw(

            "DATE_TRUNC('month', created_at) as month,
         COUNT(*) as total"

        )
            ->where(
                'farmer_id',
                $user->id
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();
    }
}
