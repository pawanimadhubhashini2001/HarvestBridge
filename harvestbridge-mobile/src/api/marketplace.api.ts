import { apiClient } from '@/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';

export interface MarketplaceImageDto {
  id: number;
  url: string;
  sort_order: number | null;
  is_primary?: boolean;
}

export interface MarketplaceStoreSummaryDto {
  id: number;
  store_name: string;
  phone_number?: string | null;
  business_status?: string | null;
  district?: string | null;
  address?: string | null;
}

export interface MarketplaceCoordinatesDto {
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export interface MarketplaceOpenMapsActionDto {
  type: string;
  label: string;
  url: string;
}

export interface MarketplaceListingDto {
  id: number;
  crop?: string | null;
  farm?: string | null;
  farmer?: string | null;
  district?: string | null;
  matched_field?: string | null;
  recommendation_reason?: string | null;
  distance?: number | null;
  distance_km?: number | null;
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
  status: string;
  is_featured: boolean;
  is_favorite?: boolean;
  featured_until?: string | null;
  description?: string | null;
  created_at: string;
  updated_at?: string | null;
  images: MarketplaceImageDto[];
  store?: MarketplaceStoreSummaryDto | null;
  coordinates?: MarketplaceCoordinatesDto | null;
  google_maps_url?: string | null;
  open_maps_action?: MarketplaceOpenMapsActionDto | null;
}

export interface NearbyProductSuggestionDto {
  id: number;
  crop_id: number;
  crop?: string | null;
  crop_category?: string | null;
  description?: string | null;
  recommendation_reason?: string | null;
  available_quantity: number | string;
  unit: string;
  price_per_unit: number | string;
  quality_grade?: string | null;
  status: string;
  distance?: number | null;
  distance_km?: number | null;
  store?: MarketplaceStoreSummaryDto | null;
  coordinates?: MarketplaceCoordinatesDto | null;
  google_maps_url?: string | null;
  open_maps_action?: MarketplaceOpenMapsActionDto | null;
}

export interface MarketplacePaginationLinkDto {
  url: string | null;
  label: string;
  active: boolean;
}

export interface MarketplacePaginationMetaDto {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  [key: string]: unknown;
}

export interface MarketplaceIndexDto {
  listings: MarketplaceListingDto[];
  pagination: {
    links?: MarketplacePaginationLinkDto[] | null;
    meta?: MarketplacePaginationMetaDto | null;
  };
  nearby_suggestions: NearbyProductSuggestionDto[];
  recommended_for_you: NearbyProductSuggestionDto[];
  used_radius: number | string | null;
  results_found: number;
  expanded: boolean;
  search_scope?: string | null;
  message?: string | null;
}

export interface MarketplaceProductDetailDto {
  product: {
    id: number;
    crop_id: number;
    crop_name?: string | null;
    crop_category?: string | null;
    description?: string | null;
    quantity: number | string;
    available_quantity: number | string;
    reserved_quantity: number | string;
    sold_quantity: number | string;
    unit: string;
    price_per_unit: number | string;
    quality_grade?: string | null;
    harvest_date?: string | null;
    available_until?: string | null;
    status: string;
    status_label?: string | null;
    is_available: boolean;
    is_featured: boolean;
    is_favorite: boolean;
    featured_until?: string | null;
    images: MarketplaceImageDto[];
    primary_image?: MarketplaceImageDto | null;
    created_at: string;
    updated_at?: string | null;
  };
  contact: {
    phone?: string | null;
    whatsapp?: string | null;
    share_url?: string | null;
  };
  farmer?: {
    id: number;
    name: string;
  } | null;
  store?: {
    id: number;
    store_name: string;
    store_description?: string | null;
    store_logo_url?: string | null;
    store_cover_image_url?: string | null;
    phone_number?: string | null;
    whatsapp_number?: string | null;
    business_hours?: string | null;
    business_status?: string | null;
    is_favorite?: boolean;
  } | null;
  store_location?: {
    district?: string | null;
    address?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    distance_km?: number | null;
    google_maps_url?: string | null;
    open_maps_action?: MarketplaceOpenMapsActionDto | null;
  } | null;
  recommended_products: MarketplaceListingDto[];
  related_products: MarketplaceListingDto[];
}

export interface MarketplaceQueryParams {
  search?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  page?: number;
  per_page?: number;
  sort?: 'distance' | 'newest';
}

export function getMarketplaceQueryKey(params: Partial<MarketplaceQueryParams>) {
  return ['marketplace', params] as const;
}

export function getMarketplaceProductQueryKey(
  listingId: number | string,
  params: Pick<MarketplaceQueryParams, 'latitude' | 'longitude'> = {},
) {
  return ['marketplace', 'product', String(listingId), params] as const;
}

export async function getMarketplace(params: MarketplaceQueryParams) {
  const response = await apiClient.get<ApiSuccessResponse<MarketplaceIndexDto>>('/marketplace', {
    params,
  });

  return response.data.data;
}

export async function getMarketplaceProduct(
  listingId: number | string,
  params: Pick<MarketplaceQueryParams, 'latitude' | 'longitude'> = {},
) {
  const response = await apiClient.get<ApiSuccessResponse<MarketplaceProductDetailDto>>(
    `/marketplace/${listingId}`,
    {
      params,
    },
  );

  return response.data.data;
}
