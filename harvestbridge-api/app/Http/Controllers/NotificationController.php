<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\RecommendationAlertDispatchRequest;
use App\Http\Requests\SendEmailNotificationRequest;
use App\Http\Requests\SendSmsNotificationRequest;
use App\Http\Requests\StoreInAppNotificationRequest;
use App\Http\Requests\WeatherAlertDispatchRequest;
use App\Http\Resources\DatabaseNotificationResource;
use App\Http\Resources\WeatherAlertResource;
use App\Models\PredictionHistory;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    public function sendEmail(SendEmailNotificationRequest $request)
    {
        $recipient = User::findOrFail($request->validated('user_id'));

        $this->notificationService->sendEmail(
            $recipient,
            $request->validated('subject'),
            $request->validated('message'),
            $request->user()
        );

        return ApiResponse::success(
            null,
            'Email notification sent successfully.'
        );
    }

    public function sendSms(SendSmsNotificationRequest $request)
    {
        $recipient = User::findOrFail($request->validated('user_id'));

        if (!$recipient->phone) {
            return ApiResponse::error('Recipient does not have a phone number.', 422);
        }

        $result = $this->notificationService->sendSms(
            $recipient,
            $request->validated('message'),
            $request->user()
        );

        return ApiResponse::success(
            $result,
            'SMS notification sent successfully.'
        );
    }

    public function storeInApp(StoreInAppNotificationRequest $request)
    {
        $recipient = User::findOrFail($request->validated('user_id'));

        $this->notificationService->sendInApp(
            $recipient,
            $request->validated('title'),
            $request->validated('message'),
            $request->user(),
            $request->validated('context') ?? []
        );

        return ApiResponse::success(
            null,
            'In-app notification created successfully.'
        );
    }

    public function weatherAlerts(WeatherAlertDispatchRequest $request)
    {
        $alerts = $this->notificationService->dispatchWeatherAlerts(
            $request->validated('district'),
            $request->validated('severity'),
            $request->validated('message'),
            $request->validated('weather_data') ?? []
        );

        return ApiResponse::success(
            WeatherAlertResource::collection($alerts),
            'Weather alerts dispatched successfully.'
        );
    }

    public function cropRecommendationAlert(RecommendationAlertDispatchRequest $request)
    {
        $history = PredictionHistory::with('user')->findOrFail(
            $request->validated('prediction_history_id')
        );

        $this->notificationService->dispatchRecommendationAlert($history);

        return ApiResponse::success(
            null,
            'Crop recommendation alert dispatched successfully.'
        );
    }

    public function index(Request $request)
    {
        return ApiResponse::success(
            DatabaseNotificationResource::collection(
                $this->notificationService->notifications($request->user())
            ),
            'Notifications retrieved successfully.'
        );
    }

    public function markAsRead(Request $request, string $notification)
    {
        $notificationModel = $this->notificationService->markAsRead(
            $request->user(),
            $notification
        );

        if (!$notificationModel) {
            return ApiResponse::error('Notification not found.', 404);
        }

        return ApiResponse::success(
            new DatabaseNotificationResource($notificationModel),
            'Notification marked as read successfully.'
        );
    }
}
