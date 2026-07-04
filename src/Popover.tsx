import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { useTheme, useColors } from './theme';
import { registerInterop } from './helpers/interop';
import { Placement, usePopoverPosition } from './helpers/usePopoverPosition';

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
}

function Popover({
  visible,
  trigger,
  placement: preferredPlacement = 'auto',
  offset = 6,
  children,
  onClose,
}: PopoverProps): React.ReactElement {
  const theme = useTheme();
  const colors = useColors();
  const [position, setPosition] = useState({ top: -9999, left: -9999 });
  const [placement, setPlacement] = useState<Placement>('bottom');
  const measuredRef = useRef(false);

  const { triggerRef, onTriggerLayout, measureTrigger, calculatePosition } =
    usePopoverPosition(preferredPlacement, offset);

  const handlePopoverLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
      if (measuredRef.current) return;
      const { width, height } = e.nativeEvent.layout;
      if (width === 0 || height === 0) return;

      measureTrigger().then((layout) => {
        if (layout) {
          const result = calculatePosition(width, height, layout);
          setPosition({ top: result.top, left: result.left });
          setPlacement(result.placement);
          measuredRef.current = true;
        }
      });
    },
    [measureTrigger, calculatePosition]
  );

  // Reset position tracker when visibility changes
  useEffect(() => {
    if (visible) {
      measuredRef.current = false;
      setPosition({ top: -9999, left: -9999 });
    }
  }, [visible]);

  // Arrow triangle
  const buildArrowStyle = () => {
    const shared: any = {
      position: 'absolute',
      width: 0,
      height: 0,
      borderWidth: ARROW_SIZE,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
    };
    if (placement === 'top') {
      shared.bottom = -ARROW_SIZE;
      shared.alignSelf = 'center';
      shared.borderTopColor = colors.background;
    } else if (placement === 'bottom') {
      shared.top = -ARROW_SIZE;
      shared.alignSelf = 'center';
      shared.borderBottomColor = colors.background;
    } else if (placement === 'left') {
      shared.right = -ARROW_SIZE;
      shared.alignSelf = 'center';
      shared.borderLeftColor = colors.background;
    } else if (placement === 'right') {
      shared.left = -ARROW_SIZE;
      shared.alignSelf = 'center';
      shared.borderRightColor = colors.background;
    }
    return shared;
  };

  // Clone trigger with accessibility state
  const triggerProps = trigger.props as Record<string, any>;
  const accessibleTrigger = React.cloneElement(trigger, {
    accessibilityState: {
      ...(triggerProps.accessibilityState || {}),
      expanded: visible,
    },
    accessibilityHint: triggerProps.accessibilityHint || 'Double tap to show popover',
  } as any);

  return (
    <View>
      {/* Trigger wrapper for measurement */}
      <View
        ref={triggerRef}
        onLayout={onTriggerLayout}
        collapsable={false}
        importantForAccessibility="no-hide-descendants"
      >
        {accessibleTrigger}
      </View>

      {visible && (
        <Modal
          transparent
          visible={visible}
          animationType="none"
          onRequestClose={onClose}
          statusBarTranslucent
        >
          <TouchableWithoutFeedback onPress={onClose} accessibilityLabel="Close popover">
            <View style={styles(theme).overlay}>
              <TouchableWithoutFeedback>
                <View
                  style={[
                    styles(theme).popover,
                    {
                      top: position.top,
                      left: position.left,
                      backgroundColor: colors.background,
                    },
                  ]}
                  onLayout={handlePopoverLayout}
                  accessibilityLabel="Popover content"
                  accessibilityHint="Double tap outside to close"
                >
                  <View style={buildArrowStyle()} />
                  {children}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
}

const styles = (theme: ReturnType<typeof useTheme>) =>
  ({
    overlay: {
      flex: 1,
    },
    popover: {
      position: 'absolute' as const,
      borderRadius: theme.sizes.BORDER_RADIUS * 2,
      padding: theme.sizes.BASE,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
      minWidth: 120,
      maxWidth: 280,
    },
  } as const);

const WrappedPopover = registerInterop(Popover, {
  className: 'containerStyle',
  arrowClassName: 'arrowStyle',
});

export default WrappedPopover;
