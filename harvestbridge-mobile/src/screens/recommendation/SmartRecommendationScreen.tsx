import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  View,
} from 'react-native';
import { Button, Card, Chip, Divider, Menu, Snackbar, Text } from 'react-native-paper';
import { z } from 'zod';

import { getFarms, getFarmsQueryKey, type FarmDto } from '@/api/farm.api';
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
  farm_id: z.string().min(1, 'Please select a farm.'),
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
  nitrogen: z
    .string()
    .trim()
    .min(1, 'Nitrogen is required.')
    .refine((value) => !Number.isNaN(Number(value)), 'Nitrogen must be a number.')
    .refine((value) => Number(value) >= 0, 'Nitrogen must be 0 or greater.'),
  phosphorus: z
    .string()
    .trim()
    .min(1, 'Phosphorus is required.')
    .refine((value) => !Number.isNaN(Number(value)), 'Phosphorus must be a number.')
    .refine((value) => Number(value) >= 0, 'Phosphorus must be 0 or greater.'),
  potassium: z
    .string()
    .trim()
    .min(1, 'Potassium is required.')
    .refine((value) => !Number.isNaN(Number(value)), 'Potassium must be a number.')
    .refine((value) => Number(value) >= 0, 'Potassium must be 0 or greater.'),
  market_demand: z.enum(marketDemandOptions, {
    message: 'Please select market demand.',
  }),
  additional_notes: z
    .string()
    .trim()
    .max(500, 'Additional notes are too long.')
    .optional()
    .or(z.literal('')),
});

type SmartRecommendationFormValues = z.infer<typeof smartRecommendationSchema>;

const formFieldNames = [
  'farm_id',
  'season',
  'soil_type',
  'soil_ph',
  'nitrogen',
  'phosphorus',
  'potassium',
  'market_demand',
  'additional_notes',
] as const satisfies readonly (keyof SmartRecommendationFormValues)[];

