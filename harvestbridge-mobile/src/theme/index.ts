import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

import { darkColors, lightColors } from '@/theme/colors';

export const appLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: lightColors.primary,
    secondary: lightColors.secondary,
    background: lightColors.background,
    surface: lightColors.surface,
    surfaceVariant: lightColors.surfaceVariant,
    error: lightColors.error,
    onPrimary: '#FFFFFF',
    onBackground: lightColors.text,
    onSurface: lightColors.text,
    onSurfaceVariant: lightColors.textMuted,
    outline: lightColors.border,
  },
};

export const appDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkColors.primary,
    secondary: darkColors.secondary,
    background: darkColors.background,
    surface: darkColors.surface,
    surfaceVariant: darkColors.surfaceVariant,
    error: darkColors.error,
    onPrimary: '#0B140E',
    onBackground: darkColors.text,
    onSurface: darkColors.text,
    onSurfaceVariant: darkColors.textMuted,
    outline: darkColors.border,
  },
};

export type AppTheme = typeof appLightTheme;

export const designTokens = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 18,
    pill: 999,
  },
} as const;
