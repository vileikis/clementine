# Theme System Usage Guide

This app uses a **CSS variable-based theme system** with Tailwind CSS integration.

## Available Color Tokens

### Base Colors

- `background` / `foreground` - Main app background and text
- `card` / `card-foreground` - Card/panel backgrounds
- `popover` / `popover-foreground` - Popover/dropdown backgrounds

### Brand Colors

- `primary` / `primary-foreground` - Primary brand color (dark gray)
- `secondary` / `secondary-foreground` - Secondary color (light gray)
- `accent` / `accent-foreground` - Interactive elements, hover states
- `muted` / `muted-foreground` - Subtle backgrounds, disabled states

### Semantic Colors ⭐ NEW

- `destructive` / `destructive-foreground` - Errors, delete actions (red)
- `success` / `success-foreground` - Success messages, confirmations (green)
- `info` / `info-foreground` - Informational messages (blue)
- `warning` / `warning-foreground` - Warnings, cautions (amber)

### UI Elements

- `border` - Default border color
- `input` - Input field borders
- `ring` - Focus ring color

## Usage Examples

### Success Message

```tsx
<div className="bg-success text-success-foreground p-4 rounded-lg">
  ✓ Settings saved successfully!
</div>
```

### Warning Banner

```tsx
<div className="bg-warning text-warning-foreground p-4 rounded-lg">
  ⚠️ Your trial expires in 3 days
</div>
```

### Info Tooltip

```tsx
<div className="bg-info text-info-foreground px-3 py-2 rounded-md text-sm">
  💡 Pro tip: Use keyboard shortcuts for faster navigation
</div>
```

### Error State

```tsx
<div className="bg-destructive text-destructive-foreground p-4 rounded-lg">
  ✗ Failed to save changes. Please try again.
</div>
```

### Button Variants

```tsx
// Success button
<button className="bg-success text-success-foreground hover:bg-success/90">
  Confirm
</button>

// Warning button
<button className="bg-warning text-warning-foreground hover:bg-warning/90">
  Proceed with Caution
</button>

// Destructive button (already available in shadcn/ui Button component)
<Button variant="destructive">Delete Account</Button>
```

### Badges

```tsx
// Success badge
<span className="bg-success/10 text-success px-2 py-1 rounded-md text-xs font-medium">
  Active
</span>

// Info badge
<span className="bg-info/10 text-info px-2 py-1 rounded-md text-xs font-medium">
  New
</span>

// Warning badge
<span className="bg-warning/10 text-warning px-2 py-1 rounded-md text-xs font-medium">
  Pending
</span>
```

### Toast Notifications

When using `sonner` or custom toasts:

```tsx
import { toast } from 'sonner'

// Success toast
toast.custom((t) => (
  <div className="bg-success text-success-foreground p-4 rounded-lg">
    Settings saved!
  </div>
))

// Error toast
toast.custom((t) => (
  <div className="bg-destructive text-destructive-foreground p-4 rounded-lg">
    Something went wrong
  </div>
))
```

## Best Practices

### ✅ DO

- Use semantic colors for their intended purpose (`success` for success, `destructive` for errors)
- Always pair background colors with their corresponding foreground colors
- Use opacity modifiers for subtle backgrounds: `bg-success/10`, `bg-info/20`
- Reference the theme system: `bg-background`, `text-foreground`

### ❌ DON'T

- Don't hard-code colors: ~~`bg-green-500`~~, ~~`text-red-600`~~
- Don't mix foreground colors incorrectly: ~~`bg-success text-destructive-foreground`~~
- Don't use arbitrary values: ~~`bg-[#ff0000]`~~ (except for one-off cases)
- Don't bypass the theme system for semantic colors

## Dark Mode Support

The theme system includes dark mode variants (defined in `src/styles.css`).

To enable dark mode in the future:

```tsx
// Add 'dark' class to html element
document.documentElement.classList.add('dark')

// Or use next-themes
import { ThemeProvider } from 'next-themes'
;<ThemeProvider attribute="class">
  <App />
</ThemeProvider>
```

## Customizing Colors

To change the color palette, edit `src/styles.css`:

```css
:root {
  /* Change success color from green to teal */
  --success: oklch(0.65 0.15 180); /* Teal instead of green */

  /* Make info color brighter */
  --info: oklch(0.7 0.15 250); /* Brighter blue */
}
```

All components using `bg-success` or `bg-info` will automatically update!

## Color Values (OKLCH)

The theme uses **OKLCH color space** for perceptually uniform colors:

- `oklch(L C H)` format
  - **L** = Lightness (0-1, where 1 is white)
  - **C** = Chroma/saturation (0-0.4, where higher is more saturated)
  - **H** = Hue angle (0-360 degrees)

Example: `oklch(0.65 0.15 150)` = medium-light green with moderate saturation

## Resources

- [OKLCH Color Picker](https://oklch.com/)
- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)
- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)
