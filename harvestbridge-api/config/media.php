<?php

return [
    'disk' => env('MEDIA_DISK', env('FILESYSTEM_DISK', 'public')),
    'rewrite_public_urls_from_request' => env('MEDIA_REWRITE_PUBLIC_URLS_FROM_REQUEST', true),
];
