# Quickstart: Session & Runtime Foundation

**Feature**: 030-session-runtime-capture
**Date**: 2026-01-15

## Overview

This guide provides a quick reference for implementing the Session & Runtime Foundation feature.

---

## Key Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/domains/session/shared/hooks/useCreateSession.ts` | Create session mutation |
| `src/domains/session/shared/hooks/useSubscribeSession.ts` | Real-time session subscription |
| `src/domains/session/shared/hooks/useUpdateSessionProgress.ts` | Update session state |
| `src/domains/session/shared/hooks/useCompleteSession.ts` | Mark session complete |
| `src/domains/session/shared/hooks/useAbandonSession.ts` | Mark session abandoned |
| `src/domains/session/shared/hooks/index.ts` | Barrel export |
| `src/domains/session/shared/queries/session.query.ts` | TanStack Query keys |
| `src/domains/experience/runtime/hooks/useExperienceRuntime.ts` | Runtime engine hook |
| `src/domains/experience/runtime/index.ts` | Barrel export |
| `src/domains/experience/designer/components/PreviewModal.tsx` | Preview modal UI |

### Files to Modify

| File | Changes |
|------|---------|
| `src/domains/experience/designer/containers/ExperienceDesignerPage.tsx` | Add Preview button |
| `src/domains/experience/steps/renderers/InfoStepRenderer.tsx` | Add run mode |
| `src/domains/experience/steps/renderers/InputScaleRenderer.tsx` | Add run mode |
| `src/domains/experience/steps/renderers/InputYesNoRenderer.tsx` | Add run mode |
| `src/domains/experience/steps/renderers/InputMultiSelectRenderer.tsx` | Add run mode |
| `src/domains/experience/steps/renderers/InputShortTextRenderer.tsx` | Add run mode |
| `src/domains/experience/steps/renderers/InputLongTextRenderer.tsx` | Add run mode |
| `src/domains/experience/steps/renderers/CapturePhotoRenderer.tsx` | Add placeholder run mode |
| `src/domains/experience/steps/renderers/TransformPipelineRenderer.tsx` | Add placeholder run mode |

---

## Implementation Order

### Phase 1: Session Hooks

```bash
# 1. Create query keys
touch src/domains/session/shared/queries/session.query.ts
touch src/domains/session/shared/queries/index.ts

# 2. Create session hooks
touch src/domains/session/shared/hooks/useCreateSession.ts
touch src/domains/session/shared/hooks/useSubscribeSession.ts
touch src/domains/session/shared/hooks/useUpdateSessionProgress.ts
touch src/domains/session/shared/hooks/useCompleteSession.ts
touch src/domains/session/shared/hooks/useAbandonSession.ts
touch src/domains/session/shared/hooks/index.ts

# 3. Update domain barrel export
# Edit src/domains/session/index.ts
```

### Phase 2: Runtime Engine

```bash
# 1. Create runtime folder
mkdir -p src/domains/experience/runtime/hooks

# 2. Create runtime hook
touch src/domains/experience/runtime/hooks/useExperienceRuntime.ts
touch src/domains/experience/runtime/hooks/index.ts
touch src/domains/experience/runtime/index.ts
```

### Phase 3: Step Renderers

Modify each renderer to support run mode. Pattern:

```tsx
export function InputScaleRenderer({ step, mode, answer, onAnswer, onSubmit, onBack, canGoBack }: StepRendererProps) {
  if (mode === 'edit') {
    return <ExistingEditModeComponent step={step} />
  }

  // Run mode implementation
  return (
    <StepLayout onSubmit={onSubmit} onBack={onBack} canGoBack={canGoBack} canProceed={answer !== undefined}>
      {/* Interactive run mode UI */}
    </StepLayout>
  )
}
```

### Phase 4: Preview Modal

```bash
# Create preview modal
touch src/domains/experience/designer/components/PreviewModal.tsx

# Modify designer page to add Preview button
# Edit src/domains/experience/designer/containers/ExperienceDesignerPage.tsx
```

---

## Code Patterns

### Session Hook Pattern

```typescript
// useCreateSession.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, collection, runTransaction, serverTimestamp } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'
import * as Sentry from '@sentry/react'
import { sessionKeys } from '../queries/session.query'
import { createSessionInputSchema, type CreateSessionInput } from '../schemas/session.schema'

export function useCreateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateSessionInput) => {
      const validated = createSessionInputSchema.parse(input)

      return await runTransaction(firestore, async (transaction) => {
        const sessionsRef = collection(firestore, `projects/${validated.projectId}/sessions`)
        const newRef = doc(sessionsRef)

        const session = {
          id: newRef.id,
          ...validated,
          status: 'active',
          currentStepIndex: 0,
          inputs: {},
          outputs: {},
          activeJobId: null,
          resultAssetId: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          completedAt: null,
        }

        transaction.set(newRef, session)
        return { sessionId: newRef.id, session }
      })
    },
    onSuccess: ({ session }) => {
      queryClient.invalidateQueries({
        queryKey: sessionKeys.list(session.projectId),
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { domain: 'session', action: 'create' },
      })
    },
  })
}
```

