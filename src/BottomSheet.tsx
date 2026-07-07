import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  findNodeHandle,
  Keyboard,
  Modal,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useTheme, useColors } from './theme';
import { registerInterop } from './helpers/interop';
import { useSnapPoints } from './helpers/useSnapPoints';

const HANDLE_HEIGHT = 24;
const CLOSE_VELOCITY = 500;
// Never lift the sheet so far that its top (and the drag handle) leaves the screen.
const TOP_SAFE_INSET = 24;
// Near-critically-damped + overshoot-clamped spring: quick settle with ZERO
// bounce on open, snap, and interrupted rapid toggles (BS-01 & BS-02).
// ζ = damping / (2·√(stiffness·mass)) = 26 / (2·√260) ≈ 0.81, and
// overshootClamping guarantees the value never crosses the target.
const SPRING = {
  damping: 26,
  stiffness: 260,
  mass: 1,
  overshootClamping: true,
} as const;

// Plain module-scope function for runOnJS. Passing `Keyboard.dismiss` directly
// makes the gesture worklet capture RN's KeyboardImpl singleton, which Worklets
// cannot serialize to the UI thread ("Cannot copy value of type KeyboardImpl").
// A standalone function is captured by reference as a remote callable instead.
function dismissKeyboard() {
  Keyboard.dismiss();
}

// TEMP diagnostic probe (remove once drag-to-close is confirmed on device).
// If NOTHING logs when you drag the handle, the gesture never activates — which
// means RNGH's native module isn't in the running binary (rebuild with
// `expo run:android`) or Metro is serving a stale bundle (relaunch with `-c`).
// If `begin`/`update` DO log but the sheet doesn't move, it's a JS-side bug.
function bsProbe(stage: string, value: number) {
  // eslint-disable-next-line no-console
  console.log(`[BS-DRAG] ${stage} translateY=${value.toFixed(1)}`);
}

export interface BottomSheetProps {
  visible: boolean;
  snapPoints: (number | string)[];
  initialSnapIndex?: number;
  onClose?: () => void;
  onSnap?: (index: number) => void;
  enablePanDownToClose?: boolean;
  enableOverlay?: boolean;
  overlayOpacity?: number;
  children: React.ReactNode;
  triggerRef?: React.RefObject<View>;
  className?: string;
  containerClassName?: string;
  handleClassName?: string;
}

