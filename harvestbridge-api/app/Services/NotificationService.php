<?php

namespace App\Services;

use App\Models\CompostRequest;
use App\Models\DonationRequest;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PredictionHistory;
use App\Models\User;
use App\Models\WeatherAlert;
use App\Notifications\CropRecommendationAlertNotification;
use App\Notifications\SystemMessageNotification;
use App\Notifications\WeatherAlertNotification;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

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

    public function notifyOrderSubmitted(Order $order): void
    {
        $item = $order->items->first();
        $listing = $item?->harvestListing;
        $farmer = $listing?->farmer;

        if (! $item instanceof OrderItem || ! $listing || ! $farmer) {
            return;
        }

        $this->sendInApp(
            $farmer,
            'New Product Order',
            sprintf(
                '%s ordered %s %s of %s.',
                $order->consumer?->name ?? 'A consumer',
                $item->quantity,
                $listing->unit,
                $listing->crop?->name ?? $listing->crop_name ?? 'your product'
            ),
            $order->consumer,
            [
                'category' => 'normal_order_request',
                'order_id' => $order->id,
                'listing_id' => $listing->id,
                'status' => $order->order_status,
                'route' => 'FarmerOrders',
            ]
        );
    }

    public function notifyOrderStatusUpdated(Order $order, User $farmer): void
    {
        $consumer = $order->consumer;

        if (! $consumer) {
            return;
        }

        $item = $order->items->first();
        $listing = $item?->harvestListing;
        $statusLabel = $this->formatStatus($order->order_status);

        $this->sendInApp(
            $consumer,
            "Order {$statusLabel}",
            sprintf(
                'Your order for %s has been %s.',
                $listing?->crop?->name ?? $listing?->crop_name ?? 'a product',
                $order->order_status
            ),
            $farmer,
            [
                'category' => 'normal_order_status',
                'order_id' => $order->id,
                'listing_id' => $listing?->id,
                'status' => $order->order_status,
                'route' => 'MyOrders',
            ]
        );
    }

    public function notifyDonationRequestSubmitted(DonationRequest $request): void
    {
        $donation = $request->donation;
        $farmer = $donation?->farmer;

        if (! $donation || ! $farmer) {
            return;
        }

        $this->sendInApp(
            $farmer,
            'New Donation Request',
            sprintf(
                '%s requested %s %s of %s.',
                $request->ngo?->name ?? 'An NGO',
                $request->quantity,
                $donation->unit,
                $donation->crop_name ?? 'your donation'
            ),
            $request->ngo,
            [
                'category' => 'donation_request',
                'donation_request_id' => $request->id,
                'donation_id' => $donation->id,
                'status' => $request->status,
                'route' => 'FarmerOrders',
            ]
        );
    }

    public function notifyDonationRequestStatusUpdated(DonationRequest $request, User $farmer): void
    {
        $ngo = $request->ngo;
        $donation = $request->donation;

        if (! $ngo || ! $donation) {
            return;
        }

        $statusLabel = $this->formatStatus($request->status);

        $this->sendInApp(
            $ngo,
            "Donation Request {$statusLabel}",
            sprintf(
                'Your donation request for %s has been %s.',
                $donation->crop_name ?? 'a donation',
                $request->status
            ),
            $farmer,
            [
                'category' => 'donation_request_status',
                'donation_request_id' => $request->id,
                'donation_id' => $donation->id,
                'status' => $request->status,
                'route' => 'MyOrders',
            ]
        );
    }

    public function notifyCompostRequestSubmitted(CompostRequest $request): void
    {
        $listing = $request->compostListing;
        $farmer = $listing?->farmer;

        if (! $listing || ! $farmer) {
            return;
        }

        $this->sendInApp(
            $farmer,
            'New Compost Request',
            sprintf(
                '%s requested %s %s of %s.',
                $request->business?->name ?? 'A compost business',
                $request->quantity,
                $listing->unit,
                $listing->waste_type ?? 'your compost listing'
            ),
            $request->business,
            [
                'category' => 'compost_request',
                'compost_request_id' => $request->id,
                'compost_listing_id' => $listing->id,
                'status' => $request->status,
                'route' => 'FarmerOrders',
            ]
        );
    }

    public function notifyCompostRequestStatusUpdated(CompostRequest $request, User $farmer): void
    {
        $business = $request->business;
        $listing = $request->compostListing;

        if (! $business || ! $listing) {
            return;
        }

        $statusLabel = $this->formatStatus($request->status);

        $this->sendInApp(
            $business,
            "Compost Request {$statusLabel}",
            sprintf(
                'Your compost request for %s has been %s.',
                $listing->waste_type ?? 'a compost listing',
                $request->status
            ),
            $farmer,
            [
                'category' => 'compost_request_status',
                'compost_request_id' => $request->id,
                'compost_listing_id' => $listing->id,
                'status' => $request->status,
                'route' => 'MyOrders',
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

    private function formatStatus(string $status): string
    {
        return Str::of($status)
            ->replace('_', ' ')
            ->title()
            ->toString();
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
