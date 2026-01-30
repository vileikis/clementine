# Data Model: Experience Runtime TopBar

**Feature**: 049-runtime-topbar
**Date**: 2026-01-30

## Overview

This document defines the component interfaces, prop types, and state management for the runtime topbar feature. Since this is a pure UI feature, there are no database entities or API models—only TypeScript interfaces for component contracts.

## Component Interfaces

### ThemedProgressBar

Reusable themed progress indicator primitive.

```typescript
interface ThemedProgressBarProps {
  /**
   * Current progress value (0-100)
   * - 0 = no progress
   * - 100 = complete
   * - null/undefined = indeterminate state
   */
  value?: number | null

  /**
   * Maximum value for progress calculation
   * @default 100
   */
  max?: number

  /**
   * Custom accessibility label generator
   * @param value - Current progress value
   * @param max - Maximum value
   * @returns Descriptive string for screen readers
   * @example (value, max) => `Upload ${value}% complete`
   */
  getValueLabel?(value: number, max: number): string

  /**
   * Theme override for use without ThemeProvider
   * Allows component to work in isolation for testing/preview
   */
  theme?: Theme

  /**
   * Additional CSS classes for root container
   * Applied to Progress.Root element
   */
  className?: string

  /**
   * Additional CSS classes for progress indicator bar
   * Applied to Progress.Indicator element
   */
  indicatorClassName?: string
}
```

**Validation Rules**:
- `value` clamped to 0-100 range (if numeric)
- `max` must be > 0 (Radix UI requirement)
- `value > max` handled by Radix (shows 100%)

**State Transitions**:
- `value: 0` → `value: 50` → `value: 100` (normal progress)
- `value: 50` → `value: 30` (backward navigation supported)
- `value: 75` → `value: null` (indeterminate state, edge case)

**Usage Context**:
- Within ThemeProvider: Uses context theme
- Outside ThemeProvider: Requires `theme` prop
- Testing: Pass mock theme via prop

---

### RuntimeTopBar

Main topbar container for experience execution screens.

```typescript
interface RuntimeTopBarProps {
  /**
   * Experience name to display in center
   * Should be human-readable experience title
   * Will truncate if too long (CSS: max-w-[200px] truncate)
   */
  experienceName: string

  /**
   * Current step index (0-based)
   * Used for progress calculation
   */
  currentStepIndex: number

  /**
   * Total number of steps in experience
   * Used for progress calculation
   * Must be >= 1 (experiences with 0 steps should not render topbar)
   */
  totalSteps: number

  /**
   * Home button click handler
   * - Guest mode: Function that opens confirmation dialog
   * - Preview mode: undefined (button disabled/inactive)
   */
  onHomeClick?: () => void

  /**
   * Additional CSS classes for topbar container
   */
  className?: string
}
```

**Validation Rules**:
- `totalSteps` must be >= 1 (caller responsibility)
- `currentStepIndex` must be >= 0 and < totalSteps
- `experienceName` should not be empty (fallback to "Experience")

**Derived Values**:
- Progress percentage: `((currentStepIndex + 1) / totalSteps) * 100`
- Home button state: `disabled={!onHomeClick}`

**State Transitions**:
- Step 1 → Step 2: `currentStepIndex: 0` → `currentStepIndex: 1`
- Progress updates: Auto-calculated from step index
- Dialog state: Managed internally by home button logic

**Usage Contexts**:
1. **Guest Pregate**: `onHomeClick={handleNavigateHome}`, uses pregate experience name
2. **Guest Main**: `onHomeClick={handleNavigateHome}`, uses main experience name
3. **Guest Preshare**: `onHomeClick={handleNavigateHome}`, uses preshare experience name
4. **Admin Preview**: `onHomeClick={undefined}`, uses experience name from preview context

---

### HomeNavigationDialog

Confirmation dialog for exit confirmation (internal to RuntimeTopBar or guest pages).

```typescript
interface HomeNavigationDialogProps {
  /**
   * Whether dialog is currently visible
   * Controlled state from parent
   */
  open: boolean

  /**
   * State change callback
   * @param open - New open state
   */
  onOpenChange: (open: boolean) => void

  /**
   * Confirm navigation callback
   * Called when user clicks "Exit" button
   * Should perform actual navigation to home
   */
  onConfirm: () => void

  /**
   * Optional custom dialog title
   * @default "Exit Experience?"
   */
  title?: string

  /**
   * Optional custom dialog description
   * @default "Your progress will be lost if you leave now."
   */
  description?: string
}
```

