import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme, useColors } from './theme';
import { registerInterop } from './helpers/interop';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
}

// ── Single zoomable image ──
function ZoomableImage({
  uri,
  onClose,
  enableZoom,
  enableSwipeToDismiss,
}: {
  uri: string;
  onClose?: () => void;
  enableZoom: boolean;
  enableSwipeToDismiss: boolean;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const dismissY = useSharedValue(0);
  const dismissProgress = useSharedValue(0);

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
        .onEnd(() => {
          if (scale.value > 1) {
            scale.value = withSpring(1);
            savedScale.value = 1;
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
            savedTranslateX.value = 0;
            savedTranslateY.value = 0;
          } else {
            scale.value = withSpring(2.5);
            savedScale.value = 2.5;
          }
        }),
    [scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY]
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
    const taps = [singleTapGesture];
    if (enableZoom) taps.push(doubleTapGesture);
    return Gesture.Race(...taps);
  }, [enableZoom, singleTapGesture, doubleTapGesture]);

  const composed = useMemo(() => {
    if (enableZoom) {
      return Gesture.Simultaneous(Gesture.Race(tapComposed, panGesture), pinchGesture);
    }
    return panGesture;
  }, [enableZoom, tapComposed, panGesture, pinchGesture]);

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
        <Animated.Image
          source={{ uri }}
          style={[{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }, imageAnimatedStyle]}
          resizeMode="contain"
          accessibilityLabel="Image"
          accessibilityRole="image"
          accessibilityHint="Pinch to zoom. Double tap to zoom in and out. Swipe down to close."
        />
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
}: MediaGalleryProps): React.ReactElement | null {
  const theme = useTheme();
  const colors = useColors();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const renderItem = useCallback(
    ({ item }: { item: MediaItem }) => (
      <ZoomableImage
        uri={item.uri}
        onClose={onClose}
        enableZoom={enableZoom}
        enableSwipeToDismiss={enableSwipeToDismiss}
      />
    ),
    [onClose, enableZoom, enableSwipeToDismiss]
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
      <View style={[componentStyles(theme).container, { backgroundColor: colors.background }]}>
        <FlatList
          ref={flatListRef}
          data={items}
          renderItem={renderItem}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
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
          accessibilityLabel="Close gallery"
          accessibilityHint="Double tap to close"
        >
          <Text style={componentStyles(theme).closeText}>✕</Text>
        </Pressable>

        {/* Page indicator */}
        {items.length > 1 && (
          <View
            style={componentStyles(theme).pageIndicator}
            accessibilityLabel={`Image ${activeIndex + 1} of ${items.length}`}
            accessibilityRole="text"
          >
            <Text style={componentStyles(theme).pageText}>
              {activeIndex + 1} / {items.length}
            </Text>
          </View>
        )}
      </View>
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
  const colors = theme.colors;
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
