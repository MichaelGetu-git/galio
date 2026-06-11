# Typography (Text)

The `Text` component in Galio is a flexible and theme-driven text renderer for React Native. It supports multiple variants, colors, and styles, all configurable via props and the theme.

## Usage

```jsx
import Text from 'galio-be/src/Text';

<Text h1 bold color="#333">Heading 1</Text>
<Text p muted>Paragraph text</Text>
<Text small italic center>Small centered italic text</Text>
```

## Props

| Prop      | Type      | Description                                      |
|-----------|-----------|--------------------------------------------------|
| `h1-h6`   | boolean   | Heading levels, sets font size from theme        |
| `p`       | boolean   | Paragraph style, sets font size from theme       |
| `body`    | boolean   | Body text style, sets font size from theme       |
| `small`   | boolean   | Small text style, sets font size from theme      |
| `muted`   | boolean   | Uses theme's tertiary text color                 |
| `neutral` | boolean   | Uses theme's secondary text color                |
| `size`    | number    | Custom font size                                 |
| `color`   | string    | Custom text color                                |
| `bold`    | boolean   | Bold font weight                                 |
| `italic`  | boolean   | Italic font style                                |
| `center`  | boolean   | Centered text                                    |
| `shadow`  | boolean   | Adds text shadow                                 |
| `style`   | object    | Custom style object                              |
| `children`| node      | Text content                                     |

## Theming

Font sizes and colors are pulled from your theme configuration. You can customize these in your theme files for consistent typography across your app.

## Example Theme Mapping

```js
// theme.sizes
{
  H1: 44,
  H2: 38,
  H3: 30,
  H4: 24,
  H5: 21,
  H6: 18,
  BODY: 16,
  SMALL: 12,
  // ...other sizes
}

// theme.colors
{
  text: '#000',
  textSecondary: '#555',
  textTertiary: '#888',
  // ...other colors
}
```

## Customization

Override any prop or theme value for full control over your app's typography.

---

## NativeWind / Tailwind (optional)

Galio supports [NativeWind](https://www.nativewind.dev/) v4 when it is installed in your app. Tailwind `className` props are converted to the same style props documented above — use `className`, `style`, or both together.

Requires NativeWind v4 and the Galio Tailwind preset in your app's `tailwind.config.js` (`nativewind/preset` + `galio-tailwind-preset`). See [Button docs](./button.md#nativewind--tailwind-optional) for full setup and token reference.

### className mapping

| Prop | Maps to |
|------|---------|
| `className` | `style` |

### Example

```tsx
<Text h3 bold className="text-galio-primary mb-2">Heading</Text>
<Text className="text-galio-body text-galio-textSecondary">Body copy</Text>
```

Typography props (`h1`–`small`, `bold`, etc.) and `className` can be combined. Typography props set the base size; Tailwind can override color, spacing, and more.
