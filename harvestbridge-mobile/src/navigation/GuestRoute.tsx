import type { ReactNode } from 'react';

import { SplashScreen } from '@/screens/auth/splash-screen';
import { useAuth } from '@/hooks/use-auth';

interface GuestRouteProps {
  children: ReactNode;
  fallback: ReactNode;
}

export function GuestRoute({ children, fallback }: GuestRouteProps) {
  const { isAuthenticated, isHydrating } = useAuth();

  if (isHydrating) {
    return <SplashScreen />;
  }

  if (isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
