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
  pH?: number | null;
  Previous_Crop?: string | null;
  Previous_Yield_t_ha?: number | null;
  Market_Demand?: string | null;
}

export interface RecommendationExplanation {
  soil?: string;
  weather?: string;
  season?: string;
  market?: string;
  [key: string]: string | undefined;
}

export interface RankedRecommendationCandidate {
  id?: number | null;
  name: string;
  category?: string | null;
  description?: string | null;
  confidence: number;
  confidence_percentage?: number;
}

export interface MarketPriceSnapshot {
  crop?: string | null;
  market_name: string;
  district: string;
  price_per_unit: number | string;
  unit: string;
  price_date: string;
  source?: string | null;
}

export interface SmartPredictionResponse {
  weather: {
    temperature: number;
    rainfall: number;
    humidity: number;
    condition?: string | null;
    location?: string | null;
  };
  prediction: {
    recommended_crop: string;
    confidence: number;
    recommended_crops?: RankedRecommendationCandidate[];
    explanation: RecommendationExplanation | string[] | string;
  };
  market_price?: MarketPriceSnapshot | null;
}

export interface CachedSmartRecommendationResult {
  request: SmartPredictionPayload;
  response: SmartPredictionResponse;
  submitted_at: string;
  store: {
    id: string;
    name: string;
    district: string;
  };
  form: {
    season: string;
    soil_type: string;
    soil_ph: number;
    market_demand: string;
    previous_crop?: string | null;
  };
}

export interface PredictionHistoryDto {
  id: number;
  district: string;
  season: string;
  recommended_crop: string;
  confidence: number;
  market_demand?: string | null;
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
  market_demand?: string | null;
  is_favorite: boolean;
  created_at: string;
}

export interface SearchRecommendationsParams {
  crop?: string;
  season?: string;
  from?: string;
  to?: string;
}

export interface RecommendationReportPayload {
  input: SmartPredictionPayload;
  weather: SmartPredictionResponse['weather'];
  prediction: SmartPredictionResponse['prediction'];
  market?: MarketPriceSnapshot | null;
}

export function getPredictionHistoryQueryKey() {
  return ['ai', 'history'] as const;
}

export function getRecommendationsQueryKey() {
  return ['recommendations'] as const;
}

export function getLatestSmartRecommendationResultQueryKey() {
  return ['ai', 'smart-result', 'latest'] as const;
}

export async function predict(payload: PredictionPayload) {
  const response = await apiClient.post<ApiSuccessResponse<Record<string, unknown>>>(
    '/ai/predict',
    payload,
  );

  return response.data.data;
}

export async function smartPredict(payload: SmartPredictionPayload) {
  const response = await apiClient.post<SmartPredictionResponse>('/ai/smart-predict', payload);

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

export async function downloadRecommendationReport(payload: RecommendationReportPayload) {
  const response = await apiClient.post('/reports/recommendation', payload, {
    responseType: 'blob',
    headers: {
      Accept: 'application/pdf',
    },
  });

  return response.data;
}
