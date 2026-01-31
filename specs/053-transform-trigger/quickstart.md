# Quickstart: Transform Pipeline Trigger

**Feature**: 053-transform-trigger
**Date**: 2026-01-31

## Overview

This guide walks through implementing the transform pipeline trigger feature:
1. Convert backend function to `onCall` (callable)
2. Add Firebase Functions client to frontend
3. Create callable trigger hook
4. Modify ExperiencePage to trigger transform on completion
5. Update SharePage to show job status
6. Update ExperiencePreviewModal to show job status

## Prerequisites

- Existing `startTransformPipeline` function (functions/)
- Session schema with `jobId` and `jobStatus` fields
- `useSubscribeSession` hook for real-time updates

---

## Step 1: Convert Backend to Callable Function

**File**: `functions/src/callable/startTransformPipeline.ts` (NEW)

```typescript
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFunctions } from 'firebase-admin/functions'
import { fetchSession, updateSessionJobStatus, hasActiveJob } from '../repositories/session'
import { fetchExperience } from '../repositories/experience'
import { createJob, buildJobData, buildJobSnapshot } from '../repositories/job'
import {
  startTransformPipelineRequestSchema,
  type TransformPipelineJobPayload,
} from '../schemas/transform-pipeline.schema'

/**
 * Callable Cloud Function: startTransformPipeline
 *
 * Initiates a transform pipeline job for a session.
 * Called from frontend via httpsCallable.
 */
export const startTransformPipeline = onCall(
  {
    region: 'europe-west1',
  },
  async (request) => {
    // Validate request data
    const parseResult = startTransformPipelineRequestSchema.safeParse(request.data)
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]
      throw new HttpsError(
        'invalid-argument',
        `Invalid request: ${firstIssue?.message ?? 'validation failed'}`
      )
    }

    const { projectId, sessionId } = parseResult.data

    // Fetch session from Firestore
    const session = await fetchSession(projectId, sessionId)
    if (!session) {
      throw new HttpsError('not-found', 'Session not found')
    }

    // Check if job already in progress
    if (hasActiveJob(session)) {
      throw new HttpsError('already-exists', 'A job is already in progress for this session')
    }

    // Fetch experience and validate transform config exists
    const experience = await fetchExperience(session.workspaceId, session.experienceId)
    if (!experience) {
      throw new HttpsError('not-found', 'Experience not found')
    }

    // Determine which config to use based on session mode
    const configSource = session.configSource
    const config = configSource === 'draft' ? experience.draft : experience.published

    if (!config || !config.transform) {
      throw new HttpsError('not-found', 'Experience has no transform configuration')
    }

    // Build job snapshot
    const snapshot = buildJobSnapshot(session, experience, configSource)

    // Create job document with snapshot
    const jobData = buildJobData({
      projectId,
      sessionId,
      experienceId: session.experienceId,
      snapshot,
    })

    const jobId = await createJob(projectId, jobData)

    // Update session with jobId and jobStatus='pending'
    await updateSessionJobStatus(projectId, sessionId, jobId, 'pending')

    // Queue Cloud Task for transformPipelineJob
    const payload: TransformPipelineJobPayload = {
      jobId,
      sessionId,
      projectId,
    }
    await queueTransformJob(payload)

    // Return jobId
    return {
      success: true,
      jobId,
      message: 'Transform pipeline job created',
    }
  }
)

async function queueTransformJob(payload: TransformPipelineJobPayload): Promise<void> {
  const queue = getFunctions().taskQueue(
    'locations/europe-west1/functions/transformPipelineJob'
  )
  await queue.enqueue(payload, {
    scheduleDelaySeconds: 0,
  })
}
```

**Update schema** - remove stepId, add projectId:

**File**: `functions/src/schemas/transform-pipeline.schema.ts` (MODIFY)

```typescript
export const startTransformPipelineRequestSchema = z.object({
  projectId: z.string().min(1),
  sessionId: z.string().min(1),
  // stepId removed - transform is now a standalone field
})
```

**Export from index.ts**:

**File**: `functions/src/index.ts` (MODIFY)

```typescript
// Add callable export
export { startTransformPipeline } from './callable/startTransformPipeline'
```

---

## Step 2: Add Firebase Functions to Client

**File**: `apps/clementine-app/src/integrations/firebase/client.ts` (MODIFY)

```typescript
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'  // ADD

// ... existing config ...

// Initialize Firebase Functions (europe-west1 region)
export const functions = getFunctions(app, 'europe-west1')
```

