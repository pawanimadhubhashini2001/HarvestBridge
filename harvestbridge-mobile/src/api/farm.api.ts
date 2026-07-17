import { apiClient } from '@/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';

export interface FarmDto {
  id: number;
  farm_name: string;
  district: string;
  address: string;
  latitude: string | number;
  longitude: string | number;
  farm_size: string | number;
  farm_size_unit: 'acres' | 'hectares';
  soil_type: string;
  created_at: string;
}

export interface StoreFarmPayload {
  farm_name: string;
  district: string;
  address: string;
  latitude: number;
  longitude: number;
  farm_size: number;
  farm_size_unit: 'acres' | 'hectares';
  soil_type: string;
}

export type UpdateFarmPayload = Partial<StoreFarmPayload>;

export async function getFarms() {
  const response = await apiClient.get<ApiSuccessResponse<FarmDto[]>>('/farms');

  return response.data.data;
}

export async function createFarm(payload: StoreFarmPayload) {
  const response = await apiClient.post<ApiSuccessResponse<FarmDto>>('/farms', payload);

  return response.data.data;
}

export async function updateFarm(farmId: number | string, payload: UpdateFarmPayload) {
  const response = await apiClient.put<ApiSuccessResponse<FarmDto>>(`/farms/${farmId}`, payload);

  return response.data.data;
}

export async function deleteFarm(farmId: number | string) {
  const response = await apiClient.delete<ApiSuccessResponse<null>>(`/farms/${farmId}`);

  return response.data;
}
