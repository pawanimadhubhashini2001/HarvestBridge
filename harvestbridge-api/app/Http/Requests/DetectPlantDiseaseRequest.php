<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DetectPlantDiseaseRequest extends FormRequest
{
    private const MAX_IMAGE_KB = 10240;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'image' => 'required|file|max:10240',
        ];
    }

    public function after(): array
    {
        return [
            function ($validator) {
                $image = $this->file('image');

                if ($image === null) {
                    return;
                }

                $mimeType = (string) $image->getMimeType();
                $sizeInKb = (int) ceil($image->getSize() / 1024);

                if (! str_starts_with($mimeType, 'image/')) {
                    $validator->errors()->add(
                        'image',
                        'The plant image must be a valid image file.'
                    );

                    return;
                }

                if ($sizeInKb > self::MAX_IMAGE_KB) {
                    $validator->errors()->add(
                        'image',
                        'Plant images may not be larger than 10 MB.'
                    );
                }
            },
        ];
    }
}
