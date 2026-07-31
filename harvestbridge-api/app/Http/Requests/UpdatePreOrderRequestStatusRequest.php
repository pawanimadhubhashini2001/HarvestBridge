<?php

namespace App\Http\Requests;

use App\Models\PreOrderRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePreOrderRequestStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in([
                    PreOrderRequest::STATUS_ACCEPTED,
                    PreOrderRequest::STATUS_REJECTED,
                    PreOrderRequest::STATUS_READY,
                    PreOrderRequest::STATUS_COMPLETED,
                ]),
            ],
        ];
    }
}
