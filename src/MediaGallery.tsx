import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewToken,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedRef,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

// Double-tap zoom target (MG-02).
const DOUBLE_TAP_SCALE = 3;

/**
 * Validates media items to ensure they have proper URIs
 * @param items - Array of media items to validate
 * @returns Filtered array of valid media items
 */
function validateMediaItems(items: MediaItem[]): MediaItem[] {
  return items.filter(item => {
    if (!item.uri || typeof item.uri !== 'string') {
      console.warn('MediaGallery: Invalid media item - missing or invalid URI', item);
      return false;
    }
    return true;
  });
}

/**
 * Safely clamps a value between min and max
 * @param value - The value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}
import { useTheme, useColors } from './theme';
import { registerInterop } from './helpers/interop';
import { VideoPlayer } from './helpers/VideoPlayer';
import { GalleryImage, preloadImages } from './helpers/GalleryImage';



export interface MediaItem {
  uri: string;
  type?: 'image' | 'video';
}

export interface MediaGalleryProps {
  visible: boolean;
  items: MediaItem[];
  initialIndex?: number;
  onClose?: () => void;
  enableZoom?: boolean;
  enableSwipeToDismiss?: boolean;
  className?: string;
  maxZoomLevel?: number;
}

// Constants for gesture behavior and validation
const GESTURE_CONFIG = {
  MAX_ZOOM: 5,
  MIN_ZOOM: 1,
  DOUBLE_TAP_SCALE_DEFAULT: 3,
  DRAG_SLOP: 12,
  DISMISS_THRESHOLD: 80,
  VELOCITY_THRESHOLD: 200,
  RESET_SCALE_THRESHOLD: 1.2,
} as const;

// ── Single zoomable image ──
function ZoomableImage({
  uri,
  onClose,
  enableZoom,
  enableSwipeToDismiss,
  onZoomChange,
}: {
  uri: string;
  onClose?: () => void;
  enableZoom: boolean;
  enableSwipeToDismiss: boolean;
  onZoomChange?: (zoomed: boolean) => void;
}) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const dismissY = useSharedValue(0);
  const dismissProgress = useSharedValue(0);
  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);

  // ── Isolate from paging (MG-01/03): the instant the image is zoomed, tell the
  // parent to disable the horizontal FlatList so the pan drives the image instead
  // of paging; re-enable the moment we're back to 1x. Driven on the UI thread. ──
  useAnimatedReaction(
    () => scale.value > 1,
    (zoomed, prev) => {
      if (zoomed !== prev && onZoomChange) runOnJS(onZoomChange)(zoomed);
    }
  );

  // ── Pinch ──
  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          savedScale.value = scale.value;
        })
        .onUpdate((e) => {
          const newScale = Math.max(1, Math.min(savedScale.value * e.scale, 5));
          scale.value = newScale;
        })
        .onEnd(() => {
          savedScale.value = scale.value;
          if (scale.value < 1.2) {
            scale.value = withSpring(1);
            savedScale.value = 1;
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
            savedTranslateX.value = 0;
            savedTranslateY.value = 0;
          }
        }),
    [scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY]
  );

  // ── Double tap ──
  const doubleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .maxDuration(250)
        .onEnd((e) => {
          if (scale.value > 1) {
            // Already zoomed → spring back to 1x, centered.
            scale.value = withSpring(1);
            savedScale.value = 1;
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
            savedTranslateX.value = 0;
            savedTranslateY.value = 0;
          } else {
            // Zoom IN, centering on the tapped point so it stays under the finger.
            // The gesture view is SCREEN_WIDTH×SCREEN_HEIGHT and scales about its
            // centre, so translate = (centre − focal) × (scale − 1), clamped to
            // the enlarged image's bounds (the image is a SCREEN_WIDTH square).
            const target = DOUBLE_TAP_SCALE;
            const maxTx = ((target - 1) * SCREEN_WIDTH) / 2;
            const maxTy = ((target - 1) * SCREEN_WIDTH) / 2;
            let tx = (SCREEN_WIDTH / 2 - e.x) * (target - 1);
            let ty = (SCREEN_HEIGHT / 2 - e.y) * (target - 1);
            tx = Math.max(-maxTx, Math.min(tx, maxTx));
            ty = Math.max(-maxTy, Math.min(ty, maxTy));
            scale.value = withSpring(target);
            savedScale.value = target;
            translateX.value = withSpring(tx);
            translateY.value = withSpring(ty);
            savedTranslateX.value = tx;
            savedTranslateY.value = ty;
          }
        }),
    [scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY, SCREEN_WIDTH, SCREEN_HEIGHT]
  );

  // ── Single tap (for future overlay toggle) ──
  const singleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(1)
        .onEnd(() => {
          /* tap to toggle UI overlay */
        }),
    []
  );

  // ── Pan ──
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minPointers(1)
        .manualActivation(true)
        .onTouchesDown((e) => {
          if (e.allTouches.length > 0) {
            panStartX.value = e.allTouches[0].x;
            panStartY.value = e.allTouches[0].y;
          }
        })
        .onTouchesMove((e, state) => {
          if (e.allTouches.length === 0) return;
          // Zoomed in: pan drives both axes freely around the enlarged image.
          if (scale.value > 1) {
            state.activate();
            return;
          }
          // Unzoomed + dismiss disabled: yield everything to the FlatList.
          if (!enableSwipeToDismiss) {
            state.fail();
            return;
          }
          // Unzoomed: a vertical drag arms swipe-to-dismiss; a horizontal drag
          // fails this gesture so the horizontal FlatList pages between items.
          const dx = Math.abs(e.allTouches[0].x - panStartX.value);
          const dy = Math.abs(e.allTouches[0].y - panStartY.value);
          if (dy > 12 && dy > dx) {
            state.activate();
          } else if (dx > 12 && dx >= dy) {
            state.fail();
          }
        })
        .onStart(() => {
          savedTranslateX.value = translateX.value;
          savedTranslateY.value = translateY.value;
        })
        .onUpdate((event) => {
          if (scale.value > 1) {
            translateX.value = savedTranslateX.value + event.translationX;
            translateY.value = savedTranslateY.value + event.translationY;
          } else if (enableSwipeToDismiss) {
            dismissY.value = event.translationY;
            dismissProgress.value = Math.min(1, Math.abs(event.translationY) / (SCREEN_HEIGHT / 2));
          }
        })
        .onEnd((event) => {
          if (scale.value > 1) {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
            const maxTx = ((scale.value - 1) * SCREEN_WIDTH) / 2;
            const maxTy = ((scale.value - 1) * SCREEN_HEIGHT) / 2;
            if (Math.abs(translateX.value) > maxTx) {
              translateX.value = withSpring(Math.sign(translateX.value) * maxTx);
            }
            if (Math.abs(translateY.value) > maxTy) {
              translateY.value = withSpring(Math.sign(translateY.value) * maxTy);
            }
          } else if (enableSwipeToDismiss) {
            if (event.translationY > 80 && event.velocityY > 200) {
              dismissY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, (finished) => {
                if (finished && onClose) runOnJS(onClose)();
              });
            } else {
              dismissY.value = withSpring(0);
              dismissProgress.value = withSpring(0);
            }
          }
        }),
    [
      scale,
      savedScale,
      translateX,
      translateY,
      savedTranslateX,
      savedTranslateY,
      dismissY,
      dismissProgress,
      enableSwipeToDismiss,
      onClose,
    ]
  );

  // ── Compose gestures ──
  // Only use tap + double-tap when zoom is enabled
  const tapComposed = useMemo(() => {
    if (!enableZoom) return singleTapGesture;
    // Exclusive defers the single-tap until the double-tap has had its chance to
    // recognize two taps, so double-tap-to-zoom actually fires (Fix 1).
    return Gesture.Exclusive(doubleTapGesture, singleTapGesture);
  }, [enableZoom, singleTapGesture, doubleTapGesture]);

  // Pinch, pan, and tap all recognise CONCURRENTLY (MG-01/02/03): a two-finger
  // pinch scales while a one-finger pan repositions, and double-tap toggles zoom —
  // none blocks another. Single/double tap stay mutually exclusive so a single
  // tap waits for the double-tap window.
  const composed = useMemo(() => {
    if (!enableZoom) return panGesture;
    return Gesture.Simultaneous(pinchGesture, panGesture, tapComposed);
  }, [enableZoom, pinchGesture, panGesture, tapComposed]);

  // ── Animations ──
  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value + dismissY.value },
        { scale: scale.value },
      ] as any,
    };
  });

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(dismissProgress.value, [0, 1], [1, 0.4], Extrapolation.CLAMP);
    return { opacity };
  });

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          styles.zoomContainer,
          containerAnimatedStyle,
          { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
        ]}
      >
        <GalleryImage
          uri={uri}
          style={[{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }, imageAnimatedStyle]}
          accessibilityLabel="Image"
          accessibilityHint="Pinch to zoom. Double tap to zoom in and out. Swipe down to close."
        />
      </Animated.View>
    </GestureDetector>
  );
}

