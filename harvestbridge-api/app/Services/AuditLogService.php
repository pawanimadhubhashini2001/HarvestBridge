<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditLogService
{
    public function log(
        string $action,
        ?int $userId = null,
        ?Model $auditable = null,
        array $metadata = [],
        ?Request $request = null
    ): AuditLog {
        return AuditLog::create([
            'user_id' => $userId,
            'action' => $action,
            'auditable_type' => $auditable?->getMorphClass(),
            'auditable_id' => $auditable?->getKey(),
            'metadata' => $metadata ?: null,
            'ip_address' => $request?->ip(),
        ]);
    }
}
