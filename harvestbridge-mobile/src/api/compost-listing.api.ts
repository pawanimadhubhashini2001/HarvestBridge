import { apiClient } from '@/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';

export interface CompostListingImageAsset {
  uri: string;
  name: string;
  type: string;
  file?: Blob | null;
}

export interface CompostListingDto {
  id: number;
  waste_type: string;
  crop_category?: string | null;
  quantity: number | string;
  unit: string;
  price_per_unit?: number | string | null;
  description?: string | null;
  notes?: string | null;
  pickup_location?: string | null;
  available_from?: string | null;
  available_until?: string | null;
  status: string;
  collection_status?: string;
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
  created_at: string;
  updated_at?: string | null;
}

export interface CreateCompostListingPayload {
  harvest_listing_id?: number;
  waste_type: string;
  crop_category: string;
  quantity: number;
  unit: string;
  price_per_unit?: number;
  pickup_location: string;
  available_from: string;
  available_until?: string;
  description: string;
  notes?: string;
  images?: CompostListingImageAsset[];
}

export function getCompostListingsQueryKey() {
  return ['compost-listings'] as const;
}

export async function getCompostListings() {
  const response = await apiClient.get<ApiSuccessResponse<CompostListingDto[]>>('/compost-listings');

  return response.data.data;
}

export async function createCompostListing(payload: CreateCompostListingPayload) {
  const formData = buildCompostListingFormData(payload);

  const response = await apiClient.post<ApiSuccessResponse<CompostListingDto>>(
    '/compost-listings',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data.data;
}

export async function updateCompostListing(
  listingId: number,
  payload: Partial<CreateCompostListingPayload>,
) {
  const formData = buildCompostListingFormData(payload);
  formData.append('_method', 'PUT');

  const response = await apiClient.post<ApiSuccessResponse<CompostListingDto>>(
    `/compost-listings/${listingId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data.data;
}

export async function deleteCompostListing(listingId: number) {
  await apiClient.delete(`/compost-listings/${listingId}`);
}

function buildCompostListingFormData(payload: Partial<CreateCompostListingPayload>) {
  const formData = new FormData();

  if (payload.harvest_listing_id !== undefined) {
    formData.append('harvest_listing_id', String(payload.harvest_listing_id));
  }

  if (payload.waste_type !== undefined) {
    formData.append('waste_type', payload.waste_type);
  }

  if (payload.crop_category !== undefined) {
    formData.append('crop_category', payload.crop_category);
  }

  if (payload.quantity !== undefined) {
    formData.append('quantity', String(payload.quantity));
  }

  if (payload.unit !== undefined) {
    formData.append('unit', payload.unit);
  }

  if (payload.price_per_unit !== undefined) {
    formData.append('price_per_unit', String(payload.price_per_unit));
  }

  if (payload.pickup_location !== undefined) {
    formData.append('pickup_location', payload.pickup_location);
  }

  if (payload.available_from !== undefined) {
    formData.append('available_from', payload.available_from);
  }

  if (payload.available_until) {
    formData.append('available_until', payload.available_until);
  }

  if (payload.description !== undefined) {
    formData.append('description', payload.description);
  }

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

  return formData;
}
