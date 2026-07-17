<?php

namespace App\Services;

use App\Models\Farm;
use App\Models\PredictionHistory;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AIAnalyticsService
{
    public function dashboard(User $user, ?string $from = null, ?string $to = null): array
    {
        $query = $this->historyQuery($user, $from, $to);
        $totalPredictions = (clone $query)->count();
        $averageConfidence = (float) ((clone $query)->avg('confidence') ?? 0);
        $favoriteCount = (clone $query)->where('is_favorite', true)->count();
        $topCrop = (clone $query)
            ->select('recommended_crop', DB::raw('COUNT(*) as total'))
            ->groupBy('recommended_crop')
            ->orderByDesc('total')
            ->first();

        return [
            'total_predictions' => $totalPredictions,
            'average_confidence' => round($averageConfidence, 4),
            'favorite_recommendations' => $favoriteCount,
            'confidence_breakdown' => [
                'high' => (clone $query)->where('confidence', '>=', 0.80)->count(),
                'medium' => (clone $query)->whereBetween('confidence', [0.60, 0.7999])->count(),
                'low' => (clone $query)->where('confidence', '<', 0.60)->count(),
            ],
            'most_recommended_crop' => $topCrop ? [
                'crop' => $topCrop->recommended_crop,
                'total' => (int) $topCrop->total,
            ] : null,
        ];
    }

    public function mostRecommendedCrops(User $user, ?string $from = null, ?string $to = null, int $limit = 10): Collection
    {
        return $this->historyQuery($user, $from, $to)
            ->select('recommended_crop', DB::raw('COUNT(*) as total'))
            ->groupBy('recommended_crop')
            ->orderByDesc('total')
            ->limit($limit)
            ->get()
            ->map(fn ($item) => [
                'crop' => $item->recommended_crop,
                'total' => (int) $item->total,
            ]);
    }

    public function confidenceAnalytics(User $user, ?string $from = null, ?string $to = null): array
    {
        $query = $this->historyQuery($user, $from, $to);

        return [
            'average_confidence' => round((float) ((clone $query)->avg('confidence') ?? 0), 4),
            'min_confidence' => round((float) ((clone $query)->min('confidence') ?? 0), 4),
            'max_confidence' => round((float) ((clone $query)->max('confidence') ?? 0), 4),
            'bands' => [
                [
                    'label' => 'high',
                    'min' => 0.80,
                    'max' => 1.00,
                    'total' => (clone $query)->where('confidence', '>=', 0.80)->count(),
                ],
                [
                    'label' => 'medium',
                    'min' => 0.60,
                    'max' => 0.7999,
                    'total' => (clone $query)->whereBetween('confidence', [0.60, 0.7999])->count(),
                ],
                [
                    'label' => 'low',
                    'min' => 0.00,
                    'max' => 0.5999,
                    'total' => (clone $query)->where('confidence', '<', 0.60)->count(),
                ],
            ],
            'by_crop' => $this->historyQuery($user, $from, $to)
                ->select(
                    'recommended_crop',
                    DB::raw('ROUND(AVG(confidence)::numeric, 4) as average_confidence'),
                    DB::raw('COUNT(*) as total')
                )
                ->groupBy('recommended_crop')
                ->orderByDesc('average_confidence')
                ->get()
                ->map(fn ($item) => [
                    'crop' => $item->recommended_crop,
                    'average_confidence' => (float) $item->average_confidence,
                    'total' => (int) $item->total,
                ]),
        ];
    }

    public function seasonalAnalytics(User $user, ?string $from = null, ?string $to = null): Collection
    {
        return $this->historyQuery($user, $from, $to)
            ->select(
                'season',
                DB::raw('COUNT(*) as total'),
                DB::raw('ROUND(AVG(confidence)::numeric, 4) as average_confidence')
            )
            ->groupBy('season')
            ->orderByDesc('total')
            ->get()
            ->map(function ($item) use ($user, $from, $to) {
                $topCrop = $this->historyQuery($user, $from, $to)
                    ->where('season', $item->season)
                    ->select('recommended_crop', DB::raw('COUNT(*) as total'))
                    ->groupBy('recommended_crop')
                    ->orderByDesc('total')
                    ->first();

                return [
                    'season' => $item->season,
                    'total' => (int) $item->total,
                    'average_confidence' => (float) $item->average_confidence,
                    'top_crop' => $topCrop?->recommended_crop,
                ];
            });
    }

    public function favoriteStatistics(User $user, ?string $from = null, ?string $to = null): array
    {
        $query = $this->historyQuery($user, $from, $to);
        $total = (clone $query)->count();
        $favorites = (clone $query)->where('is_favorite', true)->count();

        return [
            'total_recommendations' => $total,
            'favorite_recommendations' => $favorites,
            'favorite_rate' => $total > 0 ? round(($favorites / $total) * 100, 2) : 0,
            'favorite_crops' => $this->historyQuery($user, $from, $to)
                ->where('is_favorite', true)
                ->select('recommended_crop', DB::raw('COUNT(*) as total'))
                ->groupBy('recommended_crop')
                ->orderByDesc('total')
                ->get()
                ->map(fn ($item) => [
                    'crop' => $item->recommended_crop,
                    'total' => (int) $item->total,
                ]),
        ];
    }

    public function recommendationTrends(
        User $user,
        ?string $from = null,
        ?string $to = null,
        string $granularity = 'month'
    ): Collection {
        $dateTrunc = $granularity === 'week' ? 'week' : 'month';

        return $this->historyQuery($user, $from, $to)
            ->selectRaw("DATE_TRUNC('{$dateTrunc}', created_at) as period")
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('ROUND(AVG(confidence)::numeric, 4) as average_confidence')
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(fn ($item) => [
                'period' => Carbon::parse($item->period)->toDateString(),
                'total' => (int) $item->total,
                'average_confidence' => (float) $item->average_confidence,
            ]);
    }

    public function farmerDashboard(User $user): array
    {
        $farmIds = Farm::where('user_id', $user->id)->pluck('id');
        $historyQuery = $this->historyQuery($user);

        return [
            'farms' => $farmIds->count(),
            'recommendations' => (clone $historyQuery)->count(),
            'favorites' => (clone $historyQuery)->where('is_favorite', true)->count(),
            'seasonal_summary' => $this->seasonalAnalytics($user),
            'top_crops' => $this->mostRecommendedCrops($user, null, null, 5),
            'recent_trends' => $this->recommendationTrends(
                $user,
                now()->subMonths(5)->toDateString(),
                now()->toDateString()
            ),
        ];
    }

    private function historyQuery(User $user, ?string $from = null, ?string $to = null)
    {
        $query = PredictionHistory::query()->where('user_id', $user->id);

        if ($from) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to) {
            $query->whereDate('created_at', '<=', $to);
        }

        return $query;
    }
}
