import { apiClient } from '@/api/apiClient';
import type { ApiSuccessResponse, LaravelPaginatedData } from '@/types/api';

export interface PredictionPayload {
  District: string;
  Season: string;
  Soil_Type: string;
  Temperature_C: number;
  Rainfall_mm: number;
  Humidity_pct: number;
  pH: number;
  Previous_Crop?: string | null;
  Previous_Yield_t_ha?: number | null;
  Market_Demand: string;
}

export interface SmartPredictionPayload {
  District: string;
  Season: string;
  Soil_Type: string;
  pH: number;
  Previous_Crop?: string | null;
  Previous_Yield_t_ha?: number | null;
  Market_Demand: string;
}

export interface PredictionHistoryDto {
  id: number;
  district: string;
  season: string;
  recommended_crop: string;
  confidence: number;
  market_demand: string;
  temperature: number | string;
  rainfall: number | string;
  humidity: number | string;
  created_at: string;
}

export interface RecommendationHistoryDto {
  id: number;
  recommended_crop: string;
  confidence: number;
  district: string;
  season: string;
  soil_type: string;
  market_demand: string;
  is_favorite: boolean;
  created_at: string;
}

export interface SearchRecommendationsParams {
  crop?: string;
  season?: string;
  from?: string;
  to?: string;
}

export function getPredictionHistoryQueryKey() {
  return ['ai', 'history'] as const;
}

export async function predict(payload: PredictionPayload) {
  const response = await apiClient.post<ApiSuccessResponse<Record<string, unknown>>>(
    '/ai/predict',
    payload,
  );

  return response.data.data;
}

export async function smartPredict(payload: SmartPredictionPayload) {
  const response = await apiClient.post<Record<string, unknown>>('/ai/smart-predict', payload);

  return response.data;
}

export async function getPredictionHistory() {
  const response = await apiClient.get<ApiSuccessResponse<PredictionHistoryDto[]>>('/ai/history');

  return response.data.data;
}

export async function getAiDashboard() {
  const response = await apiClient.get<ApiSuccessResponse<Record<string, unknown>>>('/ai/dashboard');

  return response.data.data;
}

export async function getRecommendations() {
  const response =
    await apiClient.get<ApiSuccessResponse<LaravelPaginatedData<RecommendationHistoryDto>>>(
      '/recommendations',
    );

  return response.data.data;
}

export async function searchRecommendations(params: SearchRecommendationsParams) {
  const response =
    await apiClient.get<ApiSuccessResponse<LaravelPaginatedData<RecommendationHistoryDto>>>(
      '/recommendations/search',
      { params },
    );

  return response.data.data;
}

export async function getFavoriteRecommendations() {
  const response =
    await apiClient.get<ApiSuccessResponse<LaravelPaginatedData<RecommendationHistoryDto>>>(
      '/recommendations/favorites',
    );

  return response.data.data;
}

export async function getRecommendation(historyId: number | string) {
  const response = await apiClient.get<ApiSuccessResponse<RecommendationHistoryDto>>(
    `/recommendations/${historyId}`,
  );

  return response.data.data;
}

export async function toggleRecommendationFavorite(historyId: number | string) {
  const response = await apiClient.patch<ApiSuccessResponse<RecommendationHistoryDto>>(
    `/recommendations/${historyId}/favorite`,
  );

  return response.data.data;
}

export async function deleteRecommendation(historyId: number | string) {
  const response = await apiClient.delete<ApiSuccessResponse<null>>(
    `/recommendations/${historyId}`,
  );

  return response.data;
}
