<?php

namespace App\Notifications;

use App\Models\PredictionHistory;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CropRecommendationAlertNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected PredictionHistory $history
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject('New Crop Recommendation Available')
            ->line('Recommended crop: ' . $this->history->recommended_crop)
            ->line('Confidence: ' . $this->history->confidence)
            ->line('Season: ' . $this->history->season);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Crop Recommendation Alert',
            'recommended_crop' => $this->history->recommended_crop,
            'confidence' => $this->history->confidence,
            'season' => $this->history->season,
            'district' => $this->history->district,
            'prediction_history_id' => $this->history->id,
        ];
    }
}
