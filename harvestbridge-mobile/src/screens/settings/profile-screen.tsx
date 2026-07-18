import { useMutation, useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { Avatar, Text } from 'react-native-paper';

import { AppButton } from '@/components/common/app-button';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { useAuth } from '@/hooks/use-auth';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppTabScreenProps } from '@/navigation/types';
import { designTokens } from '@/theme';
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
    <View style={styles.field}>
      <Text variant="labelMedium" style={styles.fieldLabel}>
        {label}
      </Text>
      <Text variant="bodyLarge" style={styles.fieldValue}>
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
        <View style={styles.centerState}>
          <Text variant="headlineSmall">Profile unavailable</Text>
          <Text variant="bodyMedium" style={styles.centerText}>
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
      refreshing={profileQuery.isRefetching}
      onRefresh={() => {
        void profileQuery.refetch();
      }}>
      <View
        style={[
          styles.hero,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
        ]}>
        <View style={styles.avatarWrap}>
          {profile.profile_photo ? (
            <Avatar.Image size={84} source={{ uri: profile.profile_photo }} />
          ) : (
            <Avatar.Text size={84} label={getInitials(profile.name)} />
          )}
        </View>

        <Text variant="headlineSmall" style={styles.name}>
          {profile.name}
        </Text>
        <Text variant="bodyLarge" style={styles.role}>
          {formatRole(profile.role)}
        </Text>
        <Text variant="bodyMedium" style={styles.email}>
          {profile.email}
        </Text>
      </View>

      <View
        style={[
          styles.section,
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
          style={[
            styles.inlineError,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor: theme.colors.error,
            },
          ]}>
          <Text variant="bodyMedium" style={styles.inlineErrorText}>
            {getErrorMessage(profileQuery.error)}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
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

      <Text variant="bodySmall" style={styles.note}>
        Edit Profile is reserved for the next lesson and is intentionally not active yet.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: designTokens.radius.lg,
    padding: designTokens.spacing.lg,
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  avatarWrap: {
    marginBottom: designTokens.spacing.sm,
  },
  name: {
    textAlign: 'center',
    fontWeight: '700',
  },
  role: {
    textAlign: 'center',
  },
  email: {
    textAlign: 'center',
  },
  section: {
    borderWidth: 1,
    borderRadius: designTokens.radius.lg,
    padding: designTokens.spacing.lg,
    gap: designTokens.spacing.md,
  },
  field: {
    gap: designTokens.spacing.xs,
  },
  fieldLabel: {
    opacity: 0.72,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldValue: {
    fontWeight: '600',
  },
  actions: {
    gap: designTokens.spacing.md,
  },
  note: {
    textAlign: 'center',
    opacity: 0.7,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    gap: designTokens.spacing.md,
  },
  centerText: {
    textAlign: 'center',
  },
  inlineError: {
    borderWidth: 1,
    padding: designTokens.spacing.md,
    borderRadius: designTokens.radius.md,
  },
  inlineErrorText: {
    textAlign: 'center',
  },
});
