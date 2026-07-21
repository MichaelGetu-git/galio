import { useMemo } from 'react';

export function useSnapPoints(
  snapPoints: (number | string)[],
  screenHeight: number
): number[] {
  return useMemo(() => {
    const parsed = snapPoints.map((point) => {
      if (typeof point === 'number') return Math.max(0, Math.min(point, screenHeight));
      if (typeof point === 'string' && point.endsWith('%')) {
        const pct = parseFloat(point);
        if (isNaN(pct)) return 300;
        return (Math.min(pct, 100) / 100) * screenHeight;
      }
      return 300;
    });
    return parsed.sort((a, b) => a - b);
  }, [snapPoints, screenHeight]);
}