---

## Step 3: Create Callable Trigger Hook

**File**: `apps/clementine-app/src/domains/experience/transform/hooks/useStartTransformPipeline.ts` (NEW)

```typescript
import { useCallback } from 'react'
import { httpsCallable } from 'firebase/functions'
import * as Sentry from '@sentry/react'
import { functions } from '@/integrations/firebase/client'

export interface StartTransformParams {
  projectId: string
  sessionId: string
}

interface StartTransformResponse {
  success: boolean
  jobId: string
  message: string
}

/**
 * Hook for triggering transform pipeline via Firebase Callable
 * Returns a fire-and-forget function
 */
export function useStartTransformPipeline() {
  return useCallback((params: StartTransformParams) => {
    const startTransform = httpsCallable<StartTransformParams, StartTransformResponse>(
      functions,
      'startTransformPipeline'
    )

    // Fire-and-forget - don't await, don't block navigation
    startTransform(params).catch((error) => {
      console.error('Failed to trigger transform pipeline:', error)
      Sentry.captureException(error, {
        tags: { feature: 'transform-pipeline' },
        extra: params,
      })
    })
  }, [])
}
```

**Export from index**:

**File**: `apps/clementine-app/src/domains/experience/transform/hooks/index.ts` (NEW)

```typescript
export { useStartTransformPipeline } from './useStartTransformPipeline'
```

**File**: `apps/clementine-app/src/domains/experience/transform/index.ts` (NEW)

```typescript
export * from './hooks'
```

---

## Step 4: Create Helper Function

**File**: `apps/clementine-app/src/domains/experience/shared/utils/hasTransformConfig.ts` (NEW)

```typescript
import type { Experience } from '@clementine/shared'

/**
 * Check if experience has active transform configuration
 */
export function hasTransformConfig(
  experience: Experience,
  configSource: 'draft' | 'published'
): boolean {
  const config = configSource === 'draft' ? experience.draft : experience.published
  return (config?.transform?.nodes?.length ?? 0) > 0
}
```

---

## Step 5: Modify ExperiencePage

**File**: `apps/clementine-app/src/domains/guest/containers/ExperiencePage.tsx` (MODIFY)

```typescript
// Add imports
import { useStartTransformPipeline } from '@/domains/experience/transform'
import { hasTransformConfig } from '@/domains/experience/shared/utils/hasTransformConfig'

// In component:
const startTransformPipeline = useStartTransformPipeline()

// Modify handleExperienceComplete:
const handleExperienceComplete = async () => {
  if (sessionState.status !== 'ready') return

  const { sessionId } = sessionState

  // 1. Mark experience as complete in guest record
  try {
    await markExperienceComplete.mutateAsync({ ... })
  } catch (error) { ... }

  // 2. Trigger transform if configured (fire-and-forget)
  if (experience && hasTransformConfig(experience, 'published')) {
    startTransformPipeline({
      projectId: project.id,
      sessionId,
    })
  }

  // 3. Navigate to preshare or share
  if (needsPreshare()) {
    void navigate({ to: '/join/$projectId/preshare', ... })
  } else {
    void navigate({ to: '/join/$projectId/share', ... })
  }
}
```

---

## Step 6: Update SharePage

**File**: `apps/clementine-app/src/domains/guest/containers/SharePage.tsx` (MODIFY)

```typescript
// Add imports
import { useSubscribeSession } from '@/domains/session/shared'

export function SharePage({ mainSessionId }: SharePageProps) {
  const { project } = useGuestContext()

  // Subscribe to session for real-time jobStatus updates
  const { data: session, isLoading: isSessionLoading } = useSubscribeSession(
    project.id,
    mainSessionId
  )

  // Derive UI state from job status
  const jobStatus = session?.jobStatus
  const isJobInProgress = jobStatus === 'pending' || jobStatus === 'running'
  const isJobCompleted = jobStatus === 'completed' || jobStatus === null // null = no transform
  const isJobFailed = jobStatus === 'failed'

  // Show loading while session is being fetched
  if (isSessionLoading) {
    return <ShareLoadingRenderer shareLoading={shareLoading} mode="run" />
  }

  return (
    <ThemeProvider theme={currentTheme}>
      <ThemedBackground ...>
        {isJobInProgress && (
          <ShareLoadingRenderer shareLoading={shareLoading} mode="run" />
        )}
        {isJobCompleted && (
          <ShareReadyRenderer
            share={shareReady}
            shareOptions={shareOptions}
            mode="run"
            mediaUrl={MOCK_RESULT_IMAGE}  // Keep mock for now
            onShare={handleShare}
            onCta={handleCta}
            onStartOver={handleStartOver}
          />
        )}
        {isJobFailed && (
          <ShareErrorState onRetry={handleStartOver} />
        )}
      </ThemedBackground>
    </ThemeProvider>
  )
}
```

