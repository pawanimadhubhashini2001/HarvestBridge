import { createContext, useEffect, useState } from 'react';

import { apiClient } from '@/api/apiClient';
import {
  clearPersistedSession,
  fetchProfile,
  loadPersistedToken,
  logoutRequest,
  persistSession,
} from '@/services/session-service';
import { registerUnauthorizedHandler } from '@/services/auth-session-events';
import type { AuthContextValue, AuthSession, AuthUser, SessionOptions } from '@/types/auth';
import { normalizeApiError } from '@/utils/api-error';

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  async function clearSession() {
    try {
      if (token) {
        await logoutRequest();
      }
    } catch {
      // Ignore network errors during logout cleanup.
    } finally {
      setUser(null);
      setToken(null);
      delete apiClient.defaults.headers.common.Authorization;
      await clearPersistedSession();
    }
  }

  async function refreshProfile() {
    if (!token) {
      setUser(null);
      return null;
    }

    try {
      const profile = await fetchProfile();
      setUser(profile);
      return profile;
    } catch (error) {
      const normalized = normalizeApiError(error);

      if (normalized.status === 401) {
        await clearSession();
      }

      throw normalized;
    }
  }

  async function setSession(session: AuthSession, options?: SessionOptions) {
    setToken(session.token);
    setUser(session.user);
    apiClient.defaults.headers.common.Authorization = `Bearer ${session.token}`;
    await persistSession(session, options);
    const profile = await fetchProfile();
    setUser(profile);
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        const storedToken = await loadPersistedToken();

        if (!storedToken) {
          setIsHydrating(false);
          return;
        }

        setToken(storedToken);
        apiClient.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
        const profile = await fetchProfile();
        setUser(profile);
      } catch {
        await clearPersistedSession();
        setToken(null);
        setUser(null);
        delete apiClient.defaults.headers.common.Authorization;
      } finally {
        setIsHydrating(false);
      }
    }

    void bootstrap();
  }, []);

  useEffect(() => registerUnauthorizedHandler(() => clearSession()), [token]);

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isHydrating,
    setSession,
    clearSession,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
