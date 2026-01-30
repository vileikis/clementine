# Quickstart Guide: Runtime TopBar

**Feature**: 049-runtime-topbar
**For**: Developers integrating the runtime topbar into experience flows
**Last Updated**: 2026-01-30

## Overview

The runtime topbar displays experience name, progress tracking, and home navigation during experience execution. This guide shows how to integrate it into preview and guest contexts.

## Prerequisites

Before using the topbar:

1. ✅ ExperienceRuntime is set up and working
2. ✅ ThemeProvider wraps the experience
3. ✅ Runtime store is initialized with session data
4. ✅ (Guest mode) GuestContext provides project and experiences

## Quick Integration

### Preview Mode (Admin)

**Location**: `ExperiencePreviewModal.tsx`

```tsx
import { RuntimeTopBar } from '@/domains/experience/runtime'
import { useExperienceRuntimeStore } from '@/domains/experience/runtime/stores'

function ExperiencePreviewModal({ experience }: { experience: Experience }) {
  const currentStepIndex = useExperienceRuntimeStore(s => s.currentStepIndex)
  const steps = useExperienceRuntimeStore(s => s.steps)

  return (
    <FullscreenPreviewShell>
      <ThemeProvider theme={previewTheme}>
        <ThemedBackground>
          <ExperienceRuntime
            experienceId={experience.id}
            steps={steps}
            session={session}
          >
            {/* Add topbar - home button disabled in preview */}
            <RuntimeTopBar
              experienceName={experience.name}
              currentStepIndex={currentStepIndex}
              totalSteps={steps.length}
              onHomeClick={undefined}
            />

            <PreviewRuntimeContent />
          </ExperienceRuntime>
        </ThemedBackground>
      </ThemeProvider>
    </FullscreenPreviewShell>
  )
}
```

**Key Points**:
- `onHomeClick={undefined}` → button visible but disabled
- Experience name from preview context (already loaded)
- No confirmation dialog needed

---

### Guest Mode (Public-Facing)

**Location**: `ExperiencePage.tsx`, `PregatePage.tsx`, `PresharePage.tsx`

```tsx
import { useState, useCallback } from 'react'
import { useRouter } from '@tanstack/react-router'
import { RuntimeTopBar } from '@/domains/experience/runtime'
import { useExperienceRuntimeStore } from '@/domains/experience/runtime/stores'
import { useGuestContext } from '@/domains/guest/contexts'
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

function ExperiencePage() {
  const router = useRouter()
  const { project, experiences } = useGuestContext()

  // Read from runtime store
  const currentStepIndex = useExperienceRuntimeStore(s => s.currentStepIndex)
  const steps = useExperienceRuntimeStore(s => s.steps)
  const experienceId = useExperienceRuntimeStore(s => s.experienceId)

  // Look up experience name
  const experience = experiences.find(exp => exp.id === experienceId)
  const experienceName = experience?.name ?? 'Experience'

  // Confirmation dialog state
  const [showDialog, setShowDialog] = useState(false)

  // Open dialog on home click
  const handleHomeClick = useCallback(() => {
    setShowDialog(true)
  }, [])

  // Navigate on confirm
  const handleConfirmExit = useCallback(() => {
    router.navigate({
      to: '/join/$projectId',
      params: { projectId: project.id }
    })
  }, [router, project.id])

  return (
    <ThemeProvider theme={theme}>
      <ThemedBackground>
        <ExperienceRuntime
          experienceId={experienceId}
          steps={steps}
          session={session}
        >
          {/* Add topbar - home button active with confirmation */}
          <RuntimeTopBar
            experienceName={experienceName}
            currentStepIndex={currentStepIndex}
            totalSteps={steps.length}
            onHomeClick={handleHomeClick}
          />

          <GuestRuntimeContent />
        </ExperienceRuntime>

        {/* Confirmation dialog */}
        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Exit Experience?</AlertDialogTitle>
              <AlertDialogDescription>
                Your progress will be lost if you leave now. Are you sure you want to return home?
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
      </ThemedBackground>
    </ThemeProvider>
  )
}
```

**Key Points**:
- `onHomeClick={handleHomeClick}` → button active
- Look up experience name from GuestContext
- Confirmation dialog prevents accidental exits
- Navigation uses TanStack Router (not React Router)

---

## Common Patterns

### Pattern 1: Extracting Home Navigation Logic

For cleaner code, extract navigation into a custom hook:

```tsx
// File: useNavigateHome.ts
import { useCallback, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useGuestContext } from '@/domains/guest/contexts'

export function useNavigateHome() {
  const router = useRouter()
  const { project } = useGuestContext()
  const [showDialog, setShowDialog] = useState(false)

  const openDialog = useCallback(() => {
    setShowDialog(true)
  }, [])

  const confirmNavigation = useCallback(() => {
    router.navigate({
      to: '/join/$projectId',
      params: { projectId: project.id }
    })
    setShowDialog(false)
  }, [router, project.id])

  return {
    showDialog,
    setShowDialog,
    openDialog,
    confirmNavigation,
  }
}
```

**Usage**:

