import { apiClient } from '@/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';

export interface StoreReviewDto {
  id: number;
  store_id: number;
  reviewer_id: number;
  rating: number;
  title: string;
  comment: string;
  is_visible: boolean;
  reviewer?: {
    id: number;
    name: string;
    profile_photo?: string | null;
  } | null;
  can_edit: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface StoreReviewSummaryDto {
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
}

export interface StoreReviewsDto {
  summary: StoreReviewSummaryDto;
  current_user_review?: StoreReviewDto | null;
  reviews: StoreReviewDto[];
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

export interface StoreReviewPayload {
  rating: number;
  title: string;
  comment: string;
}

export interface StoreReviewsQueryParams {
  per_page?: number;
}

export function getStoreReviewsQueryKey(
  storeId: number | string,
  params: StoreReviewsQueryParams = {},
) {
  return ['store', 'reviews', String(storeId), params] as const;
}

export async function getStoreReviews(
  storeId: number | string,
  params: StoreReviewsQueryParams = {},
) {
  const response = await apiClient.get<ApiSuccessResponse<StoreReviewsDto>>(
    `/stores/public/${storeId}/reviews`,
    {
      params,
    },
  );

  return response.data.data;
}

export async function createStoreReview(
  storeId: number | string,
  payload: StoreReviewPayload,
) {
  const response = await apiClient.post<ApiSuccessResponse<StoreReviewDto>>(
    `/stores/${storeId}/reviews`,
    payload,
  );

  return response.data.data;
}

export async function updateStoreReview(
  storeId: number | string,
  reviewId: number | string,
  payload: StoreReviewPayload,
) {
  const response = await apiClient.put<ApiSuccessResponse<StoreReviewDto>>(
    `/stores/${storeId}/reviews/${reviewId}`,
    payload,
  );

  return response.data.data;
}

export async function deleteStoreReview(
  storeId: number | string,
  reviewId: number | string,
) {
  const response = await apiClient.delete<ApiSuccessResponse<null>>(
    `/stores/${storeId}/reviews/${reviewId}`,
  );

  return response.data;
}
