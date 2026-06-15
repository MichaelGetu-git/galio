# Checkbox

The `Checkbox` component provides a customizable, theme-aware checkbox for React Native apps.

## Usage

```tsx
import { Checkbox } from 'galio-framework';

<Checkbox label="Accept Terms" />
```

## Props

| Prop             | Type                      | Default     | Description |
|------------------|---------------------------|-------------|-------------|
| `checked`        | `boolean`                 |             | Controlled checked state |
| `initialValue`   | `boolean`                 | `false`     | Uncontrolled initial value (deprecated) |
| `onChange`       | `(checked: boolean) => void` |           | Callback when checked state changes |
| `label`          | `string`                  |             | Label text |
| `image`          | `string`                  |             | Image URI for label |
| `color`          | `string`                  | `'primary'` | Checkbox color (theme key or custom) |
| `iconName`       | `string`                  | `'check'`   | Icon name for checkmark |
| `iconFamily`     | `string`                  | `'FontAwesome'` | Icon family |
| `iconColor`      | `string`                  | `'#fff'`    | Icon color |
| `iconSize`       | `number`                  | `15`        | Icon size |
| `disabled`       | `boolean`                 | `false`     | Disable interaction |
| `flexDirection`  | `'row' \| 'row-reverse' \| 'column' \| 'column-reverse'` | `'row'` | Layout direction |
| `labelStyle`     | `TextStyle`               |             | Style for label |
| `imageStyle`     | `ImageStyle`              |             | Style for image |
| `checkboxStyle`  | `ViewStyle`               |             | Style for checkbox box |
| `style`          | `ViewStyle`               |             | Container style |
| `accessibilityLabel` | `string`               |             | Accessibility label |
| `accessibilityHint`  | `string`               |             | Accessibility hint |

## Theming

- Fully theme-aware via `useTheme` and `useColors`.
- Supports semantic colors and custom styles.

## Example

```tsx
<Checkbox
  label="Custom Checkbox"
  color="success"
  iconName="star"
  iconFamily="fontawesome"
  iconColor="#FFD700"
  checked={true}
/>
```
## NativeWind / Tailwind (optional)

Galio supports [NativeWind](https://www.nativewind.dev/) v4 when it is installed in your app. Tailwind `className` props are converted to the same style props documented above — use `className`, `style`, or both together.

Requires NativeWind v4 and the Galio Tailwind preset in your app's `tailwind.config.js` (`nativewind/preset` + `galio-tailwind-preset`). See [Button docs](./button.md#nativewind--tailwind-optional) for full setup and token reference.

### className mapping

| Prop | Maps to |
|------|---------|
| `className` | `style` (row container) |
| `checkboxClassName` | `checkboxStyle` |
| `labelClassName` | `labelStyle` |
| `imageClassName` | `imageStyle` |

### Example

```tsx
<Checkbox
  label="Accept terms"
  checkboxClassName="border-galio-primary rounded"
  labelClassName="text-galio-body text-galio-text ml-2"
/>
```
