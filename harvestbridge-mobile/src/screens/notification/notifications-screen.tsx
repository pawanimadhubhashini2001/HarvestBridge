import { PlaceholderScreen } from '@/screens/shared/placeholder-screen';

export function NotificationsScreen() {
  return (
    <PlaceholderScreen
      title="Notifications"
      badgeLabel="Alerts"
      description="Weather alerts, crop recommendation updates, and in-app notifications will appear here in a unified inbox."
      actions={[
        {
          label: 'Notification Settings',
          mode: 'outline',
        },
      ]}
    />
  );
}
