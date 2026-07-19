import { apiClient } from '@/api/apiClient';
import type { MarketplaceListingDto, MarketplaceOpenMapsActionDto } from '@/api/marketplace.api';
import type { ApiSuccessResponse, AppError } from '@/types/api';

export interface StoreOpenMapsActionDto {
  type: 'open_url';
  label: string;
  url: string;
}

export type StoreBusinessStatus = 'open' | 'closed' | 'temporarily_closed';

export interface StoreDto {
  id: number;
  store_name: string;
  store_description?: string | null;
  store_image_url?: string | null;
  store_logo_url?: string | null;
  logo_url?: string | null;
  store_cover_image_url?: string | null;
  cover_url?: string | null;
  phone_number: string;
  district: string;
  address: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  google_maps_location?: string | null;
  google_maps_url?: string | null;
  open_maps_action?: StoreOpenMapsActionDto | null;
  business_status?: StoreBusinessStatus | null;
  active_crop_count?: number;
  created_at: string;
  updated_at?: string | null;
}

export interface StoreLocationDto {
  id: number;
  store_name: string;
  district: string;
  address: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  google_maps_location?: string | null;
  google_maps_url?: string | null;
  open_maps_action?: StoreOpenMapsActionDto | null;
  updated_at?: string | null;
}

export interface StoreStatusDto {
  id: number;
  store_name: string;
  business_status: StoreBusinessStatus;
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
  store_logo?: StoreImageAsset | null;
  store_cover_image?: StoreImageAsset | null;
}

export type UpdateStorePayload = Partial<StorePayload>;

export interface StoreLocationPayload {
  district: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface StoreStatusPayload {
  business_status: StoreBusinessStatus;
}

export interface PublicStoreQueryParams {
  latitude?: number;
  longitude?: number;
  radius?: number;
  page?: number;
  per_page?: number;
}

export interface PublicStoreDetailsDto {
  id: number;
  store_name: string;
  store_description?: string | null;
  store_logo_url?: string | null;
  store_cover_image_url?: string | null;
  phone_number?: string | null;
  district?: string | null;
  address?: string | null;
  business_status?: StoreBusinessStatus | null;
  distance_km?: number | null;
  active_products_count: number;
  owner?: {
    id: number;
    name: string;
    phone?: string | null;
  } | null;
  location: {
    district?: string | null;
    address?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    google_maps_url?: string | null;
    open_maps_action?: MarketplaceOpenMapsActionDto | null;
  };
  actions: {
    phone?: string | null;
    whatsapp?: string | null;
    google_maps_url?: string | null;
    open_maps_action?: MarketplaceOpenMapsActionDto | null;
    share_url?: string | null;
  };
  reviews: {
    average_rating?: number | null;
    review_count: number;
    total_ratings: number;
    rating_breakdown: {
      five_star_count: number;
      four_star_count: number;
      three_star_count: number;
      two_star_count: number;
      one_star_count: number;
    };
  };
  is_favorite: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface PublicStoreProductsDto {
  products: MarketplaceListingDto[];
  pagination: {
    links?: {
      url: string | null;
      label: string;
      active: boolean;
    }[] | null;
    meta?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number | null;
      to: number | null;
      [key: string]: unknown;
    } | null;
  };
}

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

  if (payload.store_logo) {
    formData.append('store_logo', {
      uri: payload.store_logo.uri,
      name: payload.store_logo.name,
      type: payload.store_logo.type,
    } as unknown as Blob);
  }

  if (payload.store_cover_image) {
    formData.append('store_cover_image', {
      uri: payload.store_cover_image.uri,
      name: payload.store_cover_image.name,
      type: payload.store_cover_image.type,
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

export function getStoreLocationQueryKey(storeId?: number | string) {
  return ['store', 'location', storeId ? String(storeId) : 'me'] as const;
}

export function getStoreStatusQueryKey(storeId?: number | string) {
  return ['store', 'status', storeId ? String(storeId) : 'me'] as const;
}

export function getPublicStoreDetailsQueryKey(
  storeId: number | string,
  params: Partial<PublicStoreQueryParams> = {},
) {
  return ['store', 'public', 'details', String(storeId), params] as const;
}

export function getPublicStoreProductsQueryKey(
  storeId: number | string,
  params: Partial<PublicStoreQueryParams> = {},
) {
  return ['store', 'public', 'products', String(storeId), params] as const;
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

export async function getStoreLocation(storeId: number | string) {
  const response = await apiClient.get<ApiSuccessResponse<StoreLocationDto>>(
    `/stores/${storeId}/location`,
  );

  return response.data.data;
}

export async function getStoreStatus(storeId: number | string) {
  const response = await apiClient.get<ApiSuccessResponse<StoreStatusDto>>(
    `/stores/${storeId}/status`,
  );

  return response.data.data;
}

export async function getPublicStoreDetails(
  storeId: number | string,
  params: PublicStoreQueryParams = {},
) {
  const response = await apiClient.get<ApiSuccessResponse<PublicStoreDetailsDto>>(
    `/stores/public/${storeId}`,
    {
      params,
    },
  );

  return response.data.data;
}

export async function getPublicStoreProducts(
  storeId: number | string,
  params: PublicStoreQueryParams = {},
) {
  const response = await apiClient.get<ApiSuccessResponse<PublicStoreProductsDto>>(
    `/stores/public/${storeId}/products`,
    {
      params,
    },
  );

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

export async function updateStoreLocation(
  storeId: number | string,
  payload: StoreLocationPayload,
) {
  const response = await apiClient.put<ApiSuccessResponse<StoreLocationDto>>(
    `/stores/${storeId}/location`,
    payload,
  );

  return response.data.data;
}

export async function updateStoreStatus(
  storeId: number | string,
  payload: StoreStatusPayload,
) {
  const response = await apiClient.put<ApiSuccessResponse<StoreStatusDto>>(
    `/stores/${storeId}/status`,
    payload,
  );

  return response.data.data;
}

export async function deleteStore(storeId: number | string) {
  const response = await apiClient.delete<ApiSuccessResponse<null>>(`/stores/${storeId}`);

  return response.data;
}

function buildStoreImageFormData(fieldName: 'store_logo' | 'store_cover_image', image: StoreImageAsset) {
  const formData = new FormData();

  formData.append(fieldName, {
    uri: image.uri,
    name: image.name,
    type: image.type,
  } as unknown as Blob);

  return formData;
}

export async function uploadStoreLogo(storeId: number | string, image: StoreImageAsset) {
  const response = await apiClient.post<ApiSuccessResponse<StoreDto>>(
    `/stores/${storeId}/logo`,
    buildStoreImageFormData('store_logo', image),
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data.data;
}

export async function uploadStoreCover(storeId: number | string, image: StoreImageAsset) {
  const response = await apiClient.post<ApiSuccessResponse<StoreDto>>(
    `/stores/${storeId}/cover`,
    buildStoreImageFormData('store_cover_image', image),
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data.data;
}

export async function deleteStoreLogo(storeId: number | string) {
  const response = await apiClient.delete<ApiSuccessResponse<StoreDto>>(`/stores/${storeId}/logo`);

  return response.data.data;
}

export async function deleteStoreCover(storeId: number | string) {
  const response = await apiClient.delete<ApiSuccessResponse<StoreDto>>(`/stores/${storeId}/cover`);

  return response.data.data;
}
