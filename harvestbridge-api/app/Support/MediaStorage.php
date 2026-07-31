<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class MediaStorage
{
    public static function disk(): string
    {
        return (string) config('media.disk', config('filesystems.default', 'public'));
    }

    public static function url(?string $path, ?Request $request = null): ?string
    {
        if ($path === null || trim($path) === '') {
            return null;
        }

        $url = self::resolveUrl($path);

        if (
            $request === null
            || ! config('media.rewrite_public_urls_from_request', true)
            || self::disk() !== 'public'
        ) {
            return $url;
        }

        return self::rewriteUrlToRequestHost($url, $request);
    }

    private static function resolveUrl(string $path): string
    {
        if (self::disk() === 's3') {
            $supabasePublicUrl = self::deriveSupabasePublicUrl($path);

            if ($supabasePublicUrl !== null) {
                return $supabasePublicUrl;
            }
        }

        return Storage::disk(self::disk())->url($path);
    }

    public static function delete(?string $path): void
    {
        if ($path === null || trim($path) === '') {
            return;
        }

        Storage::disk(self::disk())->delete($path);
    }

    public static function storeUploadedFile(
        UploadedFile $file,
        string $directory,
        ?string $name = null
    ): string {
        $path = $name === null
            ? $file->store($directory, self::disk())
            : $file->storeAs($directory, $name, self::disk());

        if (! is_string($path) || trim($path) === '') {
            throw new RuntimeException(
                'Media upload failed. Check the configured storage disk and credentials.'
            );
        }

        return $path;
    }

    private static function rewriteUrlToRequestHost(string $url, Request $request): string
    {
        if ($url === '') {
            return $url;
        }

        if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
            $parsedPath = parse_url($url, PHP_URL_PATH);

            if (! is_string($parsedPath) || $parsedPath === '') {
                return $url;
            }

            return rtrim($request->getSchemeAndHttpHost(), '/') . $parsedPath;
        }

        return rtrim($request->getSchemeAndHttpHost(), '/') . '/' . ltrim($url, '/');
    }

    private static function deriveSupabasePublicUrl(string $path): ?string
    {
        $configuredUrl = trim((string) env('AWS_URL', ''));

        if ($configuredUrl !== '') {
            return rtrim($configuredUrl, '/') . '/' . ltrim($path, '/');
        }

        $endpoint = trim((string) env('AWS_ENDPOINT', ''));
        $bucket = trim((string) env('AWS_BUCKET', ''));

        if ($endpoint === '' || $bucket === '') {
            return null;
        }

        $normalizedEndpoint = rtrim($endpoint, '/');
        $publicBase = str_replace(
            '.storage.supabase.co/storage/v1/s3',
            '.supabase.co/storage/v1/object/public',
            $normalizedEndpoint
        );

        if ($publicBase === $normalizedEndpoint) {
            return null;
        }

        return $publicBase . '/' . $bucket . '/' . ltrim($path, '/');
    }
}
