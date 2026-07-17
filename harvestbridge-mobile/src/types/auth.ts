export type UserRole = 'admin' | 'farmer' | 'consumer' | 'ngo' | 'compost_business';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  district?: string | null;
  address?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  organization_name?: string | null;
  company_name?: string | null;
  profile_photo?: string | null;
  status?: 'active' | 'inactive' | 'blocked' | null;
  created_at?: string;
  updated_at?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  setSession: (session: AuthSession) => Promise<void>;
  clearSession: () => Promise<void>;
  refreshProfile: () => Promise<AuthUser | null>;
}
