# Research: Themed Component Polish

**Branch**: `087-themed-component-polish` | **Date**: 2026-03-02

## R1: Current Outline Variant Color Strategy

**Decision**: Replace semi-transparent `color-mix()` outline variant with solid color derivation.

**Rationale**: The current outline variant uses `color-mix(in srgb, ${theme.text.color} 10%, transparent)` for background and `color-mix(in srgb, ${theme.text.color} 40%, transparent)` for border. This produces a nearly invisible button on any non-trivial background (dark camera feed, saturated colors, background images with overlay).

**Current Implementation** (ThemedButton + ThemedIconButton):
```ts
// outline variant
backgroundColor: `color-mix(in srgb, ${theme.text.color} 10%, transparent)`
color: theme.text.color
border: `1px solid color-mix(in srgb, ${theme.text.color} 40%, transparent)`
```

**New Strategy**:
- **Auto surface**: Invert button colors — `button.textColor` as background base (92% blend with `buttonBgColor`), `buttonBgColor` as text color. No border.
- **Dark surface**: Camera-native — `rgba(0,0,0,0.4)` background, `#FFFFFF` text. No border.

**Alternatives Considered**:
- Adding backdrop-blur to outline buttons — rejected: doesn't solve color contrast fundamentally, adds GPU overhead
- Auto-detecting surface lightness from background — rejected: over-engineering per PRD out-of-scope declaration
- Using theme.primaryColor for outline variant — rejected: doesn't guarantee readability since primaryColor may match the background

## R2: Surface Prop Design

**Decision**: Add optional `surface?: 'auto' | 'dark'` prop (default `'auto'`) to ThemedButton, ThemedIconButton, ThemedText, and ThemedProgressBar.

**Rationale**: The surface prop is the simplest mechanism to communicate rendering context. Default `'auto'` ensures zero changes to existing callsites. Components decide their own colors based on the surface value.

**Alternatives Considered**:
- Context-based surface propagation (SurfaceProvider) — rejected: adds provider nesting complexity for a prop that only needs to flow one level in most cases
- CSS-based approach (data attributes + CSS selectors) — rejected: harder to reason about, themed components already use inline styles for dynamic theme colors

## R3: StepRenderTraits Architecture

**Decision**: Replace `STEPS_WITH_CUSTOM_NAVIGATION` Set with a `STEP_RENDER_TRAITS` partial record keyed by step type.

**Rationale**: The current Set only tracks one dimension (navigation). Adding surface awareness requires a second dimension. A traits map is more extensible and self-documenting.

**Current Implementation** (ExperienceRuntime):
```ts
const STEPS_WITH_CUSTOM_NAVIGATION = new Set(['capture.photo'])
```

**New Implementation**:
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

