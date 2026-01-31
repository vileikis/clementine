# Research: Experience Runtime TopBar Implementation

**Feature**: 049-runtime-topbar
**Date**: 2026-01-30
**Status**: Complete

## Overview

This document consolidates research findings for implementing a themed topbar with progress tracking and home navigation in the ExperienceRuntime component.

## Research Areas

### 1. Theming System Patterns

**Decision**: Use existing theming primitives pattern with `useThemeWithOverride` hook

**Rationale**:
- Consistent with all existing themed components (ThemedButton, ThemedText, ThemedIconButton)
- Supports both ThemeProvider context and direct theme prop override
- Ensures visual consistency across all experience screens
- Maintains type safety with TypeScript strict mode

**Key Patterns Identified**:

1. **Component Structure**:
   - Place in `shared/theming/components/primitives/`
   - Use `useThemeWithOverride(themeOverride)` hook for theme access
   - Export from barrel files (primitives/index.ts → theming/index.ts)
   - Include JSDoc comments with usage examples

2. **Color Application**:
   - Progress indicator: Use `theme.primaryColor` (solid color for visibility)
   - Track background: Use `color-mix(in srgb, ${theme.text.color} 10%, transparent)` for subtle background
   - Pattern matches ThemedButton outline variant (10% opacity for interactive backgrounds)

3. **Border Radius**:
   - Use `BUTTON_RADIUS_MAP[theme.button.radius]` for consistency with buttons
   - Returns '0', '0.5rem', or '9999px' based on theme setting

4. **Styling Strategy**:
   - Tailwind classes for layout/structure (`relative`, `h-2`, `w-full`, `overflow-hidden`)
   - Inline styles for theme-dependent values (colors, borderRadius)
   - Use `cn()` utility for class merging

**Alternatives Considered**:
- Creating standalone progress component without theming → Rejected: Would be inconsistent with design system
- Using CSS variables for theme colors → Rejected: Existing pattern uses inline styles for dynamic user config
- Hard-coding colors → Rejected: Violates theme system principles

**Reference**: All themed components in `apps/clementine-app/src/shared/theming/components/`

---

### 2. Progress Bar Implementation

**Decision**: Use Radix UI Progress primitive with custom themed styling

**Rationale**:
- Radix UI Progress already installed (`@radix-ui/react-progress@^1.1.8`)
- Provides built-in accessibility (ARIA attributes, screen reader support)
- Proven pattern in codebase (shadcn/ui Progress component)
- Allows full styling control while maintaining accessibility

**Implementation Approach**:

```tsx
import * as ProgressPrimitive from '@radix-ui/react-progress'

export function ThemedProgressBar({ value, theme, ... }) {
  const theme = useThemeWithOverride(themeOverride)
  const borderRadius = BUTTON_RADIUS_MAP[theme.button.radius]

  return (
    <ProgressPrimitive.Root
      value={value}
      className="relative h-2 w-full overflow-hidden"
      style={{
        backgroundColor: `color-mix(in srgb, ${theme.text.color} 10%, transparent)`,
        borderRadius
      }}
    >
      <ProgressPrimitive.Indicator
        className="h-full transition-all duration-300 ease-out"
        style={{
          backgroundColor: theme.primaryColor,
          borderRadius,
          transform: `translateX(-${100 - (value || 0)}%)`
        }}
      />
    </ProgressPrimitive.Root>
  )
}
```

**Accessibility Features** (built-in from Radix):
- `role="progressbar"` on root element
- `aria-valuemin="0"`
- `aria-valuemax="100"`
- `aria-valuenow={value}`
- `aria-valuetext` (auto-generated percentage)

**Alternatives Considered**:
- Building custom div-based progress bar → Rejected: Missing accessibility features, reinventing wheel
- Using shadcn/ui Progress as-is → Rejected: Not theme-aware, uses design system colors not dynamic theme
- CSS-only progress (no component) → Rejected: Harder to test, less maintainable

**Reference**:
- Existing shadcn/ui Progress: `apps/clementine-app/src/ui-kit/ui/progress.tsx`
- Radix UI docs: https://www.radix-ui.com/primitives/docs/components/progress

---

### 3. Navigation and Confirmation Dialog

**Decision**: Use TanStack Router with Radix AlertDialog for exit confirmation

