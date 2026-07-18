import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-app-theme';

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
  const contentBaseClassName = 'flex-grow gap-md p-md';

  if (scrollable) {
    return (
      <SafeAreaView
        className={safeAreaClassName}
        style={{ backgroundColor: theme.colors.background }}>
        <ScrollView
          className="flex-1"
          contentContainerClassName={`${contentBaseClassName} ${contentClassName}`.trim()}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            ) : undefined
          }>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={safeAreaClassName}
      style={{ backgroundColor: theme.colors.background }}>
      <View className={`${contentBaseClassName} ${contentClassName}`.trim()}>{children}</View>
    </SafeAreaView>
  );
}