---

## Step 7: Update ExperiencePreviewModal

**File**: `apps/clementine-app/src/domains/experience/preview/containers/ExperiencePreviewModal.tsx` (MODIFY)

```typescript
// Add imports
import { useStartTransformPipeline } from '@/domains/experience/transform'
import { hasTransformConfig } from '@/domains/experience/shared/utils/hasTransformConfig'
import { JobStatusDisplay } from '../components/JobStatusDisplay'

export function ExperiencePreviewModal({ ... }) {
  // Existing hooks...
  const startTransformPipeline = useStartTransformPipeline()
  const [showJobStatus, setShowJobStatus] = useState(false)

  // Modify handleComplete
  const handleComplete = useCallback(() => {
    if (hasTransformConfig(experience, 'draft')) {
      // Trigger transform
      if (sessionId && ghostProjectId) {
        startTransformPipeline({
          projectId: ghostProjectId,
          sessionId,
        })
      }
      // Show job status view instead of closing
      setShowJobStatus(true)
    } else {
      // No transform - close immediately
      toast.success('Preview complete!')
      setTimeout(() => onOpenChange(false), 1500)
    }
  }, [experience, sessionId, ghostProjectId, startTransformPipeline, onOpenChange])

  // Render job status when showJobStatus is true
  if (showJobStatus && session) {
    return (
      <FullscreenPreviewShell isOpen={open} onClose={handleClose}>
        <ThemeProvider theme={previewTheme}>
          <ThemedBackground ...>
            <JobStatusDisplay
              jobStatus={session.jobStatus}
              onClose={handleClose}
            />
          </ThemedBackground>
        </ThemeProvider>
      </FullscreenPreviewShell>
    )
  }

  // Existing render...
}
```

---

## Step 8: Create JobStatusDisplay Component

**File**: `apps/clementine-app/src/domains/experience/preview/components/JobStatusDisplay.tsx` (NEW)

```typescript
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import type { JobStatus } from '@clementine/shared'
import { Button } from '@/ui-kit/ui/button'

interface JobStatusDisplayProps {
  jobStatus: JobStatus | null
  onClose?: () => void
}

const STATUS_MESSAGES: Record<JobStatus, string> = {
  pending: 'Preparing your transformation...',
  running: 'Creating your AI masterpiece...',
  completed: 'Your creation is ready!',
  failed: 'Something went wrong. Please try again.',
  cancelled: 'Transformation was cancelled.',
}

export function JobStatusDisplay({ jobStatus, onClose }: JobStatusDisplayProps) {
  const isInProgress = jobStatus === 'pending' || jobStatus === 'running'
  const isCompleted = jobStatus === 'completed'
  const isFailed = jobStatus === 'failed' || jobStatus === 'cancelled'

  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        {isInProgress && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">
              {STATUS_MESSAGES[jobStatus ?? 'pending']}
            </p>
            <p className="text-sm text-muted-foreground">
              This usually takes less than a minute
            </p>
          </>
        )}

        {isCompleted && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">{STATUS_MESSAGES.completed}</p>
            {onClose && (
              <Button onClick={onClose}>Close Preview</Button>
            )}
          </>
        )}

        {isFailed && (
          <>
            <XCircle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-medium">{STATUS_MESSAGES[jobStatus ?? 'failed']}</p>
            {onClose && (
              <Button variant="outline" onClick={onClose}>Close</Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
```

---

## Testing Checklist

- [ ] Backend callable function deploys and works
- [ ] Experience with transform config → triggers callable on completion
- [ ] Experience without transform → navigates directly (no callable)
- [ ] SharePage shows loading when jobStatus is pending/running
- [ ] SharePage shows ready when jobStatus is completed or null
- [ ] SharePage shows error when jobStatus is failed
- [ ] PreviewModal shows job status view with spinner
- [ ] PreviewModal shows completion message when done
- [ ] Pregate/preshare never trigger transform

## Validation

Before completing:

```bash
# Frontend
pnpm app:check       # Format + lint
pnpm app:type-check  # TypeScript

# Backend
cd functions && pnpm build  # Compile functions
```
