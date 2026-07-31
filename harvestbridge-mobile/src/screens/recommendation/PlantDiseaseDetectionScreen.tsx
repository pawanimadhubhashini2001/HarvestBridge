import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Chip, HelperText, Snackbar, Text } from 'react-native-paper';

import {
  detectPlantDisease,
  getLatestDiseasePredictionQueryKey,
  type CachedDiseasePredictionResult,
  type DiseaseDetectionImageAsset,
} from '@/api/disease-detection.api';
import { AppButton } from '@/components/common/app-button';
import { Screen } from '@/components/layout/screen';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AppStackScreenProps } from '@/navigation/types';
import { getErrorMessage } from '@/utils/errorHandler';

function getImageFileName(uri: string, fallbackPrefix: string) {
  const parts = uri.split('/');
  const lastSegment = parts[parts.length - 1];

  return lastSegment || `${fallbackPrefix}-${Date.now()}.jpg`;
}

function buildImageAsset(
  asset: ImagePicker.ImagePickerAsset,
  source: 'camera' | 'gallery',
): DiseaseDetectionImageAsset {
  return {
    uri: asset.uri,
    name: asset.fileName ?? getImageFileName(asset.uri, `plant-${source}`),
    type: asset.mimeType ?? 'image/jpeg',
  };
}

export function PlantDiseaseDetectionScreen({
  navigation,
}: AppStackScreenProps<'PlantDiseaseDetection'>) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<DiseaseDetectionImageAsset | null>(null);
  const [imageSource, setImageSource] = useState<'camera' | 'gallery' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const detectDiseaseMutation = useMutation({
    mutationFn: async (image: DiseaseDetectionImageAsset) => detectPlantDisease(image),
    onSuccess: (response, image) => {
      const cachedResult: CachedDiseasePredictionResult = {
        image,
        source: imageSource ?? 'gallery',
        submitted_at: new Date().toISOString(),
        response,
      };

      queryClient.setQueryData(getLatestDiseasePredictionQueryKey(), cachedResult);
      setFeedbackMessage(null);
      navigation.navigate('PlantDiseasePrediction');
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  async function handleChooseFromGallery() {
    try {
      setValidationMessage(null);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== 'granted') {
        throw new Error('Photo library permission is required to select a plant image.');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsMultipleSelection: false,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      setSelectedImage(buildImageAsset(result.assets[0], 'gallery'));
      setImageSource('gallery');
    } catch (error) {
      setFeedbackMessage(getErrorMessage(error));
    }
  }

  async function handleCaptureWithCamera() {
    try {
      setValidationMessage(null);

      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (permission.status !== 'granted') {
        throw new Error('Camera permission is required to capture a plant image.');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsEditing: false,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      setSelectedImage(buildImageAsset(result.assets[0], 'camera'));
      setImageSource('camera');
    } catch (error) {
      setFeedbackMessage(getErrorMessage(error));
    }
  }

  function handleDetectDisease() {
    if (!selectedImage) {
      setValidationMessage('Capture or choose a plant image before requesting a prediction.');
      return;
    }

    setValidationMessage(null);
    void detectDiseaseMutation.mutateAsync(selectedImage);
  }

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
              variant="headlineMedium"
              style={{ color: theme.colors.onSurface, fontWeight: '700' }}
            >
              Plant Disease Detection
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Upload a clear plant image from your camera or gallery, and HarvestBridge will send
              it through the configured disease detection AI service.
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}
      >
        <Card.Content>
          <View className="gap-md">
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
              Plant Image
            </Text>

            {selectedImage ? (
              <Image
                source={{ uri: selectedImage.uri }}
                style={{
                  width: '100%',
                  height: 280,
                  borderRadius: 18,
                  backgroundColor: theme.colors.surfaceVariant,
                }}
                contentFit="cover"
              />
            ) : (
              <View
                className="items-center justify-center gap-sm rounded-lg border px-lg py-xl"
                style={{
                  minHeight: 280,
                  borderColor: theme.colors.outline,
                  backgroundColor: theme.colors.surfaceVariant,
                }}
              >
                <MaterialCommunityIcons
                  name="leaf-circle-outline"
                  size={72}
                  color={theme.colors.primary}
                />
                <Text
                  variant="titleMedium"
                  style={{ color: theme.colors.onSurface, fontWeight: '700', textAlign: 'center' }}
                >
                  No image selected yet
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
                >
                  Capture a close, well-lit photo of the affected plant area for better prediction
                  quality.
                </Text>
              </View>
            )}

            <View className="flex-row flex-wrap gap-sm">
              <Button
                mode="contained-tonal"
                disabled={detectDiseaseMutation.isPending}
                onPress={() => {
                  void handleCaptureWithCamera();
                }}
              >
                Camera
              </Button>
              <Button
                mode="outlined"
                disabled={detectDiseaseMutation.isPending}
                onPress={() => {
                  void handleChooseFromGallery();
                }}
              >
                Gallery Upload
              </Button>
            </View>

            <HelperText type="info" visible>
              Accepted input: a single plant image up to 10 MB.
            </HelperText>
            <HelperText type="error" visible={Boolean(validationMessage)}>
              {validationMessage ?? ''}
            </HelperText>
            {selectedImage ? (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Selected file: {selectedImage.name}
              </Text>
            ) : null}

            <AppButton
              label={detectDiseaseMutation.isPending ? 'Analyzing Plant...' : 'Detect Disease'}
              loading={detectDiseaseMutation.isPending}
              disabled={detectDiseaseMutation.isPending}
              onPress={handleDetectDisease}
            />
          </View>
        </Card.Content>
      </Card>

      <Snackbar visible={Boolean(feedbackMessage)} onDismiss={() => setFeedbackMessage(null)}>
        {feedbackMessage ?? ''}
      </Snackbar>
    </Screen>
  );
}
