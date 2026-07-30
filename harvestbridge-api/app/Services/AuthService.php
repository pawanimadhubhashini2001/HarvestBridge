<?php

namespace App\Services;

use App\Models\AuthOtp;
use App\Models\User;
use App\Notifications\AuthOtpNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthService
{
    private const OTP_EXPIRES_IN_MINUTES = 10;

    private const OTP_MAX_ATTEMPTS = 5;

    public function register(array $data)
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
        ]);

        $token = $user->createToken('mobile_token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    public function requestRegistrationOtp(array $data): void
    {
        $email = $this->normalizeEmail($data['email']);

        $code = $this->createOtp(
            $email,
            AuthOtp::PURPOSE_REGISTRATION,
            [
                'name' => $data['name'],
                'email' => $email,
                'password' => Hash::make($data['password']),
                'role' => $data['role'],
            ]
        );

        $this->sendOtp($email, $code, AuthOtp::PURPOSE_REGISTRATION);
    }

    public function verifyRegistrationOtp(string $email, string $otp): array
    {
        $email = $this->normalizeEmail($email);

        return DB::transaction(function () use ($email, $otp) {
            if (User::where('email', $email)->exists()) {
                throw ValidationException::withMessages([
                    'email' => ['This email is already registered.'],
                ]);
            }

            $otpRecord = $this->validateOtp($email, AuthOtp::PURPOSE_REGISTRATION, $otp);
            $payload = $otpRecord->payload ?? [];

            $user = User::create([
                'name' => $payload['name'],
                'email' => $email,
                'password' => $payload['password'],
                'role' => $payload['role'],
            ]);

            $user->forceFill(['email_verified_at' => now()])->save();

            $otpRecord->update([
                'consumed_at' => now(),
                'payload' => null,
            ]);

            return $this->createSession($user);
        });
    }

    public function requestLoginOtp(array $credentials): void
    {
        $email = $this->normalizeEmail($credentials['email']);

        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password.'],
            ]);
        }

        $code = $this->createOtp($email, AuthOtp::PURPOSE_LOGIN);

        $this->sendOtp($email, $code, AuthOtp::PURPOSE_LOGIN);
    }

    public function verifyLoginOtp(string $email, string $otp): array
    {
        $email = $this->normalizeEmail($email);

        return DB::transaction(function () use ($email, $otp) {
            $user = User::where('email', $email)->first();

            if (! $user) {
                throw ValidationException::withMessages([
                    'email' => ['We could not find an account with that email.'],
                ]);
            }

            $otpRecord = $this->validateOtp($email, AuthOtp::PURPOSE_LOGIN, $otp);
            $otpRecord->update(['consumed_at' => now()]);

            if (! $user->email_verified_at) {
                $user->forceFill(['email_verified_at' => now()])->save();
            }

            return $this->createSession($user);
        });
    }

    public function login(array $credentials)
    {
        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password.'],
            ]);
        }

        return $this->createSession($user);
    }

    public function logout(User $user)
    {
        $user->currentAccessToken()?->delete();
    }

    public function forgotPassword(string $email): string
    {
        $status = Password::sendResetLink([
            'email' => $email,
        ]);

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return __($status);
    }

    private function createOtp(string $email, string $purpose, ?array $payload = null): string
    {
        $code = (string) random_int(100000, 999999);

        AuthOtp::query()
            ->where('email', $email)
            ->where('purpose', $purpose)
            ->whereNull('consumed_at')
            ->update([
                'consumed_at' => now(),
                'payload' => null,
            ]);

        AuthOtp::create([
            'email' => $email,
            'purpose' => $purpose,
            'code_hash' => Hash::make($code),
            'payload' => $payload,
            'expires_at' => now()->addMinutes(self::OTP_EXPIRES_IN_MINUTES),
        ]);

        return $code;
    }

    private function validateOtp(string $email, string $purpose, string $code): AuthOtp
    {
        /** @var AuthOtp|null $otpRecord */
        $otpRecord = AuthOtp::query()
            ->where('email', $email)
            ->where('purpose', $purpose)
            ->whereNull('consumed_at')
            ->latest()
            ->first();

        if (! $otpRecord || $otpRecord->expires_at->isPast()) {
            throw ValidationException::withMessages([
                'otp' => ['The OTP is invalid or has expired.'],
            ]);
        }

        if ($otpRecord->attempts >= self::OTP_MAX_ATTEMPTS) {
            throw ValidationException::withMessages([
                'otp' => ['Too many OTP attempts. Please request a new code.'],
            ]);
        }

        if (! Hash::check($code, $otpRecord->code_hash)) {
            $otpRecord->increment('attempts');

            throw ValidationException::withMessages([
                'otp' => ['The OTP is invalid or has expired.'],
            ]);
        }

        return $otpRecord;
    }

    private function sendOtp(string $email, string $code, string $purpose): void
    {
        Notification::route('mail', $email)->notify(
            new AuthOtpNotification($code, $purpose, self::OTP_EXPIRES_IN_MINUTES)
        );
    }

    private function createSession(User $user): array
    {
        $token = $user->createToken('mobile_token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    private function normalizeEmail(string $email): string
    {
        return strtolower(trim($email));
    }
}
