import { clearStoredToken, getStoredToken, storeToken } from '@/services/auth-storage';
import { logout } from '@/api/auth.api';
import { getProfile } from '@/api/profile.api';
import type { AuthSession, AuthUser, SessionOptions } from '@/types/auth';

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
  return getProfile();
}

export async function logoutRequest(): Promise<void> {
  await logout();
}
