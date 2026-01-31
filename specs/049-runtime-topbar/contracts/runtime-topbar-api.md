# API Contract: RuntimeTopBar Component

**Component**: `RuntimeTopBar`
**Location**: `apps/clementine-app/src/domains/experience/runtime/components/RuntimeTopBar.tsx`
**Type**: React Component (Runtime UI)
**Version**: 1.0.0

## Purpose

TopBar UI for experience execution that displays experience name, progress tracking, and home navigation. Works across preview and guest contexts with context-aware behavior.

## Component Signature

```typescript
export function RuntimeTopBar(props: RuntimeTopBarProps): JSX.Element

export interface RuntimeTopBarProps {
  /** Experience name to display in center */
  experienceName: string

  /** Current step index (0-based) */
  currentStepIndex: number

  /** Total number of steps in experience */
  totalSteps: number

  /** Home button click handler. Undefined in preview mode (button disabled). */
  onHomeClick?: () => void

  /** Additional CSS classes for topbar container */
  className?: string
}
```

## Props API

### `experienceName` (required)

- **Type**: `string`
- **Purpose**: Display name of the current experience
- **Validation**: Should not be empty (caller responsibility to provide fallback)

**Behavior**:
- Displayed in center of topbar using ThemedText
- Truncates with ellipsis if too long (CSS: `max-w-[200px] truncate`)
- Uses `variant="body"` for consistent sizing with theme

**Examples**:
```tsx
<RuntimeTopBar experienceName="Holiday Photo Booth" ... />
<RuntimeTopBar experienceName="Pre-event Survey" ... />
<RuntimeTopBar experienceName="Very Long Experience Name That Will Be Truncated" ... />
```

**Fallback Strategy** (in parent component):
```tsx
const experienceName = experience?.name ?? 'Experience'
<RuntimeTopBar experienceName={experienceName} ... />
```

---

### `currentStepIndex` (required)

- **Type**: `number`
- **Range**: `0` to `totalSteps - 1`
- **Purpose**: Zero-based index of current step for progress calculation

**Behavior**:
- Used to calculate progress: `((currentStepIndex + 1) / totalSteps) * 100`
- Add 1 because index is 0-based (step 0 = first step = 1 of N)
- Updates automatically when user navigates between steps

**Examples**:
```tsx
// First step (1 of 5 = 20%)
<RuntimeTopBar currentStepIndex={0} totalSteps={5} ... />

// Third step (3 of 5 = 60%)
<RuntimeTopBar currentStepIndex={2} totalSteps={5} ... />

// Last step (5 of 5 = 100%)
<RuntimeTopBar currentStepIndex={4} totalSteps={5} ... />
```

**Validation** (caller responsibility):
```tsx
// Ensure currentStepIndex is within bounds
if (currentStepIndex < 0 || currentStepIndex >= totalSteps) {
  console.error('Invalid step index')
}
```

---

### `totalSteps` (required)

- **Type**: `number`
- **Constraint**: Must be >= 1
- **Purpose**: Total number of steps for progress percentage

**Behavior**:
- Used to calculate progress denominator
- If `totalSteps === 1`, shows 100% progress (single-step experience)
- If `totalSteps === 0`, topbar should not be rendered (caller responsibility)

**Examples**:
```tsx
// Single step experience (always 100%)
<RuntimeTopBar currentStepIndex={0} totalSteps={1} ... />

// Multi-step experience
<RuntimeTopBar currentStepIndex={2} totalSteps={5} ... />
```

**Validation** (before rendering):
```tsx
// Don't render topbar if no steps
if (totalSteps === 0) {
  return <>{children}</>
}

return (
  <>
    <RuntimeTopBar totalSteps={totalSteps} ... />
    {children}
  </>
)
```

---

### `onHomeClick` (optional)

- **Type**: `(() => void) | undefined`
- **Purpose**: Home button click handler
- **Context**: `undefined` in preview mode, function in guest mode

**Behavior**:
- **Preview mode** (`undefined`): Home button rendered but disabled, no action
- **Guest mode** (function): Home button active, triggers confirmation dialog

**Examples**:
```tsx
// Preview mode - button disabled
<RuntimeTopBar onHomeClick={undefined} ... />

// Guest mode - button active
<RuntimeTopBar
  onHomeClick={() => setShowConfirmDialog(true)}
  ...
/>
```

**Implementation Pattern** (in parent):
```tsx
// Preview mode
function ExperiencePreviewModal() {
  return (
    <ExperienceRuntime>
      <RuntimeTopBar onHomeClick={undefined} ... />
    </ExperienceRuntime>
  )
}

// Guest mode
function ExperiencePage() {
  const [showDialog, setShowDialog] = useState(false)
  const router = useRouter()
  const { project } = useGuestContext()

  const handleConfirmExit = () => {
    router.navigate({
      to: '/join/$projectId',
      params: { projectId: project.id }
    })
  }

  return (
    <>
      <ExperienceRuntime>
        <RuntimeTopBar onHomeClick={() => setShowDialog(true)} ... />
      </ExperienceRuntime>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        {/* Confirmation dialog */}
      </AlertDialog>
    </>
  )
}
```

