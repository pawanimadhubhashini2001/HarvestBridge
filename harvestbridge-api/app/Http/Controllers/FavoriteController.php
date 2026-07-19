<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Resources\FavoriteStoreResource;
use App\Http\Resources\HarvestListingResource;
use App\Models\Farm;
use App\Models\HarvestListing;
use App\Services\FavoriteService;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function __construct(
        protected FavoriteService $service
    ) {}

    public function index(Request $request)
    {
        $favorites = $this->service->getFavorites($request->user());
        $favoriteProducts = $favorites['products']->map(function ($product) {
            $product->setAttribute('is_favorite', true);

            return $product;
        });

        return ApiResponse::success(
            [
                'stores' => FavoriteStoreResource::collection($favorites['stores'])->resolve(),
                'products' => HarvestListingResource::collection($favoriteProducts)->resolve(),
            ],
            'Favorites retrieved successfully'
        );
    }

    public function favoriteStore(Request $request, Farm $store)
    {
        return ApiResponse::success(
            new FavoriteStoreResource(
                $this->service->favoriteStore($request->user(), $store)
            ),
            'Store saved to favorites successfully'
        );
    }

    public function unfavoriteStore(Request $request, Farm $store)
    {
        $this->service->unfavoriteStore($request->user(), $store);

        return ApiResponse::success(
            null,
            'Store removed from favorites successfully'
        );
    }

    public function favoriteProduct(Request $request, HarvestListing $harvestListing)
    {
        $product = $this->service->favoriteProduct($request->user(), $harvestListing)
            ->load([
                'crop:id,name,category',
                'farm:id,farm_name,district,address,latitude,longitude,business_status',
                'farmer:id,name',
                'images:id,harvest_listing_id,image_path,sort_order',
            ]);
        $product->setAttribute('is_favorite', true);

        return ApiResponse::success(
            HarvestListingResource::make($product)->resolve(),
            'Product saved to favorites successfully'
        );
    }

    public function unfavoriteProduct(Request $request, HarvestListing $harvestListing)
    {
        $this->service->unfavoriteProduct($request->user(), $harvestListing);

        return ApiResponse::success(
            null,
            'Product removed from favorites successfully'
        );
    }
}
