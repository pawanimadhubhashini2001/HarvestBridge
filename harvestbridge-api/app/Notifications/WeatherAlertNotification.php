<?php

namespace App\Notifications;

use App\Models\WeatherAlert;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WeatherAlertNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected WeatherAlert $weatherAlert
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject('Weather Alert for ' . $this->weatherAlert->district)
            ->line($this->weatherAlert->message)
            ->line('Severity: ' . ucfirst($this->weatherAlert->severity));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Weather Alert',
            'message' => $this->weatherAlert->message,
            'district' => $this->weatherAlert->district,
            'severity' => $this->weatherAlert->severity,
            'weather_data' => $this->weatherAlert->weather_data,
        ];
    }
}