// ── Single zoomable video ──
function ZoomableVideo({
  uri,
  onClose,
  enableZoom,
  enableSwipeToDismiss,
  onZoomChange,
}: {
  uri: string;
  onClose?: () => void;
  enableZoom: boolean;
  enableSwipeToDismiss: boolean;
  onZoomChange?: (zoomed: boolean) => void;
}) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const dismissY = useSharedValue(0);
  const dismissProgress = useSharedValue(0);
  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);

  useAnimatedReaction(
    () => scale.value > 1,
    (zoomed, prev) => {
      if (zoomed !== prev && onZoomChange) runOnJS(onZoomChange)(zoomed);
    }
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => { savedScale.value = scale.value; })
        .onUpdate((e) => {
          scale.value = Math.max(1, Math.min(savedScale.value * e.scale, 5));
        })
        .onEnd(() => {
          savedScale.value = scale.value;
          if (scale.value < 1.2) {
            scale.value = withSpring(1);
            savedScale.value = 1;
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
            savedTranslateX.value = 0;
            savedTranslateY.value = 0;
          }
        }),
    [scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY]
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minPointers(1)
        // Same arbitration the image item uses: the pan stays MANUAL and only
        // claims the touch when it's genuinely ours. At 1x a horizontal drag is
        // explicitly FAILED, so it propagates to the parent horizontal FlatList
        // and paging past the video works (the previous plain Pan swallowed every
        // horizontal drag → the pager froze on the video item; a forceful diagonal
        // swipe even tripped swipe-to-dismiss and exited the gallery).
        .manualActivation(true)
        .onTouchesDown((e) => {
          if (e.allTouches.length > 0) {
            panStartX.value = e.allTouches[0].x;
            panStartY.value = e.allTouches[0].y;
          }
        })
        .onTouchesMove((e, state) => {
          if (e.allTouches.length === 0) return;
          // Zoomed: pan roams the enlarged video freely.
          if (scale.value > 1) {
            state.activate();
            return;
          }
          // 1x + dismiss disabled: yield everything to the FlatList (paging).
          if (!enableSwipeToDismiss) {
            state.fail();
            return;
          }
          // 1x: a vertical drag arms swipe-to-dismiss; a horizontal drag fails so
          // the FlatList pages between items.
          const dx = Math.abs(e.allTouches[0].x - panStartX.value);
          const dy = Math.abs(e.allTouches[0].y - panStartY.value);
          if (dy > 12 && dy > dx) {
            state.activate();
          } else if (dx > 12 && dx >= dy) {
            state.fail();
          }
        })
        .onStart(() => {
          savedTranslateX.value = translateX.value;
          savedTranslateY.value = translateY.value;
        })
        .onUpdate((event) => {
          if (scale.value > 1) {
            translateX.value = savedTranslateX.value + event.translationX;
            translateY.value = savedTranslateY.value + event.translationY;
          } else if (enableSwipeToDismiss) {
            dismissY.value = event.translationY;
            dismissProgress.value = Math.min(1, Math.abs(event.translationY) / (SCREEN_HEIGHT / 2));
          }
        })
        .onEnd((event) => {
          if (scale.value > 1) {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
            const maxTx = ((scale.value - 1) * SCREEN_WIDTH) / 2;
            const maxTy = ((scale.value - 1) * SCREEN_HEIGHT) / 2;
            if (Math.abs(translateX.value) > maxTx) {
              translateX.value = withSpring(Math.sign(translateX.value) * maxTx);
            }
            if (Math.abs(translateY.value) > maxTy) {
              translateY.value = withSpring(Math.sign(translateY.value) * maxTy);
            }
          } else if (enableSwipeToDismiss) {
            if (event.translationY > 80 && event.velocityY > 200) {
              dismissY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, (finished) => {
                if (finished && onClose) runOnJS(onClose)();
              });
            } else {
              dismissY.value = withSpring(0);
              dismissProgress.value = withSpring(0);
            }
          }
        }),
    [scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY, panStartX, panStartY, dismissY, dismissProgress, enableSwipeToDismiss, onClose, SCREEN_WIDTH, SCREEN_HEIGHT]
  );

  const composed = useMemo(() => {
    if (enableZoom) {
      return Gesture.Simultaneous(panGesture, pinchGesture);
    }
    return panGesture;
  }, [enableZoom, panGesture, pinchGesture]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(dismissProgress.value, [0, 1], [1, 0.4], Extrapolation.CLAMP);
    return { opacity };
  });

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          styles.zoomContainer,
          containerAnimatedStyle,
          { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
        ]}
      >
        <VideoPlayer uri={uri} style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }} />
      </Animated.View>
    </GestureDetector>
  );
}

