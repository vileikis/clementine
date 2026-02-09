## Renderer-Owned Layout Refactoring

### Context

ExperienceRuntime currently serves as both an **orchestration engine** (step state, Firestore sync, navigation) and a **layout engine** (ScrollableView + padding). These are two different responsibilities.

As of the camera adaptive width work (067), we introduced a conditional branch in ExperienceRuntime to handle two layout paradigms:

1. **Content steps** (forms, info): ScrollableView with `my-auto` centering, `overflow-y-auto`, topbar/nav padding
2. **Full-height steps** (camera, video): Simple `flex-1 min-h-0` container, no scroll, no padding

This works for now but will get more complex as we add step types (video capture, AR, gallery picker, etc.).

### Problem

- ExperienceRuntime shouldn't decide layout for renderers
- Different step types have fundamentally different layout needs
- Adding new step types requires modifying ExperienceRuntime's conditional logic
- RuntimeNavigation is coupled to ScrollableView's responsive behavior (fixed bottom on mobile, inline on desktop)
- Per-step navigation customization (button text, style) isn't possible with the current centralized approach

### Proposed Direction

**Move layout responsibility to individual renderers.** ExperienceRuntime becomes a pure orchestration container.

#### ExperienceRuntime (after refactor)

```tsx
// Only orchestration + topbar
<>
  <RuntimeTopBar ... />
  <div className="flex-1 min-h-0">
    {children}
  </div>
</>
```

- No ScrollableView
- No RuntimeNavigation (renderers handle their own)
- No padding decisions
- Just orchestration: step state, Firestore sync, store init

#### Step Renderers (after refactor)

Each renderer controls its own layout:

**Form/input steps:**
```tsx
function InputShortTextRenderer() {
  return (
    <StepLayout>
      {/* content */}
      <StepNavigation label="Continue" />
    </StepLayout>
  )
}
```

**Camera steps:**
```tsx
function CapturePhotoRenderer() {
  return (
    <div className="flex flex-col h-full">
      <CameraView className="flex-1" />
      <CaptureControls />
    </div>
  )
}
```

#### Shared Layout Components

Create reusable layout primitives for renderers:

- **`StepLayout`** - Wraps ScrollableView with standard topbar/nav padding. Used by form/info steps.
- **`StepNavigation`** - Replaces RuntimeNavigation. Accepts per-step props (label, variant). Handles responsive positioning (fixed bottom mobile, inline desktop).

### Benefits

- Each renderer is fully self-contained (behavior + layout)
- Adding new step types doesn't require ExperienceRuntime changes
- Per-step navigation text customization (e.g., "Submit Photo", "Continue", "Next Question")
- No conditional layout branches in ExperienceRuntime
- Better separation of concerns

### Migration Path

1. Create `StepLayout` and `StepNavigation` shared components
2. Migrate form renderers one by one to use `StepLayout` + `StepNavigation`
3. Remove ScrollableView and RuntimeNavigation from ExperienceRuntime
4. Remove `STEPS_WITH_CUSTOM_NAVIGATION` set (no longer needed)

### Priority

Low - current conditional approach works. Revisit when adding new step types or when per-step navigation customization is needed.