**State Flow**:
1. User clicks home button → `open: false` → `open: true`
2. User clicks "Cancel" → `onOpenChange(false)` → `open: false`
3. User clicks "Exit" → `onConfirm()` → navigation → `open: false`

**Accessibility**:
- Focus trapped in dialog when open
- Esc key closes dialog (Cancel behavior)
- ARIA attributes auto-applied by Radix AlertDialog

---

## Existing Store Integration

The RuntimeTopBar does NOT create new store state. It reads from the existing `ExperienceRuntimeStore`:

```typescript
// Existing store interface (READ ONLY for topbar)
interface ExperienceRuntimeState {
  // Used by topbar
  currentStepIndex: number  // For progress calculation
  steps: ExperienceStep[]   // For total step count
  experienceId: string | null  // For looking up experience name

  // NOT used by topbar (shown for context)
  sessionId: string | null
  projectId: string | null
  isComplete: boolean
  answers: Answer[]
  capturedMedia: CapturedMedia[]
  resultMedia: SessionResultMedia | null
  isReady: boolean
  isSyncing: boolean
  lastSyncedAt: number | null
}
```

**Store Access Pattern** (in ExperienceRuntime container):

```typescript
import { useExperienceRuntimeStore } from './stores/experienceRuntimeStore'

function ExperienceRuntime({ ... }) {
  // Read values from store
  const currentStepIndex = useExperienceRuntimeStore(s => s.currentStepIndex)
  const steps = useExperienceRuntimeStore(s => s.steps)
  const experienceId = useExperienceRuntimeStore(s => s.experienceId)

  // Look up experience name (guest context)
  const { experiences } = useGuestContext()
  const experience = experiences.find(exp => exp.id === experienceId)
  const experienceName = experience?.name ?? 'Experience'

  // Pass to topbar
  return (
    <>
      <RuntimeTopBar
        experienceName={experienceName}
        currentStepIndex={currentStepIndex}
        totalSteps={steps.length}
        onHomeClick={isPreviewMode ? undefined : handleHomeClick}
      />
      {children}
    </>
  )
}
```

