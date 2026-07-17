import { apiClient } from '@/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';

export interface CurrentWeatherDto {
  temperature: number;
  humidity: number;
  rainfall: number;
}

export async function getCurrentWeather(city: string) {
  const response = await apiClient.get<ApiSuccessResponse<CurrentWeatherDto>>('/weather/current', {
    params: { city },
  });

  return response.data.data;
}
