import { apiClient } from '@/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';

export const ANALYTICS_AI_ENDPOINTS = {
  trends: '/analytics/ai/trends',
  mostRecommendedCrops: '/analytics/ai/most-recommended-crops',
  favorites: '/analytics/ai/favorites',
} as const;

export interface AnalyticsFilterParams {
  from?: string;
  to?: string;
  limit?: number;
  granularity?: 'week' | 'month';
}

export interface RecommendationTrendPoint {
  period: string;
  total: number;
  average_confidence: number;
}

export interface RecommendedCropDistributionItem {
  crop: string;
  total: number;
}

export interface FavoriteAnalyticsDto {
  total_recommendations: number;
  favorite_recommendations: number;
  favorite_rate: number;
  favorite_crops: RecommendedCropDistributionItem[];
}

export function getAnalyticsQueryKey(scope: 'trends' | 'crops' | 'favorites') {
  return ['analytics', 'ai', scope] as const;
}

export async function getRecommendationTrends(params: AnalyticsFilterParams = {}) {
  const response = await apiClient.get<ApiSuccessResponse<RecommendationTrendPoint[]>>(
    ANALYTICS_AI_ENDPOINTS.trends,
    {
      params,
    },
  );

  return response.data.data;
}

export async function getMostRecommendedCrops(params: AnalyticsFilterParams = {}) {
  const response = await apiClient.get<ApiSuccessResponse<RecommendedCropDistributionItem[]>>(
    ANALYTICS_AI_ENDPOINTS.mostRecommendedCrops,
    {
      params,
    },
  );

  return response.data.data;
}

export async function getFavoriteAnalytics(params: AnalyticsFilterParams = {}) {
  const response = await apiClient.get<ApiSuccessResponse<FavoriteAnalyticsDto>>(
    ANALYTICS_AI_ENDPOINTS.favorites,
    {
      params,
    },
  );

  return response.data.data;
}
