import { useEffect } from 'react';

import { LoadingState } from '@/components/common/loading-state';
import type { AuthScreenProps } from '@/navigation/types';

export function SplashScreen({ navigation }: AuthScreenProps<'Splash'>) {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      navigation.replace('Login');
    }, 900);

    return () => clearTimeout(timeoutId);
  }, [navigation]);

  return <LoadingState message="Preparing authentication..." />;
}
