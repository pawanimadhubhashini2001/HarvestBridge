import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';
import { Button, Card, Chip, Text } from 'react-native-paper';

import {
  getNotifications,
  getNotificationsQueryKey,
  markNotificationAsRead,
  type NotificationDto,
} from '@/api/notification.api';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppTabScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';

function getStringValue(data: Record<string, unknown>, key: string) {
  const value = data[key];

  return typeof value === 'string' ? value : null;
}

function getTitle(notification: NotificationDto) {
  return getStringValue(notification.data, 'title') ?? 'Notification';
}

function getMessage(notification: NotificationDto) {
  return getStringValue(notification.data, 'message') ?? '';
}

function getCategoryLabel(notification: NotificationDto) {
  const category = getStringValue(notification.data, 'category')
    ?? getStringValue(notification.data, 'channel')
    ?? notification.type;

  return category
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Just now';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function NotificationsScreen({ navigation }: AppTabScreenProps<'Notifications'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: getNotificationsQueryKey(),
    queryFn: getNotifications,
    refetchInterval: 10000,
    refetchOnMount: 'always',
  });
  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: getNotificationsQueryKey() });
    },
  });

  if (notificationsQuery.isLoading && !notificationsQuery.data) {
    return <LoadingState message="Loading notifications..." />;
  }

  if (notificationsQuery.isError && !notificationsQuery.data) {
    return (
      <ErrorState
        title="Unable to load notifications"
        message={getErrorMessage(notificationsQuery.error)}
        actionLabel="Retry"
        onAction={() => {
          void notificationsQuery.refetch();
        }}
      />
    );
  }

  const notifications = Array.isArray(notificationsQuery.data?.data)
    ? notificationsQuery.data.data
    : [];
  const unreadCount = notifications.filter((notification) => notification.read_at === null).length;

  function openNotification(notification: NotificationDto) {
    const route = getStringValue(notification.data, 'route');

    if (notification.read_at === null) {
      markReadMutation.mutate(notification.id);
    }

    if (route === 'FarmerOrders') {
      navigation.navigate('FarmerOrders');
      return;
    }

    if (route === 'MyOrders') {
      navigation.navigate('MainTabs', { screen: 'MyOrders' });
    }
  }

  return (
    <Screen
      scrollable
      contentClassName="gap-lg"
      refreshing={notificationsQuery.isRefetching}
      onRefresh={() => {
        void notificationsQuery.refetch();
      }}>
      <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
        <Card.Content>
          <View className="gap-xs">
            <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
              Notifications
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {unreadCount > 0
                ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}`
                : 'You are all caught up.'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {notifications.length === 0 ? (
        <Card mode="outlined" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
          <Card.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              No notifications yet.
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <View className="gap-md">
          {notifications.map((notification) => {
            const isUnread = notification.read_at === null;

            return (
              <Card
                key={notification.id}
                mode={isUnread ? 'elevated' : 'outlined'}
                onPress={() => openNotification(notification)}
                style={{
                  backgroundColor: isUnread
                    ? theme.colors.primaryContainer
                    : theme.colors.surface,
                  borderColor: theme.colors.outline,
                }}>
                <Card.Content>
                  <View className="gap-sm">
                    <View className="flex-row items-start justify-between gap-sm">
                      <View className="flex-1 gap-xs">
                        <Text
                          variant="titleMedium"
                          style={{
                            color: isUnread
                              ? theme.colors.onPrimaryContainer
                              : theme.colors.onSurface,
                            fontWeight: '700',
                          }}>
                          {getTitle(notification)}
                        </Text>
                        <Text
                          variant="bodyMedium"
                          style={{
                            color: isUnread
                              ? theme.colors.onPrimaryContainer
                              : theme.colors.onSurfaceVariant,
                          }}>
                          {getMessage(notification)}
                        </Text>
                      </View>
                      {isUnread ? <Chip compact>New</Chip> : null}
                    </View>

                    <View className="flex-row flex-wrap gap-xs">
                      <Chip compact>{getCategoryLabel(notification)}</Chip>
                      <Chip compact>{formatDate(notification.created_at)}</Chip>
                    </View>

                    {isUnread ? (
                      <Button
                        mode="text"
                        loading={markReadMutation.isPending}
                        disabled={markReadMutation.isPending}
                        onPress={() => markReadMutation.mutate(notification.id)}>
                        Mark as read
                      </Button>
                    ) : null}
                  </View>
                </Card.Content>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
