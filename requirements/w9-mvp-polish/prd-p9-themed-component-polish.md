# PRD P9 — Themed Component Polish

> **Priority**: P9 — UX Polish
> **Area**: App (Frontend)

---

## Objective

Make themed components look correct across all surfaces in the guest experience flow — from light welcome screens through dark camera captures to the share page.

## Why This Matters

Users configure a theme (background, text, button colors) designed for their chosen background. But the guest flow transitions through surfaces with different visual contexts:

1. **Welcome / content steps** — themed background (light or dark, user-controlled)
2. **Capture steps** — forced dark background (camera viewfinder is black)
3. **Share page** — themed background again

Themed components (buttons, text, progress bar) derive colors from one theme context. On capture steps, a light theme produces dark-on-dark controls — nearly invisible buttons and text over the camera feed. The ExperienceTopBar, which floats above everything, has the same problem.

Additionally:
- The outline button variant uses a semi-transparent background that can blend into any background (themed or dark), making text unreadable
- The exit confirmation dialog ignores the theme entirely
- The share page lacks navigation back to the welcome screen

---

## Requirements

### 1. Step Render Traits

Replace the current `STEPS_WITH_CUSTOM_NAVIGATION` Set in `ExperienceRuntime` with a declarative traits map:

```ts
type StepRenderTraits = {
  layout: 'scroll' | 'full-height'
  surface: 'auto' | 'dark'
  navigation: 'default' | 'custom'
}

const DEFAULT_TRAITS: StepRenderTraits = {
  layout: 'scroll',
  surface: 'auto',
  navigation: 'default',
}

const STEP_RENDER_TRAITS: Partial<Record<StepType, Partial<StepRenderTraits>>> = {
  'capture.photo': { layout: 'full-height', surface: 'dark', navigation: 'custom' },
}
```

`ExperienceRuntime` reads each trait independently:
- `traits.layout` — determines `ScrollableView` vs full-height wrapper
- `traits.surface` — passed to `ExperienceTopBar` as a prop
- `traits.navigation` — determines whether `RuntimeNavigation` is shown

### 2. Outline Variant Redesign

The current outline (secondary) variant uses a semi-transparent background with a border:

```ts
// Current — fragile on any non-trivial background
backgroundColor: `color-mix(in srgb, ${theme.text.color} 10%, transparent)`
border: `1px solid color-mix(in srgb, ${theme.text.color} 40%, transparent)`
```

Redesign as a solid secondary style — no border, always readable:

**`surface="auto"` — inverted button colors:**
- **Primary**: unchanged — `button.backgroundColor` (or `primaryColor`) bg, `button.textColor` text
- **Secondary**: inverted — `button.textColor` as background base (with subtle brand tint), `button.backgroundColor` as text color, no border

```ts
// Secondary outline colors (auto surface)
background: `color-mix(in srgb, ${theme.button.textColor} 92%, ${buttonBgColor})`
color: buttonBgColor  // where buttonBgColor = theme.button.backgroundColor ?? theme.primaryColor
```

The user chose `button.textColor` and `button.backgroundColor` to contrast with each other — inverting preserves that relationship. The subtle 8% tint keeps the secondary visually connected to the brand.

**`surface="dark"` — camera-native dark controls:**
- **Primary**: unchanged — opaque brand bg is already visible
- **Secondary**: dark semi-transparent bg with white text/icons, like native camera app controls

```ts
// Secondary outline colors (dark surface)
background: rgba(0, 0, 0, 0.4)
color: #FFFFFF
```

Applies to both `ThemedButton` and `ThemedIconButton`.

### 3. Surface-Aware Themed Components

Add an optional `surface` prop to themed primitives that render on variable backgrounds:

- `ThemedButton` / `ThemedIconButton` — see Requirement 2 for variant behavior
- `ThemedText` — `auto`: `theme.text.color`, `dark`: white
- `ThemedProgressBar` — `auto`: `theme.text.color`-based track, `dark`: white-based track

```ts
surface?: 'auto' | 'dark'  // default: 'auto'
```

Default is `auto` — zero changes to existing callsites.

Elevation (shadows, backdrop-blur) is the container's responsibility, not the component's. Themed components only handle their own color readability.

### 4. Capture Controls

Update `CameraActive` and `PhotoPreview` to use the `surface` prop:

- Replace hardcoded `text-white/70` labels with `ThemedText` using `surface="dark"`
- Pass `surface="dark"` to all `ThemedIconButton` and `ThemedButton` instances in capture components
- `CaptureLayout` itself stays unchanged — it's a layout shell, not a theming boundary

### 5. ExperienceTopBar Surface Awareness

`ExperienceRuntime` passes the current step's `surface` trait to `ExperienceTopBar`:

```tsx
<ExperienceTopBar surface={traits.surface} ... />
```

`ExperienceTopBar` forwards `surface` to its themed children (`ThemedIconButton`, `ThemedText`, `ThemedProgressBar`).

### 6. Decouple and Rename RuntimeTopBar → ExperienceTopBar

Currently `RuntimeTopBar` reads all state from `useRuntime()`. This couples it to the runtime store and prevents reuse on pages without a runtime (e.g., SharePage).

Rename to `ExperienceTopBar` and refactor to accept props:

```ts
interface ExperienceTopBarProps {
  title?: string
  surface?: 'auto' | 'dark'
  progress?: { current: number; total: number } // omit to hide progress bar
  onBack?: () => void        // omit to hide back button
  onClose?: () => void       // omit to disable close/home buttons
  className?: string
}
```

- `ExperienceRuntime` passes runtime state as props
- `SharePage` passes only `title` + `onClose` (no progress, no back)
- The exit confirmation dialog stays inside `ExperienceTopBar`

### 7. Themed Exit Dialog

The exit confirmation dialog in `ExperienceTopBar` currently uses default shadcn `AlertDialog` (white background, system text colors). Theme it:

- Background: `theme.background.color`
- Title and description: `theme.text.color`
- Buttons: `ThemedButton` (primary for confirm, outline/secondary for cancel)
- Max width: `max-w-sm` (384px) instead of current `sm:max-w-lg` (512px)

### 8. SharePage TopBar

Add `ExperienceTopBar` to `SharePage` for guest navigation:

```tsx
<ExperienceTopBar
  title={shareReady.title ?? 'Your Result'}
  onClose={handleStartOver}
/>
```

No progress bar, no back button — just title and close/home.

### 9. WelcomeRenderer List Layout Width

Fix list layout experience cards not stretching to full width in run mode. The cards should occupy full container width in both edit and run mode when `layout === 'list'`.

---

## Out of Scope

- Auto-detecting surface lightness from background color (manual `surface` prop is sufficient)
- Theming the shadcn `AlertDialog` primitives globally (only the exit dialog in ExperienceTopBar)
- Adding new step types or capture modes
- Changing theme schema or adding dark mode as a user-configurable option

---

## Success Metrics

- Themed buttons/text are visible on camera feed with any user theme
- ExperienceTopBar adapts correctly between content steps and capture steps
- Outline variant is always readable — solid background, no transparency issues
- Guest can navigate home from share page
- Exit dialog matches the project's theme
- List layout cards are full-width in both edit and run mode
