<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CropResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'crop_name' => $this->crop_name,

            'category' => $this->category,

            'description' => $this->description,

            'created_at' => $this->created_at

        ];
    }
}
