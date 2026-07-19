import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

import type { StoryFeedStoryDto } from '@/api/story-feed.api';
import { useAppTheme } from '@/hooks/use-app-theme';

interface StoryBubbleProps {
  story: StoryFeedStoryDto;
  onPress: () => void;
}

function formatDistance(distance?: number | null) {
  if (typeof distance !== 'number' || !Number.isFinite(distance)) {
    return null;
  }

  return `${distance.toFixed(distance % 1 === 0 ? 0 : 1)} km`;
}

export function StoryBubble({ story, onPress }: StoryBubbleProps) {
  const theme = useAppTheme();
  const distanceLabel = formatDistance(story.distance_km ?? story.distance ?? null);
  const previewImageUrl =
    story.media_type === 'image'
      ? story.media_url
      : story.store?.store_logo_url ?? null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open story from ${story.store?.store_name ?? 'store'}`}
      onPress={onPress}>
      <View className="items-center gap-xs" style={{ width: 86 }}>
        <View
          className="items-center justify-center rounded-full p-1"
          style={{ backgroundColor: theme.colors.primary }}>
          <View
            className="items-center justify-center overflow-hidden rounded-full"
            style={{
              width: 68,
              height: 68,
              backgroundColor: theme.colors.surfaceVariant,
            }}>
            {previewImageUrl ? (
              <Image
                source={{ uri: previewImageUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : story.media_type === 'video' ? (
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Video
              </Text>
            ) : (
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Story
              </Text>
            )}
          </View>
        </View>
        <Text
          numberOfLines={1}
          variant="bodySmall"
          style={{ color: theme.colors.onSurface, fontWeight: '600', textAlign: 'center' }}>
          {story.store?.store_name ?? 'Store'}
        </Text>
        {distanceLabel ? (
          <Chip compact style={{ maxWidth: 82 }}>
            {distanceLabel}
          </Chip>
        ) : (
          <Text
            numberOfLines={1}
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            Latest
          </Text>
        )}
      </View>
    </Pressable>
  );
}
