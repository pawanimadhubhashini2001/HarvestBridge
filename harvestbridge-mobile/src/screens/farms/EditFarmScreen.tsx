import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { Chip, Snackbar, Text } from 'react-native-paper';

import {
  getMyStore,
  getMyStoreQueryKey,
  updateStore,
  type StoreDto,
  type UpdateStorePayload,
} from '@/api/store.api';
import { AppButton } from '@/components/common/app-button';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackScreenProps } from '@/navigation/types';
import {
  FarmFormFields,
  farmFormSchema,
  getDefaultFarmFormValues,
  toFarmFormValues,
  toFarmPayload,
  type FarmFormValues,
} from '@/screens/farms/farm-form';
import type { AppError } from '@/types/api';
import { getErrorMessage } from '@/utils/errorHandler';

const storeFormFieldNames = [
  'store_name',
  'phone_number',
  'district',
  'address',
  'latitude',
  'longitude',
  'store_description',
] as const satisfies readonly (keyof FarmFormValues)[];

export function EditFarmScreen({ navigation }: AppStackScreenProps<'EditFarm'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const shouldBypassLeaveWarning = useRef(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isValid },
  } = useForm<FarmFormValues>({
    defaultValues: getDefaultFarmFormValues(),
    resolver: zodResolver(farmFormSchema),
    mode: 'onChange',
  });
  const storeQuery = useQuery({
    queryKey: getMyStoreQueryKey(),
    queryFn: getMyStore,
  });

  useEffect(() => {
    if (!storeQuery.data) {
      return;
    }

    reset(toFarmFormValues(storeQuery.data));
  }, [reset, storeQuery.data]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (!isDirty || shouldBypassLeaveWarning.current) {
        return;
      }

      event.preventDefault();

      Alert.alert(
        'Discard changes?',
        'You have unsaved store profile updates. Leave this screen and lose your changes?',
        [
          {
            text: 'Keep Editing',
            style: 'cancel',
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              shouldBypassLeaveWarning.current = true;
              navigation.dispatch(event.data.action);
            },
          },
        ],
      );
    });

    return unsubscribe;
  }, [isDirty, navigation]);

  const updateStoreMutation = useMutation({
    mutationFn: async (values: UpdateStorePayload) => {
      if (!storeQuery.data) {
        throw new Error('Store profile is required before updating.');
      }

      return updateStore(storeQuery.data.id, values);
    },
    onSuccess: async (updatedStore: StoreDto) => {
      setApiError(null);
      setSuccessMessage('Store profile updated successfully. Opening your latest profile...');
      queryClient.setQueryData(getMyStoreQueryKey(), updatedStore);
      await queryClient.invalidateQueries({ queryKey: getMyStoreQueryKey() });
      shouldBypassLeaveWarning.current = true;
      setTimeout(() => {
        navigation.replace('FarmDetails', { farmId: String(updatedStore.id) });
      }, 500);
    },
    onError: (error: AppError) => {
      setSuccessMessage(null);
      setApiError(error.message);

      for (const field of storeFormFieldNames) {
        const fieldError = error.errors?.[field];

        if (fieldError) {
          setError(field, {
            message: Array.isArray(fieldError) ? fieldError[0] : fieldError,
          });
        }
      }
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setApiError(null);
    setSuccessMessage(null);
    await updateStoreMutation.mutateAsync(toFarmPayload(values));
  });

  if (storeQuery.isLoading && storeQuery.data === undefined) {
    return <LoadingState message="Loading your store profile..." />;
  }

  if (storeQuery.isError && storeQuery.data === undefined) {
    return (
      <ErrorState
        title="Unable to load your store"
        message={getErrorMessage(storeQuery.error)}
        actionLabel="Retry"
        onAction={() => {
          void storeQuery.refetch();
        }}
      />
    );
  }

  if (!storeQuery.data) {
    return (
      <ErrorState
        title="No store profile yet"
        message="Create your store profile before trying to edit it."
        actionLabel="Create Store"
        onAction={() => {
          navigation.replace('AddFarm');
        }}
      />
    );
  }

  return (
    <Screen scrollable contentClassName="gap-lg">
      <View
        className="gap-sm rounded-lg border px-lg py-lg"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Chip
          compact
          style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.primaryContainer }}
          textStyle={{ color: theme.colors.primary }}
        >
          Store Profile
        </Chip>
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
          Edit Store Profile
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Update the selling location details for {storeQuery.data.store_name}.
        </Text>
      </View>

      <View
        className="gap-md rounded-lg border px-lg py-lg"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <FarmFormFields
          control={control}
          errors={errors}
          disabled={updateStoreMutation.isPending}
          latitudeLabel="Latitude (optional)"
          longitudeLabel="Longitude (optional)"
          descriptionLabel="Store Description (optional)"
        />

        {isDirty ? (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            You have unsaved store profile changes.
          </Text>
        ) : null}

        {apiError ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
            {apiError}
          </Text>
        ) : null}

        {successMessage ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
            {successMessage}
          </Text>
        ) : null}

        <View className="flex-row gap-sm">
          <AppButton
            label="Cancel"
            mode="outline"
            className="flex-1"
            onPress={() => {
              navigation.goBack();
            }}
            disabled={updateStoreMutation.isPending}
          />
          <AppButton
            label="Save Store"
            className="flex-1"
            onPress={() => {
              void onSubmit();
            }}
            loading={updateStoreMutation.isPending}
            disabled={!isValid || !isDirty || updateStoreMutation.isPending}
          />
        </View>
      </View>

      <Snackbar
        visible={Boolean(successMessage)}
        onDismiss={() => {
          setSuccessMessage(null);
        }}
      >
        {successMessage ?? ''}
      </Snackbar>
    </Screen>
  );
}
