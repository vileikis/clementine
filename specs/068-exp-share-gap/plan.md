# Implementation Plan: Experience-to-Share Transition Gap

**Branch**: `fix/exp-share-gap` | **Date**: 2026-02-11 | **Spec**: `specs/068-exp-share-gap/spec.md`
**Input**: Feature specification from `requirements/w7-sprint/exp-share-gap.md`

## Summary

After completing the last experience step, users see a blank screen during the async completion flow (Firestore sync + cloud function). Fix by rendering a "completing" state (spinner + text) inside `ExperienceRuntime` when `store.isComplete` is true, replacing children + navigation.

Combined with a targeted refactor: store the full `Experience` reference in the runtime store, convert RuntimeTopBar and RuntimeNavigation to read from the store via `useRuntime()`, and rename `onHomeClick` to `onClose` across the runtime API. This simplifies the component interfaces (RuntimeTopBar: 7 props → 1, RuntimeNavigation: 3 props → 0) while making the gap fix cleaner.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**: React 19, Zustand 5.x, lucide-react (Loader2), shadcn/ui, @clementine/shared (Experience type)
**Storage**: N/A (no Firestore schema changes; Zustand store shape updated)
**Testing**: Vitest
**Target Platform**: Web (mobile-first, 320px-768px primary)
**Project Type**: Web monorepo (TanStack Start)
**Performance Goals**: Immediate visual feedback on completion (0ms perceived gap)
**Constraints**: Must work within existing theme system (ThemedText, ThemedIconButton)
**Scale/Scope**: ~11 files changed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | PASS | Completing state is centered flex layout, fully responsive. No new touch targets. |
| II. Clean Code & Simplicity | PASS | Net reduction in complexity: RuntimeTopBar 7→1 props, RuntimeNavigation 3→0 props. Store refactor eliminates prop drilling. Two dead-code removals. |
| III. Type-Safe Development | PASS | `Experience` type from `@clementine/shared`. Store gains typed `experience` field. useRuntime exposes `experienceName: string`. |
| IV. Minimal Testing | PASS | UI-only change with no critical path logic changes. Manual testing sufficient per testing strategy. |
| V. Validation Gates | PASS | Will run `pnpm app:check` + `pnpm app:type-check` before commit. Standards review: design-system.md (themed components), component-libraries.md (lucide-react). |
| VI. Frontend Architecture | PASS | Client-first, no server changes. Zustand store is the correct state layer. |
| VII. Backend & Firebase | N/A | No backend changes. |
| VIII. Project Structure | PASS | Changes span experience/runtime, experience/preview, guest, and session domains. All within existing boundaries, no new files. |

**Gate result**: PASS — no violations, no complexity justification needed.

## Project Structure

### Documentation (this feature)

```text
specs/068-exp-share-gap/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (files to change)

```text
apps/clementine-app/src/
├── domains/experience/runtime/
│   ├── stores/
│   │   └── experienceRuntimeStore.ts   # Store experience instead of experienceId
│   ├── hooks/
│   │   └── useRuntime.ts               # Expose experienceName
│   ├── containers/
│   │   └── ExperienceRuntime.tsx        # Accept experience, rename onHomeClick→onClose, completing state
│   └── components/
│       ├── RuntimeTopBar.tsx            # Use store, single onClose prop
│       └── RuntimeNavigation.tsx        # Use store, zero props
├── domains/experience/preview/
│   └── components/
│       └── PreviewRuntimeContent.tsx    # Remove dead isComplete block
├── domains/guest/
│   ├── components/
│   │   └── GuestRuntimeContent.tsx      # Remove dead isComplete return
│   └── containers/
│       ├── ExperiencePage.tsx           # Update ExperienceRuntime props
│       ├── PregatePage.tsx              # Update ExperienceRuntime props
│       └── PresharePage.tsx             # Update ExperienceRuntime props
└── domains/experience/preview/
    └── containers/
        └── ExperiencePreviewModal.tsx   # Update ExperienceRuntime props
