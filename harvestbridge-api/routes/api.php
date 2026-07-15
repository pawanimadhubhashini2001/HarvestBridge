<?php

use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProfileController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Common
    |--------------------------------------------------------------------------
    */

    Route::get('/profile', function (Request $request) {
        return response()->json([
            'user' => $request->user()
        ]);
    });

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

    Route::get('/profile', [ProfileController::class, 'show']);

    Route::put('/profile', [ProfileController::class, 'update']);
});
