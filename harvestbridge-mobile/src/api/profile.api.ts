import { apiClient } from '@/api/apiClient';
import type { ApiSuccessResponse } from '@/types/api';
import type { AuthUser } from '@/types/auth';

export interface UpdateProfilePayload {
  name?: string;
  phone?: string | null;
  district?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  organization_name?: string | null;
  company_name?: string | null;
  profile_photo?: string | null;
}

export async function getProfile() {
  const response = await apiClient.get<ApiSuccessResponse<AuthUser>>('/profile');

  return response.data.data;
}

export async function updateProfile(payload: UpdateProfilePayload) {
  const response = await apiClient.put<ApiSuccessResponse<AuthUser>>('/profile', payload);

  return response.data.data;
}
