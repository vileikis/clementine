# API Contract: ThemedProgressBar Component

**Component**: `ThemedProgressBar`
**Location**: `apps/clementine-app/src/shared/theming/components/primitives/ThemedProgressBar.tsx`
**Type**: React Component (Themed Primitive)
**Version**: 1.0.0

## Purpose

Themed progress bar primitive that displays completion percentage with dynamic theme colors. Provides accessible progress indication for multi-step experiences.

## Component Signature

```typescript
export function ThemedProgressBar(props: ThemedProgressBarProps): JSX.Element

export interface ThemedProgressBarProps {
  /** Current progress value (0-100). null/undefined for indeterminate. */
  value?: number | null

  /** Maximum value for progress calculation. Default: 100 */
  max?: number

  /** Custom accessibility label generator */
  getValueLabel?(value: number, max: number): string

  /** Theme override for use without ThemeProvider */
  theme?: Theme

  /** Additional CSS classes for root container */
  className?: string

  /** Additional CSS classes for progress indicator bar */
  indicatorClassName?: string
}
```

## Props API

### `value` (optional)

- **Type**: `number | null | undefined`
- **Default**: `undefined`
- **Range**: `0-100` (clamped automatically)
- **Purpose**: Current progress percentage

**Behavior**:
- `0` → Empty progress bar (0% fill)
- `50` → Half-filled progress bar (50% fill)
- `100` → Fully-filled progress bar (100% fill)
- `> 100` → Clamped to 100% (full bar)
- `< 0` → Clamped to 0% (empty bar)
- `null` or `undefined` → Indeterminate state (aria-valuenow omitted)

**Examples**:
```tsx
<ThemedProgressBar value={0} />     // Empty
<ThemedProgressBar value={65} />    // 65% filled
<ThemedProgressBar value={100} />   // Full
<ThemedProgressBar value={null} />  // Indeterminate
```

---

### `max` (optional)

- **Type**: `number`
- **Default**: `100`
- **Constraint**: Must be > 0
- **Purpose**: Maximum value for ARIA attributes

**Behavior**:
- Sets `aria-valuemax` on progress element
- Used for calculating `aria-valuetext` if custom `getValueLabel` not provided
- Most use cases don't need to override (default 100 is standard)

**Examples**:
```tsx
<ThemedProgressBar value={50} />         // 50/100 = 50%
<ThemedProgressBar value={5} max={10} /> // 5/10 = 50%
```

---

### `getValueLabel` (optional)

- **Type**: `(value: number, max: number) => string`
- **Default**: Built-in Radix UI formatter (`"50%"`)
- **Purpose**: Custom screen reader announcement

**Behavior**:
- Called by Radix UI to generate `aria-valuetext`
- Only invoked when `value` is not null/undefined
- Return value announced by screen readers on focus/change

**Examples**:
```tsx
// Default behavior - announces "65%"
<ThemedProgressBar value={65} />

// Custom label - announces "Step 3 of 5"
<ThemedProgressBar
  value={60}
  getValueLabel={(val) => `Step ${Math.ceil(val / 20)} of 5`}
/>

// Upload progress - announces "Upload 75% complete"
<ThemedProgressBar
  value={75}
  getValueLabel={(val) => `Upload ${val}% complete`}
/>
```

---

### `theme` (optional)

- **Type**: `Theme` (from `@/shared/theming/types`)
- **Default**: Read from `ThemeProvider` context
- **Purpose**: Override theme without provider (testing, isolation)

**Behavior**:
- If provided: Uses this theme instead of context
- If not provided: Uses theme from nearest `ThemeProvider`
- If no provider and no prop: Throws error from `useThemeWithOverride`

**When to use**:
- Testing components in isolation
- Rendering outside ThemeProvider tree
- Preview/demo scenarios with custom themes

**Examples**:
```tsx
// Within ThemeProvider - uses context
<ThemeProvider theme={projectTheme}>
  <ThemedProgressBar value={50} />
</ThemeProvider>

// Without provider - pass theme directly
<ThemedProgressBar value={50} theme={mockTheme} />

// Testing
it('renders with custom theme', () => {
  render(<ThemedProgressBar value={75} theme={testTheme} />)
})
```

---

### `className` (optional)

- **Type**: `string`
- **Default**: `undefined`
- **Purpose**: Additional Tailwind/CSS classes for root container

**Behavior**:
- Merged with base classes using `cn()` utility
- Overrides base styles where specificity allows
- Applied to `ProgressPrimitive.Root` element

**Common use cases**:
- Custom height: `className="h-3"` (default is `h-2`)
- Custom width: `className="w-1/2"` (default is `w-full`)
- Margin/padding: `className="my-4"`

**Examples**:
```tsx
// Taller progress bar
<ThemedProgressBar value={50} className="h-4" />

// Custom spacing
<ThemedProgressBar value={65} className="my-2 mx-auto max-w-md" />

// Half width
<ThemedProgressBar value={80} className="w-1/2" />
```

---

### `indicatorClassName` (optional)

- **Type**: `string`
- **Default**: `undefined`
- **Purpose**: Additional classes for progress indicator bar

**Behavior**:
- Merged with indicator base classes
- Applied to `ProgressPrimitive.Indicator` element
- Useful for custom animations or visual effects

**Examples**:
```tsx
// Custom transition duration
<ThemedProgressBar
  value={75}
  indicatorClassName="duration-1000"
/>

// Pulsing effect
<ThemedProgressBar
  value={50}
  indicatorClassName="animate-pulse"
/>
```

