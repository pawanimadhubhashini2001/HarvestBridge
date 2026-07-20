import { apiClient } from '@/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';

export interface DonationDto {
  id: number;
  status: string;
  collection_status?: string;
  quantity: number | string;
  unit: string;
  price_per_unit?: number | string | null;
  description?: string | null;
  notes?: string | null;
  pickup_location?: string | null;
  pickup_date?: string | null;
  pickup_time?: string | null;
  available_until?: string | null;
  crop_name?: string | null;
  crop_category?: string | null;
  product?: {
    id?: number;
    crop_id?: number | null;
    crop_name?: string | null;
    crop_category?: string | null;
    listing_description?: string | null;
    available_quantity?: number | string | null;
    listing_unit?: string | null;
    listing_status?: string | null;
  } | null;
  created_at: string;
  updated_at?: string | null;
}

export interface CreateDonationPayload {
  harvest_listing_id?: number;
  crop_name?: string;
  crop_category?: string;
  quantity: number;
  unit: string;
  price_per_unit?: number;
  description: string;
  pickup_location: string;
  pickup_date?: string;
  pickup_time?: string;
  available_until: string;
  notes?: string;
}

export function getDonationsQueryKey() {
  return ['donations'] as const;
}

export async function getDonations() {
  const response = await apiClient.get<ApiSuccessResponse<DonationDto[]>>('/donations');

  return response.data.data;
}

export async function createDonation(payload: CreateDonationPayload) {
  const response = await apiClient.post<ApiSuccessResponse<DonationDto>>('/donations', payload);

  return response.data.data;
}
