<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompostListingController;
use App\Http\Controllers\CompostRequestController;
use App\Http\Controllers\CropController;
use App\Http\Controllers\FarmController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HarvestListingController;
use App\Http\Controllers\MarketplaceController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\DonationController;
use App\Http\Controllers\DonationRequestController;

// =============================
// Public Routes
// =============================

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

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

        Route::get('/admin/dashboard', function () {
            return response()->json([
                'message' => 'Welcome Admin'
            ]);
        });

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

        Route::get('/farmer/dashboard', function () {
            return response()->json([
                'message' => 'Welcome Farmer'
            ]);
        });

        Route::get('/farms', [FarmController::class, 'index']);
        Route::post('/farms', [FarmController::class, 'store']);
        Route::put('/farms/{farm}', [FarmController::class, 'update']);
        Route::delete('/farms/{farm}', [FarmController::class, 'destroy']);

        Route::get('/harvest-listings', [HarvestListingController::class, 'index']);
        Route::post('/harvest-listings', [HarvestListingController::class, 'store']);
        Route::put('/harvest-listings/{harvestListing}', [HarvestListingController::class, 'update']);
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
    Route::get(
        '/marketplace',
        [MarketplaceController::class, 'index']
    );
});
