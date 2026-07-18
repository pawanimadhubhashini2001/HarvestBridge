import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { Chip, Text } from 'react-native-paper';

import {
  getFarms,
  getFarmsQueryKey,
  updateFarm,
  type FarmDto,
  type UpdateFarmPayload,
} from '@/api/farm.api';
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

const farmFormFieldNames = [
  'farm_name',
  'district',
  'address',
  'latitude',
  'longitude',
  'farm_size',
  'farm_size_unit',
  'soil_type',
  'description',
] as const satisfies readonly (keyof FarmFormValues)[];

export function EditFarmScreen({
  navigation,
  route,
}: AppStackScreenProps<'EditFarm'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const farmId = route.params?.farmId;
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
  const farmsQuery = useQuery({
    queryKey: getFarmsQueryKey(),
    queryFn: getFarms,
    enabled: Boolean(farmId),
  });

  const farms = farmsQuery.data ?? [];
  const farm = farms.find((farmItem) => String(farmItem.id) === farmId);

  useEffect(() => {
    if (!farm) {
      return;
    }

    reset(toFarmFormValues(farm));
  }, [farm, reset]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (!isDirty || shouldBypassLeaveWarning.current) {
        return;
      }

      event.preventDefault();

      Alert.alert(
        'Discard changes?',
        'You have unsaved farm updates. Leave this screen and lose your changes?',
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

  const updateFarmMutation = useMutation({
    mutationFn: async (values: UpdateFarmPayload) => {
      if (!farmId) {
        throw new Error('Farm id is required to update a farm.');
      }

      return updateFarm(farmId, values);
    },
    onSuccess: async (updatedFarm: FarmDto) => {
      setApiError(null);
      setSuccessMessage('Farm updated successfully. Opening farm details...');
      queryClient.setQueryData<FarmDto[]>(getFarmsQueryKey(), (currentFarms) =>
        currentFarms?.map((farmItem) => (farmItem.id === updatedFarm.id ? updatedFarm : farmItem)) ??
        [updatedFarm],
      );
      await queryClient.invalidateQueries({ queryKey: getFarmsQueryKey() });
      await queryClient.refetchQueries({ queryKey: getFarmsQueryKey(), type: 'active' });
      shouldBypassLeaveWarning.current = true;
      setTimeout(() => {
        navigation.replace('FarmDetails', { farmId: String(updatedFarm.id) });
      }, 500);
    },
    onError: (error: AppError) => {
      setSuccessMessage(null);
      setApiError(error.message);

      for (const field of farmFormFieldNames) {
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
    await updateFarmMutation.mutateAsync(toFarmPayload(values));
  });

  if (!farmId) {
    return (
      <ErrorState
        title="Farm not found"
        message="A farm id was not provided for editing."
        actionLabel="Back to farms"
        onAction={() => {
          navigation.navigate('MainTabs', { screen: 'Farms' });
        }}
      />
    );
  }

  if (farmsQuery.isLoading && !farmsQuery.data) {
    return <LoadingState message="Loading farm details..." />;
  }

  if (farmsQuery.isError && !farmsQuery.data) {
    return (
      <ErrorState
        title="Unable to load farm"
        message={getErrorMessage(farmsQuery.error)}
        actionLabel="Retry"
        onAction={() => {
          void farmsQuery.refetch();
        }}
      />
    );
  }

  if (!farm) {
    return (
      <ErrorState
        title="Farm not found"
        message="We could not find that farm in your current farm list."
        actionLabel="Back to farms"
        onAction={() => {
          navigation.navigate('MainTabs', { screen: 'Farms' });
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
          Farm Module
        </Chip>
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
          Edit Farm
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Update the saved details for {farm.farm_name}.
        </Text>
      </View>

      <View
        className="gap-md rounded-lg border px-lg py-lg"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <FarmFormFields
          control={control}
          errors={errors}
          disabled={updateFarmMutation.isPending}
        />

        {isDirty ? (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            You have unsaved changes.
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
            disabled={updateFarmMutation.isPending}
          />
          <AppButton
            label="Update Farm"
            className="flex-1"
            onPress={() => {
              void onSubmit();
            }}
            loading={updateFarmMutation.isPending}
            disabled={!isValid || !isDirty || updateFarmMutation.isPending}
          />
        </View>
      </View>
    </Screen>
  );
}