**Rationale**:
- TanStack Router is the project's routing library (not React Router)
- Radix AlertDialog provides accessible confirmation dialogs (WCAG compliant)
- Pattern already established in codebase (DeleteAIPresetDialog example)
- GuestContext provides projectId without prop drilling

**Navigation Pattern**:

```tsx
import { useRouter } from '@tanstack/react-router'
import { useGuestContext } from '@/domains/guest/contexts'

function navigateToHome() {
  const router = useRouter()
  const { project } = useGuestContext()

  router.navigate({
    to: '/join/$projectId',
    params: { projectId: project.id }
  })
}
```

**Confirmation Dialog Pattern**:

```tsx
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui-kit/ui/alert-dialog'

function HomeButtonWithConfirmation() {
  const [showDialog, setShowDialog] = useState(false)

  return (
    <>
      <ThemedIconButton onClick={() => setShowDialog(true)}>
        <Home className="h-5 w-5" />
      </ThemedIconButton>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Experience?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be lost if you leave now.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
```

**Preventing Duplicate Dialogs**:
- Controlled state (`open={showDialog}`) prevents dialog duplication
- Dialog won't re-open while already open (state is already true)
- Optional: Disable button while dialog is open for extra safety

**Route Structure**:
- Home/Welcome: `/join/$projectId`
- Experience: `/join/$projectId/experience/$experienceId`
- All routes have GuestContext access via parent layout

**Alternatives Considered**:
- Browser confirm() dialog → Rejected: Not styled, poor UX, not customizable
- Custom modal component → Rejected: Reinventing wheel, Radix provides accessibility
- No confirmation → Rejected: User frustration from accidental exits

**Reference**:
- DeleteAIPresetDialog: `apps/clementine-app/src/domains/ai-presets/components/DeleteAIPresetDialog.tsx`
- GuestContext: `apps/clementine-app/src/domains/guest/contexts/GuestContext.tsx`
- Route files: `apps/clementine-app/src/app/join/$projectId/`

---

### 4. Runtime Store Integration

**Decision**: Read current step and total steps from existing Zustand runtime store

**Rationale**:
- Store already tracks `currentStepIndex` and `steps` array
- No new state management needed
- Store updates automatically on step navigation
- Component can be pure/stateless (just reads from store)

**Store Access Pattern**:

```tsx
import { useExperienceRuntimeStore } from '@/domains/experience/runtime/stores/experienceRuntimeStore'

function RuntimeTopBar() {
  const currentStepIndex = useExperienceRuntimeStore((s) => s.currentStepIndex)
  const steps = useExperienceRuntimeStore((s) => s.steps)
  const experienceId = useExperienceRuntimeStore((s) => s.experienceId)

  const progress = steps.length > 0
    ? ((currentStepIndex + 1) / steps.length) * 100
    : 0

  return <ThemedProgressBar value={progress} />
}
```

**Store Properties Available**:
- `currentStepIndex: number` - Current step (0-based index)
- `steps: ExperienceStep[]` - Array of all steps
- `experienceId: string | null` - Experience identifier
- `isComplete: boolean` - Whether all steps finished

**Progress Calculation**:
- `(currentStepIndex + 1) / steps.length * 100`
- Add 1 to index because it's 0-based (step 0 = first step = 1/5 = 20%)
- Handle edge case: `steps.length === 0` → 0% progress

**Alternatives Considered**:
- Creating new state for progress tracking → Rejected: Duplicates existing store data
- Passing progress as prop from parent → Rejected: Prop drilling, couples components
- Computing progress in ExperienceRuntime → Rejected: TopBar should self-contain logic

**Reference**: `apps/clementine-app/src/domains/experience/runtime/stores/experienceRuntimeStore.ts`

---

### 5. Experience Name Display

**Decision**: Look up experience name from experiences array using experienceId from store

**Rationale**:
- ExperienceId is available in runtime store
- Experience objects contain name/title for display
- Guest pages already load experiences via GuestContext
- Preview mode has access to experience object directly

**Implementation Approaches**:

**For Guest Pages** (pregate/main/preshare):
```tsx
import { useGuestContext } from '@/domains/guest/contexts'
import { useExperienceRuntimeStore } from '@/domains/experience/runtime'

function RuntimeTopBar() {
  const { experiences } = useGuestContext()
  const experienceId = useExperienceRuntimeStore((s) => s.experienceId)

  const experience = experiences.find(exp => exp.id === experienceId)
  const experienceName = experience?.name ?? 'Experience'

  return <ThemedText>{experienceName}</ThemedText>
}
```

