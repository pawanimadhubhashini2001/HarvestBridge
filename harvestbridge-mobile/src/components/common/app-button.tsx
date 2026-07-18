import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';

import { useAppTheme } from '@/hooks/use-app-theme';

interface AppButtonProps {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  mode?: 'primary' | 'secondary' | 'outline';
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export function AppButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  mode = 'primary',
  style,
  className,
}: AppButtonProps) {
  const theme = useAppTheme();

  const palette = {
    primary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      textColor: theme.colors.onPrimary,
    },
    secondary: {
      backgroundColor: theme.colors.secondaryContainer,
      borderColor: theme.colors.secondaryContainer,
      textColor: theme.colors.onSecondaryContainer,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.outline,
      textColor: theme.colors.onBackground,
    },
  }[mode];

  const modeClassName = {
    primary: 'bg-brand dark:bg-dark-brand',
    secondary: 'bg-[#DCE9DB] dark:bg-[#35503A]',
    outline: 'bg-transparent',
  }[mode];

  return (
    <TouchableOpacity
      className={`min-h-button items-center justify-center rounded-md border px-lg ${
        disabled || loading ? 'opacity-55' : ''
      } ${modeClassName} ${className ?? ''}`.trim()}
      activeOpacity={0.86}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.textColor} />
      ) : (
        <Text variant="labelLarge" style={{ color: palette.textColor, fontWeight: '700' }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
