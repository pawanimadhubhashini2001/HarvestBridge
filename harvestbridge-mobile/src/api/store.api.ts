import { apiClient } from '@/api/apiClient';
import type { ApiSuccessResponse, AppError } from '@/types/api';

export interface StoreDto {
  id: number;
  store_name: string;
  store_description?: string | null;
  store_image_url?: string | null;
  store_logo_url?: string | null;
  phone_number: string;
  district: string;
  address: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  google_maps_location?: string | null;
  google_maps_url?: string | null;
  business_status?: string | null;
  active_crop_count?: number;
  created_at: string;
  updated_at?: string | null;
}

export interface StoreImageAsset {
  uri: string;
  name: string;
  type: string;
}

export interface StorePayload {
  store_name: string;
  phone_number: string;
  district: string;
  address: string;
  latitude?: number;
  longitude?: number;
  store_description?: string;
  store_image?: StoreImageAsset | null;
}

export type UpdateStorePayload = Partial<StorePayload>;

function isNotFoundError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status?: number }).status === 404
  );
}

function buildStoreFormData(payload: StorePayload | UpdateStorePayload) {
  const formData = new FormData();

  const appendValue = (key: string, value: string | number | undefined) => {
    if (value === undefined) {
      return;
    }

    formData.append(key, String(value));
  };

  appendValue('store_name', payload.store_name?.trim());
  appendValue('phone_number', payload.phone_number?.trim());
  appendValue('district', payload.district?.trim());
  appendValue('address', payload.address?.trim());
  appendValue('latitude', payload.latitude);
  appendValue('longitude', payload.longitude);
  appendValue('store_description', payload.store_description?.trim());

  if (payload.store_image) {
    formData.append('store_image', {
      uri: payload.store_image.uri,
      name: payload.store_image.name,
      type: payload.store_image.type,
    } as unknown as Blob);
  }

  return formData;
}

export function getMyStoreQueryKey() {
  return ['store', 'me'] as const;
}

export function getStoreDetailsQueryKey(storeId?: number | string) {
  return ['store', 'details', storeId ? String(storeId) : 'me'] as const;
}

export async function getMyStore() {
  try {
    const response = await apiClient.get<ApiSuccessResponse<StoreDto>>('/stores/me');

    return response.data.data;
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

export async function getStoreDetails(storeId: number | string) {
  const response = await apiClient.get<ApiSuccessResponse<StoreDto>>(`/stores/${storeId}`);

  return response.data.data;
}

export async function createStore(payload: StorePayload) {
  const response = await apiClient.post<ApiSuccessResponse<StoreDto>>(
    '/stores',
    buildStoreFormData(payload),
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data.data;
}

export async function updateStore(storeId: number | string, payload: UpdateStorePayload) {
  const formData = buildStoreFormData(payload);
  formData.append('_method', 'PUT');

  const response = await apiClient.post<ApiSuccessResponse<StoreDto>>(
    `/stores/${storeId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data.data;
}
