<?php

namespace App\Providers;

use App\Models\Farm;
use App\Policies\FarmPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use App\Models\Crop;
use App\Policies\CropPolicy;
use App\Models\HarvestListing;
use App\Policies\HarvestListingPolicy;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::policy(Farm::class, FarmPolicy::class);
        Gate::policy(Crop::class, CropPolicy::class);
        Gate::policy(
            HarvestListing::class,
            HarvestListingPolicy::class
        );
    }
}
