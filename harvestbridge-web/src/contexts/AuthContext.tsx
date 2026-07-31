import { createContext, useContext, useMemo, useState } from 'react';

import { clearStoredToken, getApiError, setStoredToken } from '../lib/api';
import { loginAdmin, logoutAdmin } from '../services/admin';
import type { AdminUser } from '../types/api';

const USER_KEY = 'harvestbridge_admin_user';

interface AuthContextValue {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredUser() {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AdminUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    clearStoredToken();
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => getStoredUser());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'admin',
      async login(email, password) {
        const session = await loginAdmin(email, password);

        if (session.user.role !== 'admin') {
          throw new Error('Only administrator accounts can access this dashboard.');
        }

        setStoredToken(session.token);
        localStorage.setItem(USER_KEY, JSON.stringify(session.user));
        setUser(session.user);
      },
      async logout() {
        try {
          await logoutAdmin();
        } catch (error) {
          console.warn(getApiError(error));
        } finally {
          clearStoredToken();
          localStorage.removeItem(USER_KEY);
          setUser(null);
        }
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
