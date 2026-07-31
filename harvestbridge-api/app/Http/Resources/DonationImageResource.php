<?php

namespace App\Http\Resources;

use App\Support\MediaStorage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DonationImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'url' => MediaStorage::url($this->image_path, $request),
            'sort_order' => $this->sort_order,
            'is_primary' => $this->isPrimary(),
        ];
    }
}
