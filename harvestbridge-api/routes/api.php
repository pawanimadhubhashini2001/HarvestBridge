<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CropController;
use App\Http\Controllers\FarmController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HarvestListingController;
use App\Http\Controllers\MarketplaceController;

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
