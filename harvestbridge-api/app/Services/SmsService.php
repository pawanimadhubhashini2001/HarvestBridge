<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class SmsService
{
    public function send(string $phone, string $message): array
    {
        $endpoint = config('services.sms.endpoint');

        if (!$endpoint) {
            throw new RuntimeException('SMS service endpoint is not configured.');
        }

        $response = Http::withToken(config('services.sms.token'))
            ->post($endpoint, [
                'to' => $phone,
                'message' => $message,
                'sender' => config('services.sms.sender'),
            ]);

        if ($response->failed()) {
            throw new RuntimeException('Unable to send SMS notification.');
        }

        return $response->json() ?? [
            'status' => 'sent',
        ];
    }
}
