import { apiClient } from '@/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';

export type PreOrderProductStatus = 'open' | 'closed' | 'cancelled' | 'completed';
export type PreOrderRequestStatus = 'pending' | 'accepted' | 'ready' | 'rejected' | 'completed';

export interface PreOrderProductDto {
  id: number;
  farmer_id: number;
  farm_id: number;
  crop_id?: number | null;
  crop_name?: string | null;
  crop?: string | null;
  crop_category?: string | null;
  description?: string | null;
  expected_quantity: number | string;
  available_quantity: number | string;
  reserved_quantity: number | string;
  fulfilled_quantity: number | string;
  unit: string;
  price_per_unit: number | string;
  quality_grade?: string | null;
  expected_harvest_date?: string | null;
  order_deadline?: string | null;
  status: PreOrderProductStatus;
  status_label?: string | null;
  is_available: boolean;
  farmer?: {
    id?: number | null;
    name?: string | null;
    phone?: string | null;
  } | null;
  store?: {
    id?: number | null;
    store_name?: string | null;
    district?: string | null;
    address?: string | null;
    phone_number?: string | null;
    business_status?: string | null;
    google_maps_url?: string | null;
    open_maps_action?: {
      type: string;
      label: string;
      url: string;
    } | null;
  } | null;
  created_at: string;
  updated_at?: string | null;
}

export interface PreOrderRequestDto {
  id: number;
  pre_order_product_id: number;
  consumer_id: number;
  quantity: number | string;
  price: number | string;
  subtotal: number | string;
  preferred_pickup_date?: string | null;
  notes?: string | null;
  status: PreOrderRequestStatus;
  accepted_at?: string | null;
  ready_at?: string | null;
  completed_at?: string | null;
  product?: PreOrderProductDto | null;
  consumer?: {
    id?: number | null;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  actions?: {
    phone?: string | null;
    google_maps_url?: string | null;
    open_maps_action?: {
      type: string;
      label: string;
      url: string;
    } | null;
  } | null;
  created_at: string;
  updated_at?: string | null;
}

export interface CreatePreOrderProductPayload {
  farm_id: number | string;
  crop_id?: number;
  crop_name: string;
  crop_category?: string;
  expected_quantity: number;
  unit: string;
  price_per_unit: number;
  quality_grade?: string;
  expected_harvest_date: string;
  order_deadline?: string;
  description?: string;
}

export interface CreatePreOrderRequestPayload {
  pre_order_product_id: number;
  quantity: number;
  preferred_pickup_date?: string;
  notes?: string;
}

export function getPreOrderProductsQueryKey() {
  return ['pre-order-products'] as const;
}

export function getAvailablePreOrdersQueryKey() {
  return ['available-pre-orders'] as const;
}

export function getPreOrderRequestsQueryKey() {
  return ['pre-order-requests'] as const;
}

export function getFarmerPreOrderRequestsQueryKey() {
  return ['pre-order-requests', 'farmer'] as const;
}

export async function getPreOrderProducts() {
  const response = await apiClient.get<ApiSuccessResponse<PreOrderProductDto[]>>(
    '/pre-order-products',
  );

  return response.data.data;
}

export async function getAvailablePreOrders() {
  const response = await apiClient.get<ApiSuccessResponse<PreOrderProductDto[]>>(
    '/available-pre-orders',
  );

  return response.data.data;
}

export async function createPreOrderProduct(payload: CreatePreOrderProductPayload) {
  const response = await apiClient.post<ApiSuccessResponse<PreOrderProductDto>>(
    '/pre-order-products',
    payload,
  );

  return response.data.data;
}

export async function deletePreOrderProduct(productId: number) {
  await apiClient.delete(`/pre-order-products/${productId}`);
}

export async function createPreOrderRequest(payload: CreatePreOrderRequestPayload) {
  const response = await apiClient.post<ApiSuccessResponse<PreOrderRequestDto>>(
    '/pre-order-requests',
    payload,
  );

  return response.data.data;
}

export async function getPreOrderRequests() {
  const response = await apiClient.get<ApiSuccessResponse<PreOrderRequestDto[]>>(
    '/pre-order-requests',
  );

  return response.data.data;
}

export async function getFarmerPreOrderRequests() {
  const response = await apiClient.get<ApiSuccessResponse<PreOrderRequestDto[]>>(
    '/farmer/pre-order-requests',
  );

  return response.data.data;
}

export async function updatePreOrderRequestStatus(
  requestId: number | string,
  status: PreOrderRequestStatus,
) {
  const response = await apiClient.patch<ApiSuccessResponse<PreOrderRequestDto>>(
    `/pre-order-requests/${requestId}/status`,
    { status },
  );

  return response.data.data;
}
