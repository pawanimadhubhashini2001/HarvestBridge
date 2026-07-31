<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'status' => $this->status,
            'phone' => $this->phone,
            'district' => $this->district,
            'organization_name' => $this->organization_name,
            'company_name' => $this->company_name,
            'profile_photo' => $this->profile_photo,
            'can_suspend' => $this->status === 'active',
            'can_activate' => $this->status !== 'active',
            'created_at' => $this->created_at?->toDateTimeString(),
        ];
    }
}