### Real-time Subscription Pattern

```typescript
// useSubscribeSession.ts
import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'
import type { Session } from '../types/session.types'

export function useSubscribeSession(projectId: string | null, sessionId: string | null) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!projectId || !sessionId) {
      setSession(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const unsubscribe = onSnapshot(
      doc(firestore, `projects/${projectId}/sessions/${sessionId}`),
      (snapshot) => {
        if (snapshot.exists()) {
          setSession(snapshot.data() as Session)
        } else {
          setSession(null)
        }
        setIsLoading(false)
      },
      (err) => {
        setError(err)
        setIsLoading(false)
      }
    )

    return unsubscribe
  }, [projectId, sessionId])

  return { session, isLoading, error }
}
```

### Runtime Engine Pattern

```typescript
// useExperienceRuntime.ts
import { useState, useCallback, useMemo } from 'react'
import type { Experience, Step } from '@/domains/experience'
import type { Session, RuntimeEngine } from '../types/runtime.types'
import { useUpdateSessionProgress, useCompleteSession } from '@/domains/session'

interface RuntimeConfig {
  experience: Experience
  session: Session
  onComplete?: () => void
  onError?: (error: Error) => void
}

export function useExperienceRuntime(config: RuntimeConfig): RuntimeEngine {
  const { experience, session, onComplete, onError } = config
  const steps = experience.draft?.steps ?? []

  const updateProgress = useUpdateSessionProgress(session.projectId)
  const completeSession = useCompleteSession(session.projectId)

  const currentStep = useMemo(() =>
    steps[session.currentStepIndex] ?? null,
    [steps, session.currentStepIndex]
  )

  const canProceed = useMemo(() =>
    calculateCanProceed(currentStep, session.inputs),
    [currentStep, session.inputs]
  )

  const canGoBack = session.currentStepIndex > 0
  const isComplete = session.status === 'completed'

  const next = useCallback(async () => {
    if (!canProceed) throw new Error('Cannot proceed')

    if (session.currentStepIndex >= steps.length - 1) {
      await completeSession.mutateAsync({ sessionId: session.id })
      onComplete?.()
    } else {
      await updateProgress.mutateAsync({
        sessionId: session.id,
        currentStepIndex: session.currentStepIndex + 1,
      })
    }
  }, [canProceed, session, steps.length, completeSession, updateProgress, onComplete])

  const back = useCallback(() => {
    if (!canGoBack) return
    updateProgress.mutate({
      sessionId: session.id,
      currentStepIndex: session.currentStepIndex - 1,
    })
  }, [canGoBack, session, updateProgress])

  const setInput = useCallback((stepId: string, input: unknown) => {
    updateProgress.mutate({
      sessionId: session.id,
      inputs: { ...session.inputs, [stepId]: input },
    })
  }, [session, updateProgress])

  return {
    experienceId: experience.id,
    sessionId: session.id,
    mode: session.mode,
    currentStep,
    currentStepIndex: session.currentStepIndex,
    totalSteps: steps.length,
    canProceed,
    canGoBack,
    isComplete,
    next,
    back,
    goToStep: (index) => updateProgress.mutate({ sessionId: session.id, currentStepIndex: index }),
    setInput,
    setMedia: (stepId, ref) => updateProgress.mutate({ sessionId: session.id, outputs: { ...session.outputs, [stepId]: ref } }),
    getInput: (stepId) => session.inputs[stepId],
    getOutput: (stepId) => session.outputs[stepId],
    getState: () => ({ currentStepIndex: session.currentStepIndex, inputs: session.inputs, outputs: session.outputs }),
  }
}
```

---

## Testing Commands

```bash
# Run all tests
pnpm test

# Run specific domain tests
pnpm test -- --filter session
pnpm test -- --filter runtime

# Type check
pnpm type-check

# Lint and format
pnpm check
```

---

## Verification Checklist

- [ ] Session hooks create/update/subscribe work correctly
- [ ] Runtime engine sequences steps in order
- [ ] Navigation (next/back) respects rules
- [ ] Input validation prevents invalid answers
- [ ] Info steps display and advance correctly
- [ ] All input step types work in run mode
- [ ] Placeholder steps show message and Continue button
- [ ] Preview modal opens from editor
- [ ] Preview uses draft configuration
- [ ] Session persists progress to Firestore
- [ ] Back navigation preserves previous answers

---

## Related Documentation

- **Spec**: [spec.md](./spec.md)
- **Research**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Contracts**: [contracts/](./contracts/)
