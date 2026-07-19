import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  View,
} from 'react-native';
import { Button, Card, Chip, Snackbar, Text } from 'react-native-paper';
import { z } from 'zod';

import { getMyStore, getMyStoreQueryKey } from '@/api/store.api';
import {
  getLatestSmartRecommendationResultQueryKey,
  getPredictionHistoryQueryKey,
  getRecommendationsQueryKey,
  smartPredict,
  type CachedSmartRecommendationResult,
  type SmartPredictionPayload,
} from '@/api/recommendation.api';
import { getCurrentWeather, getCurrentWeatherQueryKey } from '@/api/weather.api';
import { AppButton } from '@/components/common/app-button';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { AppTextInput } from '@/components/form/app-text-input';
import { Screen } from '@/components/layout/screen';
import { QUERY_STALE_TIME_MS } from '@/constants/app';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackScreenProps } from '@/navigation/types';
import type { AppError } from '@/types/api';
import { getErrorMessage } from '@/utils/errorHandler';

const seasonOptions = ['Yala', 'Maha'] as const;
const marketDemandOptions = ['Low', 'Medium', 'High'] as const;

const smartRecommendationSchema = z.object({
  season: z.enum(seasonOptions, {
    message: 'Please select a season.',
  }),
  soil_type: z
    .string()
    .trim()
    .min(1, 'Soil type is required.')
    .max(100, 'Soil type is too long.'),
  soil_ph: z
    .string()
    .trim()
    .min(1, 'Soil pH is required.')
    .refine((value) => !Number.isNaN(Number(value)), 'Soil pH must be a number.')
    .refine(
      (value) => Number(value) >= 0 && Number(value) <= 14,
      'Soil pH must be between 0 and 14.',
    ),
  market_demand: z.enum(marketDemandOptions, {
    message: 'Please select market demand.',
  }),
  previous_crop: z
    .string()
    .trim()
    .max(100, 'Previous crop is too long.')
    .optional()
    .or(z.literal('')),
});

type SmartRecommendationFormValues = z.infer<typeof smartRecommendationSchema>;

const formFieldNames = [
  'season',
  'soil_type',
  'soil_ph',
  'market_demand',
  'previous_crop',
] as const satisfies readonly (keyof SmartRecommendationFormValues)[];

