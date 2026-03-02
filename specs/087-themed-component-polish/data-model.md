# Data Model: Themed Component Polish

**Branch**: `087-themed-component-polish` | **Date**: 2026-03-02

## New Types

### Surface

Rendering context indicator for themed components.

```ts
type Surface = 'auto' | 'dark'
```

- `auto` — Component uses theme-derived colors (existing behavior). Default value.
- `dark` — Component uses dark-surface colors (white text, dark semi-transparent backgrounds).

No persistence — runtime-only prop.

### StepRenderTraits

Declarative per-step rendering characteristics.

```ts
type StepRenderTraits = {
  layout: 'scroll' | 'full-height'
  surface: Surface
  navigation: 'default' | 'custom'
}
```

**Fields**:
- `layout` — `scroll`: wraps step content in ScrollableView; `full-height`: renders in full-height container
- `surface` — Passed to themed components (ExperienceTopBar, buttons, text, progress bar)
- `navigation` — `default`: shows RuntimeNavigation; `custom`: step manages its own navigation

**Default values**:
```ts
const DEFAULT_TRAITS: StepRenderTraits = {
  layout: 'scroll',
  surface: 'auto',
  navigation: 'default',
}
```

**Step-specific overrides**:
```ts
const STEP_RENDER_TRAITS: Partial<Record<ExperienceStepType, Partial<StepRenderTraits>>> = {
  'capture.photo': { layout: 'full-height', surface: 'dark', navigation: 'custom' },
}
```

Traits resolution: merge step overrides with defaults using spread operator.

No persistence — compile-time constant.

### ExperienceTopBarProps (Revised)

Props-driven interface replacing the store-coupled RuntimeTopBar.

```ts
interface ExperienceTopBarProps {
  title?: string
  surface?: Surface
  progress?: { current: number; total: number }
  onBack?: () => void
  onClose?: () => void
  className?: string
}
```

**Fields**:
- `title` — Experience name displayed in center. Optional (empty when not provided).
- `surface` — Forwarded to all themed children (ThemedIconButton, ThemedText, ThemedProgressBar). Default: `auto`.
- `progress` — When provided, shows progress bar. `current` is 1-based step number, `total` is total steps. Omit to hide.
- `onBack` — When provided, shows back button (ArrowLeft icon). Omit to hide.
- `onClose` — When provided, enables close (X) and home buttons with exit confirmation. Omit to disable.
- `className` — Additional CSS classes for container.

**Usage contexts**:
- **ExperienceRuntime**: Passes all props derived from runtime state.
- **SharePage**: Passes only `title` and `onClose` (no progress, no back).

## Modified Type Interfaces

### ThemedButtonProps (Extended)

```ts
interface ThemedButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  children: ReactNode
  size?: ButtonSize
  variant?: ButtonVariant  // 'primary' | 'outline'
  surface?: Surface        // NEW — default: 'auto'
  theme?: Theme
}
```

### ThemedIconButtonProps (Extended)

```ts
interface ThemedIconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  children: ReactNode
  size?: IconButtonSize
  variant?: IconButtonVariant  // 'primary' | 'outline'
  surface?: Surface            // NEW — default: 'auto'
  theme?: Theme
}
```

### ThemedTextProps (Extended)

```ts
interface ThemedTextProps {
  children: ReactNode
  variant?: TextVariant
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div'
  align?: 'left' | 'center' | 'right' | 'inherit'
  surface?: Surface  // NEW — default: 'auto'
  className?: string
  theme?: Theme
}
```

### ThemedProgressBarProps (Extended)

```ts
interface ThemedProgressBarProps {
  value?: number | null
  max?: number
  getValueLabel?: (value: number, max: number) => string
  surface?: Surface  // NEW — default: 'auto'
  theme?: Theme
  className?: string
  indicatorClassName?: string
}
```

## Color Derivation Rules

### ThemedButton / ThemedIconButton — Outline Variant

| Surface | Background | Text Color | Border |
|---------|-----------|------------|--------|
| `auto` | `color-mix(in srgb, ${buttonTextColor} 92%, ${buttonBgColor})` | `buttonBgColor` | None |
| `dark` | `rgba(0, 0, 0, 0.4)` | `#FFFFFF` | None |

Where `buttonBgColor = theme.button.backgroundColor ?? theme.primaryColor` and `buttonTextColor = theme.button.textColor`.

Primary variant: **No changes** on either surface.

### ThemedText

| Surface | Color |
|---------|-------|
| `auto` | `theme.text.color` (unchanged) |
| `dark` | `#FFFFFF` |

### ThemedProgressBar

| Surface | Track Background | Indicator |
|---------|-----------------|-----------|
| `auto` | `color-mix(in srgb, ${theme.text.color} 10%, transparent)` (unchanged) | `theme.primaryColor` (unchanged) |
| `dark` | `rgba(255, 255, 255, 0.2)` | `#FFFFFF` |

## Entity Relationships

```
ExperienceRuntime
  ├── resolves StepRenderTraits for current step
  ├── passes traits.surface → ExperienceTopBar.surface
  └── passes traits to layout/navigation decisions

ExperienceTopBar
  ├── forwards surface → ThemedIconButton.surface
  ├── forwards surface → ThemedText.surface
  └── forwards surface → ThemedProgressBar.surface

CameraActive / PhotoPreview / UploadProgress
  └── passes surface="dark" → all themed children

SharePage
  └── renders ExperienceTopBar (title + onClose only, surface="auto")
```