const STEP_RENDER_TRAITS: Partial<Record<ExperienceStepType, Partial<StepRenderTraits>>> = {
  'capture.photo': { layout: 'full-height', surface: 'dark', navigation: 'custom' },
}
```

**Alternatives Considered**:
- Multiple Sets (one per trait) — rejected: doesn't scale, harder to reason about
- Step components self-declaring traits — rejected: couples layout decisions to step internals

## R4: RuntimeTopBar → ExperienceTopBar Refactor

**Decision**: Rename to ExperienceTopBar. Move from reading `useRuntime()` to accepting props. Keep exit confirmation dialog inside the component.

**Rationale**: The current RuntimeTopBar reads 6 values from `useRuntime()`: `experienceName`, `currentStepIndex`, `totalSteps`, `isComplete`, `canGoBack`, `back`. This couples it to the runtime store and prevents reuse on SharePage. Props-based API enables both runtime and non-runtime usage.

**New Props Interface**:
```ts
interface ExperienceTopBarProps {
  title?: string
  surface?: 'auto' | 'dark'
  progress?: { current: number; total: number }
  onBack?: () => void
  onClose?: () => void
  className?: string
}
```

**Migration**: ExperienceRuntime computes props from runtime state and passes them down. SharePage passes only `title` + `onClose`.

**Alternatives Considered**:
- Creating a separate ShareTopBar component — rejected: duplicates layout/styling logic
- Making RuntimeTopBar accept optional runtime override — rejected: still couples to runtime concept

## R5: Exit Dialog Theming

**Decision**: Apply theme colors directly to AlertDialog content using inline styles, and replace default buttons with ThemedButton components.

**Rationale**: The exit dialog currently uses default shadcn AlertDialog styling (white bg, system text). The themed approach uses `theme.background.color` for dialog bg, `theme.text.color` for text, and ThemedButton for actions. This keeps the dialog visually consistent with the experience.

**Implementation Approach**: Use `useThemeWithOverride()` inside ExperienceTopBar (already available since it's rendered within ThemeProvider). Apply theme colors via style prop on AlertDialogContent. Replace AlertDialogAction/Cancel with ThemedButton.

## R6: WelcomeRenderer List Layout Width Fix

**Decision**: Investigate and fix the list layout cards not stretching to full width in run mode.

**Current Implementation**: WelcomeRenderer uses `<ScrollableView className="items-center gap-6 px-4 py-16 max-w-2xl">`. The `max-w-2xl` (672px) constrains all content. Cards use `w-full` within this constraint. The `items-center` class on ScrollableView centers the inner flex column, which may shrink content width.

**Root Cause**: The `items-center` on the scrollable container combined with the inner `w-full` div — the items-center aligns flex children to center which can cause width shrinkage in some flex contexts. In run mode vs edit mode, the parent container structure differs, which may cause the width discrepancy.

**Fix Strategy**: Ensure the card container div has `w-full` applied consistently and that the ScrollableView's inner wrapper doesn't shrink content in run mode.

## R7: Themed Component File Locations

**Existing Files to Modify**:
| Component | Path |
|-----------|------|
| ThemedButton | `apps/clementine-app/src/shared/theming/components/primitives/ThemedButton.tsx` |
| ThemedIconButton | `apps/clementine-app/src/shared/theming/components/primitives/ThemedIconButton.tsx` |
| ThemedText | `apps/clementine-app/src/shared/theming/components/primitives/ThemedText.tsx` |
| ThemedProgressBar | `apps/clementine-app/src/shared/theming/components/primitives/ThemedProgressBar.tsx` |
| RuntimeTopBar | `apps/clementine-app/src/domains/experience/runtime/components/RuntimeTopBar.tsx` |
| RuntimeTopBar Tests | `apps/clementine-app/src/domains/experience/runtime/components/RuntimeTopBar.test.tsx` |
| ExperienceRuntime | `apps/clementine-app/src/domains/experience/runtime/containers/ExperienceRuntime.tsx` |
| CameraActive | `apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer/components/CameraActive.tsx` |
| PhotoPreview | `apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer/components/PhotoPreview.tsx` |
| UploadProgress | `apps/clementine-app/src/domains/experience/steps/renderers/CapturePhotoRenderer/components/UploadProgress.tsx` |
| SharePage | `apps/clementine-app/src/domains/guest/containers/SharePage.tsx` |
| WelcomeRenderer | `apps/clementine-app/src/domains/project-config/welcome/components/WelcomeRenderer.tsx` |
| Theming barrel | `apps/clementine-app/src/shared/theming/index.ts` |
| Primitives barrel | `apps/clementine-app/src/shared/theming/components/primitives/index.ts` |
| Runtime components barrel | `apps/clementine-app/src/domains/experience/runtime/components/index.ts` |

**Theme Color Properties Available**:
- `theme.primaryColor` — brand color (default: `#3B82F6`)
- `theme.text.color` — text color (default: `#1E1E1E`)
- `theme.button.backgroundColor` — nullable, falls back to primaryColor
- `theme.button.textColor` — button text (default: `#FFFFFF`)
- `theme.background.color` — page background (default: `#FFFFFF`)

**ThemeContextValue provides computed values**:
- `buttonBgColor` — resolved `theme.button.backgroundColor ?? theme.primaryColor`
- `buttonTextColor` — direct from theme
- `buttonRadius` — CSS value from BUTTON_RADIUS_MAP

## R8: Step Types Registry

**All Current Step Types** (from `packages/shared`):
- `info` — Information/display step
- `input.scale` — Rating scale
- `input.yesNo` — Yes/No toggle
- `input.multiSelect` — Multiple choice
- `input.shortText` — Single-line text
- `input.longText` — Multi-line text
- `capture.photo` — Photo capture

Only `capture.photo` requires dark surface treatment. All others use default traits (scroll, auto, default navigation).
