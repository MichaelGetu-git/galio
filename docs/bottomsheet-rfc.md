# RFC: BottomSheet Snap-Point API

**Status:** Proposed  
**Author:** Dev 4  
**PR:** #pending  

## Problem

BottomSheet needs a snap-point mechanism that is:
- Expressive enough for common use cases (peek, half, full)
- Predictable across iOS, Android, and Web
- Resilient to API changes after v2.0 ships

## Proposed API

```tsx
import { BottomSheet } from 'galio-framework';

<BottomSheet
  visible={open}
  snapPoints={[100, 300, '80%']}
  initialSnapIndex={0}
  onClose={() => setOpen(false)}
>
  <Text>Content</Text>
</BottomSheet>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `visible` | `boolean` | required | Show/hide the sheet |
| `snapPoints` | `(number \| string)[]` | required | Snap positions from smallest (closed) to largest (open). Numbers are pixels. Strings ending in `%` are percentage of screen height. Sorted ascending automatically. |
| `initialSnapIndex` | `number` | `0` | Index into `snapPoints` for initial position |
| `onClose` | `() => void` | — | Called when sheet is dismissed |
| `enablePanDownToClose` | `boolean` | `true` | Allow swiping down past the lowest snap point to close |
| `enableOverlay` | `boolean` | `true` | Show semi-transparent backdrop |
| `overlayOpacity` | `number` | `0.5` | Backdrop opacity |

## Behavior

### Snap resolution
1. Each entry in `snapPoints` is converted to an absolute pixel value:
   - `number` → used as-is, clamped to `[0, screenHeight]`
   - `'50%'` → `50% of screen height`
2. Values are sorted ascending
3. The sheet snaps to the nearest point on release

### Velocity detection
- Swipe down with velocity > 500px/s at the lowest snap → close
- Otherwise → snap to nearest point with spring animation

### Inner scroll
- When `ScrollView`/`FlatList` content is scrolled past top, the pan gesture is disabled
- When scroll reaches top (offset <= 0), pan gesture re-engages

## Alternatives Considered

### A. Array of pixel values only
```tsx
snapPoints={[100, 300, 600]}
```
**Rejected.** Forces consumers to hardcode pixel values that break on different screen sizes.

### B. Array of objects with units
```tsx
snapPoints={[{ value: 100, unit: 'px' }, { value: 50, unit: '%' }]}
```
**Rejected.** Verbose. Mixed `number | string` is more concise and matches APIs like `react-native-bottom-sheet`.

### C. Single `minHeight` / `maxHeight` props
```tsx
<BottomSheet minHeight={100} maxHeight="80%" />
```
**Rejected.** Multi-point snapping (peek, half, full) is a hard requirement for Phase 2. Two-point API is insufficient.

### D. Named snap points
```tsx
snapPoints={{ peek: 100, half: '50%', full: '90%' }}
```
**Rejected.** Ordering is implicit. Arrays are simpler and unambiguous.

## Open Questions

1. Should we support `'100%'` as full-screen (no gap at top)?
2. Should `enablePanDownToClose` also close on fast swipe down at any snap point, or only at the lowest?
3. Do we need `onSnap` callback? (e.g., `onSnap={(index) => console.log('snapped to', index)}`)
4. Should the handle be customizable via render prop? (e.g., `renderHandle={() => <MyHandle />}`)
5. Should there be a `detent`-style API in addition to snap points? (term used by iOS sheets)

## Feedback Requested

- Are the snap point types expressive enough?
- Is `initialSnapIndex` intuitive, or would `initialSnap` as a value (not index) be better?
- Should we expose `onAnimate` for consumers to run side effects during animation?
