# Experience Runtime Container Plan

## Overview

Refactor the session runtime implementation to improve naming consistency, introduce a container pattern, and remove unreliable functionality.

## Changes Summary

1. Rename `useSessionRuntimeStore` → `experienceRuntimeStore`
2. Create `ExperienceRuntime` container component with lifecycle callbacks
3. Align terminology: `result` → `resultMedia`
4. Update `RuntimeState` to use `answers`/`capturedMedia` instead of `inputs`/`outputs`
5. Remove `useAbandonSession` hook

---

## Phase 1: Rename Store (sessionRuntime → experienceRuntime)

### Files to Modify

**Rename file:**
- `src/domains/experience/runtime/stores/useSessionRuntimeStore.ts` → `experienceRuntimeStore.ts`

**Update exports:**
- `src/domains/experience/runtime/stores/index.ts` - update export path

**Update imports:**
- `src/domains/experience/runtime/hooks/useExperienceRuntime.ts` - update import

### Changes

1. Rename file (remove "use" prefix, change "session" to "experience")
2. Rename exported items:
   - `SessionRuntimeState` → `ExperienceRuntimeState`
   - `SessionRuntimeActions` → `ExperienceRuntimeActions`
   - `SessionRuntimeStore` → `ExperienceRuntimeStore`
   - `useSessionRuntimeStore` → `useExperienceRuntimeStore`
   - `selectCurrentStep`, `selectTotalSteps`, `selectIsComplete` - keep names (they're already generic)

---

## Phase 2: Terminology Alignment (result → resultMedia)

### Files to Modify

1. `src/domains/session/shared/schemas/session.schema.ts`
   - Rename `sessionResultSchema` → `sessionResultMediaSchema`
   - Rename field `result` → `resultMedia` in `sessionSchema`
   - Update exported type `SessionResult` → `SessionResultMedia`

2. `src/domains/session/shared/types/session-api.types.ts`
   - Update `updateSessionProgressInputSchema`: `result` → `resultMedia`

3. `src/domains/session/shared/hooks/useCreateSession.ts`
   - Update initialization: `result: null` → `resultMedia: null`

4. `src/domains/session/shared/hooks/useUpdateSessionProgress.ts`
   - Update field reference: `validated.result` → `validated.resultMedia`

5. `src/domains/experience/runtime/stores/experienceRuntimeStore.ts` (after Phase 1 rename)
   - Update state interface: `result` → `resultMedia`
   - Update action: `setResult` → `setResultMedia`
   - Update initialState: `result: null` → `resultMedia: null`
   - Update `initFromSession`: reference `session.resultMedia`

6. `src/domains/experience/runtime/hooks/useExperienceRuntime.ts`
   - No changes needed (doesn't directly reference result field)

---

## Phase 3: Update RuntimeState Terminology

### Files to Modify

1. `src/domains/experience/shared/types/runtime.types.ts`
   - Change `inputs: Record<string, unknown>` → `answers: Record<string, Answer['value']>`
   - Change `outputs: Record<string, MediaReference>` → `capturedMedia: Record<string, CapturedMediaRef>`
   - Add `resultMedia: SessionResultMedia | null`
   - Add necessary type imports

2. `src/domains/experience/runtime/hooks/useExperienceRuntime.ts`
   - Update `getState()` to return aligned terminology
   - Remove the conversion logic (inputs/outputs abstraction)

### New RuntimeState Interface

```typescript
export interface RuntimeState {
  currentStepIndex: number
  answers: Record<string, Answer['value']>
  capturedMedia: Record<string, { assetId: string; url: string }>
  resultMedia: SessionResultMedia | null
}
```

---

## Phase 4: Create ExperienceRuntime Container + Public Hook

### Architecture Decision: Zustand Store as State Layer

Instead of creating a separate React context, we use Zustand store directly:
- **Store** (`experienceRuntimeStore.ts`) - Pure state + internal actions
- **Container** (`ExperienceRuntime.tsx`) - Initialization, lifecycle callbacks, Firestore sync
- **Public hook** (`useRuntime.ts`) - Curated read-only accessor for children

Benefits:
- No extra context layer (Zustand is already optimized for this)
- Store holds state, container orchestrates, hook provides clean access
- Children use `useRuntime()` which only exposes safe, consumer-facing API

### New Files

1. `src/domains/experience/runtime/containers/ExperienceRuntime.tsx`
2. `src/domains/experience/runtime/containers/index.ts`
3. `src/domains/experience/runtime/hooks/useRuntime.ts` (public curated hook)

### Files to Modify

- `src/domains/experience/runtime/hooks/index.ts` - export new `useRuntime`, keep `useExperienceRuntime` internal
- `src/domains/experience/runtime/index.ts` - add container export

### Container Design

```typescript
interface ExperienceRuntimeProps {
  experienceId: string
  steps: ExperienceStep[]
  session: Session
  children: React.ReactNode

  // Lifecycle callbacks (for analytics, etc.)
  onStepChange?: (step: ExperienceStep, index: number) => void
  onComplete?: () => void
  onError?: (error: Error) => void
}
```

Container responsibilities:
1. Initialize store from session on mount
2. Handle zero-steps edge case
3. Call `onStepChange` when step changes
4. Call `onComplete` when experience completes
5. Call `onError` on sync failures
6. Clean up on unmount

### Public Hook Design (`useRuntime`)

```typescript
/**
 * Public hook for accessing runtime state within ExperienceRuntime container.
 * Throws if used outside container (store not initialized).
 */
export function useRuntime() {
  const store = useExperienceRuntimeStore()

  // Throw if not initialized
  if (!store.sessionId) {
    throw new Error('useRuntime must be used within ExperienceRuntime container')
  }

  return {
    // Read-only state
    currentStep: store.getCurrentStep(),
    currentStepIndex: store.currentStepIndex,
    totalSteps: store.steps.length,
    canProceed: store.canProceed(),
    canGoBack: store.canGoBack(),
    isComplete: store.isComplete,
    isSyncing: store.isSyncing,
    mode: store.mode, // if we add this to store

    // Getters
    getAnswer: store.getAnswerValue,
    getMedia: (stepId: string) => store.capturedMedia.find(m => m.stepId === stepId),

    // Note: Navigation actions (next, back) are NOT exposed here
    // They are handled by container's internal orchestration
  }
}
```

### Navigation Actions

Navigation (next/back/goToStep) will be passed to children differently:
- Option A: Container passes them via a prop drilling pattern
- Option B: Include navigation actions in `useRuntime()` hook

**Recommended: Include in useRuntime** - keeps API simple for consumers.

```typescript
// Full useRuntime API
export function useRuntime() {
  const store = useExperienceRuntimeStore()
  // ... validation ...

  // Navigation actions that trigger Firestore sync
  // These use refs to access latest callbacks from container
  const navigationRef = useRef<NavigationActions | null>(null)

  return {
    // State (as above)
    ...state,

    // Navigation (delegates to container's handlers)
    next: () => navigationRef.current?.next(),
    back: () => navigationRef.current?.back(),
    goToStep: (i: number) => navigationRef.current?.goToStep(i),

    // Data mutation
    setAnswer: (stepId: string, value: Answer['value']) => { /* ... */ },
    setMedia: (stepId: string, media: MediaReference) => { /* ... */ },
  }
}
```

**Actually, simpler approach**: Move sync logic to store actions, container just subscribes to store changes and fires callbacks. Then `useRuntime()` can expose store actions directly.

### Final Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ ExperienceRuntime (Container)                               │
│  - Initializes store from session                           │
│  - Subscribes to store changes                              │
│  - Fires lifecycle callbacks (onStepChange, onComplete)     │
│  - Manages Firestore sync on meaningful events              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ uses internally
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ experienceRuntimeStore (Zustand)                            │
│  - State: steps, currentStepIndex, answers, capturedMedia   │
│  - Actions: setAnswer, setCapturedMedia, nextStep, etc.     │
│  - No Firestore sync (pure state management)                │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ accessed via
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ useRuntime() (Public Hook)                                  │
│  - Curated API for children components                      │
│  - Read: currentStep, canProceed, answers, etc.             │
│  - Write: setAnswer, setMedia                               │
│  - Navigation: next, back, goToStep                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ used by
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Children (StepRenderer, etc.)                               │
│  const { currentStep, next, setAnswer } = useRuntime()      │
└─────────────────────────────────────────────────────────────┘
```

### What Happens to useExperienceRuntime Hook?

The current `useExperienceRuntime` hook will be refactored:
- Its initialization logic moves to `ExperienceRuntime` container
- Its sync logic moves to container (or stays as internal helper)
- Its public API becomes `useRuntime()` hook
- The original hook can be deleted or kept as internal orchestration helper

---

## Phase 5: Remove useAbandonSession

### Files to Delete

- `src/domains/session/shared/hooks/useAbandonSession.ts`

### Files to Modify

- `src/domains/session/shared/hooks/index.ts` - remove export

---

## File Summary

All paths relative to `apps/clementine-app/src/`

### Files to Create
- `domains/experience/runtime/containers/ExperienceRuntime.tsx`
- `domains/experience/runtime/containers/index.ts`
- `domains/experience/runtime/hooks/useRuntime.ts`

### Files to Rename
- `domains/experience/runtime/stores/useSessionRuntimeStore.ts` → `experienceRuntimeStore.ts`

### Files to Delete
- `domains/session/shared/hooks/useAbandonSession.ts`
- `domains/experience/runtime/hooks/useExperienceRuntime.ts` (after refactoring logic to container)

### Files to Modify
- `domains/experience/runtime/stores/index.ts` - update export
- `domains/experience/runtime/stores/experienceRuntimeStore.ts` - rename types, result→resultMedia
- `domains/experience/runtime/hooks/index.ts` - export useRuntime, remove useExperienceRuntime
- `domains/experience/runtime/index.ts` - add containers export
- `domains/experience/shared/types/runtime.types.ts` - update RuntimeState terminology
- `domains/session/shared/schemas/session.schema.ts` - result→resultMedia, type renames
- `domains/session/shared/types/session-api.types.ts` - result→resultMedia
- `domains/session/shared/hooks/useCreateSession.ts` - result→resultMedia
- `domains/session/shared/hooks/useUpdateSessionProgress.ts` - result→resultMedia
- `domains/session/shared/hooks/index.ts` - remove useAbandonSession export

---

## Verification

1. **Type checking**: Run `pnpm type-check` - should pass with no errors
2. **Linting**: Run `pnpm lint` - should pass
3. **Build**: Run `pnpm build` - should complete successfully
4. **Tests**: Run `pnpm test` - all tests should pass
5. **Manual verification**:
   - Import `ExperienceRuntime` container from `@/domains/experience`
   - Import `useExperienceRuntimeStore` from `@/domains/experience`
   - Verify TypeScript autocomplete shows correct types