// ── Main MediaGallery ──
function MediaGallery({
  visible,
  items,
  initialIndex = 0,
  onClose,
  enableZoom = true,
  enableSwipeToDismiss = true,
  maxZoomLevel = GESTURE_CONFIG.MAX_ZOOM,
}: MediaGalleryProps): React.ReactElement | null {
  const theme = useTheme();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  
  // Validate items on each render to prevent crashes from bad data
  const validatedItems = useMemo(
    () => validateMediaItems(items),
    [items]
  );

  // Clamp initialIndex to valid range
  const safeInitialIndex = useMemo(
    () => clampValue(initialIndex, 0, Math.max(0, validatedItems.length - 1)),
    [initialIndex, validatedItems.length]
  );
  
  // useAnimatedRef holds the native FlatList ref in a UI-thread-safe shareable,
  // so it is never frozen/serialized like a plain useRef object would be. It
  // still works as an ordinary `ref` (its `.current` is populated on the JS
  // thread) and is the Reanimated-sanctioned home for a native-component ref.
  const flatListRef = useAnimatedRef<FlatList>();
  const [activeIndex, setActiveIndex] = useState(safeInitialIndex);
  // Paging is disabled while any item is zoomed, so a pan moves the enlarged
  // image instead of flipping pages; it re-enables at 1x (MG-01/03 isolation).
  const [pagingEnabled, setPagingEnabled] = useState(true);
  const handleZoomChange = useCallback((zoomed: boolean) => {
    setPagingEnabled(!zoomed);
  }, []);

  // JS-thread-only refs — these callbacks/config never cross into a worklet,
  // so a plain useRef is correct here (do NOT convert these to shared values).
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  // Preload image frames into the cache the moment the gallery opens, so the
  // first (and adjacent) frames paint instantly instead of flashing white/black
  // while the network decode happens. No-op when expo-image isn't installed.
  useEffect(() => {
    if (visible) {
      preloadImages(
        items.filter((it) => it.type !== 'video').map((it) => it.uri)
      );
    }
  }, [visible, items]);

  const renderItem = useCallback(
    ({ item }: { item: MediaItem }) => {
      if (item.type === 'video') {
        return (
          <ZoomableVideo
            uri={item.uri}
            onClose={onClose}
            enableZoom={enableZoom}
            enableSwipeToDismiss={enableSwipeToDismiss}
            onZoomChange={handleZoomChange}
          />
        );
      }
      return (
        <ZoomableImage
          uri={item.uri}
          onClose={onClose}
          enableZoom={enableZoom}
          enableSwipeToDismiss={enableSwipeToDismiss}
          onZoomChange={handleZoomChange}
        />
      );
    },
    [onClose, enableZoom, enableSwipeToDismiss, handleZoomChange]
  );

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* A RN <Modal> is a separate native window — RNGH only dispatches touches
          under a GestureHandlerRootView, so without this every pinch / double-tap
          / pan GestureDetector inside is dead (paging still works because it's RN's
          native scroll, not RNGH). This re-enables the gesture system here. */}
      <GestureHandlerRootView style={componentStyles(theme).container}>
      <View style={[componentStyles(theme).container, { backgroundColor: '#000000' }]}>
        {validatedItems.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 16 }}>No media items to display</Text>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={validatedItems}
              renderItem={renderItem}
              keyExtractor={(_, i) => String(i)}
              horizontal
              pagingEnabled
              scrollEnabled={pagingEnabled}
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={safeInitialIndex}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              bounces={false}
            />

            {/* Close button */}
            <Pressable
              style={componentStyles(theme).closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close gallery"
              accessibilityHint="Double tap to close"
            >
              <Text style={componentStyles(theme).closeText}>✕</Text>
            </Pressable>

            {/* Page indicator */}
            {validatedItems.length > 1 && (
              <View
                style={componentStyles(theme).pageIndicator}
                accessibilityLabel={`Image ${activeIndex + 1} of ${validatedItems.length}`}
                accessibilityRole="text"
              >
                <Text style={componentStyles(theme).pageText}>
                  {activeIndex + 1} / {validatedItems.length}
                </Text>
              </View>
            )}
          </>
        )}
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = {
  zoomContainer: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
} as const;

const componentStyles = (theme: ReturnType<typeof useTheme>) => {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    closeButton: {
      position: 'absolute',
      top: 50,
      right: 16,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    closeText: {
      color: '#FFFFFF',
      fontSize: 18,
    },
    pageIndicator: {
      position: 'absolute',
      bottom: 40,
      alignSelf: 'center',
      backgroundColor: 'rgba(0,0,0,0.4)',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    pageText: {
      color: '#FFFFFF',
      fontSize: 14,
    },
  });
};

const WrappedMediaGallery = registerInterop(MediaGallery, {
  className: 'containerStyle',
});

export default WrappedMediaGallery;
