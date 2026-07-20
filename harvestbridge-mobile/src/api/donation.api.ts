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
  images?: Array<{
    id: number;
    url: string;
    sort_order?: number | null;
  }>;
  primary_image?: {
    id: number;
    url: string;
    sort_order?: number | null;
  } | null;
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
  images?: Array<{
    uri: string;
    name: string;
    type: string;
    file?: Blob | null;
  }>;
}

export function getDonationsQueryKey() {
  return ['donations'] as const;
}

export async function getDonations() {
  const response = await apiClient.get<ApiSuccessResponse<DonationDto[]>>('/donations');

  return response.data.data;
}

export async function createDonation(payload: CreateDonationPayload) {
  const formData = new FormData();

  if (payload.harvest_listing_id !== undefined) {
    formData.append('harvest_listing_id', String(payload.harvest_listing_id));
  }

  if (payload.crop_name !== undefined) {
    formData.append('crop_name', payload.crop_name);
  }

  if (payload.crop_category !== undefined) {
    formData.append('crop_category', payload.crop_category);
  }

  formData.append('quantity', String(payload.quantity));
  formData.append('unit', payload.unit);

  if (payload.price_per_unit !== undefined) {
    formData.append('price_per_unit', String(payload.price_per_unit));
  }

  formData.append('description', payload.description);
  formData.append('pickup_location', payload.pickup_location);

  if (payload.pickup_date) {
    formData.append('pickup_date', payload.pickup_date);
  }

  if (payload.pickup_time) {
    formData.append('pickup_time', payload.pickup_time);
  }

  formData.append('available_until', payload.available_until);

  if (payload.notes) {
    formData.append('notes', payload.notes);
  }

  (payload.images ?? []).forEach((image) => {
    const imageFile =
      image.file
      ?? ({
        uri: image.uri,
        name: image.name,
        type: image.type,
      } as unknown as Blob);

    formData.append('images[]', imageFile, image.name);
  });

  const response = await apiClient.post<ApiSuccessResponse<DonationDto>>(
    '/donations',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data.data;
}

export async function deleteDonation(donationId: number) {
  await apiClient.delete(`/donations/${donationId}`);
}
