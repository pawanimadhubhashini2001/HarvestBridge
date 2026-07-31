import { createContext, useCallback, useEffect, useRef, useState } from 'react';

import { queryClient } from '@/api/query-client';
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
  const [authError, setAuthError] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const isClearingSessionRef = useRef(false);

  const clearAuthHeader = useCallback(() => {
    delete apiClient.defaults.headers.common.Authorization;
  }, []);

  const applyAuthenticatedState = useCallback((nextToken: string, nextUser: AuthUser) => {
    tokenRef.current = nextToken;
    setToken(nextToken);
    setUser(nextUser);
    setAuthError(null);
    apiClient.defaults.headers.common.Authorization = `Bearer ${nextToken}`;
  }, []);

  const clearLocalSession = useCallback(
    async (errorMessage: string | null = null) => {
      tokenRef.current = null;
      setUser(null);
      setToken(null);
      setAuthError(errorMessage);
      clearAuthHeader();
      await clearPersistedSession();
      queryClient.clear();
    },
    [clearAuthHeader],
  );

  const clearSession = useCallback(async () => {
    if (isClearingSessionRef.current) {
      return;
    }

    isClearingSessionRef.current = true;

    try {
      if (tokenRef.current) {
        await logoutRequest();
      }
    } catch {
      // Ignore network errors during logout cleanup.
    } finally {
      await clearLocalSession();
      isClearingSessionRef.current = false;
    }
  }, [clearLocalSession]);

  const handleUnauthorized = useCallback(
    async (message = 'Your session expired. Please sign in again.') => {
      if (isClearingSessionRef.current) {
        return;
      }

      isClearingSessionRef.current = true;

      try {
        await clearLocalSession(message);
      } finally {
        isClearingSessionRef.current = false;
      }
    },
    [clearLocalSession],
  );

  const refreshProfile = useCallback(async () => {
    if (!tokenRef.current) {
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
        await handleUnauthorized(normalized.message);
      }

      throw normalized;
    }
  }, [handleUnauthorized]);

  const checkAuthentication = useCallback(async () => {
    try {
      const storedToken = await loadPersistedToken();

      if (!storedToken) {
        await clearLocalSession();
        return false;
      }

      apiClient.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
      const profile = await fetchProfile();
      applyAuthenticatedState(storedToken, profile);

      return true;
    } catch (error) {
      const normalized = normalizeApiError(error);
      await clearLocalSession(
        normalized.status === 401 ? 'Your session expired. Please sign in again.' : null,
      );

      return false;
    }
  }, [applyAuthenticatedState, clearLocalSession]);

  const setSession = useCallback(async (session: AuthSession, options?: SessionOptions) => {
    applyAuthenticatedState(session.token, session.user);
    await persistSession(session, options);

    try {
      const profile = await fetchProfile();
      applyAuthenticatedState(session.token, profile);
    } catch (error) {
      const normalized = normalizeApiError(error);

      if (normalized.status === 401) {
        await handleUnauthorized(normalized.message);
        throw normalized;
      }

      setAuthError('Signed in, but we could not refresh your profile yet.');
    }
  }, [applyAuthenticatedState, handleUnauthorized]);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        await checkAuthentication();
      } finally {
        setIsHydrating(false);
      }
    }

    void bootstrap();
  }, [checkAuthentication]);

  useEffect(
    () =>
      registerUnauthorizedHandler((reason) =>
        handleUnauthorized(
          reason === 'expired'
            ? 'Your session expired. Please sign in again.'
            : 'Authentication is required. Please sign in again.',
        ),
      ),
    [handleUnauthorized],
  );

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isHydrating,
    authError,
    setSession,
    clearSession,
    refreshProfile,
    checkAuthentication,
    clearAuthError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
