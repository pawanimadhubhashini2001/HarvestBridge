<?php

namespace App\Services;

use App\Models\Farm;
use App\Models\FavoriteProduct;
use App\Models\FavoriteStore;
use App\Models\HarvestListing;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class FavoriteService
{
    public function getFavorites(User $user): array
    {
        $this->assertConsumer($user);

        return [
            'stores' => $this->getFavoriteStores($user),
            'products' => $this->getFavoriteProducts($user),
        ];
    }

    public function getFavoriteStores(User $user): Collection
    {
        $this->assertConsumer($user);

        return Farm::query()
            ->join('favorite_stores', 'favorite_stores.farm_id', '=', 'farms.id')
            ->where('favorite_stores.user_id', $user->id)
            ->select('farms.*')
            ->latest('favorite_stores.created_at')
            ->get();
    }

    public function getFavoriteProducts(User $user): Collection
    {
        $this->assertConsumer($user);

        return HarvestListing::query()
            ->join('favorite_products', 'favorite_products.harvest_listing_id', '=', 'harvest_listings.id')
            ->where('favorite_products.user_id', $user->id)
            ->with([
                'crop:id,name,category',
                'farm:id,farm_name,district,address,latitude,longitude,business_status',
                'farmer:id,name',
                'images:id,harvest_listing_id,image_path,sort_order',
            ])
            ->select('harvest_listings.*')
            ->latest('favorite_products.created_at')
            ->get();
    }

    public function favoriteStore(User $user, Farm $store): Farm
    {
        $this->assertConsumer($user);

        FavoriteStore::query()->firstOrCreate([
            'user_id' => $user->id,
            'farm_id' => $store->id,
        ]);

        return $store->fresh() ?? $store;
    }

    public function unfavoriteStore(User $user, Farm $store): void
    {
        $this->assertConsumer($user);

        FavoriteStore::query()
            ->where('user_id', $user->id)
            ->where('farm_id', $store->id)
            ->delete();
    }

    public function favoriteProduct(User $user, HarvestListing $product): HarvestListing
    {
        $this->assertConsumer($user);

        FavoriteProduct::query()->firstOrCreate([
            'user_id' => $user->id,
            'harvest_listing_id' => $product->id,
        ]);

        return $product->fresh() ?? $product;
    }

    public function unfavoriteProduct(User $user, HarvestListing $product): void
    {
        $this->assertConsumer($user);

        FavoriteProduct::query()
            ->where('user_id', $user->id)
            ->where('harvest_listing_id', $product->id)
            ->delete();
    }

    private function assertConsumer(User $user): void
    {
        if ($user->role !== 'consumer') {
            throw ValidationException::withMessages([
                'favorites' => ['Only authenticated consumers can manage favorites.'],
            ]);
        }
    }
}
