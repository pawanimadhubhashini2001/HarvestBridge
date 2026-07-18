import { apiClient } from '@/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';

export type HarvestListingStatus =
  | 'available'
  | 'hidden'
  | 'sold'
  | 'expired'
  | 'reserved'
  | 'donated';

export interface HarvestListingImageDto {
  id: number;
  url: string;
  sort_order: number | null;
  is_primary: boolean;
}

export interface HarvestListingDto {
  id: number;
  user_id: number;
  farm_id: number;
  crop_id: number;
  crop?: string | null;
  crop_category?: string | null;
  quantity: number | string;
  total_quantity: number | string;
  available_quantity: number | string;
  reserved_quantity: number | string;
  sold_quantity: number | string;
  unit: string;
  price_per_unit: number | string;
  quality_grade?: string | null;
  harvest_date?: string | null;
  available_until?: string | null;
  status: HarvestListingStatus;
  status_label?: string | null;
  is_available: boolean;
  description?: string | null;
  images: HarvestListingImageDto[];
  primary_image?: HarvestListingImageDto | null;
  created_at: string;
  updated_at?: string | null;
}

export interface HarvestListingImageAsset {
  uri: string;
  name: string;
  type: string;
}

export interface UpdateHarvestListingAvailabilityPayload {
  status?: 'available' | 'hidden' | 'sold_out';
  available_quantity?: number;
}

export function getHarvestListingsQueryKey() {
  return ['harvest-listings'] as const;
}

export async function getHarvestListings() {
  const response = await apiClient.get<ApiSuccessResponse<HarvestListingDto[]>>('/harvest-listings');

  return response.data.data;
}

export async function updateHarvestListingAvailability(
  listingId: number | string,
  payload: UpdateHarvestListingAvailabilityPayload,
) {
  const normalizedPayload = {
    ...payload,
    status: payload.status === 'sold_out' ? 'sold' : payload.status,
  };

  const response = await apiClient.patch<ApiSuccessResponse<HarvestListingDto>>(
    `/harvest-listings/${listingId}/availability`,
    normalizedPayload,
  );

  return response.data.data;
}

export async function deleteHarvestListing(listingId: number | string) {
  const response = await apiClient.delete<ApiSuccessResponse<null>>(
    `/harvest-listings/${listingId}`,
  );

  return response.data;
}

export async function uploadHarvestListingImages(
  listingId: number | string,
  images: HarvestListingImageAsset[],
) {
  const formData = new FormData();

  images.forEach((image) => {
    formData.append('images[]', {
      uri: image.uri,
      name: image.name,
      type: image.type,
    } as unknown as Blob);
  });

  const response = await apiClient.post<ApiSuccessResponse<HarvestListingDto>>(
    `/harvest-listings/${listingId}/images`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data.data;
}

export async function deleteHarvestListingImage(
  listingId: number | string,
  imageId: number | string,
) {
  const response = await apiClient.delete<ApiSuccessResponse<HarvestListingDto>>(
    `/harvest-listings/${listingId}/images/${imageId}`,
  );

  return response.data.data;
}

export async function setHarvestListingPrimaryImage(
  listingId: number | string,
  imageId: number | string,
) {
  const response = await apiClient.patch<ApiSuccessResponse<HarvestListingDto>>(
    `/harvest-listings/${listingId}/images/${imageId}/primary`,
  );

  return response.data.data;
}

export async function reorderHarvestListingImages(
  listingId: number | string,
  imageIds: number[],
) {
  const response = await apiClient.patch<ApiSuccessResponse<HarvestListingDto>>(
    `/harvest-listings/${listingId}/images/order`,
    {
      image_ids: imageIds,
    },
  );

  return response.data.data;
}
