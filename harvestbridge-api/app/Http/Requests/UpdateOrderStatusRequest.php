<?php

namespace App\Http\Requests;

use App\Models\Order;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderStatusRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules.
     */
    public function rules(): array
    {
        return [

            'status' => [
                'required',
                Rule::in([
                    Order::STATUS_ACCEPTED,
                    Order::STATUS_REJECTED,
                    Order::STATUS_COMPLETED,
                ]),
            ],

        ];
    }
}
