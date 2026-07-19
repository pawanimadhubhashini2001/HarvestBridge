import { Image } from 'expo-image';
import { View } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';

import type { StoreStoryMediaType } from '@/api/store-story.api';
import { useAppTheme } from '@/hooks/use-app-theme';

interface StoreStoryPreviewCardProps {
  caption?: string | null;
  mediaType: StoreStoryMediaType;
  mediaUrl?: string | null;
  createdAtLabel?: string | null;
  expiresAtLabel?: string | null;
  storeName?: string | null;
  fileName?: string | null;
}

export function StoreStoryPreviewCard({
  caption,
  mediaType,
  mediaUrl,
  createdAtLabel,
  expiresAtLabel,
  storeName,
  fileName,
}: StoreStoryPreviewCardProps) {
  const theme = useAppTheme();

  return (
    <Card
      mode="outlined"
      style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }}>
      <Card.Content>
        <View className="gap-md">
          <View className="gap-xs">
            <View className="flex-row flex-wrap gap-sm">
              <Chip compact>{mediaType === 'video' ? 'Video Story' : 'Image Story'}</Chip>
              {storeName ? <Chip compact>{storeName}</Chip> : null}
            </View>
            {createdAtLabel ? (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Posted: {createdAtLabel}
              </Text>
            ) : null}
            {expiresAtLabel ? (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Expires: {expiresAtLabel}
              </Text>
            ) : null}
          </View>

          {mediaType === 'image' && mediaUrl ? (
            <View className="overflow-hidden rounded-lg">
              <Image
                source={{ uri: mediaUrl }}
                style={{
                  width: '100%',
                  height: 260,
                  borderRadius: 16,
                  backgroundColor: theme.colors.surfaceVariant,
                }}
                contentFit="cover"
              />
            </View>
          ) : (
            <View
              className="items-center justify-center rounded-lg border border-dashed px-lg py-xl"
              style={{
                minHeight: 220,
                borderColor: theme.colors.outline,
                backgroundColor: theme.colors.surfaceVariant,
              }}>
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.onSurface, fontWeight: '700', textAlign: 'center' }}>
                Video story selected
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                {fileName ?? 'The selected video will be uploaded as your active story.'}
              </Text>
            </View>
          )}

          <View className="gap-xs">
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
              Caption
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {caption?.trim() || 'No caption added yet.'}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}
