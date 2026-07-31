import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { Button, Card, Snackbar, Text } from 'react-native-paper';

import {
  deleteStoreLogo,
  getMyStoreQueryKey,
  getStoreDetailsQueryKey,
  type StoreDto,
  type StoreImageAsset,
  uploadStoreLogo,
} from '@/api/store.api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getErrorMessage } from '@/utils/errorHandler';

function getImageFileName(uri: string, fallbackPrefix: string) {
  const uriSegments = uri.split('/');
  const lastSegment = uriSegments[uriSegments.length - 1];

  if (lastSegment) {
    return lastSegment;
  }

  return `${fallbackPrefix}-${Date.now()}.jpg`;
}

async function resolveWebImageFile(params: {
  asset: ImagePicker.ImagePickerAsset;
  mimeType: string;
  fileName: string;
}) {
  const directFile =
    'file' in params.asset
      ? ((params.asset as ImagePicker.ImagePickerAsset & { file?: Blob | null }).file ?? null)
      : null;

  if (directFile) {
    return directFile;
  }

  if (Platform.OS !== 'web') {
    return null;
  }

  const response = await fetch(params.asset.uri);
  const blob = await response.blob();

  if (typeof File !== 'undefined') {
    return new File([blob], params.fileName, {
      type: params.mimeType,
    });
  }

  return blob;
}

function StoreImageSlot({
  label,
  imageUrl,
  placeholder,
  actionLabel,
  deleteLabel,
  onUpload,
  onDelete,
  uploading,
  deleting,
  height,
}: {
  label: string;
  imageUrl?: string | null;
  placeholder: string;
  actionLabel: string;
  deleteLabel: string;
  onUpload: () => void;
  onDelete: () => void;
  uploading: boolean;
  deleting: boolean;
  height: number;
}) {
  const theme = useAppTheme();

  return (
    <View className="gap-sm">
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
        {label}
      </Text>
      {imageUrl ? (
        <View className="overflow-hidden rounded-lg border" style={{ borderColor: theme.colors.outline }}>
          <Image source={{ uri: imageUrl }} style={{ width: '100%', height }} contentFit="cover" />
        </View>
      ) : (
        <View
          className="items-center justify-center rounded-lg border border-dashed px-md py-xl"
          style={{
            borderColor: theme.colors.outline,
            minHeight: height,
            backgroundColor: theme.colors.surfaceVariant,
          }}
        >
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            {placeholder}
          </Text>
        </View>
      )}
      <View className="flex-row flex-wrap gap-sm">
        <Button
          mode="contained-tonal"
          loading={uploading}
          disabled={uploading || deleting}
          onPress={onUpload}
        >
          {imageUrl ? actionLabel : actionLabel.replace('Change', 'Upload')}
        </Button>
        <Button
          mode="outlined"
          disabled={!imageUrl || uploading || deleting}
          loading={deleting}
          onPress={onDelete}
        >
          {deleteLabel}
        </Button>
      </View>
    </View>
  );
}

export function StoreImageManager({
  storeId,
  store,
}: {
  storeId: number | string;
  store: StoreDto;
}) {
  const queryClient = useQueryClient();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const syncStore = async (updatedStore: StoreDto, successMessage: string) => {
    queryClient.setQueryData(getMyStoreQueryKey(), updatedStore);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getMyStoreQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getStoreDetailsQueryKey(storeId) }),
    ]);
    setFeedbackMessage(successMessage);
  };

  const logoUploadMutation = useMutation({
    mutationFn: async (image: StoreImageAsset) => uploadStoreLogo(storeId, image),
    onSuccess: async (updatedStore) => {
      await syncStore(updatedStore, 'Store logo updated successfully.');
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  const logoDeleteMutation = useMutation({
    mutationFn: async () => deleteStoreLogo(storeId),
    onSuccess: async (updatedStore) => {
      await syncStore(updatedStore, 'Store logo deleted successfully.');
    },
    onError: (error) => {
      setFeedbackMessage(getErrorMessage(error));
    },
  });

  const pickImage = async (fallbackPrefix: string) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      throw new Error('Photo library permission is required to upload a store image.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsMultipleSelection: false,
    });

    if (result.canceled || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const fileName = asset.fileName ?? getImageFileName(asset.uri, fallbackPrefix);
    const mimeType = asset.mimeType ?? 'image/jpeg';
    const browserFile = await resolveWebImageFile({
      asset,
      mimeType,
      fileName,
    });

    return {
      uri: asset.uri,
      name: fileName,
      type: mimeType,
      file: browserFile,
    } satisfies StoreImageAsset;
  };

  const handleLogoUpload = async () => {
    try {
      const image = await pickImage('store-logo');

      if (!image) {
        return;
      }

      await logoUploadMutation.mutateAsync(image);
    } catch (error) {
      setFeedbackMessage(getErrorMessage(error));
    }
  };

  return (
    <>
      <Card mode="outlined">
        <Card.Content>
          <View className="gap-lg">
            <View className="gap-xs">
              <Text variant="titleLarge" style={{ fontWeight: '700' }}>
                Store Logo
              </Text>
              <Text variant="bodySmall">
                Upload a logo for your store. Supported formats are JPG, PNG, and WEBP.
              </Text>
            </View>

            <StoreImageSlot
              label="Store Logo"
              imageUrl={store.store_logo_url ?? store.logo_url ?? store.store_image_url}
              placeholder="Default logo placeholder"
              actionLabel="Change Logo"
              deleteLabel="Delete Logo"
              onUpload={() => {
                void handleLogoUpload();
              }}
              onDelete={() => {
                void logoDeleteMutation.mutateAsync();
              }}
              uploading={logoUploadMutation.isPending}
              deleting={logoDeleteMutation.isPending}
              height={150}
            />
          </View>
        </Card.Content>
      </Card>

      <Snackbar
        visible={Boolean(feedbackMessage)}
        onDismiss={() => {
          setFeedbackMessage(null);
        }}
        action={{
          label: 'Close',
          onPress: () => {
            setFeedbackMessage(null);
          },
        }}
      >
        {feedbackMessage ?? ''}
      </Snackbar>
    </>
  );
}
