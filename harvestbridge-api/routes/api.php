<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AIAnalyticsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompostListingController;
use App\Http\Controllers\CompostRequestController;
use App\Http\Controllers\CropController;
use App\Http\Controllers\FarmController;
use App\Http\Controllers\AdminModerationController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\StoreReviewController;
use App\Http\Controllers\StoreStoryController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HarvestListingController;
use App\Http\Controllers\MarketplaceController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\DonationController;
use App\Http\Controllers\DonationRequestController;
use App\Http\Controllers\AIPredictionController;
use App\Http\Controllers\WeatherController;
use App\Http\Controllers\RecommendationReportController;

// =============================
// Public Routes
// =============================

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);

// =============================
// Protected Routes
// =============================

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Common
    |--------------------------------------------------------------------------
    */

    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/logout', [AuthController::class, 'logout']);

    /*
    |--------------------------------------------------------------------------
    | Admin
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:admin')->group(function () {

        Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/admin/users', [AdminController::class, 'users']);
        Route::get('/admin/users/{user}', [AdminController::class, 'showUser']);
        Route::patch('/admin/users/{user}/status', [AdminController::class, 'updateUserStatus']);
        Route::patch('/admin/users/{user}/suspend', [AdminController::class, 'suspendUser']);
        Route::patch('/admin/users/{user}/activate', [AdminController::class, 'activateUser']);
        Route::get('/admin/moderation/products', [AdminModerationController::class, 'products']);
        Route::patch('/admin/moderation/products/{harvestListing}/hide', [AdminModerationController::class, 'hideProduct']);
        Route::delete('/admin/moderation/products/{harvestListing}', [AdminModerationController::class, 'deleteProduct']);
        Route::get('/admin/moderation/stores', [AdminModerationController::class, 'stores']);
        Route::patch('/admin/moderation/stores/{store}/suspend', [AdminModerationController::class, 'suspendStore']);
        Route::get('/admin/moderation/stories', [AdminModerationController::class, 'stories']);
        Route::patch('/admin/moderation/stories/{story}/hide', [AdminModerationController::class, 'hideStory']);
        Route::delete('/admin/moderation/stories/{story}', [AdminModerationController::class, 'deleteStory']);
        Route::get('/admin/moderation/donations', [AdminModerationController::class, 'donations']);
        Route::patch('/admin/moderation/donations/{donation}/hide', [AdminModerationController::class, 'hideDonation']);
        Route::delete('/admin/moderation/donations/{donation}', [AdminModerationController::class, 'deleteDonation']);
        Route::get('/admin/moderation/compost-listings', [AdminModerationController::class, 'compostListings']);
        Route::patch('/admin/moderation/compost-listings/{compostListing}/hide', [AdminModerationController::class, 'hideCompostListing']);
        Route::delete('/admin/moderation/compost-listings/{compostListing}', [AdminModerationController::class, 'deleteCompostListing']);
        Route::get('/admin/moderation/reports', [AdminModerationController::class, 'reports']);
        Route::get('/admin/farms', [AdminController::class, 'farms']);
        Route::get('/admin/crops', [AdminController::class, 'crops']);
        Route::get('/admin/ai-logs', [AdminController::class, 'aiLogs']);
        Route::get('/admin/weather-logs', [AdminController::class, 'weatherLogs']);
        Route::get('/admin/market-prices', [AdminController::class, 'marketPrices']);
        Route::post('/admin/market-prices', [AdminController::class, 'storeMarketPrice']);
        Route::put('/admin/market-prices/{marketPrice}', [AdminController::class, 'updateMarketPrice']);
        Route::patch('/admin/harvest-listings/{harvestListing}/featured', [AdminController::class, 'updateHarvestListingFeatured']);
        Route::get('/admin/analytics', [AdminController::class, 'analytics']);
        Route::get('/admin/audit-logs', [AdminController::class, 'auditLogs']);
        Route::get('/admin/reports', [AdminController::class, 'reports']);
        Route::post('/notifications/email', [NotificationController::class, 'sendEmail']);
        Route::post('/notifications/sms', [NotificationController::class, 'sendSms']);
        Route::post('/notifications/in-app', [NotificationController::class, 'storeInApp']);
        Route::post('/notifications/weather-alerts', [NotificationController::class, 'weatherAlerts']);
        Route::post('/notifications/recommendation-alerts', [NotificationController::class, 'cropRecommendationAlert']);

        // Crop Management
        Route::post('/crops', [CropController::class, 'store']);
        Route::put('/crops/{crop}', [CropController::class, 'update']);
        Route::delete('/crops/{crop}', [CropController::class, 'destroy']);
    });

    /*
    |--------------------------------------------------------------------------
    | Farmer
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:farmer')->group(function () {

        Route::get('/farmer/dashboard', [AnalyticsController::class, 'farmerMarketplaceDashboard']);

        Route::get('/farms', [FarmController::class, 'index']);
        Route::post('/farms', [FarmController::class, 'store']);
        Route::put('/farms/{farm}', [FarmController::class, 'update']);
        Route::delete('/farms/{farm}', [FarmController::class, 'destroy']);
        Route::get('/stores', [StoreController::class, 'index']);
        Route::get('/stores/me', [StoreController::class, 'me']);
        Route::get('/stores/{store}', [StoreController::class, 'show']);
        Route::post('/stores', [StoreController::class, 'store']);
        Route::put('/stores/{store}', [StoreController::class, 'update']);
        Route::get('/stores/{store}/status', [StoreController::class, 'status']);
        Route::put('/stores/{store}/status', [StoreController::class, 'updateStatus']);
        Route::post('/stores/{store}/logo', [StoreController::class, 'uploadLogo']);
        Route::post('/stores/{store}/cover', [StoreController::class, 'uploadCover']);
        Route::delete('/stores/{store}/logo', [StoreController::class, 'deleteLogo']);
        Route::delete('/stores/{store}/cover', [StoreController::class, 'deleteCover']);
        Route::put('/stores/{store}/location', [StoreController::class, 'updateLocation']);
        Route::delete('/stores/{store}', [StoreController::class, 'destroy']);
        Route::get('/stores/me/stories', [StoreStoryController::class, 'index']);
        Route::post('/stores/{store}/stories', [StoreStoryController::class, 'store']);
        Route::put('/stores/{store}/stories/{story}', [StoreStoryController::class, 'update']);
        Route::delete('/stores/{store}/stories/{story}', [StoreStoryController::class, 'destroy']);

        Route::get('/harvest-listings', [HarvestListingController::class, 'index']);
        Route::get('/harvest-listings/{harvestListing}', [HarvestListingController::class, 'show']);
        Route::post('/harvest-listings', [HarvestListingController::class, 'store']);
        Route::post('/harvest-listings/{harvestListing}/images', [HarvestListingController::class, 'uploadImages']);
        Route::put('/harvest-listings/{harvestListing}', [HarvestListingController::class, 'update']);
        Route::patch('/harvest-listings/{harvestListing}/availability', [HarvestListingController::class, 'updateAvailability']);
        Route::patch('/harvest-listings/{harvestListing}/images/order', [HarvestListingController::class, 'reorderImages']);
        Route::patch('/harvest-listings/{harvestListing}/images/{image}/primary', [HarvestListingController::class, 'setPrimaryImage']);
        Route::delete('/harvest-listings/{harvestListing}/images/{image}', [HarvestListingController::class, 'deleteImage']);
        Route::delete('/harvest-listings/{harvestListing}', [HarvestListingController::class, 'destroy']);

        Route::get(
            '/farmer/orders',
            [OrderController::class, 'farmerOrders']
        );

        Route::patch(
            '/orders/{order}/status',
            [OrderController::class, 'updateStatus']
        );

        Route::get(
            '/farmer/orders',
            [OrderController::class, 'farmerOrders']
        );

        Route::patch(
            '/orders/{order}/status',
            [OrderController::class, 'updateStatus']
        );

        Route::get(
            '/donations',
            [DonationController::class, 'index']
        );

        Route::post(
            '/donations',
            [DonationController::class, 'store']
        );

        Route::put(
            '/donations/{donation}',
            [DonationController::class, 'update']
        );

        Route::delete(
            '/donations/{donation}',
            [DonationController::class, 'destroy']
        );

        Route::get(
            '/farmer/donation-requests',
            [DonationRequestController::class, 'farmerRequests']
        );

        Route::patch(
            '/donation-requests/{donationRequest}/status',
            [DonationRequestController::class, 'updateStatus']
        );

        Route::get('/compost-listings', [CompostListingController::class, 'index']);

        Route::post('/compost-listings', [CompostListingController::class, 'store']);

        Route::put('/compost-listings/{compostListing}', [CompostListingController::class, 'update']);

        Route::delete('/compost-listings/{compostListing}', [CompostListingController::class, 'destroy']);

        Route::get(
            '/farmer/compost-requests',
            [CompostRequestController::class, 'farmerRequests']
        );

        Route::patch(
            '/compost-requests/{compostRequest}/status',
            [CompostRequestController::class, 'updateStatus']
        );

        Route::patch(
            '/compost-requests/{compostRequest}/complete',
            [CompostRequestController::class, 'complete']
        );

        Route::get(
            '/analytics/compost',
            [AnalyticsController::class, 'compost']
        );
        Route::get('/analytics/farmer-dashboard', [AIAnalyticsController::class, 'farmerDashboard']);
    });

    /*
    |--------------------------------------------------------------------------
    | Consumer
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:consumer')->group(function () {

        Route::get('/consumer/dashboard', function () {
            return response()->json([
                'message' => 'Welcome Consumer'
            ]);
        });
        Route::post(
            '/orders',
            [OrderController::class, 'store']
        );

        Route::get(
            '/orders',
            [OrderController::class, 'index']
        );
        Route::get('/favorites', [FavoriteController::class, 'index']);
        Route::post('/favorites/stores/{store}', [FavoriteController::class, 'favoriteStore']);
        Route::delete('/favorites/stores/{store}', [FavoriteController::class, 'unfavoriteStore']);
        Route::post('/favorites/products/{harvestListing}', [FavoriteController::class, 'favoriteProduct']);
        Route::delete('/favorites/products/{harvestListing}', [FavoriteController::class, 'unfavoriteProduct']);
        Route::post('/stores/{store}/reviews', [StoreReviewController::class, 'store']);
        Route::put('/stores/{store}/reviews/{review}', [StoreReviewController::class, 'update']);
        Route::delete('/stores/{store}/reviews/{review}', [StoreReviewController::class, 'destroy']);
    });

    /*
    |--------------------------------------------------------------------------
    | NGO
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:ngo')->group(function () {

        Route::get('/ngo/dashboard', function () {
            return response()->json([
                'message' => 'Welcome NGO'
            ]);
        });
        Route::get(
            '/available-donations',
            [DonationController::class, 'available']
        );

        Route::get(
            '/donation-requests',
            [DonationRequestController::class, 'index']
        );

        Route::post(
            '/donation-requests',
            [DonationRequestController::class, 'store']
        );
        Route::patch(
            '/donations/{donation}/pickup',
            [DonationController::class, 'schedulePickup']
        );

        Route::patch(
            '/donations/{donation}/complete',
            [DonationController::class, 'complete']
        );
    });

    /*
    |--------------------------------------------------------------------------
    | Compost Business
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:compost_business')->group(function () {

        Route::get('/compost/dashboard', function () {
            return response()->json([
                'message' => 'Welcome Compost Business'
            ]);
        });

        Route::get(
            '/available-compost',
            [CompostListingController::class, 'marketplace']
        );

        Route::post(
            '/compost-requests',
            [CompostRequestController::class, 'store']
        );

        Route::patch(
            '/compost-requests/{compostRequest}/collect',
            [CompostRequestController::class, 'collect']
        );
        Route::get(
            '/compost/dashboard',
            [CompostRequestController::class, 'dashboard']
        );

        Route::get(
            '/my-compost-requests',
            [CompostRequestController::class, 'businessRequests']
        );
    });

    /*
    |--------------------------------------------------------------------------
    | Crops (Viewable by all authenticated users)
    |--------------------------------------------------------------------------
    */

    Route::get('/crops', [CropController::class, 'index']);
    Route::get('/crops/categories', [CropController::class, 'categories']);
    Route::get('/stores/public/{store}', [StoreController::class, 'publicShow']);
    Route::get('/stores/public/{store}/products', [StoreController::class, 'publicProducts']);
    Route::get('/stores/public/{store}/reviews', [StoreReviewController::class, 'index']);
    Route::get('/stores/{store}/location', [StoreController::class, 'location']);
    Route::get('/stories/feed', [StoreStoryController::class, 'feed']);
    Route::post('/stories/{story}/view', [StoreStoryController::class, 'recordView']);
    Route::get(
        '/marketplace',
        [MarketplaceController::class, 'index']
    );
    Route::get(
        '/marketplace/{harvestListing}',
        [MarketplaceController::class, 'show']
    );
    Route::post(
        '/ai/predict',
        [AIPredictionController::class, 'predict']
    );
    Route::post(
        '/ai/disease-detect',
        [AIPredictionController::class, 'detectDisease']
    );
    Route::get(
        '/ai/history',
        [AIPredictionController::class, 'history']
    );
    Route::get(
        '/ai/dashboard',
        [AIPredictionController::class, 'dashboard']
    );
    Route::get(
        '/weather/current',
        [WeatherController::class, 'current']
    );
    Route::post(
        '/ai/smart-predict',
        [AIPredictionController::class, 'smartPredict']
    );
    Route::post(
        '/reports/recommendation',
        [RecommendationReportController::class, 'download']
    );
    Route::get('/reports/crops', [ReportController::class, 'crop']);
    Route::get('/reports/farms', [ReportController::class, 'farm']);
    Route::get('/reports/ai', [ReportController::class, 'ai']);
    Route::get('/reports/export-excel', [ReportController::class, 'exportExcel']);
    Route::get('/reports/advanced-pdf', [ReportController::class, 'advancedPdf']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::get('/analytics/ai/dashboard', [AIAnalyticsController::class, 'dashboard']);
    Route::get('/analytics/ai/most-recommended-crops', [AIAnalyticsController::class, 'mostRecommendedCrops']);
    Route::get('/analytics/ai/confidence', [AIAnalyticsController::class, 'confidence']);
    Route::get('/analytics/ai/seasonal', [AIAnalyticsController::class, 'seasonal']);
    Route::get('/analytics/ai/favorites', [AIAnalyticsController::class, 'favorites']);
    Route::get('/analytics/ai/trends', [AIAnalyticsController::class, 'trends']);
    Route::get(
        '/recommendations/favorites',
        [AIPredictionController::class, 'favorites']
    );

    Route::patch(
        '/recommendations/{history}/favorite',
        [AIPredictionController::class, 'toggleFavorite']
    );

    Route::middleware('auth:sanctum')->group(function () {

        Route::get(
            '/recommendations',
            [AIPredictionController::class, 'recommendationHistory']
        );

        Route::get(
            '/recommendations/search',
            [AIPredictionController::class, 'searchRecommendations']
        );

        Route::get(
            '/recommendations/{history}',
            [AIPredictionController::class, 'showRecommendation']
        );

        Route::delete(
            '/recommendations/{history}',
            [AIPredictionController::class, 'destroyRecommendation']
        );
    });
});