```tsx
function ExperiencePage() {
  const { showDialog, setShowDialog, openDialog, confirmNavigation } = useNavigateHome()

  return (
    <>
      <RuntimeTopBar onHomeClick={openDialog} ... />

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        {/* Dialog content */}
        <AlertDialogAction onClick={confirmNavigation}>Exit</AlertDialogAction>
      </AlertDialog>
    </>
  )
}
```

---

### Pattern 2: Shared Confirmation Dialog Component

Create reusable dialog component:

```tsx
// File: ExitConfirmationDialog.tsx
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

interface ExitConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ExitConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
}: ExitConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Exit Experience?</AlertDialogTitle>
          <AlertDialogDescription>
            Your progress will be lost if you leave now. Are you sure you want to return home?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Exit
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

**Usage**:

```tsx
function ExperiencePage() {
  const [showDialog, setShowDialog] = useState(false)
  const router = useRouter()
  const { project } = useGuestContext()

  const handleConfirm = () => {
    router.navigate({ to: '/join/$projectId', params: { projectId: project.id } })
  }

  return (
    <>
      <RuntimeTopBar onHomeClick={() => setShowDialog(true)} ... />
      <ExitConfirmationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onConfirm={handleConfirm}
      />
    </>
  )
}
```

---

## Styling Customization

### Custom Progress Bar Height

```tsx
<RuntimeTopBar
  experienceName="Photo Booth"
  currentStepIndex={2}
  totalSteps={5}
  className="custom-topbar"
/>

// In CSS/Tailwind
.custom-topbar [role="progressbar"] {
  height: 12px; // Taller progress bar
}
```

### Custom TopBar Position

```tsx
// Sticky instead of fixed
<RuntimeTopBar className="sticky top-0" ... />

// Custom z-index
<RuntimeTopBar className="z-50" ... />
```

---

## Troubleshooting

### Issue: "Cannot read property 'currentStepIndex' of undefined"

**Cause**: Runtime store not initialized

**Solution**: Ensure ExperienceRuntime.initFromSession was called

```tsx
// In ExperienceRuntime.tsx
useLayoutEffect(() => {
  if (!store.sessionId || store.sessionId !== session.id) {
    store.initFromSession(session, steps, experienceId)
  }
}, [session.id, experienceId, steps])
```

---

### Issue: "experience.name is undefined"

**Cause**: Experience not found in experiences array

**Solution**: Provide fallback name

```tsx
const experienceName = experience?.name ?? 'Experience'
```

---

### Issue: Home button does nothing in guest mode

**Cause**: Forgot to pass `onHomeClick` handler

**Solution**: Pass callback function

```tsx
// ❌ Wrong
<RuntimeTopBar onHomeClick={undefined} ... />

// ✅ Correct
<RuntimeTopBar onHomeClick={() => setShowDialog(true)} ... />
```

---

### Issue: TopBar overlaps step content

**Cause**: Step content not accounting for topbar height

**Solution**: Add top padding or margin to step container

```tsx
// In ExperienceRuntime.tsx
<div className="h-full pt-16"> {/* Top padding for topbar */}
  <RuntimeTopBar ... />
  {children}
</div>
```

---

### Issue: Progress bar doesn't update on step navigation

**Cause**: Not reading from runtime store

**Solution**: Use store selectors in parent component

```tsx
// ✅ Correct - reads from store
const currentStepIndex = useExperienceRuntimeStore(s => s.currentStepIndex)
const steps = useExperienceRuntimeStore(s => s.steps)

<RuntimeTopBar
  currentStepIndex={currentStepIndex}
  totalSteps={steps.length}
  ...
/>
```

---

## Testing

### Unit Test Example

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { RuntimeTopBar } from './RuntimeTopBar'
import { ThemeProvider } from '@/shared/theming'

const mockTheme = {
  primaryColor: '#3B82F6',
  text: { color: '#1F2937', alignment: 'center' },
  // ... other theme properties
}

describe('RuntimeTopBar', () => {
  it('renders experience name and progress', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar
          experienceName="Test Experience"
          currentStepIndex={2}
          totalSteps={5}
        />
      </ThemeProvider>
    )

    expect(screen.getByText('Test Experience')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60')
  })

  it('disables home button in preview mode', () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar
          experienceName="Test"
          currentStepIndex={0}
          totalSteps={1}
          onHomeClick={undefined}
        />
      </ThemeProvider>
    )

    expect(screen.getByLabelText('Return to home')).toBeDisabled()
  })

  it('calls onHomeClick when button clicked in guest mode', () => {
    const handleClick = vi.fn()

    render(
      <ThemeProvider theme={mockTheme}>
        <RuntimeTopBar
          experienceName="Test"
          currentStepIndex={0}
          totalSteps={1}
          onHomeClick={handleClick}
        />
      </ThemeProvider>
    )

    fireEvent.click(screen.getByLabelText('Return to home'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

---

## Next Steps

1. ✅ Integrate topbar into preview modal
2. ✅ Add topbar to guest pages (pregate, main, preshare)
3. ✅ Test on mobile devices (320px-768px)
4. ✅ Verify accessibility with screen reader
5. ✅ Test with different theme color combinations

## Further Reading

- [API Contract: RuntimeTopBar](./contracts/runtime-topbar-api.md)
- [API Contract: ThemedProgressBar](./contracts/themed-progress-bar-api.md)
- [Data Model Documentation](./data-model.md)
- [Research Findings](./research.md)
