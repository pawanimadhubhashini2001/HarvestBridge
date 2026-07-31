import { apiClient } from '@/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';

export interface CropDto {
  id: number;
  name: string;
  category?: string | null;
  description?: string | null;
  growing_season?: string | null;
  ideal_soil?: string | null;
  is_active?: boolean;
}

export function getCropsQueryKey() {
  return ['crops'] as const;
}

export async function getCrops() {
  const response = await apiClient.get<ApiSuccessResponse<CropDto[]>>('/crops');

  return response.data.data;
}
