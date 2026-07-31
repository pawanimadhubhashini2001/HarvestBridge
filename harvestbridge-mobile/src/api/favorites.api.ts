import { apiClient } from '@/api/apiClient';
import type { MarketplaceListingDto } from '@/api/marketplace.api';
import type { ApiSuccessResponse } from '@/types/api';

export interface FavoriteStoreDto {
  id: number;
  store_name: string;
  store_description?: string | null;
  store_logo_url?: string | null;
  store_cover_image_url?: string | null;
  phone_number?: string | null;
  district?: string | null;
  address?: string | null;
  business_status?: string | null;
  google_maps_url?: string | null;
  open_maps_action?: {
    type: 'open_url';
    label: string;
    url: string;
  } | null;
  is_favorite: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface FavoritesDto {
  stores: FavoriteStoreDto[];
  products: MarketplaceListingDto[];
}

export function getFavoritesQueryKey() {
  return ['favorites'] as const;
}

export async function getFavorites() {
  const response = await apiClient.get<ApiSuccessResponse<FavoritesDto>>('/favorites');

  return response.data.data;
}

export async function favoriteStore(storeId: number | string) {
  const response = await apiClient.post<ApiSuccessResponse<FavoriteStoreDto>>(
    `/favorites/stores/${storeId}`,
  );

  return response.data.data;
}

export async function unfavoriteStore(storeId: number | string) {
  const response = await apiClient.delete<ApiSuccessResponse<null>>(`/favorites/stores/${storeId}`);

  return response.data;
}

export async function favoriteProduct(productId: number | string) {
  const response = await apiClient.post<ApiSuccessResponse<MarketplaceListingDto>>(
    `/favorites/products/${productId}`,
  );

  return response.data.data;
}

export async function unfavoriteProduct(productId: number | string) {
  const response = await apiClient.delete<ApiSuccessResponse<null>>(
    `/favorites/products/${productId}`,
  );

  return response.data;
}
