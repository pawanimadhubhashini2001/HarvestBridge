import { apiClient } from '@/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';

export type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface OrderItemDto {
  id: number;
  harvest_listing_id: number;
  quantity: number | string;
  price: number | string;
  subtotal: number | string;
  product?: {
    id: number;
    crop_name?: string | null;
    crop_category?: string | null;
    unit?: string | null;
    price_per_unit?: number | string | null;
    status?: string | null;
    available_quantity?: number | string | null;
    image_url?: string | null;
  } | null;
}

export interface OrderDto {
  id: number;
  consumer?: {
    id?: number | null;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  total_amount: number | string;
  order_status: OrderStatus;
  payment_status?: string | null;
  delivery_address?: string | null;
  visit_date?: string | null;
  notes?: string | null;
  created_at: string;
  store?: {
    id: number;
    store_name: string;
    district?: string | null;
    address?: string | null;
    phone_number?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    google_maps_url?: string | null;
    open_maps_action?: {
      type: string;
      label: string;
      url: string;
    } | null;
  } | null;
  items: OrderItemDto[];
}

export interface CreateOrderPayload {
  harvest_listing_id: number | string;
  quantity: number;
  visit_date: string;
  notes?: string;
}

export function getMyOrdersQueryKey() {
  return ['orders', 'consumer'] as const;
}

export function getFarmerOrdersQueryKey() {
  return ['orders', 'farmer'] as const;
}

export async function createOrder(payload: CreateOrderPayload) {
  const response = await apiClient.post<ApiSuccessResponse<OrderDto>>('/orders', payload);

  return response.data.data;
}

export async function getMyOrders() {
  const response = await apiClient.get<ApiSuccessResponse<OrderDto[]>>('/orders');

  return response.data.data;
}

export async function getFarmerOrders() {
  const response = await apiClient.get<ApiSuccessResponse<OrderDto[]>>('/farmer/orders');

  return response.data.data;
}

export async function updateOrderStatus(orderId: number | string, status: OrderStatus) {
  const response = await apiClient.patch<ApiSuccessResponse<OrderDto>>(
    `/orders/${orderId}/status`,
    { status },
  );

  return response.data.data;
}
