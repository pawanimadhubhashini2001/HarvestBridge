import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-app-theme';
import { designTokens } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentClassName?: string;
}

export function Screen({
  children,
  scrollable = false,
  refreshing = false,
  onRefresh,
  contentClassName = '',
}: ScreenProps) {
  const theme = useAppTheme();
  const safeAreaClassName = 'flex-1';
  const contentBaseClassName = 'flex-grow gap-md';
  const contentStyle = {
    paddingHorizontal: designTokens.spacing.md,
    paddingTop: designTokens.spacing.md,
    paddingBottom: designTokens.spacing['2xl'],
  };

  const content = scrollable ? (
    <ScrollView
      className="flex-1"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerClassName={`${contentBaseClassName} ${contentClassName}`.trim()}
      contentContainerStyle={contentStyle}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        ) : undefined
      }>
      {children}
    </ScrollView>
  ) : (
    <View
      className={`${contentBaseClassName} ${contentClassName}`.trim()}
      style={contentStyle}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      className={safeAreaClassName}
      style={{ backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
