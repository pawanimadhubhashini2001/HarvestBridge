<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\RequestLoginOtpRequest;
use App\Http\Requests\RequestRegistrationOtpRequest;
use App\Http\Requests\VerifyLoginOtpRequest;
use App\Http\Requests\VerifyRegistrationOtpRequest;
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

    public function requestRegistrationOtp(RequestRegistrationOtpRequest $request)
    {
        $this->authService->requestRegistrationOtp(
            $request->validated()
        );

        return ApiResponse::success(
            null,
            'Registration OTP sent successfully.'
        );
    }

    public function verifyRegistrationOtp(VerifyRegistrationOtpRequest $request)
    {
        $result = $this->authService->verifyRegistrationOtp(
            $request->validated('email'),
            $request->validated('otp')
        );

        return ApiResponse::success(
            $result,
            'Registration verified successfully.',
            201
        );
    }

    public function requestLoginOtp(RequestLoginOtpRequest $request)
    {
        $this->authService->requestLoginOtp(
            $request->validated()
        );

        return ApiResponse::success(
            null,
            'Login OTP sent successfully.'
        );
    }

    public function verifyLoginOtp(VerifyLoginOtpRequest $request)
    {
        $result = $this->authService->verifyLoginOtp(
            $request->validated('email'),
            $request->validated('otp')
        );

        return ApiResponse::success(
            $result,
            'Login successful.'
        );
    }

    public function forgotPassword(ForgotPasswordRequest $request)
    {
        $message = $this->authService->forgotPassword(
            $request->validated('email')
        );

        return ApiResponse::success(
            null,
            $message
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
