# Research: Transform Pipeline Trigger

**Feature**: 053-transform-trigger
**Date**: 2026-01-31

## Research Questions

### 1. Function Invocation Pattern

**Question**: How should the frontend call the `startTransformPipeline` function?

**Decision**: Use Firebase `httpsCallable` with callable function (`onCall`)

**Rationale**:
- Function is app-exclusive (only called from frontend, not external systems)
- Cleaner client integration - no manual URL construction or fetch config
- Automatic JSON serialization/deserialization
- Works seamlessly with Firebase emulator for local development
- Type-safe with generics support
- Fire-and-forget pattern still works - just don't await the promise

**Alternatives Considered**:
- Raw `fetch` with `onRequest`: More manual setup, requires VITE_FIREBASE_FUNCTIONS_URL env var
- TanStack Query mutation: Overkill for fire-and-forget, adds unnecessary complexity
- Axios: Not used elsewhere in codebase, would add dependency

**Implementation Pattern**:
```typescript
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/integrations/firebase/client'

const startTransform = httpsCallable<StartTransformParams, StartTransformResponse>(
  functions,
  'startTransformPipeline'
)

// Fire-and-forget - catch errors but don't block
startTransform(params).catch((error) => {
  console.error('Failed to trigger transform pipeline:', error)
  Sentry.captureException(error, { ... })
})
```

**Backend Change Required**:
Convert `onRequest` to `onCall`:
```typescript
// Before (HTTP)
export const startTransformPipeline = onRequest({ region: 'europe-west1', cors: true }, ...)

// After (Callable)
export const startTransformPipeline = onCall({ region: 'europe-west1' }, ...)
```

---

### 2. Session Job Status Flow

**Question**: How does session.jobStatus get updated and how can SharePage subscribe to changes?

**Decision**: Use existing `useSubscribeSession` hook

**Rationale**:
- Hook already provides real-time Firestore subscription via `onSnapshot`
- Integrates with TanStack Query cache for consistent state
- Session schema already includes `jobStatus: JobStatus | null` field
- Backend (startTransformPipeline) updates session.jobId and session.jobStatus

**Flow**:
1. ExperiencePage triggers HTTP endpoint → creates Job document
2. Backend sets `session.jobId = jobId` and `session.jobStatus = 'pending'`
3. Cloud Task processes job → updates Job.status → triggers function to sync to session
4. `useSubscribeSession` receives real-time update
5. SharePage re-renders with new jobStatus value

**Implementation**:
```typescript
// SharePage.tsx
const { data: session } = useSubscribeSession(project.id, mainSessionId)

// Derive state from session.jobStatus
const isJobComplete = session?.jobStatus === 'completed'
const isJobRunning = session?.jobStatus === 'pending' || session?.jobStatus === 'running'
const isJobFailed = session?.jobStatus === 'failed'
```

---

### 3. Existing Completion Patterns

**Question**: How does ExperienceRuntime handle completion and where should transform trigger be added?

**Decision**: Add transform trigger in ExperiencePage's `handleExperienceComplete` callback

**Rationale**:
- ExperienceRuntime calls `onComplete` callback after session is marked complete
- ExperiencePage owns the navigation decision (preshare vs share)
- Transform trigger should happen between completion and navigation
- Fire-and-forget allows navigation to proceed immediately

**Current Flow** (ExperiencePage):
```typescript
const handleExperienceComplete = async () => {
  // 1. Mark experience complete in guest record
  await markExperienceComplete.mutateAsync({ ... })

  // 2. Navigate to preshare or share
  if (needsPreshare()) {
    navigate('/join/$projectId/preshare', ...)
  } else {
    navigate('/join/$projectId/share', ...)
  }
}
```

**New Flow**:
```typescript
const handleExperienceComplete = async () => {
  // 1. Mark experience complete in guest record
  await markExperienceComplete.mutateAsync({ ... })

  // 2. Trigger transform if configured (fire-and-forget)
  if (hasTransformConfig(experience)) {
    triggerTransformPipeline({
      projectId: project.id,
      sessionId: sessionState.sessionId,
      stepId: experience.published.steps[0]?.id ?? '',
    })
  }

  // 3. Navigate to preshare or share
  if (needsPreshare()) {
    navigate('/join/$projectId/preshare', ...)
  } else {
    navigate('/join/$projectId/share', ...)
  }
}
```

---

### 4. Transform Config Detection

**Question**: How to reliably detect if an experience has transform configuration?

**Decision**: Helper function checking `transform?.nodes?.length > 0`

**Rationale**:
- Transform config is optional (`transform: TransformConfig | null`)
- Empty nodes array means no transform processing needed
- Published config should be used for guest experiences
- Draft config should be used for preview mode

**Implementation**:
```typescript
/**
 * Check if experience has active transform configuration
 */
function hasTransformConfig(experience: Experience, configSource: 'draft' | 'published'): boolean {
  const config = configSource === 'draft' ? experience.draft : experience.published
  return (config?.transform?.nodes?.length ?? 0) > 0
}
```

---

### 5. stepId Parameter (Removed)

**Question**: What stepId should be passed to startTransformPipeline?

**Decision**: Remove stepId from the request

**Rationale**:
- Transform is now a standalone field in ExperienceConfig
- The transform pipeline doesn't need to reference a specific step
- Simplifies the API contract
- Session and experience context is sufficient for job creation

**Previous Implementation** (deprecated):
```typescript
// No longer needed
const stepId = experience.published?.steps[0]?.id ?? ''
```

---

### 6. Preview Mode Considerations

**Question**: Should preview mode trigger transform and show job status?

**Decision**: Yes, preview mode should trigger transform and show job status

**Rationale**:
- Creators need to validate the full experience including AI transformation
- Preview uses ghost project (same infrastructure as guest)
- Session subscription already works in preview modal
- Job status display can be shared between SharePage and PreviewModal

**Implementation**:
- ExperiencePreviewModal already has `session` via `useSubscribeSession`
- Add job status display after completion instead of closing immediately
- Show loading spinner with friendly status text
- Show completion message when job is done
