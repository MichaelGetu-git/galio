import { useCallback, useRef, type RefObject } from 'react';
import { View } from 'react-native';

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
  // Where the arrow must sit *inside* the popover so it keeps pointing at the
  // anchor even after the body is shifted to stay on-screen. For top/bottom this
  // is an X offset from the popover's left edge; for left/right, a Y offset from
  // its top edge.
  arrowOffset: number;
}

type CleanPlacement = 'top' | 'bottom' | 'left' | 'right';

const EDGE_PADDING = 8;
const STATUS_BAR_SAFE_ZONE = 44;
// Keep the arrow away from the popover's rounded corners.
const ARROW_INSET = 16;

function clamp(v: number, min: number, max: number): number {
  // When the popover is larger than the available space, min can exceed max;
  // fall back to min so we never produce NaN/inverted values.
  if (max < min) return min;
  return Math.max(min, Math.min(v, max));
}

function fits(
  top: number,
  left: number,
  w: number,
  h: number,
  sw: number,
  sh: number
): boolean {
  return (
    left >= EDGE_PADDING &&
    left + w <= sw - EDGE_PADDING &&
    top >= EDGE_PADDING &&
    top + h <= sh - EDGE_PADDING
  );
}

function getPos(
  placement: CleanPlacement,
  trigger: TriggerLayout,
  pw: number,
  ph: number,
  offset: number
): { top: number; left: number } {
  switch (placement) {
    case 'bottom':
      return {
        top: trigger.y + trigger.height + offset,
        left: trigger.x + trigger.width / 2 - pw / 2,
      };
    case 'top':
      return {
        top: trigger.y - ph - offset,
        left: trigger.x + trigger.width / 2 - pw / 2,
      };
    case 'left':
      return {
        top: trigger.y + trigger.height / 2 - ph / 2,
        left: trigger.x - pw - offset,
      };
    case 'right':
      return {
        top: trigger.y + trigger.height / 2 - ph / 2,
        left: trigger.x + trigger.width + offset,
      };
  }
}

function opposite(p: CleanPlacement): CleanPlacement {
  switch (p) {
    case 'bottom': return 'top';
    case 'top': return 'bottom';
    case 'left': return 'right';
    case 'right': return 'left';
  }
}

/**
 * @param preferred    requested placement (or 'auto')
 * @param offset       gap between anchor and popover
 * @param externalRef  optional ref to the REAL anchor element. When provided it
 *                     is measured instead of the internal wrapper, so the
 *                     popover attaches to the caller's anchor exactly.
 */
export function usePopoverPosition(
  preferred: Placement,
  offset: number,
  externalRef?: RefObject<any>
) {
  const triggerRef = useRef<View>(null);

  const measureTrigger = useCallback(() => {
    return new Promise<TriggerLayout | null>((resolve) => {
      // Prefer the caller's anchor; fall back to the inline trigger wrapper.
      const node = externalRef?.current ?? triggerRef.current;
      if (node && typeof node.measureInWindow === 'function') {
        node.measureInWindow(
          (x: number, y: number, width: number, height: number) => {
            resolve({ x, y, width, height });
          }
        );
      } else {
        resolve(null);
      }
    });
  }, [externalRef]);

  const calculatePosition = useCallback(
    (
      popoverWidth: number,
      popoverHeight: number,
      screenWidth: number,
      screenHeight: number,
      layout?: TriggerLayout
    ): PositionResult => {
      if (!layout) {
        return {
          placement: preferred === 'auto' ? 'bottom' : preferred,
          top: 0,
          left: 0,
          arrowOffset: popoverWidth / 2,
        };
      }

      // Determine priority order of placements to try.
      let candidates: CleanPlacement[];
      if (preferred === 'auto') {
        const spaceBelow = screenHeight - (layout.y + layout.height);
        const spaceAbove = layout.y;
        const spaceRight = screenWidth - (layout.x + layout.width);
        const spaceLeft = layout.x;

        candidates = (
          [
            ['bottom', spaceBelow],
            ['top', spaceAbove],
            ['right', spaceRight],
            ['left', spaceLeft],
          ] as [CleanPlacement, number][]
        )
          .filter(([_, s]) => s > 0)
          .sort((a, b) => b[1] - a[1])
          .map(([p]) => p);

        if (candidates.length === 0) {
          candidates = ['bottom', 'top', 'right', 'left'];
        }
      } else {
        const p = preferred as CleanPlacement;
        const oppP = opposite(p);
        if (p === 'top' && layout.y < STATUS_BAR_SAFE_ZONE) {
          candidates = ['bottom', oppP, 'right', 'left'];
        } else if (p === 'bottom' && screenHeight - (layout.y + layout.height) < STATUS_BAR_SAFE_ZONE) {
          candidates = ['top', oppP, 'right', 'left'];
        } else {
          candidates = [p, oppP, 'right', 'left'];
        }
        candidates = candidates.filter((v, i, a) => a.indexOf(v) === i) as CleanPlacement[];
      }

      // Pick the first placement that fully fits; otherwise keep the first.
      let chosen: CleanPlacement = candidates[0];
      let pos = getPos(chosen, layout, popoverWidth, popoverHeight, offset);
      for (const candidate of candidates) {
        const p = getPos(candidate, layout, popoverWidth, popoverHeight, offset);
        if (fits(p.top, p.left, popoverWidth, popoverHeight, screenWidth, screenHeight)) {
          chosen = candidate;
          pos = p;
          break;
        }
      }

      // Clamp on-screen (a no-op when it already fit). This is what can shift the
      // body away from being perfectly centered over the anchor.
      const finalLeft = clamp(pos.left, EDGE_PADDING, screenWidth - popoverWidth - EDGE_PADDING);
      const finalTop = clamp(pos.top, EDGE_PADDING, screenHeight - popoverHeight - EDGE_PADDING);

      // Re-point the arrow at the anchor's true centre, regardless of any shift.
      const isVertical = chosen === 'top' || chosen === 'bottom';
      const arrowOffset = isVertical
        ? clamp(layout.x + layout.width / 2 - finalLeft, ARROW_INSET, popoverWidth - ARROW_INSET)
        : clamp(layout.y + layout.height / 2 - finalTop, ARROW_INSET, popoverHeight - ARROW_INSET);

      return { placement: chosen, top: finalTop, left: finalLeft, arrowOffset };
    },
    [preferred, offset]
  );

  return { triggerRef, measureTrigger, calculatePosition };
}
