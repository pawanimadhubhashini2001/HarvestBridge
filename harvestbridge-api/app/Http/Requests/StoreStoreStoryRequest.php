<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStoreStoryRequest extends FormRequest
{
    private const MAX_IMAGE_KB = 5120;
    private const MAX_VIDEO_KB = 25600;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'caption' => 'nullable|string|max:500',
            'media' => 'required|file|max:25600',
        ];
    }

    public function after(): array
    {
        return [
            function ($validator) {
                $media = $this->file('media');

                if ($media === null) {
                    return;
                }

                $mimeType = (string) $media->getMimeType();
                $sizeInKb = (int) ceil($media->getSize() / 1024);

                if (
                    ! str_starts_with($mimeType, 'image/')
                    && ! str_starts_with($mimeType, 'video/')
                ) {
                    $validator->errors()->add(
                        'media',
                        'The story media must be a valid image or video file.'
                    );

                    return;
                }

                if (
                    str_starts_with($mimeType, 'image/')
                    && $sizeInKb > self::MAX_IMAGE_KB
                ) {
                    $validator->errors()->add(
                        'media',
                        'Story images may not be larger than 5 MB.'
                    );
                }

                if (
                    str_starts_with($mimeType, 'video/')
                    && $sizeInKb > self::MAX_VIDEO_KB
                ) {
                    $validator->errors()->add(
                        'media',
                        'Story videos may not be larger than 25 MB.'
                    );
                }
            },
        ];
    }
}
