<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Services\AuthService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    public function register(RegisterRequest $request)
    {
        $result = $this->authService->register(
            $request->validated()
        );

        return ApiResponse::success(
            $result,
            'User registered successfully',
            201
        );
    }

    public function login(LoginRequest $request)
    {
        $result = $this->authService->login(
            $request->validated()
        );

        return ApiResponse::success(
            $result,
            'Login successful'
        );
    }

    public function logout(Request $request)
    {
        $this->authService->logout(
            $request->user()
        );

        return ApiResponse::success(
            null,
            'Logout successful'
        );
    }
}