function BottomSheet({
  visible,
  snapPoints,
  initialSnapIndex = 0,
  onClose,
  onSnap,
  enablePanDownToClose = true,
  enableOverlay = true,
  overlayOpacity = 0.5,
  children,
  triggerRef,
}: BottomSheetProps): React.ReactElement | null {
  const theme = useTheme();
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const resolvedSnapPoints = useSnapPoints(snapPoints, SCREEN_HEIGHT);

  // --- Geometry (plain JS numbers — never read a SharedValue during render) ---
  // resolvedSnapPoints are ascending *visible heights*. The sheet is anchored to
  // the bottom with a fixed height of the tallest snap; translateY = 0 means fully
  // open, positive means pushed down. translation[i] = maxSnap - height[i].
  const maxSnap = resolvedSnapPoints[resolvedSnapPoints.length - 1] ?? SCREEN_HEIGHT * 0.75;
  const sheetHeight = maxSnap + HANDLE_HEIGHT;
  const closedY = sheetHeight; // fully off-screen
  // Largest upward lift allowed before the handle would clip off the top edge.
  const maxLift = Math.max(0, SCREEN_HEIGHT - sheetHeight - TOP_SAFE_INSET);
  // Callers routinely pass a fresh `snapPoints` array literal every render
  // (`snapPoints={['50%','90%']}`), so `resolvedSnapPoints` is a NEW reference
  // each render even when the numbers are identical. Key this memo on the actual
  // VALUES, not the array identity, so `snapTranslations` stays referentially
  // stable across renders. Without this, every re-render recreated the gesture
  // objects AND re-ran the open/close effect below — which sprang translateY
  // back to the open position mid-drag, the real reason the sheet moved 0px.
  const snapKey = resolvedSnapPoints.join(',');
  const snapTranslations = useMemo(
    () => resolvedSnapPoints.map((h) => maxSnap - h),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snapKey, maxSnap]
  );
  const snapCount = snapTranslations.length;
  const snapIndex = Math.min(initialSnapIndex, Math.max(0, snapCount - 1));

  // --- Shared values ---
  const translateY = useSharedValue(snapTranslations[snapIndex] ?? 0);
  const currentSnapIndex = useSharedValue(snapIndex);
  const contextY = useSharedValue(0);
  // Latch: true once the pan has "taken over" driving the sheet in this drag, so
  // we can rebase the offset at hand-off and avoid a jump (BS-01).
  const isDrivingSheet = useSharedValue(false);

  // --- BS-02: deferred unmount. The Modal stays mounted through a rapid toggle
  // burst; we only tear it down after a close animation genuinely completes. ---
  const [mounted, setMounted] = useState(visible);

  // --- Refs ---
  const sheetContainerRef = useRef<View>(null);
  // BS-01: track the inner scroll position with an onScroll worklet handler.
  // `useScrollViewOffset` proved unreliable here — inside a RN <Modal> on the New
  // Architecture its animatedRef isn't initialized, so it reported a stale 0 and
  // the pan could never tell whether the list was at the top (which is exactly
  // why drag-to-close silently no-op'd on a fully-expanded single-snap sheet).
  // An animated scroll handler updates on the UI thread every frame and works
  // correctly inside the Modal window.
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // --- Keyboard (BS-03): drive an EXACT-height shared value from Keyboard
  // events. `useAnimatedKeyboard()` is the right tool OUTSIDE a Modal, but a RN
  // <Modal> is a separate window — on Android it reports height 0, so the sheet
  // never lifts (the "keyboard covers the input" bug). Keyboard events fire in
  // the modal window on both platforms, so this is the reliable source. ---
  const keyboardHeight = useSharedValue(0);
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => {
      keyboardHeight.value = withTiming(e.endCoordinates.height, { duration: 220 });
    });
    const hideSub = Keyboard.addListener(hideEvt, () => {
      keyboardHeight.value = withTiming(0, { duration: 180 });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardHeight]);

  // --- Announce open/close to the screen reader ---
  useEffect(() => {
    if (visible && sheetContainerRef.current) {
      const tag = findNodeHandle(sheetContainerRef.current);
      if (tag) AccessibilityInfo.announceForAccessibility('Bottom sheet opened');
    }
  }, [visible]);

  useEffect(() => {
    if (!visible && triggerRef?.current) {
      const tag = findNodeHandle(triggerRef.current);
      if (tag) AccessibilityInfo.announceForAccessibility('Bottom sheet closed');
    }
  }, [visible, triggerRef]);

  const announceSnap = useCallback(
    (index: number) => {
      AccessibilityInfo.announceForAccessibility(
        `Sheet position ${index + 1} of ${snapCount}`
      );
    },
    [snapCount]
  );

  useAnimatedReaction(
    () => currentSnapIndex.value,
    (current, previous) => {
      if (current !== previous && previous !== null) {
        runOnJS(announceSnap)(current);
      }
    }
  );

  // --- Snap to the nearest translation (worklet) ---
  const snapToPoint = useCallback(
    (velocity: number, currentY: number) => {
      'worklet';
      let targetSnap = 0;
      let minDist = Infinity;
      for (let i = 0; i < snapTranslations.length; i++) {
        const dist = Math.abs(currentY - snapTranslations[i]);
        if (dist < minDist) {
          minDist = dist;
          targetSnap = i;
        }
      }

      // Dismiss when the sheet is released either (a) past the half-way point
      // between its lowest snap and fully-closed — i.e. dragged down more than
      // half the sheet's remaining height — or (b) with a fast downward flick
      // while the nearest snap is already the lowest one. Distance OR velocity,
      // matching the platform-native bottom-sheet feel (BS-01 / BS-03).
      const mostCollapsed = Math.max(...snapTranslations); // lowest snap position
      const dismissThreshold = mostCollapsed + (closedY - mostCollapsed) * 0.5;
      if (
        enablePanDownToClose &&
        (currentY > dismissThreshold ||
          (velocity > CLOSE_VELOCITY && targetSnap === 0))
      ) {
        translateY.value = withTiming(closedY, { duration: 220 }, (finished) => {
          if (finished && onClose) runOnJS(onClose)();
        });
        return;
      }

      currentSnapIndex.value = targetSnap;
      translateY.value = withSpring(snapTranslations[targetSnap], {
        ...SPRING,
        velocity,
      });

      if (onSnap) runOnJS(onSnap)(targetSnap);
    },
    [snapTranslations, closedY, enablePanDownToClose, onClose, onSnap, currentSnapIndex, translateY]
  );

  // --- BS-01: native scroll handler so the pan can run *simultaneously* with the
  // inner ScrollView instead of fighting it. Gesture.Native() is the RNGH v2
  // replacement for NativeViewGestureHandler. ---
  const nativeScrollGesture = useMemo(() => Gesture.Native(), []);

  // --- Drag-handle Pan. The handle sits ABOVE the scroll view, so nothing
  // competes with it — it drives the sheet directly and unconditionally. This is
  // what guarantees "drag the handle down to close" always works, regardless of
  // the inner list's scroll position or how many snap points there are. It no
  // longer depends on reading a (possibly stale) scroll offset — the root cause
  // of the drag-to-close bug in BS-01 and BS-03. ---
  const handlePan = useMemo(
    () =>
      Gesture.Pan()
        // Explicit activation: claim ANY vertical movement immediately and fail
        // to horizontal, so RNGH wins the touch before Android's window/Modal
        // interceptor or the scroll can. `onBegin` fires the instant a touch
        // lands (before activation) — a reliable probe that the detector is live.
        .activeOffsetY([-8, 8])
        .failOffsetX([-20, 20])
        .onBegin(() => {
          runOnJS(bsProbe)('handle:begin', translateY.value);
        })
        .onStart(() => {
          contextY.value = translateY.value;
          runOnJS(bsProbe)('handle:start', translateY.value);
          // Dragging the sheet also dismisses an open keyboard (no-op if closed).
          runOnJS(dismissKeyboard)();
        })
        .onUpdate((event) => {
          translateY.value = Math.max(
            0,
            Math.min(contextY.value + event.translationY, closedY)
          );
        })
        .onEnd((event) => {
          runOnJS(bsProbe)('handle:end', translateY.value);
          snapToPoint(event.velocityY, translateY.value);
        }),
    [contextY, translateY, snapToPoint, closedY]
  );

  // --- Body Pan. Spans the scrollable content and runs *simultaneously* with the
  // native scroll (composed below). It only takes over driving the sheet when the
  // list is at the top and the user is pulling down (or the sheet is already
  // partly collapsed), so scrolling up and dragging the sheet down never fight
  // each other — a swipe-down at the top of the list seamlessly becomes a sheet
  // drag (BS-01). It reads the reliable `scrollY` shared value, not the offset
  // hook. ---
  const bodyPan = useMemo(
    () =>
      Gesture.Pan()
        // Let the native scroll own the first few px; only a deliberate vertical
        // drag hands control to the sheet. Fail to horizontal so RNGH resolves
        // vertical-vs-horizontal intent deterministically inside the Modal window.
        .activeOffsetY([-12, 12])
        .failOffsetX([-20, 20])
        .onBegin(() => {
          runOnJS(bsProbe)('body:begin', translateY.value);
        })
        .onStart(() => {
          contextY.value = translateY.value;
          isDrivingSheet.value = false;
          runOnJS(dismissKeyboard)();
        })
        .onUpdate((event) => {
          const atTop = scrollY.value <= 0;
          // Drive the sheet when it's already partially collapsed, OR when the
          // list is at the top and the user is pulling down.
          const shouldDrive =
            translateY.value > 0 || (atTop && event.translationY > 0);

          if (shouldDrive) {
            if (!isDrivingSheet.value) {
              // Hand-off: rebase so the sheet follows the finger from *here* with
              // no visual jump, even if the list scrolled first (BS-01).
              isDrivingSheet.value = true;
              contextY.value = translateY.value - event.translationY;
            }
            translateY.value = Math.max(
              0,
              Math.min(contextY.value + event.translationY, closedY)
            );
          }
        })
        .onEnd((event) => {
          if (isDrivingSheet.value) {
            snapToPoint(event.velocityY, translateY.value);
          }
          isDrivingSheet.value = false;
        }),
    [contextY, translateY, isDrivingSheet, scrollY, snapToPoint, closedY]
  );

  // Compose the body Pan with the native scroll so both recognise together
  // (RNGH v2 replacement for wrapping the ScrollView in a NativeViewGestureHandler
  // and declaring `simultaneousWithExternalGesture`). Attached to the ScrollView.
  const scrollGesture = useMemo(
    () => Gesture.Simultaneous(bodyPan, nativeScrollGesture),
    [bodyPan, nativeScrollGesture]
  );

  // --- Animated styles ---
  const sheetStyle = useAnimatedStyle(() => {
    // BS-03: lift by the keyboard height, clamped so the handle never clips off
    // the top. The rest is covered by the scroll spacer below.
    const lift = Math.min(keyboardHeight.value, maxLift);
    return {
      transform: [{ translateY: translateY.value - lift }],
    };
  });

  // BS-02: overlay opacity follows the sheet's travel instead of a per-render
  // timing, so rapid toggles fade smoothly with the spring (no blinking).
  const overlayStyle = useAnimatedStyle(() => {
    const progress = closedY > 0 ? 1 - translateY.value / closedY : 0;
    return { opacity: Math.max(0, Math.min(progress, 1)) * overlayOpacity };
  });

  // BS-03: animated bottom spacer guarantees a focused input can always scroll
  // above the keyboard, even when the sheet lift is clamped.
  const keyboardSpacerStyle = useAnimatedStyle(() => ({
    height: keyboardHeight.value,
  }));

  // --- Open / close lifecycle with interruptible animations (BS-02) ---
  // Latch the last-handled visibility so this effect drives the sheet ONLY on a
  // real open↔close transition. Previously it depended on `snapTranslations`,
  // whose reference changed every render, so it re-fired constantly and reset
  // `translateY` to the open snap — overpowering the drag gesture on every frame.
  const prevVisibleRef = useRef<boolean | null>(null);
  useEffect(() => {
    const wasVisible = prevVisibleRef.current;
    if (wasVisible === visible) return; // no transition → don't touch translateY
    prevVisibleRef.current = visible;

    if (visible && snapCount > 0) {
      const idx = Math.min(initialSnapIndex, snapCount - 1);
      setMounted(true);
      cancelAnimation(translateY);
      translateY.value = withSpring(snapTranslations[idx], SPRING);
      currentSnapIndex.value = idx;
    } else if (!visible) {
      // Animate out, then unmount only if the close actually finished. A re-open
      // mid-flight cancels this, so `finished` is false and we never unmount.
      cancelAnimation(translateY);
      translateY.value = withTiming(closedY, { duration: 240 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible, snapTranslations, snapCount, initialSnapIndex, closedY, translateY, currentSnapIndex]);

  // Keep the Modal alive until the close animation completes (Rules of Hooks:
  // this early return is after every hook).
  if ((!visible && !mounted) || snapCount === 0) return null;

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* A RN <Modal> is a SEPARATE native window on Android — it is NOT a child
          of the app's GestureHandlerRootView, and RNGH only processes touches
          under a GH root. Without this wrapper every GestureDetector inside the
          Modal is dead: onStart/onUpdate never fire, so translateY can't move and
          drag-to-close silently no-ops (while Popover, which uses Pressable /
          RN's own responder system, keeps working). This root re-enables the
          gesture system inside the Modal window. */}
      <GestureHandlerRootView style={styles(theme).root}>
        {/* Overlay */}
        {enableOverlay && (
          <GestureDetector gesture={Gesture.Tap().onEnd(() => onClose && runOnJS(onClose)())}>
            <Animated.View
              style={[styles(theme).overlay, overlayStyle]}
              accessibilityLabel="Close bottom sheet"
              accessibilityHint="Double tap to close"
              importantForAccessibility={visible ? 'no-hide-descendants' : 'auto'}
              accessible
            />
          </GestureDetector>
        )}

        {/* Sheet. The drag handle and the scrollable body carry their own Pan
            gestures: the handle drives the sheet directly (always), the body
            cooperates with the inner scroll. */}
        <Animated.View
          ref={sheetContainerRef}
          style={[styles(theme).sheet, { height: sheetHeight }, sheetStyle]}
          accessible={false}
          accessibilityLabel="Bottom sheet"
          accessibilityViewIsModal
        >
          {/* Handle — always drives the sheet (drag-to-close); nothing competes. */}
          <GestureDetector gesture={handlePan}>
            <View
              style={styles(theme).handleContainer}
              accessibilityRole="adjustable"
              accessibilityLabel="Sheet position"
              accessibilityHint={`Drag up or down. ${snapCount} snap positions available.`}
              accessibilityActions={[
                { name: 'increment', label: 'expand' },
                { name: 'decrement', label: 'collapse' },
              ]}
              onAccessibilityAction={(event) => {
                if (event.nativeEvent.actionName === 'increment') {
                  const next = Math.min(currentSnapIndex.value + 1, snapCount - 1);
                  currentSnapIndex.value = next;
                  translateY.value = withSpring(snapTranslations[next], SPRING);
                  onSnap?.(next);
                } else if (event.nativeEvent.actionName === 'decrement') {
                  const prev = Math.max(currentSnapIndex.value - 1, 0);
                  currentSnapIndex.value = prev;
                  translateY.value = withSpring(snapTranslations[prev], SPRING);
                  onSnap?.(prev);
                }
              }}
            >
              <View style={styles(theme).handle} accessible={false} />
            </View>
          </GestureDetector>

          {/* Scrollable content — body Pan + native scroll recognise together. */}
          <GestureDetector gesture={scrollGesture}>
            <Animated.ScrollView
              onScroll={scrollHandler}
              scrollEventThrottle={16}
              bounces={false}
              overScrollMode="never"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
              {/* BS-03: keeps the focused input reachable above the keyboard. */}
              <Animated.View style={keyboardSpacerStyle} />
            </Animated.ScrollView>
          </GestureDetector>
        </Animated.View>
      </GestureHandlerRootView>
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
