# Research: Guest Experience Runtime

**Feature**: 039-guest-experience-runtime
**Date**: 2026-01-23
**Status**: Complete

## Research Tasks

### 1. Existing Runtime Infrastructure

**Task**: Understand how `ExperienceRuntime` and `useRuntime()` currently work

**Findings**:
- **ExperienceRuntime Container** (`domains/experience/runtime/ExperienceRuntime.tsx`):
  - Manages complete lifecycle of experience execution
  - Two-phase initialization: `useLayoutEffect` for synchronous setup, then effects for side effects
  - Handles Firestore synchronization on forward navigation only (not backward)
  - Syncs `answers` and `capturedMedia` to Firestore when guest navigates forward
  - Triggers `completeSession` mutation when all steps are finished
  - Provides callbacks: `onStepChange`, `onComplete`, `onError`
  - Does NOT render children until `isReady` is true

- **useRuntime() Hook** (`domains/experience/runtime/useRuntime.ts`):
  - Public API for step components
  - Provides: `currentStep`, `currentStepIndex`, `totalSteps`, `canProceed`, `canGoBack`, `isComplete`
  - Navigation: `next()`, `back()`, `goToStep(index)`
  - Data mutation: `setAnswer(stepId, value)`, `setMedia(stepId, mediaRef)`
  - State access: `getAnswer()`, `getMedia()`, `getState()`

- **experienceRuntimeStore** (`domains/experience/runtime/experienceRuntimeStore.ts`):
  - Zustand store for navigation and data state
  - `initFromSession()`: Initializes from Session, resumes from first unanswered step
  - Step validation via step registry before allowing forward navigation

**Decision**: Reuse existing runtime infrastructure for pregate and preshare experiences. No modifications to core runtime needed - each phase creates its own session and uses the same runtime.

**Rationale**: The runtime is already designed for single-experience execution. Each phase (pregate, main, preshare) runs as an independent experience with its own session.

### 2. Session Schema Extension

**Task**: Determine how to add `mainSessionId` for session linking

**Findings**:
- Current session schema (`packages/shared/src/schemas/session/session.schema.ts`):
  - Uses `z.looseObject()` for forward compatibility
  - Optional fields use `.nullable().default(null)` pattern
  - Already has `jobId` and `jobStatus` fields with same pattern

- Existing Firestore pattern for nullable fields:
  ```typescript
  jobId: z.string().nullable().default(null)
  ```

**Decision**: Add `mainSessionId: z.string().nullable().default(null)` to session schema in `packages/shared`.

**Rationale**: Follows existing Firestore-safe patterns with `nullable().default(null)`. Allows pregate and preshare sessions to link back to the main session.

### 3. Guest Schema Extension

**Task**: Determine how to add `completedExperiences` for skip logic

**Findings**:
- Current guest schema (`domains/guest/schemas/guest.schema.ts`):
  - Simple structure: `id`, `projectId`, `authUid`, `createdAt`
  - Uses standard Zod object (not `looseObject`)

- Per spec Decision 3, need array with:
  - `experienceId: string` - Which experience was completed
  - `completedAt: number` - Timestamp (Unix ms)
  - `sessionId: string` - Session ID for analytics linking

**Decision**: Extend guest schema with `completedExperiences` array using Firestore-safe patterns.

**Rationale**: Enables experience-specific tracking for pregate/preshare skip logic. If admin changes pregate experience ID, guests will see new content.

**Implementation**:
```typescript
export const completedExperienceSchema = z.object({
  experienceId: z.string().min(1),
  completedAt: z.number(),
  sessionId: z.string().min(1),
})

export const guestSchema = z.object({
  // ... existing fields ...
  completedExperiences: z.array(completedExperienceSchema).default([]),
})
```

### 4. TanStack Router History Replacement

**Task**: Verify how to use history replacement for phase transitions

**Findings**:
- TanStack Router `navigate()` supports `replace: true` option
- Already used in codebase at `ExperiencePage.tsx:96`:
  ```typescript
  navigate({
    to: '/join/$projectId/experience/$experienceId',
    params: { projectId, experienceId },
    search: { session: newSessionId },
    replace: true,
  })
  ```

**Decision**: Use `navigate({ ..., replace: true })` for all phase transitions (pregate→main, main→preshare, preshare→share).

**Rationale**: Per spec Decision 8, browser back should return to welcome screen, not completed phases. History replacement achieves this.

**Implementation**:
```typescript
// Welcome → Pregate: push (back returns to welcome)
navigate({ to: '/join/$projectId/pregate', ..., replace: false })

// Pregate → Main: replace (back returns to welcome)
navigate({ to: '/join/$projectId/experience/$experienceId', ..., replace: true })

// Main → Preshare: replace (back returns to welcome)
navigate({ to: '/join/$projectId/preshare', ..., replace: true })

// Preshare → Share: replace (back returns to welcome)
navigate({ to: '/join/$projectId/share', ..., replace: true })
```

### 5. Published Config Pregate/Preshare Structure

**Task**: Verify existing config structure for pregate and preshare

