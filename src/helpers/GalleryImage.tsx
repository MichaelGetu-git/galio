import React from 'react';
import { Image as RNImage } from 'react-native';
import Animated from 'react-native-reanimated';

/**
 * GalleryImage — a Reanimated-animatable image that uses `expo-image` for
 * memory+disk caching and instant re-render when it is installed, and falls
 * back to the core RN Image otherwise (same optional-peer pattern as
 * VideoPlayer). Either way it accepts a Reanimated style so the pinch/zoom
 * transform can be applied on the UI thread.
 */
let ExpoImage: any = null;
try {
  // Optional dependency — never a hard require.
  ExpoImage = require('expo-image').Image;
} catch {
  ExpoImage = null;
}

// createAnimatedComponent so `useAnimatedStyle` transforms drive the image.
const AnimatedMedia: any = Animated.createAnimatedComponent(ExpoImage ?? RNImage);

/**
 * Warm the cache before the gallery renders so the first frame is immediate
 * instead of a white/black flash. No-op when expo-image is absent.
 */
export function preloadImages(uris: string[]): void {
  if (ExpoImage && typeof ExpoImage.prefetch === 'function' && uris.length) {
    try {
      ExpoImage.prefetch(uris, { cachePolicy: 'memory-disk' });
    } catch {
      /* prefetch is best-effort */
    }
  }
}

export interface GalleryImageProps {
  uri: string;
  style?: any;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function GalleryImage({ uri, style, accessibilityLabel, accessibilityHint }: GalleryImageProps) {
  if (ExpoImage) {
    return (
      <AnimatedMedia
        source={{ uri }}
        style={style}
        contentFit="contain"
        // memory-disk => decoded frame is reused instantly on revisit/re-open.
        cachePolicy="memory-disk"
        // Short cross-fade hides any decode latency instead of a hard flash.
        transition={150}
        // Stable key lets expo-image recycle views cleanly inside the FlatList.
        recyclingKey={uri}
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      />
    );
  }

  // Fallback: core RN Image (no disk cache, but correct rendering + gestures).
  return (
    <AnimatedMedia
      source={{ uri }}
      style={style}
      resizeMode="contain"
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    />
  );
}
