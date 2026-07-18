<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Crop;
use App\Models\Farm;
use App\Models\HarvestListing;
use App\Models\MarketPrice;
use App\Models\PredictionHistory;
use App\Models\User;
use App\Models\WeatherAlert;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AdminService
{
    public function dashboard(): array
    {
        return [
            'users' => User::count(),
            'active_users' => User::where('status', 'active')->count(),
            'farms' => Farm::count(),
            'crops' => Crop::count(),
            'predictions' => PredictionHistory::count(),
            'weather_alerts' => WeatherAlert::count(),
            'market_prices' => MarketPrice::count(),
            'audit_logs' => AuditLog::count(),
        ];
    }

    public function users(array $filters): LengthAwarePaginator
    {
        return User::query()
            ->when($filters['role'] ?? null, fn ($query, $role) => $query->where('role', $role))
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($innerQuery) use ($search) {
                    $innerQuery
                        ->where('name', 'ILIKE', "%{$search}%")
                        ->orWhere('email', 'ILIKE', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($filters['per_page'] ?? 15);
    }

    public function updateUserStatus(User $user, string $status): User
    {
        $user->update([
            'status' => $status,
        ]);

        return $user->fresh();
    }

    public function farms(array $filters): LengthAwarePaginator
    {
        return Farm::query()
            ->with('user')
            ->when($filters['district'] ?? null, fn ($query, $district) => $query->where('district', $district))
            ->latest()
            ->paginate($filters['per_page'] ?? 15);
    }

    public function crops(array $filters): LengthAwarePaginator
    {
        return Crop::query()
            ->when(isset($filters['is_active']), fn ($query) => $query->where('is_active', $filters['is_active']))
            ->latest()
            ->paginate($filters['per_page'] ?? 15);
    }

    public function aiLogs(array $filters): LengthAwarePaginator
    {
        return AuditLog::query()
            ->with('user')
            ->where('action', 'ILIKE', 'ai.%')
            ->when($filters['from'] ?? null, fn ($query, $from) => $query->whereDate('created_at', '>=', $from))
            ->when($filters['to'] ?? null, fn ($query, $to) => $query->whereDate('created_at', '<=', $to))
            ->latest()
            ->paginate($filters['per_page'] ?? 15);
    }

    public function weatherLogs(array $filters): LengthAwarePaginator
    {
        return WeatherAlert::query()
            ->with('user')
            ->when($filters['district'] ?? null, fn ($query, $district) => $query->where('district', $district))
            ->when($filters['severity'] ?? null, fn ($query, $severity) => $query->where('severity', $severity))
            ->latest()
            ->paginate($filters['per_page'] ?? 15);
    }

    public function marketPrices(array $filters): LengthAwarePaginator
    {
        return MarketPrice::query()
            ->with('crop')
            ->when($filters['crop_id'] ?? null, fn ($query, $cropId) => $query->where('crop_id', $cropId))
            ->when(isset($filters['is_active']), fn ($query) => $query->where('is_active', $filters['is_active']))
            ->latest('price_date')
            ->paginate($filters['per_page'] ?? 15);
    }

    public function createMarketPrice(array $data): MarketPrice
    {
        return MarketPrice::create($data);
    }

    public function updateMarketPrice(MarketPrice $marketPrice, array $data): MarketPrice
    {
        $marketPrice->update($data);

        return $marketPrice->fresh('crop');
    }

    public function updateHarvestListingFeatured(
        HarvestListing $harvestListing,
        array $data
    ): HarvestListing {
        $isFeatured = filter_var(
            $data['is_featured'],
            FILTER_VALIDATE_BOOLEAN
        );

        $harvestListing->update([
            'is_featured' => $isFeatured,
            'featured_until' => $isFeatured
                ? ($data['featured_until'] ?? null)
                : null,
        ]);

        return $harvestListing->fresh([
            'crop',
            'farm',
            'farmer',
            'images',
        ]);
    }

    public function analytics(): array
    {
        return [
            'users_by_role' => User::query()
                ->select('role', DB::raw('COUNT(*) as total'))
                ->groupBy('role')
                ->orderBy('role')
                ->get(),
            'prediction_trends' => PredictionHistory::query()
                ->selectRaw("DATE_TRUNC('month', created_at) as month")
                ->selectRaw('COUNT(*) as total')
                ->groupBy('month')
                ->orderBy('month')
                ->get()
                ->map(fn ($item) => [
                    'month' => $item->month?->format('Y-m-d'),
                    'total' => (int) $item->total,
                ]),
            'favorite_rate' => [
                'total_predictions' => PredictionHistory::count(),
                'total_favorites' => PredictionHistory::where('is_favorite', true)->count(),
            ],
        ];
    }

    public function auditLogs(array $filters): LengthAwarePaginator
    {
        return AuditLog::query()
            ->with('user')
            ->when($filters['action'] ?? null, fn ($query, $action) => $query->where('action', 'ILIKE', "%{$action}%"))
            ->when($filters['from'] ?? null, fn ($query, $from) => $query->whereDate('created_at', '>=', $from))
            ->when($filters['to'] ?? null, fn ($query, $to) => $query->whereDate('created_at', '<=', $to))
            ->latest()
            ->paginate($filters['per_page'] ?? 15);
    }

    public function reports(): array
    {
        return [
            'user_summary' => [
                'total' => User::count(),
                'active' => User::where('status', 'active')->count(),
                'blocked' => User::where('status', 'blocked')->count(),
            ],
            'farm_summary' => [
                'total' => Farm::count(),
            ],
            'ai_summary' => [
                'predictions' => PredictionHistory::count(),
                'average_confidence' => round((float) (PredictionHistory::avg('confidence') ?? 0), 4),
            ],
            'weather_summary' => [
                'alerts' => WeatherAlert::count(),
            ],
        ];
    }
}
