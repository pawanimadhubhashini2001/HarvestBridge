<?php

namespace App\Services;

use App\Models\PredictionHistory;
use App\Models\User;
use App\Models\WeatherAlert;
use App\Notifications\CropRecommendationAlertNotification;
use App\Notifications\SystemMessageNotification;
use App\Notifications\WeatherAlertNotification;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Collection;

class NotificationService
{
    public function __construct(
        protected AuditLogService $auditLogService,
        protected SmsService $smsService
    ) {}

    public function sendEmail(User $recipient, string $subject, string $message, ?User $actor = null): void
    {
        $recipient->notify(new SystemMessageNotification($subject, $message, 'email'));

        $this->auditLogService->log(
            'notification.email.sent',
            $actor?->id,
            $recipient,
            [
                'subject' => $subject,
            ]
        );
    }

    public function sendSms(User $recipient, string $message, ?User $actor = null): array
    {
        $result = $this->smsService->send((string) $recipient->phone, $message);

        $recipient->notify(new SystemMessageNotification('SMS Notification', $message, 'sms'));

        $this->auditLogService->log(
            'notification.sms.sent',
            $actor?->id,
            $recipient,
            [
                'phone' => $recipient->phone,
                'provider_response' => $result,
            ]
        );

        return $result;
    }

    public function sendInApp(User $recipient, string $title, string $message, ?User $actor = null, array $extra = []): void
    {
        $recipient->notify(new SystemMessageNotification($title, $message, 'in_app', $extra));

        $this->auditLogService->log(
            'notification.in_app.sent',
            $actor?->id,
            $recipient,
            [
                'title' => $title,
            ]
        );
    }

    public function notifications(User $user)
    {
        return $user->notifications()->latest()->paginate(15);
    }

    public function markAsRead(User $user, string $notificationId): ?DatabaseNotification
    {
        $notification = $user->notifications()->find($notificationId);

        if ($notification) {
            $notification->markAsRead();
        }

        return $notification;
    }

    public function dispatchWeatherAlerts(string $district, string $severity, string $message, array $weatherData = []): Collection
    {
        $users = User::query()
            ->where('role', 'farmer')
            ->where('district', $district)
            ->get();

        return $users->map(function (User $user) use ($district, $severity, $message, $weatherData) {
            $alert = WeatherAlert::create([
                'user_id' => $user->id,
                'district' => $district,
                'alert_type' => 'weather',
                'severity' => $severity,
                'message' => $message,
                'weather_data' => $weatherData,
                'sent_at' => now(),
            ]);

            $user->notify(new WeatherAlertNotification($alert));

            return $alert;
        });
    }

    public function dispatchRecommendationAlert(PredictionHistory $history): void
    {
        $history->user->notify(new CropRecommendationAlertNotification($history));

        $this->auditLogService->log(
            'notification.recommendation.sent',
            $history->user_id,
            $history,
            [
                'recommended_crop' => $history->recommended_crop,
                'confidence' => $history->confidence,
            ]
        );
    }
}
