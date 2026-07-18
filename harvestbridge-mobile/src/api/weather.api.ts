import { apiClient } from '@/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';

export interface CurrentWeatherDto {
  temperature: number;
  humidity: number;
  rainfall: number;
  condition?: string | null;
  condition_description?: string | null;
  wind_speed?: number | null;
  rain_probability?: number | null;
  location?: string | null;
  last_updated?: string | null;
}

export function getCurrentWeatherQueryKey(city?: string) {
  return ['weather', 'current', city ?? 'no-city'] as const;
}

export async function getCurrentWeather(city: string) {
  const response = await apiClient.get<ApiSuccessResponse<CurrentWeatherDto>>('/weather/current', {
    params: { city },
  });

  return response.data.data;
}
