import { useState, useCallback, useRef } from 'react';
import { LayoutChangeEvent, View } from 'react-native';

const EDGE_PADDING = 8;

export type Placement = 'auto' | 'top' | 'bottom' | 'left' | 'right';

export interface TriggerLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PositionResult {
  placement: Placement;
  top: number;
  left: number;
}

export function usePopoverPosition(preferred: Placement, offset: number) {
  const triggerRef = useRef<View>(null);
  const [triggerLayout, setTriggerLayout] = useState<TriggerLayout | null>(null);

  const onTriggerLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setTriggerLayout((prev) => (prev ? { ...prev, width, height } : { x: 0, y: 0, width, height }));
  }, []);

  const measureTrigger = useCallback(() => {
    return new Promise<TriggerLayout | null>((resolve) => {
      if (triggerRef.current) {
        triggerRef.current.measureInWindow((x, y, width, height) => {
          const layout = { x, y, width, height };
          setTriggerLayout(layout);
          resolve(layout);
        });
      } else {
        resolve(null);
      }
    });
  }, []);

  const calculatePosition = useCallback(
    (
      popoverWidth: number,
      popoverHeight: number,
      screenWidth: number,
      screenHeight: number,
      layout?: TriggerLayout
    ): PositionResult => {
      const rect = layout || triggerLayout;
      if (!rect) {
        return { placement: preferred, top: 0, left: 0 };
      }

      const spaceAbove = rect.y;
      const spaceBelow = screenHeight - (rect.y + rect.height);
      const spaceLeft = rect.x;
      const spaceRight = screenWidth - (rect.x + rect.width);

      let placement: Placement = preferred;
      if (preferred === 'auto') {
        const spaces: [Placement, number][] = [
          ['bottom', spaceBelow],
          ['top', spaceAbove],
          ['right', spaceRight],
          ['left', spaceLeft],
        ];
        placement = spaces.sort((a, b) => b[1] - a[1])[0][0];
      }

      let top = 0;
      let left = 0;

      switch (placement) {
        case 'top':
          top = rect.y - popoverHeight - offset;
          left = rect.x + rect.width / 2 - popoverWidth / 2;
          break;
        case 'bottom':
          top = rect.y + rect.height + offset;
          left = rect.x + rect.width / 2 - popoverWidth / 2;
          break;
        case 'left':
          top = rect.y + rect.height / 2 - popoverHeight / 2;
          left = rect.x - popoverWidth - offset;
          break;
        case 'right':
          top = rect.y + rect.height / 2 - popoverHeight / 2;
          left = rect.x + rect.width + offset;
          break;
      }

      // Clamp so it never clips off-screen
      left = Math.max(EDGE_PADDING, Math.min(left, screenWidth - popoverWidth - EDGE_PADDING));
      top = Math.max(EDGE_PADDING, Math.min(top, screenHeight - popoverHeight - EDGE_PADDING));

      return { placement, top, left };
    },
    [triggerLayout, preferred, offset]
  );

  return { triggerRef, onTriggerLayout, measureTrigger, triggerLayout, calculatePosition };
}
