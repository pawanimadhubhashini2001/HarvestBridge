<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AuthOtpNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected string $code,
        protected string $purpose,
        protected int $expiresInMinutes
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $action = $this->purpose === 'registration'
            ? 'complete your HarvestBridge registration'
            : 'sign in to HarvestBridge';

        return (new MailMessage)
            ->subject('Your HarvestBridge OTP')
            ->greeting('HarvestBridge verification')
            ->line("Use this OTP to {$action}:")
            ->line($this->code)
            ->line("This code expires in {$this->expiresInMinutes} minutes.");
    }
}
