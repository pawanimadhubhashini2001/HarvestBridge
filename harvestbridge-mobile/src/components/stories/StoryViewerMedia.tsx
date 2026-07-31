import { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';

import type { StoryFeedStoryDto } from '@/api/story-feed.api';
import { useAppTheme } from '@/hooks/use-app-theme';

const IMAGE_DURATION_MS = 5000;
const PROGRESS_TICK_MS = 60;
const VIDEO_TICK_MS = 120;

interface StoryViewerMediaProps {
  story: StoryFeedStoryDto;
  isActive: boolean;
  isPaused: boolean;
  onProgressChange: (progress: number) => void;
  onComplete: () => void;
  onTogglePause: () => void;
}

export function StoryViewerMedia({
  story,
  isActive,
  isPaused,
  onProgressChange,
  onComplete,
  onTogglePause,
}: StoryViewerMediaProps) {
  const theme = useAppTheme();
  const imageElapsedMsRef = useRef(0);
  const hasCompletedRef = useRef(false);

  const player = useVideoPlayer(
    story.media_type === 'video' ? story.media_url : null,
    (instance) => {
      instance.loop = false;
      instance.muted = false;
      instance.allowsExternalPlayback = false;
    },
  );

  useEffect(() => {
    imageElapsedMsRef.current = 0;
    hasCompletedRef.current = false;
  }, [story.id]);

  useEffect(() => {
    if (!isActive) {
      if (story.media_type === 'video') {
        player.pause();
        player.currentTime = 0;
      }

      imageElapsedMsRef.current = 0;
      hasCompletedRef.current = false;
      return;
    }

    if (story.media_type === 'image') {
      if (isPaused) {
        return;
      }

      const startedAt = Date.now() - imageElapsedMsRef.current;
      const interval = setInterval(() => {
        const elapsed = Math.min(Date.now() - startedAt, IMAGE_DURATION_MS);
        imageElapsedMsRef.current = elapsed;

        const progress = elapsed / IMAGE_DURATION_MS;
        onProgressChange(progress);

        if (progress >= 1 && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          clearInterval(interval);
          onComplete();
        }
      }, PROGRESS_TICK_MS);

      return () => {
        clearInterval(interval);
      };
    }

    if (player.currentTime > 0.1 && player.duration > 0 && player.currentTime >= player.duration) {
      player.currentTime = 0;
    }

    if (isPaused) {
      player.pause();
    } else {
      player.play();
    }

    const interval = setInterval(() => {
      const duration = Number.isFinite(player.duration) ? player.duration : 0;
      const currentTime = Number.isFinite(player.currentTime) ? player.currentTime : 0;

      if (duration <= 0) {
        return;
      }

      const progress = Math.min(currentTime / duration, 1);
      onProgressChange(progress);

      if (progress >= 0.995 && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        player.pause();
        onComplete();
      }
    }, VIDEO_TICK_MS);

    return () => {
      clearInterval(interval);
      player.pause();
    };
  }, [isActive, isPaused, onComplete, onProgressChange, player, story.media_type]);

  const media = story.media_type === 'video' ? (
    <VideoView
      style={{ width: '100%', height: '100%' }}
      player={player}
      nativeControls={false}
      contentFit="contain"
    />
  ) : (
    <Image
      source={{ uri: story.media_url }}
      style={{ width: '100%', height: '100%' }}
      contentFit="contain"
      transition={180}
    />
  );

  return (
    <Pressable style={{ flex: 1 }} onPress={onTogglePause}>
      <View style={{ flex: 1, backgroundColor: theme.colors.backdrop }}>
        {media}

        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.18)',
          }}
        />
      </View>
    </Pressable>
  );
}