function SelectorField({
  label,
  value,
  options,
  onSelect,
  errorMessage,
  disabled = false,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onSelect: (value: string) => void;
  errorMessage?: string;
  disabled?: boolean;
}) {
  const theme = useAppTheme();

  return (
    <View className="gap-xs">
      <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-sm">
        {options.map((option) => {
          const selected = value === option;

          return (
            <Button
              key={option}
              mode={selected ? 'contained-tonal' : 'outlined'}
              disabled={disabled}
              onPress={() => {
                onSelect(option);
              }}
            >
              {option}
            </Button>
          );
        })}
      </View>
      {errorMessage ? (
        <Text variant="bodySmall" style={{ color: theme.colors.error }}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

function toSmartPayload(
  values: SmartRecommendationFormValues,
  store: NonNullable<Awaited<ReturnType<typeof getMyStore>>>,
): SmartPredictionPayload {
  return {
    District: store.district,
    Season: values.season,
    Soil_Type: values.soil_type.trim(),
    pH: Number(values.soil_ph),
    Previous_Crop: values.previous_crop?.trim() || null,
    Market_Demand: values.market_demand,
    Previous_Yield_t_ha: null,
  };
}

export function SmartRecommendationScreen({
  navigation,
}: AppStackScreenProps<'AIRecommendationForm'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<SmartRecommendationFormValues>({
    defaultValues: {
      season: 'Yala',
      soil_type: '',
      soil_ph: '',
      market_demand: 'Medium',
      previous_crop: '',
    },
    resolver: zodResolver(smartRecommendationSchema),
    mode: 'onChange',
  });

  const storeQuery = useQuery({
    queryKey: getMyStoreQueryKey(),
    queryFn: getMyStore,
    staleTime: QUERY_STALE_TIME_MS,
  });
  const store = storeQuery.data;

  const weatherQuery = useQuery({
    queryKey: getCurrentWeatherQueryKey(store?.district),
    queryFn: () => getCurrentWeather(store?.district ?? ''),
    enabled: Boolean(store?.district),
  });

  const smartRecommendationMutation = useMutation({
    mutationFn: async (payload: SmartPredictionPayload) => smartPredict(payload),
    onSuccess: async (response, payload) => {
      setErrorMessage(null);

      if (store) {
        const cachedResult: CachedSmartRecommendationResult = {
          request: payload,
          response,
          submitted_at: new Date().toISOString(),
          store: {
            id: String(store.id),
            name: store.store_name,
            district: store.district,
          },
          form: {
            season: payload.Season,
            soil_type: payload.Soil_Type,
            soil_ph: payload.pH ?? 0,
            market_demand: payload.Market_Demand ?? 'Medium',
            previous_crop: payload.Previous_Crop ?? null,
          },
        };

        queryClient.setQueryData(getLatestSmartRecommendationResultQueryKey(), cachedResult);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getPredictionHistoryQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getRecommendationsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: ['analytics', 'ai'] }),
      ]);

      navigation.navigate('RecommendationResult', {});
    },
    onError: (error: AppError) => {
      setErrorMessage(error.message);

      for (const field of formFieldNames) {
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
    if (!store) {
      setErrorMessage('Create your store profile before requesting a smart recommendation.');
      return;
    }

    if (!weatherQuery.data) {
      setErrorMessage(
        'Live weather data is required before generating a recommendation. Please retry after the weather section loads.',
      );
      return;
    }

    setErrorMessage(null);
    await smartRecommendationMutation.mutateAsync(toSmartPayload(values, store));
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

  if (!store) {
    return (
      <Screen scrollable contentClassName="gap-lg">
        <Card
          mode="outlined"
          style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
        >
          <Card.Content>
            <View className="gap-md">
              <Chip
                compact
                style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.primaryContainer }}
                textStyle={{ color: theme.colors.primary }}
              >
                AI Module
              </Chip>
              <Text
                variant="headlineSmall"
                style={{ color: theme.colors.onSurface, fontWeight: '700' }}
              >
                Create your store profile first
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Smart recommendations now use your store district as the location context before
                prediction.
              </Text>
              <Button
                mode="contained"
                onPress={() => {
                  navigation.navigate('AddFarm');
                }}
              >
                Create Store Profile
              </Button>
            </View>
          </Card.Content>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scrollable contentClassName="gap-lg">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="gap-lg">
          <View
            className="gap-sm rounded-lg border px-lg py-lg"
            style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
          >
            <Chip
              compact
              style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.primaryContainer }}
              textStyle={{ color: theme.colors.primary }}
            >
              AI Module
            </Chip>
            <Text
              variant="headlineMedium"
              style={{ color: theme.colors.onSurface, fontWeight: '700' }}
            >
              Smart Crop Recommendation
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Enter your season, soil type, soil pH, market demand, and previous crop. Live
              district weather is added automatically before the AI service recommends a crop.
            </Text>
          </View>

          <View className={isWide ? 'flex-row gap-md' : 'gap-md'}>
            <Card
              mode="outlined"
              style={{
                flex: 1,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline,
              }}
            >
              <Card.Content>
                <View className="gap-md">
                  <Text
                    variant="titleLarge"
                    style={{ color: theme.colors.onSurface, fontWeight: '700' }}
                  >
                    Recommendation Form
                  </Text>

                  <Controller
                    control={control}
                    name="season"
                    render={({ field: { onChange, value } }) => (
                      <SelectorField
                        label="Season"
                        value={value}
                        options={seasonOptions}
                        onSelect={onChange}
                        errorMessage={errors.season?.message}
                        disabled={smartRecommendationMutation.isPending}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="soil_type"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <AppTextInput
                        containerClassName="gap-0"
                        label="Soil Type"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        autoCapitalize="words"
                        errorMessage={errors.soil_type?.message}
                        disabled={smartRecommendationMutation.isPending}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="soil_ph"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <AppTextInput
                        containerClassName="gap-0"
                        label="Soil pH"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="decimal-pad"
                        errorMessage={errors.soil_ph?.message}
                        disabled={smartRecommendationMutation.isPending}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="market_demand"
                    render={({ field: { onChange, value } }) => (
                      <SelectorField
                        label="Market Demand"
                        value={value}
                        options={marketDemandOptions}
                        onSelect={onChange}
                        errorMessage={errors.market_demand?.message}
                        disabled={smartRecommendationMutation.isPending}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="previous_crop"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <AppTextInput
                        containerClassName="gap-0"
                        label="Previous Crop (optional)"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        autoCapitalize="words"
                        errorMessage={errors.previous_crop?.message}
                        disabled={smartRecommendationMutation.isPending}
                      />
                    )}
                  />

                  {smartRecommendationMutation.isPending ? (
                    <View
                      className="items-center gap-sm rounded-lg px-md py-md"
                      style={{ backgroundColor: theme.colors.surfaceVariant }}
                    >
                      <ActivityIndicator size="large" color={theme.colors.primary} />
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        Generating your smart recommendation...
                      </Text>
                    </View>
                  ) : null}

                  <AppButton
                    label="Request Smart Recommendation"
                    onPress={() => {
                      void onSubmit();
                    }}
                    loading={smartRecommendationMutation.isPending}
                    disabled={
                      smartRecommendationMutation.isPending || !isValid || !weatherQuery.data
                    }
                  />
                </View>
              </Card.Content>
            </Card>

            <View style={{ flex: 1 }} className="gap-md">
              <Card
                mode="outlined"
                style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
              >
                <Card.Content>
                  <View className="gap-md">
                    <Text
                      variant="titleLarge"
                      style={{ color: theme.colors.onSurface, fontWeight: '700' }}
                    >
                      Store Context
                    </Text>
                    <Text
                      variant="titleMedium"
                      style={{ color: theme.colors.onSurface, fontWeight: '700' }}
                    >
                      {store.store_name}
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      {store.address}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      District: {store.district}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Phone: {store.phone_number}
                    </Text>
                    {store.store_description?.trim() ? (
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {store.store_description}
                      </Text>
                    ) : null}
                  </View>
                </Card.Content>
              </Card>

              <Card
                mode="outlined"
                style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
              >
                <Card.Content>
                  <View className="gap-md">
                    <Text
                      variant="titleLarge"
                      style={{ color: theme.colors.onSurface, fontWeight: '700' }}
                    >
                      Weather Context
                    </Text>
                    {!store ? (
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        Weather preview will appear after you create your store profile.
                      </Text>
                    ) : weatherQuery.isLoading && !weatherQuery.data ? (
                      <View className="items-center gap-sm py-md">
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                          Loading weather for {store.district}...
                        </Text>
                      </View>
                    ) : weatherQuery.isError ? (
                      <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
                        {getErrorMessage(weatherQuery.error)}
                      </Text>
                    ) : weatherQuery.data ? (
                      <View className="gap-sm">
                        <View className="flex-row flex-wrap gap-sm">
                          <Chip compact>Temperature_C: {weatherQuery.data.temperature}</Chip>
                          <Chip compact>Humidity_pct: {weatherQuery.data.humidity}</Chip>
                          <Chip compact>Rainfall_mm: {weatherQuery.data.rainfall}</Chip>
                        </View>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                          {weatherQuery.data.condition_description ||
                            weatherQuery.data.condition ||
                            'Current conditions available'}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          {weatherQuery.data.location || store.district}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          These weather values are attached automatically when you submit the form.
                        </Text>
                      </View>
                    ) : (
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        Weather preview is unavailable right now.
                      </Text>
                    )}
                  </View>
                </Card.Content>
              </Card>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Snackbar
        visible={Boolean(errorMessage)}
        onDismiss={() => {
          setErrorMessage(null);
        }}
        action={{
          label: 'Close',
          onPress: () => {
            setErrorMessage(null);
          },
        }}
      >
        {errorMessage ?? ''}
      </Snackbar>
    </Screen>
  );
}
