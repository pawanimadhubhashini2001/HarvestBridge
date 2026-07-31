import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

import {
  createStore,
  getMyStore,
  getMyStoreQueryKey,
  type StoreDto,
  type StorePayload,
} from '@/api/store.api';
import { AppButton } from '@/components/common/app-button';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/layout/screen';
import { DeleteStoreButton } from '@/components/store/DeleteStoreButton';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackScreenProps } from '@/navigation/types';
import {
  FarmFormFields,
  farmFormSchema,
  getDefaultFarmFormValues,
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
  'store_logo',
] as const satisfies readonly (keyof FarmFormValues)[];

export function AddFarmScreen({ navigation }: AppStackScreenProps<'AddFarm'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdStoreId, setCreatedStoreId] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isValid },
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
    if (!createdStoreId) {
      return;
    }

    const timeoutId = setTimeout(() => {
      navigation.replace('FarmDetails', { farmId: createdStoreId });
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [createdStoreId, navigation]);

  const createStoreMutation = useMutation({
    mutationFn: async (values: StorePayload) => createStore(values),
    onSuccess: async (createdStore: StoreDto) => {
      setApiError(null);
      setSuccessMessage('Store profile created successfully. Opening your store profile...');
      queryClient.setQueryData(getMyStoreQueryKey(), createdStore);
      await queryClient.invalidateQueries({ queryKey: getMyStoreQueryKey() });
      setCreatedStoreId(String(createdStore.id));
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
    await createStoreMutation.mutateAsync(toFarmPayload(values));
  });

  if (storeQuery.isLoading && storeQuery.data === undefined) {
    return <LoadingState message="Checking your store profile..." />;
  }

  if (storeQuery.isError && storeQuery.data === undefined) {
    return (
      <ErrorState
        title="Unable to check your store"
        message={getErrorMessage(storeQuery.error)}
        actionLabel="Retry"
        onAction={() => {
          void storeQuery.refetch();
        }}
      />
    );
  }

  if (storeQuery.data) {
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
            Your store already exists
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Farmers can create exactly one store profile before publishing harvest listings.
          </Text>
        </View>

        <View
          className="gap-md rounded-lg border px-lg py-lg"
          style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
        >
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
            {storeQuery.data.store_name}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {storeQuery.data.address}
          </Text>
          <View className="gap-sm">
            <AppButton
              label="My Store"
              onPress={() => {
                navigation.replace('FarmDetails', { farmId: String(storeQuery.data?.id) });
              }}
            />
            <AppButton
              label="Edit Store"
              mode="outline"
              onPress={() => {
                navigation.replace('EditFarm', { farmId: String(storeQuery.data?.id) });
              }}
            />
            <DeleteStoreButton storeId={storeQuery.data.id} label="Delete Store" />
          </View>
        </View>
      </Screen>
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
          Create Your Store Profile
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Set up your single selling location before you publish harvest listings.
        </Text>
      </View>

      <View
        className="gap-md rounded-lg border px-lg py-lg"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <FarmFormFields
          control={control}
          errors={errors}
          setValue={setValue}
          disabled={createStoreMutation.isPending}
          latitudeLabel="Latitude (optional)"
          longitudeLabel="Longitude (optional)"
          descriptionLabel="Store Description (optional)"
        />

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
            disabled={createStoreMutation.isPending}
          />
          <AppButton
            label="Create Store"
            className="flex-1"
            onPress={() => {
              void onSubmit();
            }}
            loading={createStoreMutation.isPending}
            disabled={!isValid || createStoreMutation.isPending}
          />
        </View>
      </View>
    </Screen>
  );
}
