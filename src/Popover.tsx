import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  findNodeHandle,
  LayoutChangeEvent,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useColors } from './theme';
import { registerInterop } from './helpers/interop';
import type { Placement } from './helpers/usePopoverPosition';
import { usePopoverPosition } from './helpers/usePopoverPosition';

const ARROW_SIZE = 8;

export interface PopoverProps {
  visible: boolean;
  trigger: React.ReactElement;
  placement?: Placement;
  offset?: number;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
  arrowClassName?: string;
  triggerRef?: React.RefObject<any>;
}

function Popover({
  visible,
  trigger,
  placement: preferredPlacement = 'auto',
  offset = 6,
  children,
  onClose,
  triggerRef,
}: PopoverProps): React.ReactElement {
  const colors = useColors();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [placement, setPlacement] = useState<Placement>('bottom');
  // Where the pointer sits inside the popover so it keeps aiming at the anchor.
  const [arrowOffset, setArrowOffset] = useState(0);
  const [measured, setMeasured] = useState(false);
  const measuredRef = useRef(false);
  const [internalVisible, setInternalVisible] = useState(false);
  // Shared value (NOT useRef): it's read inside the withTiming worklet callback
  // below. A React ref read in a worklet gets frozen, then mutating `.current`
  // on the JS thread triggers "[Worklets] Tried to modify key current…".
  const pendingDismiss = useSharedValue(false);
  const popoverDimensionsRef = useRef({ width: 0, height: 0 });

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  // Measure the caller's real anchor (triggerRef) when provided, so the popover
  // attaches to it exactly — not to the inline trigger wrapper (PV-01 anchoring).
  const { triggerRef: internalTriggerRef, measureTrigger, calculatePosition } =
    usePopoverPosition(preferredPlacement, offset, triggerRef);

  // Recalculate on window dimension changes (PV-01: rotation handling).
  useEffect(() => {
    if (!(internalVisible && measuredRef.current && popoverDimensionsRef.current.width > 0)) {
      return;
    }
    // Defer one frame: after a rotation the anchor's native layout hasn't
    // settled on the same tick, so measureInWindow could return stale coords.
    const raf = requestAnimationFrame(() => {
      measureTrigger().then((layout) => {
        if (!layout) return;
        const result = calculatePosition(
          popoverDimensionsRef.current.width,
          popoverDimensionsRef.current.height,
          screenWidth,
          screenHeight,
          layout
        );
        setPosition({ top: result.top, left: result.left });
        setPlacement(result.placement);
        setArrowOffset(result.arrowOffset);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [screenWidth, screenHeight, internalVisible, measureTrigger, calculatePosition]);

  useEffect(() => {
    if (visible) {
      pendingDismiss.value = false;
      measuredRef.current = false;
      setMeasured(false);
      // Reset the entry animation so the pop plays on every open (Fix 3).
      scale.value = 0.95;
      opacity.value = 0;
      setInternalVisible(true);
    } else if (internalVisible) {
      pendingDismiss.value = true;
      opacity.value = withTiming(0, { duration: 150 }, (finished) => {
        if (finished && pendingDismiss.value) {
          runOnJS(setInternalVisible)(false);
        }
      });
      if (triggerRef?.current) {
        const tag = findNodeHandle(triggerRef.current);
        if (tag) AccessibilityInfo.setAccessibilityFocus(tag);
      }
    }
  }, [visible, internalVisible, opacity, scale, triggerRef]);

  useEffect(() => {
    if (measured && internalVisible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 15 });
    }
  }, [measured]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handlePopoverLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (measuredRef.current) return;
      const { width, height } = e.nativeEvent.layout;
      if (width === 0 || height === 0) return;

      // Store dimensions for rotation recalculation
      popoverDimensionsRef.current = { width, height };

      measureTrigger().then((layout) => {
        if (layout) {
          const result = calculatePosition(width, height, screenWidth, screenHeight, layout);
          setPosition({ top: result.top, left: result.left });
          setPlacement(result.placement);
          setArrowOffset(result.arrowOffset);
          measuredRef.current = true;
          setMeasured(true);
        }
      });
    },
    [measureTrigger, calculatePosition, screenWidth, screenHeight]
  );

  // A single absolutely-positioned triangle whose cross-axis position tracks the
  // anchor centre (arrowOffset), so the pointer stays on the anchor even when the
  // popover body is shifted to fit on-screen or after a rotation (PV-01 pointer).
  const arrowStyle = useMemo(() => {
    const half = ARROW_SIZE * 0.75; // half the triangle's base
    const base: any = {
      position: 'absolute',
      width: 0,
      height: 0,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
    };

    switch (placement) {
      case 'bottom': // popover below anchor → arrow on top edge pointing up
        base.top = -ARROW_SIZE;
        base.left = arrowOffset - half;
        base.borderLeftWidth = half;
        base.borderRightWidth = half;
        base.borderBottomWidth = ARROW_SIZE;
        base.borderBottomColor = colors.background;
        break;
      case 'top': // popover above anchor → arrow on bottom edge pointing down
        base.bottom = -ARROW_SIZE;
        base.left = arrowOffset - half;
        base.borderLeftWidth = half;
        base.borderRightWidth = half;
        base.borderTopWidth = ARROW_SIZE;
        base.borderTopColor = colors.background;
        break;
      case 'left': // popover left of anchor → arrow on right edge pointing right
        base.right = -ARROW_SIZE;
        base.top = arrowOffset - half;
        base.borderTopWidth = half;
        base.borderBottomWidth = half;
        base.borderLeftWidth = ARROW_SIZE;
        base.borderLeftColor = colors.background;
        break;
      case 'right': // popover right of anchor → arrow on left edge pointing left
        base.left = -ARROW_SIZE;
        base.top = arrowOffset - half;
        base.borderTopWidth = half;
        base.borderBottomWidth = half;
        base.borderRightWidth = ARROW_SIZE;
        base.borderRightColor = colors.background;
        break;
    }

    return base;
  }, [placement, arrowOffset, colors.background]);

  const accessibleTrigger = useMemo(() => {
    const triggerProps = trigger.props as Record<string, any>;
    return React.cloneElement(trigger, {
      accessibilityState: {
        ...(triggerProps.accessibilityState || {}),
        expanded: visible,
      },
      accessibilityHint: triggerProps.accessibilityHint || 'Double tap to show popover',
    } as any);
  }, [trigger, visible]);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  return (
    <View>
      <View
        ref={internalTriggerRef}
        collapsable={false}
      >
        {accessibleTrigger}
      </View>

      {internalVisible && (
        <Modal
          transparent
          visible={internalVisible}
          animationType="none"
          onRequestClose={handleClose}
          statusBarTranslucent
        >
          <View
            style={opaqueStyles.overlay}
            importantForAccessibility={internalVisible ? 'no-hide-descendants' : 'auto'}
          >
            {/* Backdrop is a SIBLING behind the popover — not a parent wrapper —
                so it catches outside taps to dismiss without ever intercepting
                the popover's own touch stream. This is what lets the inner
                ScrollView receive the very first swipe (PV-02). */}
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={handleClose}
              accessibilityLabel="Close popover"
              accessibilityRole="button"
            />

            <Animated.View
              style={[
                opaqueStyles.popover,
                {
                  top: position.top,
                  left: position.left,
                  backgroundColor: colors.background,
                },
                animatedStyle,
              ]}
              onLayout={handlePopoverLayout}
              accessibilityRole="menu"
              accessibilityLabel="Popover content"
              accessibilityHint="Double tap outside to close"
              accessibilityViewIsModal
            >
              <View style={arrowStyle} />
              {children}
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const opaqueStyles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  popover: {
    position: 'absolute',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 120,
    maxWidth: 280,
  },
});

const WrappedPopover = registerInterop(Popover, {
  className: 'containerStyle',
  arrowClassName: 'arrowStyle',
});

export default WrappedPopover;
