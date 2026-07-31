import type { ReactNode } from 'react';

import { SplashScreen } from '@/screens/auth/splash-screen';
import { useAuth } from '@/hooks/use-auth';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isHydrating } = useAuth();

  if (isHydrating) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
