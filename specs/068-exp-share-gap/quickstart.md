# Quickstart: Experience-to-Share Transition Gap

## Overview

Fix the blank screen that appears after completing the last experience step. Add a "Completing your experience..." spinner state inside ExperienceRuntime. Combined with a refactor: store full Experience in the runtime store, convert RuntimeTopBar/RuntimeNavigation to use store, rename `onHomeClick` → `onClose`.

## Prerequisites

- Node.js, pnpm 10.18.1
- `pnpm install` from monorepo root

## Implementation Order

Changes should be made in dependency order — store first, then components that read from it, then consumers.

### Phase 1: Store & Hook (foundation)

**1. experienceRuntimeStore.ts**
- Replace `experienceId: string | null` with `experience: Experience | null`
- Update `initFromSession` to accept `Experience` instead of `experienceId`
- Update `reset()` to clear `experience: null`
- Derive `experienceId` as `state.experience?.id` wherever needed

**2. useRuntime.ts**
- Add `experienceName: string` to `RuntimeAPI` interface
- Derive from `store.experience?.name ?? 'Experience'`

### Phase 2: Runtime components (consume store)

**3. RuntimeTopBar.tsx**
- Strip to 1 prop: `onClose?: () => void` (+ `className`)
- Use `useRuntime()` for all state: `experienceName`, `currentStepIndex`, `totalSteps`, `isComplete`, `canGoBack`, `back`
- `isCloseMode = isComplete || totalSteps === 1 || currentStepIndex === 0`
- Progress bar: `{totalSteps > 1 && !isComplete && (`
- Simplify handlers: `handleGoBack` → isCloseMode ? dialog : `back()`

**4. RuntimeNavigation.tsx**
- Use `useRuntime()` for `next` and `canProceed`
- Keep only optional `buttonLabel` prop

**5. ExperienceRuntime.tsx**
- Replace `experienceId` + `experienceName` props with `experience: Experience`
- Rename `onHomeClick` to `onClose`
- Pass `experience` to `store.initFromSession`
- Simplify RuntimeTopBar render: `<RuntimeTopBar onClose={onClose} />`
- Simplify RuntimeNavigation render: `<RuntimeNavigation />`
- Add completing state: when `store.isComplete`, render Loader2 + ThemedText instead of children

### Phase 3: Dead code removal

**6. GuestRuntimeContent.tsx**
- Remove `isComplete` from `useRuntime()` destructure
- Remove `if (isComplete) return null` block
- Remove stale comments

**7. PreviewRuntimeContent.tsx**
- Remove `isComplete` from `useRuntime()` destructure
- Remove `if (isComplete)` checkmark block
- Update comments

### Phase 4: Consumer updates

**8. ExperiencePage.tsx** — `experience={experience}`, remove `experienceId`/`experienceName`, `onClose={navigateToWelcome}`
**9. PregatePage.tsx** — same pattern with `pregateExperience`
**10. PresharePage.tsx** — same pattern with `preshareExperience`
**11. ExperiencePreviewModal.tsx** — `experience={experience}`, `onClose={undefined}`

## Validation

```bash
pnpm app:check        # Format + lint
pnpm app:type-check   # TypeScript
```

## Manual Testing

1. **ExperiencePage (guest)**: Complete all steps → spinner until share page
2. **PreviewModal**: Complete preview → spinner until JobStatusDisplay
3. **PregatePage**: Complete pregate → spinner until main experience
4. **PresharePage**: Complete preshare → spinner until share
5. **RuntimeTopBar during completing**: X icon shown, no progress bar
6. **X button during completing**: Home confirmation dialog appears
7. **Back navigation**: Still works normally during non-completing states
8. **Single-step experience**: X icon shown (close mode), no progress bar