```

**Structure Decision**: All changes are edits to existing files within established domain boundaries. No new files needed.

## Design

### Change 1: experienceRuntimeStore.ts — Store full Experience reference

**File**: `apps/clementine-app/src/domains/experience/runtime/stores/experienceRuntimeStore.ts`

**Current state**: Stores `experienceId: string | null` in state. `initFromSession(session, steps, experienceId)` accepts the ID as a string.

**New state**: Store `experience: Experience | null` instead of `experienceId: string | null`.

**Implementation**:
1. Import `Experience` type from `@clementine/shared`
2. Replace `experienceId: string | null` with `experience: Experience | null` in `ExperienceRuntimeState`
3. Update `initFromSession` signature: `(session: Session, steps: ExperienceStep[], experience: Experience)` — replace `experienceId` param with `experience`
4. In `initFromSession` body: set `experience` instead of `experienceId`
5. Update `reset()` to clear `experience: null` instead of `experienceId: null`
6. Wherever the store references `experienceId`, derive it as `state.experience?.id`

### Change 2: useRuntime.ts — Expose experienceName

**File**: `apps/clementine-app/src/domains/experience/runtime/hooks/useRuntime.ts`

**Current behavior**: `RuntimeAPI` exposes `sessionId`, `projectId`, navigation state, and response management. Does NOT expose experience data.

**New behavior**: Add `experienceName: string` to `RuntimeAPI`.

**Implementation**:
1. Add `experienceName: string` to the `RuntimeAPI` interface
2. In the hook body, derive: `experienceName: store.experience?.name ?? 'Experience'`

### Change 3: ExperienceRuntime.tsx — Accept experience, rename onClose, completing state

**File**: `apps/clementine-app/src/domains/experience/runtime/containers/ExperienceRuntime.tsx`

**Props changes**:
- Remove `experienceId: string` prop — derive from `experience.id`
- Remove `experienceName?: string` prop — stored in experience
- Rename `onHomeClick?: () => void` to `onClose?: () => void`
- Add `experience: Experience` prop (required)

**Store init change** (line 129):
- `store.initFromSession(session, steps, experience)` instead of `store.initFromSession(session, steps, experienceId)`
- Guard (line 128): use `experience.id` instead of separate `experienceId`

**RuntimeTopBar render** (lines 270-279):
- Replace all prop drilling with: `<RuntimeTopBar onClose={onClose} />`
- RuntimeTopBar reads everything else from the store

**RuntimeNavigation render** (lines 295-298):
- Replace with: `<RuntimeNavigation />`
- RuntimeNavigation reads `nextStep` and `canProceed` from the store

**Completing state** (new, after line 266):
- Add `const isCompleting = store.isComplete`
- Add imports: `Loader2` from `lucide-react`, `ThemedText` from `@/shared/theming`
- Replace content area with three-way ternary:

```tsx
{isCompleting ? (
  <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
    <Loader2 className="h-12 w-12 animate-spin opacity-50" />
    <ThemedText variant="body" className="opacity-60">
      Completing your experience...
    </ThemedText>
  </div>
) : isFullHeightStep ? (
  // existing full-height layout
) : (
  // existing scrollable layout
)}
```

**Pattern reference**: Follows `PermissionLoading.tsx` (Loader2 + ThemedText with opacity) and `JobStatusDisplay.tsx` centering pattern.

### Change 4: RuntimeTopBar.tsx — Use store, single onClose prop

**File**: `apps/clementine-app/src/domains/experience/runtime/components/RuntimeTopBar.tsx`

**Current props** (7): `experienceName`, `currentStepIndex`, `totalSteps`, `onHomeClick`, `onBack`, `onClose`, `canGoBack`, `className`

**New props** (1 + className): `onClose?: () => void`, `className?: string`

**Implementation**:
1. Replace `RuntimeTopBarProps` interface — only `onClose?: () => void` and `className?: string`
2. Import and call `useRuntime()` inside the component to get: `experienceName`, `currentStepIndex`, `totalSteps`, `isComplete`, `canGoBack`, `back`
3. Compute `isCloseMode = isComplete || totalSteps === 1 || currentStepIndex === 0` (incorporates completing state)
4. Progress bar guard: `{totalSteps > 1 && !isComplete && (` (hides during completing)
5. Simplify `handleGoBack`: if `isCloseMode` → show confirmation dialog; else → `back()`
6. Remove the separate `onClose?.()` call — `onClose` is now the unified exit callback triggered after dialog confirmation
7. Remove `onBack` and `canGoBack` logic — replaced by `back()` from `useRuntime()`

### Change 5: RuntimeNavigation.tsx — Use store, zero required props

**File**: `apps/clementine-app/src/domains/experience/runtime/components/RuntimeNavigation.tsx`

**Current props** (3): `onNext`, `canProceed`, `buttonLabel`

**New props** (0 required, 1 optional): `buttonLabel?: string`

**Implementation**:
1. Import and call `useRuntime()` to get `next` and `canProceed`
2. Replace `onNext` with `next` from hook, `canProceed` prop with `canProceed` from hook
3. Keep `buttonLabel` as optional prop (UI customization, not store state)

### Change 6: GuestRuntimeContent.tsx — Remove dead isComplete return

**File**: `apps/clementine-app/src/domains/guest/components/GuestRuntimeContent.tsx`

- Remove `isComplete` from `useRuntime()` destructure (line 48)
- Remove lines 59-63 (`if (isComplete) { return null }`)
- Remove stale comments referencing completion handling (lines 12, 44)

### Change 7: PreviewRuntimeContent.tsx — Remove dead isComplete checkmark

**File**: `apps/clementine-app/src/domains/experience/preview/components/PreviewRuntimeContent.tsx`

- Remove `isComplete` from `useRuntime()` destructure (line 27)
- Remove lines 38-65 (entire `if (isComplete)` block with checkmark UI)
- Update comment on line 10

### Change 8: Consumer updates — experience prop + onClose rename

Four consumers need prop updates. Each is a one-line-per-prop change:

**ExperiencePage.tsx** (lines 334-344):
```tsx
// Before:
<ExperienceRuntime experienceId={experienceId} steps={steps} experienceName={experience?.name ?? 'Experience'} onHomeClick={navigateToWelcome} ...>
// After:
<ExperienceRuntime experience={experience} steps={steps} onClose={navigateToWelcome} ...>
```

**PregatePage.tsx** (lines 219-229):
```tsx
// Before:
<ExperienceRuntime experienceId={pregateExperienceId} steps={steps} experienceName={pregateExperience?.name ?? 'Pregate'} onHomeClick={navigateToWelcome} ...>
// After:
<ExperienceRuntime experience={pregateExperience} steps={steps} onClose={navigateToWelcome} ...>
```

**PresharePage.tsx** (lines 250-260):
```tsx
// Before:
<ExperienceRuntime experienceId={preshareExperienceId} steps={steps} experienceName={preshareExperience?.name ?? 'Preshare'} onHomeClick={navigateToWelcome} ...>
// After:
<ExperienceRuntime experience={preshareExperience} steps={steps} onClose={navigateToWelcome} ...>
```

**ExperiencePreviewModal.tsx** (lines 251-261):
```tsx
// Before:
<ExperienceRuntime experienceId={experience.id} steps={steps} experienceName={experience.name} onHomeClick={undefined} ...>
// After:
<ExperienceRuntime experience={experience} steps={steps} onClose={undefined} ...>
```

## Phase 2 Design: Completion Error Handling

### Change 9: experienceRuntimeStore.ts — Add completionError state

**File**: `apps/clementine-app/src/domains/experience/runtime/stores/experienceRuntimeStore.ts`

**New state field**:
```typescript
completionError: string | null  // Error message from completion flow
```

**New action**:
```typescript
setCompletionError: (error: string | null) => void
```

**Implementation**:
1. Add `completionError: string | null` to `ExperienceRuntimeState` (initial: `null`)
2. Add `setCompletionError` to `ExperienceRuntimeActions`
3. Clear `completionError: null` in `initFromSession` and `reset()`

### Change 10: useRuntime.ts — Expose completionError

**File**: `apps/clementine-app/src/domains/experience/runtime/hooks/useRuntime.ts`

Add `completionError: string | null` to `RuntimeAPI` interface, read from `store.completionError`.

### Change 11: ExperienceRuntime.tsx — Completion error flow + error UI + retry

**File**: `apps/clementine-app/src/domains/experience/runtime/containers/ExperienceRuntime.tsx`

**Props change**:
- `onComplete` type: `() => void` → `() => void | Promise<void>`

**Completion flow refactor**:
1. Extract `runCompletion` from the completion `useEffect` into a `useCallback` stored in a ref, so both the effect and retry button can invoke it
2. In `runCompletion`:
   - Clear `completionError` at start (`store.setCompletionError(null)`)
   - Step 1 (sync): guarded by `hasCompletedRef` — skip if already synced. On failure, `store.setCompletionError(error.message)` and return
   - Step 2 (completeSession): on failure, `store.setCompletionError(error.message)` and return
   - Step 3 (`await onComplete?.()`): catch rejection, `store.setCompletionError(error.message)`
3. Completion `useEffect` calls `runCompletion()` once when conditions are met (same guards as today)

**Retry mechanism**:
- Retry button calls `runCompletion()` directly
- Already-succeeded steps are skipped by existing guards (`hasCompletedRef` for sync)
- `completeSession` is idempotent (Firestore set on existing doc)

**Render change** (four-way):
```tsx
{isCompleting && store.completionError ? (
  <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-6">
    <ThemedText variant="heading" as="h2">Something went wrong</ThemedText>
    <ThemedText variant="body">{store.completionError}</ThemedText>
    <ThemedButton onClick={handleRetry}>Try Again</ThemedButton>
  </div>
) : isCompleting ? (
  <ThemedLoading message="Completing your experience..." />
) : isFullHeightStep ? (
  ...
) : (
  ...
)}
```

### Change 12: ExperiencePage.tsx — Propagate completion errors

**File**: `apps/clementine-app/src/domains/guest/containers/ExperiencePage.tsx`

**Current** (`handleExperienceComplete`):
```tsx
const success = await startTransformPipeline({...})
if (!success) {
  toast.error('Failed to start processing', { description: 'Please try again.' })
  return
}
```

**After**: Throw on failure so the runtime catches it:
```tsx
const success = await startTransformPipeline({...})
if (!success) {
  throw new Error('Failed to start processing. Please try again.')
}
```

Also change the `onComplete` prop from `() => void handleExperienceComplete()` to `handleExperienceComplete` (remove `void` wrapper so the runtime can await the returned promise).

### Change 13: ExperiencePreviewModal.tsx — Propagate completion errors

**File**: `apps/clementine-app/src/domains/experience/preview/containers/ExperiencePreviewModal.tsx`

**Current** (`handleComplete`):
```tsx
const success = await startTransformPipeline({...})
if (!success) {
  toast.error('Failed to start processing', { description: 'Please try again.' })
}
```

**After**: Throw on failure:
```tsx
const success = await startTransformPipeline({...})
if (!success) {
  throw new Error('Failed to start processing. Please try again.')
}
```

`onComplete={handleComplete}` is already passed without void wrapper — no change needed.

## Complexity Tracking

No violations — no complexity justification needed.
