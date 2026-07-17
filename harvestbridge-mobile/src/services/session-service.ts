import { apiClient } from '@/api/client';
import { clearStoredToken, getStoredToken, storeToken } from '@/services/auth-storage';
import type { AuthSession, AuthUser } from '@/types/auth';
import type { ApiSuccessResponse } from '@/types/api';

export async function loadPersistedToken(): Promise<string | null> {
  return getStoredToken();
}

export async function persistSession(session: AuthSession): Promise<void> {
  await storeToken(session.token);
}

export async function clearPersistedSession(): Promise<void> {
  await clearStoredToken();
}

export async function fetchProfile(): Promise<AuthUser> {
  const response = await apiClient.get<ApiSuccessResponse<AuthUser>>('/profile');

  return response.data.data;
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post('/logout');
}
