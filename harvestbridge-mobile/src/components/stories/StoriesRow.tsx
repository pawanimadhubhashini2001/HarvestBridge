import { ScrollView, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import type { StoryFeedStoryDto } from '@/api/story-feed.api';
import { StoryBubble } from '@/components/stories/StoryBubble';
import { useAppTheme } from '@/hooks/use-app-theme';

interface StoriesRowProps {
  stories: StoryFeedStoryDto[];
  title: string;
  subtitle: string;
  onStoryPress: (story: StoryFeedStoryDto) => void;
  onViewAllPress: () => void;
  actionLabel?: string;
  onActionPress?: () => void;
  emptyStateMessage?: string;
}

export function StoriesRow({
  stories,
  title,
  subtitle,
  onStoryPress,
  onViewAllPress,
  actionLabel,
  onActionPress,
  emptyStateMessage,
}: StoriesRowProps) {
  const theme = useAppTheme();

  if (stories.length === 0 && !actionLabel && !emptyStateMessage) {
    return null;
  }

  return (
    <View className="gap-md">
      <View className="flex-row items-start justify-between gap-md">
        <View className="flex-1 gap-xs">
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
            {title}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {subtitle}
          </Text>
        </View>
        <View className="items-end gap-xs">
          {actionLabel && onActionPress ? (
            <Button mode="contained-tonal" onPress={onActionPress}>
              {actionLabel}
            </Button>
          ) : null}
          {stories.length > 0 ? (
            <Button mode="text" onPress={onViewAllPress}>
              View All
            </Button>
          ) : null}
        </View>
      </View>

      {stories.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-md pr-sm">
            {stories.map((story) => (
              <StoryBubble
                key={`story-bubble-${story.id}`}
                story={story}
                onPress={() => {
                  onStoryPress(story);
                }}
              />
            ))}
          </View>
        </ScrollView>
      ) : emptyStateMessage ? (
        <View
          className="rounded-lg border px-md py-md"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
          }}
        >
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {emptyStateMessage}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
