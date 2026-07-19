import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Circle } from 'react-native-svg';

import { useAppTheme } from '@/hooks/use-app-theme';

type ConfidenceMeterProps = {
  confidence: number;
  size?: number;
  strokeWidth?: number;
};

function clampConfidence(confidence: number) {
  const percent = confidence <= 1 ? confidence * 100 : confidence;

  return Math.max(0, Math.min(100, percent));
}

function getConfidenceLabel(confidence: number) {
  if (confidence >= 95) {
    return 'Excellent Prediction';
  }

  if (confidence >= 80) {
    return 'High Confidence';
  }

  if (confidence >= 60) {
    return 'Moderate Confidence';
  }

  return 'Low Confidence';
}

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3;
}

export function ConfidenceMeter({
  confidence,
  size,
  strokeWidth = 12,
}: ConfidenceMeterProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const animationFrameRef = useRef<number | null>(null);
  const displayedConfidenceRef = useRef(0);
  const [animatedConfidence, setAnimatedConfidence] = useState(0);

  const normalizedConfidence = useMemo(
    () => clampConfidence(confidence),
    [confidence],
  );
  const resolvedSize = useMemo(() => {
    if (size) {
      return size;
    }

    return Math.max(132, Math.min(180, width * 0.38));
  }, [size, width]);

  useEffect(() => {
    const startValue = displayedConfidenceRef.current;
    const endValue = normalizedConfidence;
    const startedAt = Date.now();
    const duration = 700;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (startValue === endValue) {
      setAnimatedConfidence(endValue);
      displayedConfidenceRef.current = endValue;
      return;
    }

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const nextValue = startValue + (endValue - startValue) * easedProgress;

      displayedConfidenceRef.current = nextValue;
      setAnimatedConfidence(nextValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(tick);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [normalizedConfidence]);

  const center = resolvedSize / 2;
  const radius = Math.max((resolvedSize - strokeWidth) / 2, 0);
  const circumference = Math.max(2 * Math.PI * radius, 0);
  const strokeDashoffset = Math.max(
    circumference - (animatedConfidence / 100) * circumference,
    0,
  );
  const strokeDasharray = `${circumference} ${circumference}`;
  const confidenceLabel = getConfidenceLabel(normalizedConfidence);
  const progressColor =
    normalizedConfidence >= 95
      ? theme.colors.tertiary
      : normalizedConfidence >= 80
        ? theme.colors.primary
        : normalizedConfidence >= 60
          ? theme.colors.secondary
          : theme.colors.error;

  return (
    <View
      style={[
        styles.container,
        { width: resolvedSize, height: resolvedSize, alignSelf: 'center' },
      ]}
    >
      <Svg width={resolvedSize} height={resolvedSize} viewBox={`0 0 ${resolvedSize} ${resolvedSize}`}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.colors.surfaceVariant}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      <View style={styles.content}>
        <Text
          variant="headlineMedium"
          style={{ color: theme.colors.onSurface, fontWeight: '700' }}
        >
          {`${Math.round(animatedConfidence)}%`}
        </Text>
        <Text
          variant="labelMedium"
          style={{
            color: progressColor,
            fontWeight: '700',
            textAlign: 'center',
          }}
        >
          {confidenceLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
  },
});