**No State Mutations**: TopBar is read-only consumer of runtime store. All mutations happen via existing store actions (not topbar's responsibility).

---

## Context Integration

### GuestContext (for experience name lookup)

```typescript
// Existing context interface (READ ONLY for topbar)
interface GuestContextValue {
  project: Project           // Contains project ID for navigation
  guest: Guest              // Guest user record
  experiences: Experience[] // Array of available experiences
  experiencesLoading: boolean
}
```

**Usage in RuntimeTopBar Integration**:

```typescript
import { useGuestContext } from '@/domains/guest/contexts'

// In guest pages (Pregate, Experience, Preshare)
function SomePage() {
  const { project, experiences } = useGuestContext()
  const experienceId = useExperienceRuntimeStore(s => s.experienceId)

  const experience = experiences.find(exp => exp.id === experienceId)
  const experienceName = experience?.name ?? 'Experience'

  const handleHomeClick = () => {
    router.navigate({
      to: '/join/$projectId',
      params: { projectId: project.id }
    })
  }

  return (
    <ExperienceRuntime
      experienceName={experienceName}
      onHomeClick={handleHomeClick}
      ...
    />
  )
}
```

---

## Type Definitions

### Supporting Types

```typescript
// From @/shared/theming/types
interface Theme {
  fontFamily: string
  primaryColor: string  // Hex color for progress indicator
  text: {
    color: string      // Hex color for text and track background
    alignment: 'left' | 'center' | 'right'
  }
  button: {
    backgroundColor: string | null
    textColor: string
    radius: 'sharp' | 'rounded' | 'pill'
  }
  background: {
    color: string
    image: MediaReference | null
    overlayOpacity: number
  }
}

// From @radix-ui/react-progress (built-in)
namespace ProgressPrimitive {
  interface ProgressProps {
    value?: number | null
    max?: number
    getValueLabel?(value: number, max: number): string
    asChild?: boolean
    // ... standard HTML div props
  }

  interface ProgressIndicatorProps {
    asChild?: boolean
    // ... standard HTML div props
  }
}
```

---

## Edge Cases and Validation

### ThemedProgressBar Edge Cases

| Scenario | Input | Behavior |
|----------|-------|----------|
| Zero progress | `value={0}` | Shows empty track (0% fill) |
| Complete | `value={100}` | Shows full track (100% fill) |
| Over max | `value={150}` | Shows full track (clamped to 100%) |
| Under min | `value={-10}` | Shows empty track (clamped to 0%) |
| Null value | `value={null}` | Indeterminate state (no specific percentage) |
| No steps | `totalSteps={0}` | Caller should not render topbar |
| Single step | `totalSteps={1}, currentStepIndex={0}` | Shows 100% progress |

### RuntimeTopBar Edge Cases

| Scenario | Input | Behavior |
|----------|-------|----------|
| First step | `currentStepIndex={0}, totalSteps={5}` | Progress = 20% (1/5) |
| Last step | `currentStepIndex={4}, totalSteps={5}` | Progress = 100% (5/5) |
| Single step | `currentStepIndex={0}, totalSteps={1}` | Progress = 100% |
| Long name | `experienceName="Very Long Experience Name..."` | Truncates with ellipsis (CSS) |
| Empty name | `experienceName=""` | Shows fallback "Experience" |
| Preview mode | `onHomeClick={undefined}` | Button disabled, no action |
| Guest mode | `onHomeClick={fn}` | Button active, opens dialog |

---

## Performance Considerations

### Rendering Optimization

1. **Store Selectors**: Use granular selectors to prevent unnecessary re-renders

```typescript
// ❌ Bad: Re-renders on any store change
const store = useExperienceRuntimeStore()

// ✅ Good: Re-renders only when specific values change
const currentStepIndex = useExperienceRuntimeStore(s => s.currentStepIndex)
const steps = useExperienceRuntimeStore(s => s.steps)
```

2. **Memo Callbacks**: Wrap navigation handlers in `useCallback`

```typescript
const handleHomeClick = useCallback(() => {
  setShowDialog(true)
}, [])
```

3. **Progress Calculation**: Inline calculation is fast (no memo needed)

```typescript
// Simple arithmetic - no useMemo required
const progress = ((currentStepIndex + 1) / totalSteps) * 100
```

### Animation Performance

- Use `transform` for progress bar (GPU-accelerated)
- `transition-all duration-300 ease-out` for smooth updates
- Avoid layout thrashing (progress bar height/width are fixed)

---

## Testing Considerations

### Unit Tests (ThemedProgressBar)

```typescript
describe('ThemedProgressBar', () => {
  it('calculates progress percentage correctly', () => {
    render(<ThemedProgressBar value={50} />)
    expect(indicator).toHaveStyle({ width: '50%' })
  })

  it('clamps values to 0-100 range', () => {
    render(<ThemedProgressBar value={150} />)
    expect(indicator).toHaveStyle({ width: '100%' })
  })

  it('applies theme colors', () => {
    render(<ThemedProgressBar value={75} theme={mockTheme} />)
    expect(indicator).toHaveStyle({
      backgroundColor: mockTheme.primaryColor
    })
  })
})
```

### Integration Tests (RuntimeTopBar)

```typescript
describe('RuntimeTopBar', () => {
  it('displays experience name', () => {
    render(<RuntimeTopBar experienceName="Test Experience" ... />)
    expect(screen.getByText('Test Experience')).toBeInTheDocument()
  })

  it('shows correct progress for current step', () => {
    render(<RuntimeTopBar currentStepIndex={2} totalSteps={5} ... />)
    // Step 3 of 5 = 60%
    expect(progressBar).toHaveAttribute('aria-valuenow', '60')
  })

  it('disables home button in preview mode', () => {
    render(<RuntimeTopBar onHomeClick={undefined} ... />)
    expect(homeButton).toBeDisabled()
  })

  it('opens dialog on home click in guest mode', () => {
    const handleClick = vi.fn()
    render(<RuntimeTopBar onHomeClick={handleClick} ... />)
    fireEvent.click(homeButton)
    expect(handleClick).toHaveBeenCalled()
  })
})
```

---

## Summary

This data model defines:
- **3 component interfaces**: ThemedProgressBar, RuntimeTopBar, HomeNavigationDialog
- **0 new database entities**: Pure UI feature
- **0 new store state**: Reads from existing ExperienceRuntimeStore
- **2 context integrations**: GuestContext (read-only), ThemeProvider (theme access)

All types are fully specified with TypeScript strict mode compliance. No runtime validation needed (compile-time type safety sufficient for UI components).
