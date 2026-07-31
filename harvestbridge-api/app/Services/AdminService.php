<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\CompostListing;
use App\Models\Crop;
use App\Models\Donation;
use App\Models\FavoriteProduct;
use App\Models\FavoriteStore;
use App\Models\Farm;
use App\Models\HarvestListing;
use App\Models\MarketPrice;
use App\Models\PredictionHistory;
use App\Models\Review;
use App\Models\StoreStory;
use App\Models\User;
use App\Models\WeatherAlert;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdminService
{
    private const NEARBY_SEARCH_ACTION = 'marketplace.nearby_search.performed';
    private const MANAGEABLE_ROLES = [
        'farmer',
        'consumer',
        'ngo',
        'compost_business',
    ];

    public function dashboard(): array
    {
        $overview = $this->overviewMetrics();

        return [
            'users' => User::count(),
            'active_users' => User::where('status', 'active')->count(),
            'farms' => Farm::count(),
            'crops' => Crop::count(),
            'predictions' => PredictionHistory::count(),
            'weather_alerts' => WeatherAlert::count(),
            'market_prices' => MarketPrice::count(),
            'audit_logs' => AuditLog::count(),
            'overview' => $overview,
            'generated_at' => now()->toISOString(),
        ];
    }

    public function users(array $filters): LengthAwarePaginator
    {
        return User::query()
            ->whereIn('role', self::MANAGEABLE_ROLES)
            ->when($filters['role'] ?? null, fn ($query, $role) => $query->where('role', $role))
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($innerQuery) use ($search) {
                    $innerQuery
                        ->where('name', 'ILIKE', "%{$search}%")
                        ->orWhere('email', 'ILIKE', "%{$search}%")
                        ->orWhere('phone', 'ILIKE', "%{$search}%")
                        ->orWhere('district', 'ILIKE', "%{$search}%")
                        ->orWhere('organization_name', 'ILIKE', "%{$search}%")
                        ->orWhere('company_name', 'ILIKE', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($filters['per_page'] ?? 15);
    }

    public function userProfile(User $user): User
    {
        $this->assertManageableUser($user);

        return $user->loadCount([
            'farms',
            'harvestListings',
            'donations',
            'compostListings',
            'consumerOrders',
            'favoriteStores',
            'favoriteProducts',
            'reviewsWritten',
            'donationRequests',
            'compostRequests',
        ]);
    }

    public function updateUserStatus(User $user, string $status): User
    {
        $this->assertManageableUser($user);

        $user->update([
            'status' => $status,
        ]);

        return $user->fresh();
    }

    public function suspendUser(User $user): User
    {
        return $this->updateUserStatus($user, 'blocked');
    }

    public function activateUser(User $user): User
    {
        return $this->updateUserStatus($user, 'active');
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
            'overview' => $this->overviewMetrics(),
            'charts' => $this->chartMetrics(),
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
                    'month' => $item->month !== null
                        ? Carbon::parse($item->month)->format('Y-m-d')
                        : null,
                    'total' => (int) $item->total,
                ]),
            'favorite_rate' => [
                'total_predictions' => PredictionHistory::count(),
                'total_favorites' => PredictionHistory::where('is_favorite', true)->count(),
            ],
            'generated_at' => now()->toISOString(),
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

    private function assertManageableUser(User $user): void
    {
        if (! in_array($user->role, self::MANAGEABLE_ROLES, true)) {
            throw ValidationException::withMessages([
                'user' => ['This user account cannot be managed through the platform user management module.'],
            ]);
        }
    }

    private function overviewMetrics(): array
    {
        $averageStoreRating = Review::query()
            ->where('is_visible', true)
            ->avg('rating');

        return [
            'total_users' => User::count(),
            'total_stores' => Farm::count(),
            'total_products' => HarvestListing::count(),
            'available_products' => HarvestListing::query()
                ->where('status', HarvestListing::STATUS_AVAILABLE)
                ->where('available_quantity', '>', 0)
                ->count(),
            'sold_out_products' => HarvestListing::query()
                ->where('status', HarvestListing::STATUS_SOLD)
                ->count(),
            'nearby_searches' => AuditLog::query()
                ->where('action', self::NEARBY_SEARCH_ACTION)
                ->count(),
            'story_count' => StoreStory::count(),
            'donation_listings' => Donation::count(),
            'compost_listings' => CompostListing::count(),
            'favorite_products' => FavoriteProduct::count(),
            'favorite_stores' => FavoriteStore::count(),
            'average_store_rating' => $averageStoreRating !== null
                ? round((float) $averageStoreRating, 2)
                : null,
        ];
    }

    private function chartMetrics(): array
    {
        return [
            'monthly_user_registrations' => $this->monthlyUserRegistrations(),
            'popular_products' => $this->popularProducts(),
            'top_rated_stores' => $this->topRatedStores(),
            'most_active_farmers' => $this->mostActiveFarmers(),
        ];
    }

    private function monthlyUserRegistrations(): array
    {
        $startMonth = now()->startOfMonth()->subMonths(11);

        $totalsByMonth = User::query()
            ->selectRaw("TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month_key")
            ->selectRaw('COUNT(*) as total')
            ->where('created_at', '>=', $startMonth)
            ->groupBy('month_key')
            ->orderBy('month_key')
            ->pluck('total', 'month_key');

        return collect(range(0, 11))
            ->map(function (int $offset) use ($startMonth, $totalsByMonth) {
                $month = (clone $startMonth)->addMonths($offset);
                $monthKey = $month->format('Y-m');

                return [
                    'month' => $monthKey,
                    'label' => $month->format('M Y'),
                    'total' => (int) ($totalsByMonth[$monthKey] ?? 0),
                ];
            })
            ->all();
    }

    private function popularProducts(): array
    {
        return HarvestListing::query()
            ->with([
                'crop:id,name',
                'farm:id,farm_name',
            ])
            ->withCount('favoritedByUsers')
            ->orderByDesc('favorited_by_users_count')
            ->orderByDesc('sold_quantity')
            ->orderByDesc('id')
            ->limit(10)
            ->get()
            ->map(fn (HarvestListing $listing) => [
                'product_id' => $listing->id,
                'product_name' => $listing->crop?->name ?? 'Unknown Product',
                'store_name' => $listing->farm?->farm_name,
                'favorite_count' => (int) ($listing->favorited_by_users_count ?? 0),
                'sold_quantity' => round((float) ($listing->sold_quantity ?? 0), 2),
                'available_quantity' => round((float) ($listing->available_quantity ?? 0), 2),
                'status' => $listing->status,
            ])
            ->all();
    }

    private function topRatedStores(): array
    {
        return Farm::query()
            ->with('user:id,name')
            ->whereHas('visibleReviews')
            ->withAvg('visibleReviews as average_rating', 'rating')
            ->withCount('visibleReviews as review_count')
            ->orderByDesc('average_rating')
            ->orderByDesc('review_count')
            ->orderByDesc('id')
            ->limit(10)
            ->get()
            ->map(fn (Farm $store) => [
                'store_id' => $store->id,
                'store_name' => $store->farm_name,
                'farmer_name' => $store->user?->name,
                'average_rating' => $store->average_rating !== null
                    ? round((float) $store->average_rating, 2)
                    : null,
                'review_count' => (int) ($store->review_count ?? 0),
                'business_status' => $store->business_status,
                'is_suspended' => (bool) ($store->is_suspended ?? false),
            ])
            ->all();
    }

    private function mostActiveFarmers(): array
    {
        $farmers = User::query()
            ->select('users.id', 'users.name')
            ->where('role', 'farmer')
            ->withCount([
                'farms as stores_count',
                'harvestListings as products_count',
                'donations as donations_count',
                'compostListings as compost_listings_count',
            ])
            ->selectSub(
                StoreStory::query()
                    ->selectRaw('COUNT(*)')
                    ->join('farms', 'farms.id', '=', 'store_stories.farm_id')
                    ->whereColumn('farms.user_id', 'users.id'),
                'stories_count'
            )
            ->get()
            ->map(function (User $farmer) {
                $activityScore = (int) ($farmer->stores_count ?? 0)
                    + (int) ($farmer->products_count ?? 0)
                    + (int) ($farmer->stories_count ?? 0)
                    + (int) ($farmer->donations_count ?? 0)
                    + (int) ($farmer->compost_listings_count ?? 0);

                return [
                    'farmer_id' => $farmer->id,
                    'farmer_name' => $farmer->name,
                    'stores_count' => (int) ($farmer->stores_count ?? 0),
                    'products_count' => (int) ($farmer->products_count ?? 0),
                    'stories_count' => (int) ($farmer->stories_count ?? 0),
                    'donations_count' => (int) ($farmer->donations_count ?? 0),
                    'compost_listings_count' => (int) ($farmer->compost_listings_count ?? 0),
                    'activity_score' => $activityScore,
                ];
            })
            ->sortByDesc('activity_score')
            ->take(10)
            ->values();

        return $farmers->all();
    }
}
