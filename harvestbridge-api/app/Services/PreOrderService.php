<?php

namespace App\Services;

use App\Models\Crop;
use App\Models\Farm;
use App\Models\PreOrderProduct;
use App\Models\PreOrderRequest;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PreOrderService
{
    private const PRODUCT_RELATIONS = [
        'farmer:id,name,phone',
        'farm:id,user_id,farm_name,district,address,phone_number,business_status,latitude,longitude',
        'crop:id,name,category',
    ];

    private const REQUEST_RELATIONS = [
        'consumer:id,name,email,phone',
        'product.farmer:id,name,phone',
        'product.farm:id,user_id,farm_name,district,address,phone_number,business_status,latitude,longitude',
        'product.crop:id,name,category',
    ];

    public function farmerProducts(User $farmer)
    {
        return PreOrderProduct::with(self::PRODUCT_RELATIONS)
            ->where('farmer_id', $farmer->id)
            ->latest()
            ->get();
    }

    public function availableProducts()
    {
        return PreOrderProduct::with(self::PRODUCT_RELATIONS)
            ->where('status', PreOrderProduct::STATUS_OPEN)
            ->where('available_quantity', '>', 0)
            ->where(function ($query) {
                $query->whereNull('order_deadline')
                    ->orWhereDate('order_deadline', '>=', now()->toDateString());
            })
            ->orderBy('expected_harvest_date')
            ->latest()
            ->get();
    }

    public function createProduct(User $farmer, array $data): PreOrderProduct
    {
        $this->assertOwnedStore($farmer->id, $data['farm_id']);
        $data = $this->syncCropAttributes($data);
        $expectedQuantity = $this->toDecimal($data['expected_quantity']);

        $product = PreOrderProduct::create([
            ...$data,
            'farmer_id' => $farmer->id,
            'available_quantity' => $expectedQuantity,
            'reserved_quantity' => 0,
            'fulfilled_quantity' => 0,
            'status' => PreOrderProduct::STATUS_OPEN,
        ]);

        return $product->load(self::PRODUCT_RELATIONS);
    }

    public function updateProduct(PreOrderProduct $product, User $farmer, array $data): PreOrderProduct
    {
        $this->assertProductOwner($product, $farmer);
        $data = $this->syncCropAttributes($data);

        return DB::transaction(function () use ($product, $data) {
            /** @var PreOrderProduct $lockedProduct */
            $lockedProduct = PreOrderProduct::query()
                ->lockForUpdate()
                ->findOrFail($product->id);

            $expectedQuantity = array_key_exists('expected_quantity', $data)
                ? $this->toDecimal($data['expected_quantity'])
                : $this->toDecimal($lockedProduct->expected_quantity);
            $reservedQuantity = $this->toDecimal($lockedProduct->reserved_quantity);
            $fulfilledQuantity = $this->toDecimal($lockedProduct->fulfilled_quantity);
            $committedQuantity = $this->toDecimal($reservedQuantity + $fulfilledQuantity);

            if ($expectedQuantity < $committedQuantity) {
                throw ValidationException::withMessages([
                    'expected_quantity' => [
                        'Expected quantity cannot be less than already reserved and completed pre-orders.',
                    ],
                ]);
            }

            $data['expected_quantity'] = $expectedQuantity;
            $data['available_quantity'] = $this->toDecimal($expectedQuantity - $committedQuantity);

            $lockedProduct->update($data);

            return $lockedProduct->fresh()->load(self::PRODUCT_RELATIONS);
        });
    }

    public function deleteProduct(PreOrderProduct $product, User $farmer): void
    {
        $this->assertProductOwner($product, $farmer);

        if ($product->requests()->exists()) {
            throw ValidationException::withMessages([
                'pre_order_product' => ['This pre-order product has requests and cannot be deleted. Close it instead.'],
            ]);
        }

        $product->delete();
    }

    public function createRequest(User $consumer, array $data): PreOrderRequest
    {
        return DB::transaction(function () use ($consumer, $data) {
            /** @var PreOrderProduct $product */
            $product = PreOrderProduct::query()
                ->with(self::PRODUCT_RELATIONS)
                ->lockForUpdate()
                ->findOrFail($data['pre_order_product_id']);

            if ($product->farmer_id === $consumer->id) {
                throw ValidationException::withMessages([
                    'pre_order_product_id' => ['You cannot pre-order your own product.'],
                ]);
            }

            if (! $product->isOpenForRequests()) {
                throw ValidationException::withMessages([
                    'pre_order_product_id' => ['This pre-order product is not open for requests.'],
                ]);
            }

            $quantity = $this->toDecimal($data['quantity']);

            if ($quantity > (float) $product->available_quantity) {
                throw ValidationException::withMessages([
                    'quantity' => ['Requested quantity exceeds available pre-order stock.'],
                ]);
            }

            if (! empty($data['preferred_pickup_date'])) {
                $pickupDate = Carbon::parse($data['preferred_pickup_date']);
                $expectedHarvestDate = Carbon::parse($product->expected_harvest_date);

                if ($pickupDate->isBefore($expectedHarvestDate->startOfDay())) {
                    throw ValidationException::withMessages([
                        'preferred_pickup_date' => ['Pickup date must be on or after the expected harvest date.'],
                    ]);
                }
            }

            $subtotal = $this->toDecimal($quantity * (float) $product->price_per_unit);

            return PreOrderRequest::create([
                'pre_order_product_id' => $product->id,
                'consumer_id' => $consumer->id,
                'quantity' => $quantity,
                'price' => $product->price_per_unit,
                'subtotal' => $subtotal,
                'preferred_pickup_date' => $data['preferred_pickup_date'] ?? null,
                'notes' => $data['notes'] ?? null,
                'status' => PreOrderRequest::STATUS_PENDING,
            ])->load(self::REQUEST_RELATIONS);
        });
    }

    public function consumerRequests(User $consumer)
    {
        return PreOrderRequest::with(self::REQUEST_RELATIONS)
            ->where('consumer_id', $consumer->id)
            ->latest()
            ->get();
    }

    public function farmerRequests(User $farmer)
    {
        return PreOrderRequest::with(self::REQUEST_RELATIONS)
            ->whereHas('product', fn ($query) => $query->where('farmer_id', $farmer->id))
            ->latest()
            ->get();
    }

    public function updateRequestStatus(
        PreOrderRequest $request,
        string $status,
        User $farmer
    ): PreOrderRequest {
        return DB::transaction(function () use ($request, $status, $farmer) {
            /** @var PreOrderRequest $lockedRequest */
            $lockedRequest = PreOrderRequest::with('product')
                ->lockForUpdate()
                ->findOrFail($request->id);
            $product = PreOrderProduct::query()
                ->lockForUpdate()
                ->findOrFail($lockedRequest->pre_order_product_id);

            $this->assertProductOwner($product, $farmer);

            $current = $lockedRequest->status;
            $allowedTransitions = [
                PreOrderRequest::STATUS_PENDING => [
                    PreOrderRequest::STATUS_ACCEPTED,
                    PreOrderRequest::STATUS_REJECTED,
                ],
                PreOrderRequest::STATUS_ACCEPTED => [
                    PreOrderRequest::STATUS_READY,
                ],
                PreOrderRequest::STATUS_READY => [
                    PreOrderRequest::STATUS_COMPLETED,
                ],
                PreOrderRequest::STATUS_REJECTED => [],
                PreOrderRequest::STATUS_COMPLETED => [],
            ];

            if (! in_array($status, $allowedTransitions[$current] ?? [], true)) {
                throw ValidationException::withMessages([
                    'status' => ["Cannot change pre-order request from {$current} to {$status}."],
                ]);
            }

            if ($current === PreOrderRequest::STATUS_PENDING && $status === PreOrderRequest::STATUS_ACCEPTED) {
                $this->reserveProductStock($product, (float) $lockedRequest->quantity);
                $lockedRequest->accepted_at = now();
            }

            if ($status === PreOrderRequest::STATUS_READY) {
                $lockedRequest->ready_at = now();
            }

            if ($current === PreOrderRequest::STATUS_READY && $status === PreOrderRequest::STATUS_COMPLETED) {
                $this->completeProductStock($product, (float) $lockedRequest->quantity);
                $lockedRequest->completed_at = now();
            }

            $lockedRequest->status = $status;
            $lockedRequest->save();

            return $lockedRequest->fresh()->load(self::REQUEST_RELATIONS);
        });
    }

    private function reserveProductStock(PreOrderProduct $product, float $quantity): void
    {
        $requestedQuantity = $this->toDecimal($quantity);
        $availableQuantity = $this->toDecimal($product->available_quantity);

        if ($requestedQuantity > $availableQuantity) {
            throw ValidationException::withMessages([
                'quantity' => ['Requested quantity exceeds available pre-order stock.'],
            ]);
        }

        $product->update([
            'available_quantity' => $this->toDecimal($availableQuantity - $requestedQuantity),
            'reserved_quantity' => $this->toDecimal((float) $product->reserved_quantity + $requestedQuantity),
        ]);
    }

    private function completeProductStock(PreOrderProduct $product, float $quantity): void
    {
        $requestedQuantity = $this->toDecimal($quantity);
        $reservedQuantity = $this->toDecimal($product->reserved_quantity);

        if ($requestedQuantity > $reservedQuantity) {
            throw ValidationException::withMessages([
                'quantity' => ['Cannot complete more pre-order stock than is reserved.'],
            ]);
        }

        $product->update([
            'reserved_quantity' => $this->toDecimal($reservedQuantity - $requestedQuantity),
            'fulfilled_quantity' => $this->toDecimal((float) $product->fulfilled_quantity + $requestedQuantity),
        ]);
    }

    private function syncCropAttributes(array $data): array
    {
        $cropId = $data['crop_id'] ?? null;

        if ($cropId) {
            $crop = Crop::query()->find($cropId);

            if ($crop) {
                $data['crop_name'] = trim((string) ($data['crop_name'] ?? $crop->name));
                $data['crop_category'] = $data['crop_category'] ?? $crop->category;
            }
        }

        if (array_key_exists('crop_name', $data)) {
            $data['crop_name'] = trim((string) $data['crop_name']);
        }

        return $data;
    }

    private function assertOwnedStore(int $userId, mixed $farmId): void
    {
        $ownsStore = Farm::query()
            ->where('user_id', $userId)
            ->whereKey($farmId)
            ->exists();

        if (! $ownsStore) {
            throw ValidationException::withMessages([
                'farm_id' => ['Please create your Store Profile before adding pre-order products.'],
            ]);
        }
    }

    private function assertProductOwner(PreOrderProduct $product, User $farmer): void
    {
        if ($product->farmer_id !== $farmer->id) {
            throw ValidationException::withMessages([
                'pre_order_product' => ['You cannot manage this pre-order product.'],
            ]);
        }
    }

    private function toDecimal(float|int|string $value): float
    {
        return round((float) $value, 2);
    }
}
