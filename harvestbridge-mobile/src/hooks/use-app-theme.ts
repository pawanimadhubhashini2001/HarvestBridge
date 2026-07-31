import { useColorScheme } from 'react-native';

import { appDarkTheme, appLightTheme } from '@/theme';

export function useAppTheme() {
  const colorScheme = useColorScheme();

  return colorScheme === 'dark' ? appDarkTheme : appLightTheme;
}
