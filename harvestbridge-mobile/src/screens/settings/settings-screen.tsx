import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Card, Snackbar, Text, TextInput } from 'react-native-paper';

import { updateProfile, type UpdateProfilePayload } from '@/api/profile.api';
import { AppButton } from '@/components/common/app-button';
import { Screen } from '@/components/layout/screen';
import { useAuth } from '@/hooks/use-auth';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';

export function SettingsScreen({ navigation }: AppStackScreenProps<'Settings'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const { user, refreshProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [district, setDistrict] = useState(user?.district ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [organizationName, setOrganizationName] = useState(user?.organization_name ?? '');
  const [companyName, setCompanyName] = useState(user?.company_name ?? '');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name ?? '');
    setPhone(user?.phone ?? '');
    setDistrict(user?.district ?? '');
    setAddress(user?.address ?? '');
    setOrganizationName(user?.organization_name ?? '');
    setCompanyName(user?.company_name ?? '');
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const trimmedName = name.trim();

      if (!trimmedName) {
        throw new Error('Name is required.');
      }

      const payload: UpdateProfilePayload = {
        name: trimmedName,
        phone: phone.trim() || null,
        district: district.trim() || null,
        address: address.trim() || null,
      };

      if (user?.role === 'ngo') {
        payload.organization_name = organizationName.trim() || null;
      }

      if (user?.role === 'compost_business') {
        payload.company_name = companyName.trim() || null;
      }

      return updateProfile(payload);
    },
    onSuccess: async () => {
      await refreshProfile();
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      setFeedbackMessage('Profile updated successfully.');

      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  return (
    <Screen scrollable contentClassName="gap-md">
      <Card mode="contained" style={{ backgroundColor: theme.colors.surface }}>
        <Card.Content>
          <View className="gap-sm">
            <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
              Edit Profile
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Update the details shown on your HarvestBridge account.
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card mode="outlined" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
        <Card.Content>
          <View className="gap-md">
            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              autoCapitalize="words"
              disabled={updateMutation.isPending}
            />
            <TextInput
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              keyboardType="phone-pad"
              disabled={updateMutation.isPending}
            />
            <TextInput
              label="District"
              value={district}
              onChangeText={setDistrict}
              mode="outlined"
              autoCapitalize="words"
              disabled={updateMutation.isPending}
            />
            <TextInput
              label="Address"
              value={address}
              onChangeText={setAddress}
              mode="outlined"
              multiline
              numberOfLines={3}
              disabled={updateMutation.isPending}
            />

            {user?.role === 'ngo' ? (
              <TextInput
                label="Organization Name"
                value={organizationName}
                onChangeText={setOrganizationName}
                mode="outlined"
                disabled={updateMutation.isPending}
              />
            ) : null}

            {user?.role === 'compost_business' ? (
              <TextInput
                label="Company Name"
                value={companyName}
                onChangeText={setCompanyName}
                mode="outlined"
                disabled={updateMutation.isPending}
              />
            ) : null}

            <View className="gap-sm pt-sm">
              <AppButton
                label="Save Changes"
                loading={updateMutation.isPending}
                disabled={updateMutation.isPending}
                onPress={() => {
                  updateMutation.mutate();
                }}
              />
              <AppButton
                label="Cancel"
                mode="outline"
                disabled={updateMutation.isPending}
                onPress={() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                  }
                }}
              />
            </View>
          </View>
        </Card.Content>
      </Card>

      <Snackbar visible={Boolean(feedbackMessage)} onDismiss={() => setFeedbackMessage(null)}>
        {feedbackMessage}
      </Snackbar>
    </Screen>
  );
}
