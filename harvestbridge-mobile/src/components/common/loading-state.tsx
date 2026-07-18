import { ActivityIndicator, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

import { useAppTheme } from '@/hooks/use-app-theme';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({
  message = 'Loading...',
  fullScreen = true,
}: LoadingStateProps) {
  const theme = useAppTheme();

  return (
    <View
      className={`${fullScreen ? 'flex-1' : ''} items-center justify-center gap-md px-lg`}
      style={{ backgroundColor: theme.colors.background }}>
      <Chip
        compact
        style={{ backgroundColor: theme.colors.primaryContainer }}
        textStyle={{ color: theme.colors.primary }}>
        HarvestBridge
      </Chip>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text variant="bodyMedium" style={{ color: theme.colors.onBackground, textAlign: 'center' }}>
        {message}
      </Text>
    </View>
  );
}
