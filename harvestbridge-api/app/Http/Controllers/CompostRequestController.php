<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\StoreCompostRequestRequest;
use App\Http\Resources\CompostRequestResource;
use App\Services\CompostRequestService;

class CompostRequestController extends Controller
{
    public function __construct(

        protected CompostRequestService $service

    ){}

    public function store(

        StoreCompostRequestRequest $request

    )
    {
        $requestData=$this->service->create(

            $request->user(),

            $request->validated()

        );

        return ApiResponse::success(

            new CompostRequestResource(

                $requestData

            ),

            'Compost request submitted successfully.',

            201

        );
    }
}
