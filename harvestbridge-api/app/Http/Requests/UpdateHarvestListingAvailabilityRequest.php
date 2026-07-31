<?php

namespace App\Http\Requests;

use App\Models\HarvestListing;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateHarvestListingAvailabilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'nullable',
                'string',
                Rule::in(HarvestListing::farmerManageableStatuses()),
            ],
            'available_quantity' => 'nullable|numeric|min:0',
        ];
    }

    public function after(): array
    {
        return [
            function ($validator) {
                if (! $this->hasAny(['status', 'available_quantity'])) {
                    $validator->errors()->add(
                        'availability',
                        'Please provide a status, an available quantity, or both.'
                    );
                }
            },
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('status')) {
            $normalizedStatus = strtolower(trim((string) $this->input('status')));

            $this->merge([
                'status' => match ($normalizedStatus) {
                    'sold_out' => HarvestListing::STATUS_SOLD,
                    default => $normalizedStatus,
                },
            ]);
        }
    }
}