---

### `className` (optional)

- **Type**: `string`
- **Default**: `undefined`
- **Purpose**: Additional Tailwind/CSS classes for topbar container

**Behavior**:
- Merged with base topbar classes
- Useful for custom positioning, z-index, or spacing

**Examples**:
```tsx
// Custom positioning
<RuntimeTopBar className="sticky top-0" ... />

// Custom z-index
<RuntimeTopBar className="z-50" ... />

// Custom padding
<RuntimeTopBar className="py-3" ... />
```

---

## Layout Structure

The topbar uses a three-column layout:

```
┌────────────────────────────────────────┐
│  [spacer]  [name + progress]  [home]  │
└────────────────────────────────────────┘
```

### DOM Structure

```html
<div class="fixed top-0 left-0 right-0 z-40 bg-transparent">
  <div class="flex items-center justify-between px-4 py-2">
    <!-- Left: Empty spacer for balance -->
    <div class="w-11"></div>

    <!-- Center: Experience name + progress bar -->
    <div class="flex-1 flex flex-col items-center gap-1 max-w-md">
      <ThemedText variant="body" className="truncate max-w-[200px]">
        {experienceName}
      </ThemedText>
      <ThemedProgressBar value={progressPercent} className="w-full h-1.5" />
    </div>

    <!-- Right: Home button -->
    <ThemedIconButton
      onClick={onHomeClick}
      disabled={!onHomeClick}
      aria-label="Return to home"
      size="md"
    >
      <Home className="h-5 w-5" />
    </ThemedIconButton>
  </div>
</div>
```

---

## Progress Calculation

```typescript
const progressPercent = totalSteps > 0
  ? ((currentStepIndex + 1) / totalSteps) * 100
  : 0
```

**Examples**:

| Current Index | Total Steps | Calculation | Progress |
|---------------|-------------|-------------|----------|
| 0 | 5 | (0+1)/5 * 100 | 20% |
| 1 | 5 | (1+1)/5 * 100 | 40% |
| 2 | 5 | (2+1)/5 * 100 | 60% |
| 3 | 5 | (3+1)/5 * 100 | 80% |
| 4 | 5 | (4+1)/5 * 100 | 100% |
| 0 | 1 | (0+1)/1 * 100 | 100% |
| 0 | 0 | 0 (guard) | 0% |

---

## Styling Contract

### Default Styles

```typescript
// TopBar container
'fixed top-0 left-0 right-0 z-40 bg-transparent pointer-events-none'

// Content container (allows interaction with buttons)
'flex items-center justify-between px-4 py-2 pointer-events-auto'

// Center column
'flex-1 flex flex-col items-center gap-1 max-w-md'

// Experience name
'truncate max-w-[200px]'

// Progress bar
'w-full h-1.5'
```

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Full width, compact padding (px-4) |
| Tablet (640px-1024px) | Same as mobile, centered content |
| Desktop (>1024px) | Same layout, more horizontal space |

### Z-Index Strategy

- TopBar: `z-40` (above step content, below modals)
- Modals: `z-50` (confirmation dialog)
- Toasts: `z-[100]` (highest priority)

---

## Accessibility Contract

### ARIA Attributes

```html
<!-- Home button -->
<button
  aria-label="Return to home"
  aria-disabled="true"  <!-- Only in preview mode -->
>
  <Home />
</button>

<!-- Progress bar (from ThemedProgressBar) -->
<div
  role="progressbar"
  aria-valuenow="60"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuetext="60%"
>
```

### Screen Reader Experience

1. **On page load**: "Experience name [name], Progress bar 20%"
2. **On step navigation**: Announces new percentage automatically
3. **On home button focus**: "Return to home, button, disabled" (preview) or "Return to home, button" (guest)

### Keyboard Interaction

- **Tab**: Focus on home button (if enabled)
- **Enter/Space** (on home button): Triggers `onHomeClick`
- **Escape** (in confirmation dialog): Closes dialog, returns focus to button

---

## Context Integration

### Preview Mode (ExperiencePreviewModal)

```tsx
import { RuntimeTopBar } from '@/domains/experience/runtime'
import { useExperienceRuntimeStore } from '@/domains/experience/runtime/stores'

function ExperiencePreviewModal({ experience }: Props) {
  const currentStepIndex = useExperienceRuntimeStore(s => s.currentStepIndex)
  const steps = useExperienceRuntimeStore(s => s.steps)

  return (
    <ExperienceRuntime ...>
      <RuntimeTopBar
        experienceName={experience.name}
        currentStepIndex={currentStepIndex}
        totalSteps={steps.length}
        onHomeClick={undefined}  // Preview mode - button disabled
      />
      <PreviewRuntimeContent />
    </ExperienceRuntime>
  )
}
```

### Guest Mode (Pregate/Main/Preshare Pages)

