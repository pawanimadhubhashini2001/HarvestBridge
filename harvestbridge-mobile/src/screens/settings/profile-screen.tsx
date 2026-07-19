import { useMutation, useQuery } from '@tanstack/react-query';
import { View } from 'react-native';
import { Avatar, Text } from 'react-native-paper';

import { AppButton } from '@/components/common/app-button';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { useAuth } from '@/hooks/use-auth';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppTabScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';

function getInitials(name?: string | null) {
  if (!name) {
    return 'HB';
  }

  const parts = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || 'HB';
}

function getDisplayValue(value?: string | null) {
  if (!value || !value.trim()) {
    return 'Not provided';
  }

  return value;
}

function formatRole(role?: string | null) {
  if (!role) {
    return 'Unknown';
  }

  return role
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-xs">
      <Text
        variant="labelMedium"
        style={{ opacity: 0.72, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </Text>
      <Text variant="bodyLarge" style={{ fontWeight: '600' }}>
        {value}
      </Text>
    </View>
  );
}

export function ProfileScreen({ navigation }: AppTabScreenProps<'Profile'>) {
  const theme = useAppTheme();
  const { user, clearSession, refreshProfile, isAuthenticated } = useAuth();

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: refreshProfile,
    enabled: isAuthenticated,
    initialData: user ?? undefined,
  });

  const logoutMutation = useMutation({
    mutationFn: clearSession,
  });

  const profile = profileQuery.data;

  if (profileQuery.isLoading && !profile) {
    return <LoadingState message="Loading your profile..." />;
  }

  if (profileQuery.isError && !profile) {
    return (
      <ErrorState
        title="Unable to load profile"
        message={getErrorMessage(profileQuery.error)}
        actionLabel="Reload profile"
        onAction={() => {
          void profileQuery.refetch();
        }}
      />
    );
  }

  if (!profile) {
    return (
      <Screen>
        <View className="flex-1 justify-center gap-md">
          <Text variant="headlineSmall">Profile unavailable</Text>
          <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
            We could not find profile information for this account yet.
          </Text>
          <AppButton
            label="Retry"
            onPress={() => {
              void profileQuery.refetch();
            }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scrollable
      contentClassName="gap-lg"
      refreshing={profileQuery.isRefetching}
      onRefresh={() => {
        void profileQuery.refetch();
      }}>
      <View
        className="items-center gap-sm rounded-lg border px-lg py-lg"
        style={[
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
        ]}>
        <View className="mb-sm">
          {profile.profile_photo ? (
            <Avatar.Image size={84} source={{ uri: profile.profile_photo }} />
          ) : (
            <Avatar.Text size={84} label={getInitials(profile.name)} />
          )}
        </View>

        <Text variant="headlineSmall" style={{ textAlign: 'center', fontWeight: '700' }}>
          {profile.name}
        </Text>
        <Text variant="bodyLarge" style={{ textAlign: 'center' }}>
          {formatRole(profile.role)}
        </Text>
        <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
          {profile.email}
        </Text>
      </View>

      <View
        className="gap-md rounded-lg border px-lg py-lg"
        style={[
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
        ]}>
        <Text variant="titleMedium">Profile Details</Text>
        <ProfileField label="Name" value={getDisplayValue(profile.name)} />
        <ProfileField label="Email" value={getDisplayValue(profile.email)} />
        <ProfileField label="Phone" value={getDisplayValue(profile.phone)} />
        <ProfileField label="Role" value={formatRole(profile.role)} />
      </View>

      {profileQuery.isError ? (
        <View
          className="rounded-md border px-md py-md"
          style={[
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor: theme.colors.error,
            },
          ]}>
          <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
            {getErrorMessage(profileQuery.error)}
          </Text>
        </View>
      ) : null}

      <View className="gap-md">
        {profile.role === 'consumer' ? (
          <AppButton
            label="Favorites"
            mode="outline"
            onPress={() => {
              navigation.navigate('Favorites');
            }}
          />
        ) : null}
        <AppButton
          label="Edit Profile"
          mode="outline"
          disabled
          onPress={() => {
            navigation.navigate('Settings');
          }}
        />
        <AppButton
          label="Logout"
          mode="secondary"
          loading={logoutMutation.isPending}
          disabled={logoutMutation.isPending}
          onPress={() => {
            logoutMutation.mutate();
          }}
        />
      </View>

      <Text variant="bodySmall" style={{ textAlign: 'center', opacity: 0.7 }}>
        Edit Profile is reserved for the next lesson and is intentionally not active yet.
      </Text>
    </Screen>
  );
}