**Findings**:
- `experiencesConfigSchema` already defined in `packages/shared/src/schemas/event/experiences.schema.ts`:
  ```typescript
  export const experiencesConfigSchema = z.object({
    main: z.array(mainExperienceReferenceSchema).default([]),
    pregate: experienceReferenceSchema.nullable().default(null),
    preshare: experienceReferenceSchema.nullable().default(null),
  })
  ```

- `experienceReferenceSchema`:
  ```typescript
  export const experienceReferenceSchema = z.object({
    experienceId: z.string().min(1, 'Experience ID is required'),
    enabled: z.boolean().default(true),
  })
  ```

**Decision**: No schema changes needed - pregate and preshare structure already exists.

**Rationale**: The spec's design aligns perfectly with existing schema. Implementation can proceed with current types.

### 6. Transform Pipeline Integration

**Task**: Verify how to trigger transform pipeline from client

**Findings**:
- `startTransformPipeline` is an HTTP Cloud Function at `functions/src/http/startTransformPipeline.ts`
- Endpoint: `POST /startTransformPipeline?projectId=xxx`
- Request body: `{ sessionId: string, stepId: string }`
- Returns: `{ success: true, jobId: string }` on success

- Firebase Functions region: `europe-west1`
- Full URL pattern: `https://europe-west1-{project}.cloudfunctions.net/startTransformPipeline`

**Decision**: Call `startTransformPipeline` HTTP endpoint from client using `fetch()` at main experience completion (before navigating to preshare/share).

**Rationale**: Per spec Decision 7, trigger before preshare so transform can process while guest completes preshare. Fire-and-forget (don't wait for response).

**Implementation**:
```typescript
// In ExperiencePage completion handler
const triggerTransform = async (projectId: string, sessionId: string, stepId: string) => {
  try {
    const url = `${FUNCTIONS_BASE_URL}/startTransformPipeline?projectId=${projectId}`
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, stepId }),
    })
  } catch (error) {
    console.error('Failed to trigger transform:', error)
    // Fire-and-forget - don't block navigation
  }
}
```

### 7. Route Param Passing

**Task**: Determine URL param strategy for passing context between phases

**Findings**:
- TanStack Router uses `validateSearch` with Zod schema for type-safe search params
- Example from existing code (`experience/$experienceId.tsx`):
  ```typescript
  const searchSchema = z.object({
    session: z.string().optional(),
  })

  export const Route = createFileRoute('...')({
    validateSearch: searchSchema,
    component: JoinExperiencePage,
  })
  ```

**Decision**: Use URL search params for passing context:
- Pregate route: `?experience=xyz` (selected experience ID for redirect after)
- Main route: `?pregate=abc` (optional pregate session ID for linking)
- Preshare route: `?session=xyz` (main session ID)
- Share route: `?session=xyz` (main session ID)

**Rationale**: URL params enable deep linking and session resumption. Follows existing patterns in codebase.

### 8. GuestContext Extension

**Task**: Determine if GuestContext needs modification

**Findings**:
- `GuestContext.tsx` provides: `user`, `project`, `event`, `guest`, `experiences`, `experiencesLoading`
- `publishedConfig.experiences` already accessible via `event` object
- Pregate/preshare experience IDs from `publishedConfig.experiences.pregate` and `.preshare`

**Decision**: No changes needed to GuestContext. Access pregate/preshare config from existing `event.publishedConfig.experiences` context.

**Rationale**: Context already provides all necessary data. Additional hooks for pregate/preshare logic will consume context.

## Summary of Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Runtime reuse | Use existing ExperienceRuntime for all phases | Each phase is independent experience with own session |
| Session linking | Add `mainSessionId` to session schema | Links pregate/preshare sessions to main session |
| Guest tracking | Add `completedExperiences` array to guest schema | Enables skip logic for repeated visits |
| History replacement | Use `replace: true` for phase transitions | Browser back always returns to welcome |
| Config schema | No changes needed | Pregate/preshare structure already exists |
| Transform trigger | HTTP fetch to `startTransformPipeline` | Fire-and-forget before preshare navigation |
| URL params | Search params for context passing | Enables deep linking and resumption |
| GuestContext | No changes needed | Already provides necessary data |

## Alternatives Considered

### Session Strategy: Single Session vs Separate Sessions

**Rejected Alternative**: Single session spanning pregate→main→preshare with phase tracking.

**Why Rejected**:
1. Session schema designed for single-experience execution (one `experienceId`, one `answers[]`)
2. ExperienceRuntime works with one experience per session
3. Transform isolation - only main session needs `jobId/jobStatus`
4. Query complexity for analytics

**Chosen**: Separate sessions per phase with `mainSessionId` linking.

### Pregate Timing: On Project Entry vs On Experience Selection

**Rejected Alternative**: Show pregate immediately when guest visits project URL.

**Why Rejected**:
1. Guest hasn't expressed intent to do an experience yet
2. Pregate questions without context feel abrupt
3. No experience ID to redirect to after completion

**Chosen**: Pregate triggers when guest selects experience from welcome screen (per spec Decision 6).