function SelectorField({
  label,
  value,
  placeholder,
  visible,
  onOpen,
  onDismiss,
  options,
  onSelect,
  errorMessage,
  disabled = false,
}: {
  label: string;
  value?: string;
  placeholder: string;
  visible: boolean;
  onOpen: () => void;
  onDismiss: () => void;
  options: { label: string; value: string }[];
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
      <Menu
        visible={visible}
        onDismiss={onDismiss}
        anchor={
          <Button
            mode="outlined"
            icon="chevron-down"
            disabled={disabled}
            contentStyle={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}
            style={{ justifyContent: 'center' }}
            onPress={onOpen}
          >
            {value || placeholder}
          </Button>
        }
      >
        {options.map((option) => (
          <Menu.Item
            key={option.value}
            title={option.label}
            onPress={() => {
              onSelect(option.value);
              onDismiss();
            }}
          />
        ))}
      </Menu>
      {errorMessage ? (
        <Text variant="bodySmall" style={{ color: theme.colors.error }}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

function formatFarmSize(farm: FarmDto) {
  const numericValue =
    typeof farm.farm_size === 'number' ? farm.farm_size : Number(farm.farm_size);

  if (Number.isNaN(numericValue)) {
    return `${farm.farm_size} ${farm.farm_size_unit}`;
  }

  return `${new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(numericValue)} ${farm.farm_size_unit}`;
}

function toSmartPayload(
  values: SmartRecommendationFormValues,
  selectedFarm: FarmDto,
): SmartPredictionPayload {
  return {
    District: selectedFarm.district,
    Season: values.season,
    Soil_Type: values.soil_type.trim(),
    pH: Number(values.soil_ph),
    Market_Demand: values.market_demand,
  };
}

export function SmartRecommendationScreen({
  navigation,
}: AppStackScreenProps<'AIRecommendationForm'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const [farmMenuVisible, setFarmMenuVisible] = useState(false);
  const [seasonMenuVisible, setSeasonMenuVisible] = useState(false);
  const [marketMenuVisible, setMarketMenuVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isValid },
  } = useForm<SmartRecommendationFormValues>({
    defaultValues: {
      farm_id: '',
      season: 'Yala',
      soil_type: '',
      soil_ph: '',
      nitrogen: '',
      phosphorus: '',
      potassium: '',
      market_demand: 'Medium',
      additional_notes: '',
    },
    resolver: zodResolver(smartRecommendationSchema),
    mode: 'onChange',
  });

  const selectedFarmId = useWatch({
    control,
    name: 'farm_id',
  });
  const soilPhValue = useWatch({
    control,
    name: 'soil_ph',
  });
  const nitrogenValue = useWatch({
    control,
    name: 'nitrogen',
  });
  const phosphorusValue = useWatch({
    control,
    name: 'phosphorus',
  });
  const potassiumValue = useWatch({
    control,
    name: 'potassium',
  });
  const additionalNotesValue = useWatch({
    control,
    name: 'additional_notes',
  });

  const farmsQuery = useQuery({
    queryKey: getFarmsQueryKey(),
    queryFn: getFarms,
    staleTime: QUERY_STALE_TIME_MS,
  });

  const farms = useMemo(() => farmsQuery.data ?? [], [farmsQuery.data]);
  const selectedFarm = useMemo(
    () => farms.find((farm) => String(farm.id) === selectedFarmId),
    [farms, selectedFarmId],
  );

  const weatherQuery = useQuery({
    queryKey: getCurrentWeatherQueryKey(selectedFarm?.district),
    queryFn: () => getCurrentWeather(selectedFarm?.district ?? ''),
    enabled: Boolean(selectedFarm?.district),
  });

  useEffect(() => {
    if (!selectedFarm) {
      return;
    }

    setValue('soil_type', selectedFarm.soil_type, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [selectedFarm, setValue]);

  const smartRecommendationMutation = useMutation({
    mutationFn: async (payload: SmartPredictionPayload) => smartPredict(payload),
    onSuccess: async (response, payload) => {
      setErrorMessage(null);
      if (selectedFarm) {
        const cachedResult: CachedSmartRecommendationResult = {
          request: payload,
          response,
          submitted_at: new Date().toISOString(),
          farm: {
            id: String(selectedFarm.id),
            name: selectedFarm.farm_name,
            district: selectedFarm.district,
            soil_type: selectedFarm.soil_type,
          },
          form: {
            season: payload.Season,
            soil_ph: Number(soilPhValue),
            nitrogen: Number(nitrogenValue),
            phosphorus: Number(phosphorusValue),
            potassium: Number(potassiumValue),
            market_demand: payload.Market_Demand,
            additional_notes: additionalNotesValue?.trim() || undefined,
          },
        };

        queryClient.setQueryData(getLatestSmartRecommendationResultQueryKey(), cachedResult);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getPredictionHistoryQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getRecommendationsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: ['analytics', 'ai'] }),
      ]);
      navigation.navigate('RecommendationResult', { predictionId: undefined });
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
    if (!selectedFarm) {
      setError('farm_id', {
        message: 'Please select a farm.',
      });
      return;
    }

    setErrorMessage(null);
    await smartRecommendationMutation.mutateAsync(toSmartPayload(values, selectedFarm));
  });

  if (farmsQuery.isLoading && !farmsQuery.data) {
    return <LoadingState message="Loading your farms..." />;
  }

  if (farmsQuery.isError && !farmsQuery.data) {
    return (
      <ErrorState
        title="Unable to load farms"
        message={getErrorMessage(farmsQuery.error)}
        actionLabel="Retry"
        onAction={() => {
          void farmsQuery.refetch();
        }}
      />
    );
  }

  if (farms.length === 0) {
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
                Add a farm first
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Smart recommendations need a farm so the system can use its district and soil
                context.
              </Text>
              <Button
                mode="contained"
                onPress={() => {
                  navigation.navigate('AddFarm');
                }}
              >
                Add Farm
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
              Select a farm, confirm growing conditions, and let the AI service use live weather
              context from the farm district.
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
                    name="farm_id"
                    render={({ field: { onChange, value } }) => (
                      <SelectorField
                        label="Farm Selector"
                        value={farms.find((farm) => String(farm.id) === value)?.farm_name}
                        placeholder="Choose a farm"
                        visible={farmMenuVisible}
                        onOpen={() => {
                          setFarmMenuVisible(true);
                        }}
                        onDismiss={() => {
                          setFarmMenuVisible(false);
                        }}
                        options={farms.map((farm) => ({
                          label: `${farm.farm_name} - ${farm.district}`,
                          value: String(farm.id),
                        }))}
                        onSelect={onChange}
                        errorMessage={errors.farm_id?.message}
                        disabled={smartRecommendationMutation.isPending}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="season"
                    render={({ field: { onChange, value } }) => (
                      <SelectorField
                        label="Season Selector"
                        value={value}
                        placeholder="Choose a season"
                        visible={seasonMenuVisible}
                        onOpen={() => {
                          setSeasonMenuVisible(true);
                        }}
                        onDismiss={() => {
                          setSeasonMenuVisible(false);
                        }}
                        options={seasonOptions.map((season) => ({
                          label: season,
                          value: season,
                        }))}
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

                  <View className={isWide ? 'flex-row gap-md' : 'gap-md'}>
                    <View style={{ flex: 1 }}>
                      <Controller
                        control={control}
                        name="nitrogen"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <AppTextInput
                            containerClassName="gap-0"
                            label="Nitrogen"
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            keyboardType="decimal-pad"
                            errorMessage={errors.nitrogen?.message}
                            disabled={smartRecommendationMutation.isPending}
                          />
                        )}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Controller
                        control={control}
                        name="phosphorus"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <AppTextInput
                            containerClassName="gap-0"
                            label="Phosphorus"
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            keyboardType="decimal-pad"
                            errorMessage={errors.phosphorus?.message}
                            disabled={smartRecommendationMutation.isPending}
                          />
                        )}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Controller
                        control={control}
                        name="potassium"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <AppTextInput
                            containerClassName="gap-0"
                            label="Potassium"
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            keyboardType="decimal-pad"
                            errorMessage={errors.potassium?.message}
                            disabled={smartRecommendationMutation.isPending}
                          />
                        )}
                      />
                    </View>
                  </View>

                  <Controller
                    control={control}
                    name="market_demand"
                    render={({ field: { onChange, value } }) => (
                      <SelectorField
                        label="Market Demand"
                        value={value}
                        placeholder="Choose market demand"
                        visible={marketMenuVisible}
                        onOpen={() => {
                          setMarketMenuVisible(true);
                        }}
                        onDismiss={() => {
                          setMarketMenuVisible(false);
                        }}
                        options={marketDemandOptions.map((option) => ({
                          label: option,
                          value: option,
                        }))}
                        onSelect={onChange}
                        errorMessage={errors.market_demand?.message}
                        disabled={smartRecommendationMutation.isPending}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="additional_notes"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <AppTextInput
                        containerClassName="gap-0"
                        label="Additional Notes (optional)"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        multiline
                        numberOfLines={4}
                        errorMessage={errors.additional_notes?.message}
                        disabled={smartRecommendationMutation.isPending}
                      />
                    )}
                  />

                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    The current smart recommendation API uses district, season, soil type, pH, and
                    market demand. Nutrient values and notes are collected here for operator
                    context.
                  </Text>

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
                    disabled={smartRecommendationMutation.isPending || !isValid}
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
                      Selected Farm
                    </Text>

                    {!selectedFarm ? (
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        Select a farm to preload district and soil information.
                      </Text>
                    ) : (
                      <View className="gap-sm">
                        <Text
                          variant="titleMedium"
                          style={{ color: theme.colors.onSurface, fontWeight: '700' }}
                        >
                          {selectedFarm.farm_name}
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                          {selectedFarm.address}
                        </Text>
                        <Divider />
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          District
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                          {selectedFarm.district}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Soil Type
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                          {selectedFarm.soil_type}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Farm Size
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                          {formatFarmSize(selectedFarm)}
                        </Text>
                      </View>
                    )}
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
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      The backend automatically loads weather by district during smart prediction.
                    </Text>

                    {!selectedFarm ? (
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        Weather preview will appear after you select a farm.
                      </Text>
                    ) : weatherQuery.isLoading && !weatherQuery.data ? (
                      <View className="items-center gap-sm py-md">
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                          Loading weather for {selectedFarm.district}...
                        </Text>
                      </View>
                    ) : weatherQuery.isError ? (
                      <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
                        {getErrorMessage(weatherQuery.error)}
                      </Text>
                    ) : weatherQuery.data ? (
                      <View className="gap-sm">
                        <View className="flex-row flex-wrap gap-sm">
                          <Chip compact>{weatherQuery.data.temperature} deg C</Chip>
                          <Chip compact>{weatherQuery.data.humidity}% humidity</Chip>
                          <Chip compact>{weatherQuery.data.rainfall} mm rain</Chip>
                        </View>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                          {weatherQuery.data.condition_description ||
                            weatherQuery.data.condition ||
                            'Current conditions available'}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          {weatherQuery.data.location || selectedFarm.district}
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

              <Card
                mode="outlined"
                style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
              >
                <Card.Content>
                  <View className="gap-sm">
                    <Text
                      variant="titleLarge"
                      style={{ color: theme.colors.onSurface, fontWeight: '700' }}
                    >
                      Submission Notes
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      Results are not shown here. After a successful request, the app moves to the
                      AI result screen.
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Existing endpoint used: /ai/smart-predict
                    </Text>
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
