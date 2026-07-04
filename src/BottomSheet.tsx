import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  KeyboardState,
  useAnimatedKeyboard,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme, useColors } from './theme';
import { registerInterop } from './helpers/interop';
import { useSnapPoints } from './helpers/useSnapPoints';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HANDLE_HEIGHT = 24;

export interface BottomSheetProps {
  visible: boolean;
  snapPoints: (number | string)[];
  initialSnapIndex?: number;
  onClose?: () => void;
  enablePanDownToClose?: boolean;
  enableOverlay?: boolean;
  overlayOpacity?: number;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  handleClassName?: string;
}

function BottomSheet({
  visible,
  snapPoints,
  initialSnapIndex = 0,
  onClose,
  enablePanDownToClose = true,
  enableOverlay = true,
  overlayOpacity = 0.5,
  children,
  className,
  containerClassName,
  handleClassName,
}: BottomSheetProps): React.ReactElement | null {
  const theme = useTheme();
  const colors = useColors();
  const resolvedSnapPoints = useSnapPoints(snapPoints);

  // Clamp initial index
  const snapIndex = Math.min(initialSnapIndex, resolvedSnapPoints.length - 1);

  // --- Shared values ---
  const translateY = useSharedValue(resolvedSnapPoints[snapIndex] ?? 300);
  const currentSnapIndex = useSharedValue(snapIndex);
  const isAtTop = useSharedValue(true);
  const contextY = useSharedValue(0);

  // Keyboard
  const keyboard = useAnimatedKeyboard();
  const keyboardHeight = useDerivedValue(() =>
    keyboard.state.value === KeyboardState.OPEN ? keyboard.height.value : 0
  );

  const sheetHeight = useSharedValue(resolvedSnapPoints[resolvedSnapPoints.length - 1] ?? SCREEN_HEIGHT * 0.75);
  useEffect(() => {
    sheetHeight.value = resolvedSnapPoints[resolvedSnapPoints.length - 1] ?? SCREEN_HEIGHT * 0.75;
  }, [resolvedSnapPoints, sheetHeight]);

  // Snap to the nearest snap point
  const snapToPoint = useCallback(
    (velocity: number, currentY: number) => {
      'worklet';
      let targetSnap = 0;
      let minDist = Infinity;
      for (let i = 0; i < resolvedSnapPoints.length; i++) {
        const dist = Math.abs(currentY - resolvedSnapPoints[i]);
        if (dist < minDist) {
          minDist = dist;
          targetSnap = i;
        }
      }

      // If panning down fast, close
      if (enablePanDownToClose && velocity > 500 && targetSnap === resolvedSnapPoints.length - 1) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, (finished) => {
          if (finished && onClose) runOnJS(onClose)();
        });
        return;
      }

      currentSnapIndex.value = targetSnap;
      translateY.value = withSpring(resolvedSnapPoints[targetSnap], {
        damping: 15,
        stiffness: 200,
        velocity,
      });
    },
    [resolvedSnapPoints, enablePanDownToClose, onClose, currentSnapIndex, translateY]
  );

  // --- Pan gesture ---
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          contextY.value = translateY.value;
        })
        .onUpdate((event) => {
          // If scroll is not at top, don't drag the sheet
          if (!isAtTop.value) return;

          const newTranslateY = contextY.value - event.translationY;
          // Clamp between fully open (top of screen) and fully closed
          translateY.value = Math.max(0, Math.min(newTranslateY, SCREEN_HEIGHT));
        })
        .onEnd((event) => {
          if (!isAtTop.value) return;
          snapToPoint(event.velocityY, translateY.value);
        }),
    [contextY, isAtTop, translateY, snapToPoint]
  );

  // --- Animated styles ---
  const sheetStyle = useAnimatedStyle(() => {
    const adjustedY = Math.max(0, translateY.value - keyboardHeight.value / 2);
    return {
      transform: [{ translateY: adjustedY }],
    };
  });

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: withTiming(visible ? overlayOpacity : 0, { duration: 250 }),
  }));

  // Reset position when visibility changes
  useEffect(() => {
    if (visible && resolvedSnapPoints.length > 0) {
      const idx = Math.min(initialSnapIndex, resolvedSnapPoints.length - 1);
      translateY.value = withSpring(resolvedSnapPoints[idx], { damping: 15 });
      currentSnapIndex.value = idx;
    }
  }, [visible, resolvedSnapPoints, initialSnapIndex, translateY, currentSnapIndex]);

  // --- Scroll handling for nested content ---
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      isAtTop.value = event.contentOffset.y <= 0;
    },
  });

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles(theme).root}>
        {/* Overlay */}
        {enableOverlay && (
          <GestureDetector gesture={Gesture.Tap().onEnd(() => onClose?.())}>
            <Animated.View style={[styles(theme).overlay, overlayStyle]} />
          </GestureDetector>
        )}

        {/* Sheet */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles(theme).sheet,
              { height: sheetHeight.value + HANDLE_HEIGHT },
              sheetStyle,
            ]}
          >
            {/* Handle */}
            <View style={[styles(theme).handleContainer]}>
              <View style={[styles(theme).handle]} />
            </View>

            {/* Scrollable content */}
            <Animated.ScrollView
              onScroll={scrollHandler}
              scrollEventThrottle={16}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </Animated.ScrollView>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = (theme: ReturnType<typeof useTheme>) => {
  const colors = theme.colors;
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#000',
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: theme.sizes.BASE,
      borderTopRightRadius: theme.sizes.BASE,
      overflow: 'hidden',
    },
    handleContainer: {
      height: HANDLE_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    handle: {
      width: 36,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: colors.border,
    },
  });
};

const WrappedBottomSheet = registerInterop(BottomSheet, {
  className: 'containerStyle',
  containerClassName: 'containerStyle',
  handleClassName: 'handleStyle',
});

export default WrappedBottomSheet;
