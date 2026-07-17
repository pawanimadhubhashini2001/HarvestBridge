import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';

import { useAppTheme } from '@/hooks/use-app-theme';
import { designTokens } from '@/theme';

interface AppButtonProps {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  mode?: 'primary' | 'secondary' | 'outline';
  style?: StyleProp<ViewStyle>;
}

export function AppButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  mode = 'primary',
  style,
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

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
        (disabled || loading) && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.textColor} />
      ) : (
        <Text variant="labelLarge" style={[styles.label, { color: palette.textColor }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: designTokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: designTokens.spacing.lg,
    borderWidth: 1,
  },
  label: {
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.55,
  },
});
