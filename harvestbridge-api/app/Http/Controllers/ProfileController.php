<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\ProfileResource;
use App\Services\ProfileService;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function __construct(
        protected ProfileService $profileService
    ) {}

    public function show(Request $request)
    {
        $profile = $this->profileService->getProfile(
            $request->user()
        );

        return ApiResponse::success(
            new ProfileResource($profile),
            'Profile retrieved successfully'
        );
    }

    public function update(UpdateProfileRequest $request)
    {
        $profile = $this->profileService->updateProfile(
            $request->user(),
            $request->validated()
        );

        return ApiResponse::success(
            new ProfileResource($profile),
            'Profile updated successfully'
        );
    }
}