---

## Styling Contract

### Theme Color Application

The component applies theme colors via inline styles:

```typescript
// Root container (track background)
backgroundColor: `color-mix(in srgb, ${theme.text.color} 10%, transparent)`
borderRadius: BUTTON_RADIUS_MAP[theme.button.radius]

// Indicator bar (filled portion)
backgroundColor: theme.primaryColor
borderRadius: BUTTON_RADIUS_MAP[theme.button.radius]
```

**Color Mapping**:
- **Track**: 10% opacity text color (subtle background)
- **Indicator**: Solid primary color (high contrast fill)
- **Radius**: Matches theme button radius (`sharp` | `rounded` | `pill`)

### Default Tailwind Classes

```typescript
// Root
'relative h-2 w-full overflow-hidden'

// Indicator
'h-full w-full flex-1 transition-all duration-300 ease-out'
```

### Size Variants (via className)

| Variant | Class | Height | Use Case |
|---------|-------|--------|----------|
| Tiny | `h-1` | 4px | Minimal space |
| Small (default) | `h-2` | 8px | Standard UI |
| Medium | `h-3` | 12px | Prominent |
| Large | `h-4` | 16px | Hero/primary |

---

## Accessibility Contract

### ARIA Attributes (auto-applied by Radix)

```html
<div
  role="progressbar"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuenow="65"
  aria-valuetext="65%"
  data-state="loading"
  data-value="65"
>
  <div data-state="loading" data-value="65" style="transform: translateX(-35%)">
  </div>
</div>
```

**Screen Reader Behavior**:
- On focus: Announces "Progress bar, 65%"
- On update: Announces new percentage automatically
- Custom label: Uses `getValueLabel` return value

### Keyboard Interaction

Not applicable - progress bars are not interactive (no focus, no keyboard events).

### Color Contrast

Component uses theme primary color for indicator. Theme creator responsible for ensuring:
- Primary color has sufficient contrast against backgrounds
- Progress bar visible in all theme color combinations

**Recommended**: Test with extreme themes (light/dark, low contrast) during theming.

---

## DOM Structure

```html
<div class="relative h-2 w-full overflow-hidden" style="...theme styles...">
  <!-- Progress Indicator -->
  <div
    class="h-full w-full flex-1 transition-all duration-300 ease-out"
    style="transform: translateX(-35%); ...theme styles..."
  >
  </div>
</div>
```

**Element Hierarchy**:
- `ProgressPrimitive.Root` → Root container (track)
- `ProgressPrimitive.Indicator` → Animated fill bar

**Transform Calculation**:
```typescript
// value = 65 → translateX(-35%)
// value = 100 → translateX(0%)
// value = 0 → translateX(-100%)
transform: `translateX(-${100 - (value || 0)}%)`
```

---

## Usage Examples

### Basic Progress Display

```tsx
import { ThemedProgressBar } from '@/shared/theming'

function UploadProgress({ percent }: { percent: number }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Uploading...</p>
      <ThemedProgressBar value={percent} />
    </div>
  )
}
```

### Step Indicator

```tsx
function StepProgress({ current, total }: { current: number; total: number }) {
  const progress = (current / total) * 100

  return (
    <ThemedProgressBar
      value={progress}
      getValueLabel={(val) => `Step ${current} of ${total}`}
    />
  )
}
```

### Custom Styled

```tsx
function HeroProgress({ value }: { value: number }) {
  return (
    <ThemedProgressBar
      value={value}
      className="h-4 rounded-full"
      indicatorClassName="duration-500"
    />
  )
}
```

### Testing Example

```tsx
import { render, screen } from '@testing-library/react'
import { ThemedProgressBar } from './ThemedProgressBar'

const mockTheme: Theme = {
  primaryColor: '#3B82F6',
  text: { color: '#1F2937', alignment: 'center' },
  // ... other theme properties
}

it('displays correct progress', () => {
  render(<ThemedProgressBar value={65} theme={mockTheme} />)

  const progressBar = screen.getByRole('progressbar')
  expect(progressBar).toHaveAttribute('aria-valuenow', '65')
})
```

---

## Error Handling

### Type Errors (Compile-Time)

```tsx
// ❌ TypeScript error: value must be number | null | undefined
<ThemedProgressBar value="50%" />

// ❌ TypeScript error: max must be number
<ThemedProgressBar max="100" />

// ✅ Correct
<ThemedProgressBar value={50} max={100} />
```

### Runtime Behavior

```tsx
// Graceful handling - clamped to valid range
<ThemedProgressBar value={-10} />  // Treated as 0
<ThemedProgressBar value={150} />  // Treated as 100

// Null safety - shows indeterminate state
<ThemedProgressBar value={null} /> // No aria-valuenow

// Missing theme - throws error from useThemeWithOverride
<ThemedProgressBar value={50} />   // ERROR if not in ThemeProvider
```

---

## Performance Characteristics

- **Render**: O(1) - constant time
- **Re-render triggers**: `value` change, `theme` change, `className` change
- **Animation**: GPU-accelerated transform (60fps capable)
- **Memory**: Minimal - no internal state, no subscriptions

---

## Dependencies

- `@radix-ui/react-progress` - Primitive component
- `@/shared/theming/hooks/useThemeWithOverride` - Theme access
- `@/shared/theming/constants` - BUTTON_RADIUS_MAP
- `@/shared/theming/types` - Theme type
- `@/shared/utils` - cn() utility

---

## Version History

- **1.0.0** (2026-01-30): Initial implementation for runtime topbar feature