```tsx
import { RuntimeTopBar } from '@/domains/experience/runtime'
import { useExperienceRuntimeStore } from '@/domains/experience/runtime/stores'
import { useGuestContext } from '@/domains/guest/contexts'
import { useRouter } from '@tanstack/react-router'

function ExperiencePage() {
  const router = useRouter()
  const { project, experiences } = useGuestContext()
  const currentStepIndex = useExperienceRuntimeStore(s => s.currentStepIndex)
  const steps = useExperienceRuntimeStore(s => s.steps)
  const experienceId = useExperienceRuntimeStore(s => s.experienceId)

  const experience = experiences.find(exp => exp.id === experienceId)
  const experienceName = experience?.name ?? 'Experience'

  const [showDialog, setShowDialog] = useState(false)

  const handleConfirmExit = () => {
    router.navigate({
      to: '/join/$projectId',
      params: { projectId: project.id }
    })
  }

  return (
    <>
      <ExperienceRuntime ...>
        <RuntimeTopBar
          experienceName={experienceName}
          currentStepIndex={currentStepIndex}
          totalSteps={steps.length}
          onHomeClick={() => setShowDialog(true)}  // Guest mode - active
        />
        <GuestRuntimeContent />
      </ExperienceRuntime>

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
            <AlertDialogAction onClick={handleConfirmExit}>
              Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
```

---

## Usage Examples

### Basic Usage (Preview)

```tsx
<RuntimeTopBar
  experienceName="Holiday Photo Booth"
  currentStepIndex={2}
  totalSteps={5}
  onHomeClick={undefined}
/>
```

### With Home Navigation (Guest)

```tsx
<RuntimeTopBar
  experienceName="Pre-Event Survey"
  currentStepIndex={0}
  totalSteps={3}
  onHomeClick={() => setShowConfirmDialog(true)}
/>
```

### Single Step Experience

```tsx
<RuntimeTopBar
  experienceName="Quick Poll"
  currentStepIndex={0}
  totalSteps={1}  // Shows 100% progress
  onHomeClick={handleHomeClick}
/>
```

---

## Error Handling

### Compile-Time (TypeScript)

```tsx
// ❌ Missing required props
<RuntimeTopBar experienceName="Test" />

// ❌ Wrong types
<RuntimeTopBar
  experienceName={123}
  currentStepIndex="2"
  totalSteps="5"
/>

// ✅ Correct
<RuntimeTopBar
  experienceName="Test"
  currentStepIndex={2}
  totalSteps={5}
  onHomeClick={handleClick}
/>
```

### Runtime

```tsx
// Graceful handling of edge cases
<RuntimeTopBar
  experienceName=""              // Shows empty (better to provide fallback)
  currentStepIndex={-1}          // Caller should validate
  totalSteps={0}                 // Caller should not render topbar
  onHomeClick={undefined}        // Valid - preview mode
/>
```

---

## Performance Characteristics

### Re-Render Triggers

Component re-renders when:
- `currentStepIndex` changes (progress updates)
- `experienceName` changes (experience switch - rare)
- `onHomeClick` changes (should be wrapped in useCallback)
- `totalSteps` changes (experience config change - rare)

### Optimization

```tsx
// ✅ Good: Stable callback reference
const handleHomeClick = useCallback(() => {
  setShowDialog(true)
}, [])

<RuntimeTopBar onHomeClick={handleHomeClick} ... />

// ❌ Bad: New function on every render
<RuntimeTopBar onHomeClick={() => setShowDialog(true)} ... />
```

---

## Testing Contract

### Unit Tests

```tsx
describe('RuntimeTopBar', () => {
  it('displays experience name', () => {
    render(<RuntimeTopBar experienceName="Test" currentStepIndex={0} totalSteps={1} />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('calculates progress correctly', () => {
    render(<RuntimeTopBar experienceName="Test" currentStepIndex={2} totalSteps={5} />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '60')
  })

  it('disables home button in preview mode', () => {
    render(<RuntimeTopBar experienceName="Test" currentStepIndex={0} totalSteps={1} onHomeClick={undefined} />)
    expect(screen.getByLabelText('Return to home')).toBeDisabled()
  })

  it('enables home button in guest mode', () => {
    const handleClick = vi.fn()
    render(<RuntimeTopBar experienceName="Test" currentStepIndex={0} totalSteps={1} onHomeClick={handleClick} />)

    fireEvent.click(screen.getByLabelText('Return to home'))
    expect(handleClick).toHaveBeenCalled()
  })
})
```

---

## Dependencies

- `@/shared/theming` - ThemedText, ThemedIconButton, ThemedProgressBar
- `lucide-react` - Home icon
- `@/domains/experience/runtime/stores` - Runtime store access (in parent)
- `@/domains/guest/contexts` - Guest context (in parent)
- `@tanstack/react-router` - Navigation (in parent)

---

## Version History

- **1.0.0** (2026-01-30): Initial implementation for runtime topbar feature