**For Preview Mode**:
- ExperiencePreviewModal already has experience object
- Pass experience name as prop to ExperienceRuntime → RuntimeTopBar

**Fallback Strategy**:
- Default to "Experience" if name not found
- Truncate long names with CSS: `className="truncate max-w-[200px]"`

**Alternatives Considered**:
- Storing experience name in runtime store → Rejected: Adds duplication, store should be minimal
- Requiring experience name as required prop → Rejected: Harder to integrate, breaks existing API
- Not showing experience name → Rejected: User story specifically requires it

**Reference**:
- GuestContext: `apps/clementine-app/src/domains/guest/contexts/GuestContext.tsx`
- Experience type: `apps/clementine-app/src/domains/experience/shared/schemas/experience.ts`

---

### 6. Context-Specific Behavior

**Decision**: Pass `onHomeClick` prop to RuntimeTopBar, undefined in preview mode

**Rationale**:
- Clean separation of concerns (topbar doesn't know context)
- Preview mode: `onHomeClick={undefined}` → button visible but inactive
- Guest mode: `onHomeClick={handleNavigate}` → button triggers confirmation
- Single component handles both contexts

**Implementation Pattern**:

```tsx
interface RuntimeTopBarProps {
  /** Optional home navigation handler. If undefined, button is inactive (preview mode) */
  onHomeClick?: () => void
}

function RuntimeTopBar({ onHomeClick }: RuntimeTopBarProps) {
  return (
    <ThemedIconButton
      onClick={onHomeClick}
      disabled={!onHomeClick}
      aria-label="Return to home"
    >
      <Home className="h-5 w-5" />
    </ThemedIconButton>
  )
}

// Usage in guest pages:
<RuntimeTopBar onHomeClick={() => setShowConfirmDialog(true)} />

// Usage in preview:
<RuntimeTopBar onHomeClick={undefined} />
```

**Button States**:
- Preview mode: `disabled={true}` → grayed out, no pointer events
- Guest mode: `disabled={false}` → interactive, opens confirmation

**Alternatives Considered**:
- Separate components for preview/guest → Rejected: Duplicates code, harder to maintain
- Mode prop (`mode: 'preview' | 'guest'`) → Rejected: Couples topbar to context knowledge
- Always show confirmation → Rejected: Confusing UX in preview mode

**Reference**: ThemedIconButton supports disabled state via Radix UI primitives

---

## Implementation Checklist

Based on research findings, implementation requires:

- [ ] Create `ThemedProgressBar` component in `shared/theming/components/primitives/`
- [ ] Add unit tests for ThemedProgressBar (progress calculation, theme application)
- [ ] Create `RuntimeTopBar` component in `domains/experience/runtime/components/`
- [ ] Integrate RuntimeTopBar into ExperienceRuntime container
- [ ] Add home navigation handler to guest pages (Pregate, Experience, Preshare)
- [ ] Pass `onHomeClick={undefined}` in preview mode
- [ ] Test in all 4 contexts (preview, pregate, main, preshare)
- [ ] Verify mobile responsiveness (320px-2560px)
- [ ] Validate accessibility (ARIA, contrast ratios, touch targets)

## Open Questions

**RESOLVED** - All research complete. No open questions remaining.

## References

### Codebase Files Analyzed
- `apps/clementine-app/src/shared/theming/components/primitives/ThemedButton.tsx`
- `apps/clementine-app/src/shared/theming/components/primitives/ThemedText.tsx`
- `apps/clementine-app/src/shared/theming/components/primitives/ThemedIconButton.tsx`
- `apps/clementine-app/src/shared/theming/hooks/useThemeWithOverride.ts`
- `apps/clementine-app/src/ui-kit/ui/progress.tsx`
- `apps/clementine-app/src/ui-kit/ui/alert-dialog.tsx`
- `apps/clementine-app/src/domains/experience/runtime/stores/experienceRuntimeStore.ts`
- `apps/clementine-app/src/domains/guest/contexts/GuestContext.tsx`
- `apps/clementine-app/src/domains/ai-presets/components/DeleteAIPresetDialog.tsx`

### External Documentation
- [Radix UI Progress](https://www.radix-ui.com/primitives/docs/components/progress)
- [Radix UI Alert Dialog](https://www.radix-ui.com/primitives/docs/components/alert-dialog)
- [TanStack Router](https://tanstack.com/router/latest)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
