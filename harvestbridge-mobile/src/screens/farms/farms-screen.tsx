import { PlaceholderScreen } from '@/screens/shared/placeholder-screen';

export function FarmsScreen() {
  return (
    <PlaceholderScreen
      title="Farms"
      badgeLabel="Farm Module"
      description="Farm listing and management will live here with the new light-green dashboard language and Tailwind-driven layouts."
      actions={[
        {
          label: 'Add Farm',
        },
        {
          label: 'View Dashboard',
          mode: 'outline',
        },
      ]}
    />
  );
}
