import { apiClient } from '@/api/apiClient';
import { clearStoredToken, getStoredToken, storeToken } from '@/services/auth-storage';
import type { AuthSession, AuthUser, SessionOptions } from '@/types/auth';
import type { ApiSuccessResponse } from '@/types/api';

export async function loadPersistedToken(): Promise<string | null> {
  return getStoredToken();
}

export async function persistSession(
  session: AuthSession,
  options?: SessionOptions,
): Promise<void> {
  if (options?.persist === false) {
    await clearStoredToken();
    return;
  }

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
