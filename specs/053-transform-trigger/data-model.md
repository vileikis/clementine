# Data Model: Transform Pipeline Trigger

**Feature**: 053-transform-trigger
**Date**: 2026-01-31

## Entities

### Session (existing)

The session entity already contains the fields needed for job tracking:

```typescript
type Session = {
  // ... existing fields ...

  // Transform Job Tracking (already exists)
  jobId: string | null          // Reference to Job document
  jobStatus: JobStatus | null   // Synced from Job.status

  // Result (populated by job completion)
  resultMedia: SessionResultMedia | null
}

type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
```

**No schema changes required** - session.jobStatus field already exists.

### Job (existing, backend-managed)

```typescript
type Job = {
  id: string
  projectId: string
  sessionId: string
  experienceId: string
  stepId: string | null  // Deprecated - no longer passed from frontend
  status: JobStatus
  progress: JobProgress | null
  output: JobOutput | null
  error: JobError | null
  snapshot: JobSnapshot
  createdAt: number
  updatedAt: number
  startedAt: number | null
  completedAt: number | null
}
```

**Note**: `stepId` is no longer passed from frontend. Transform is now a standalone field in ExperienceConfig, so step reference is not needed.

### Experience.transform (existing)

```typescript
type ExperienceConfig = {
  steps: ExperienceStep[]
  transform: TransformConfig | null  // Used to determine if trigger needed
}

type TransformConfig = {
  nodes: TransformNode[]
  outputFormat: OutputFormat | null
}
```

**No changes required** - used for detection only.

## State Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        EXPERIENCE COMPLETION                         │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 1. ExperienceRuntime.onComplete() called                            │
│    - Session marked as completed                                     │
│    - handleExperienceComplete() in ExperiencePage triggered         │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
        ┌───────────────────┐         ┌───────────────────┐
        │ HAS TRANSFORM?    │         │ NO TRANSFORM      │
        │ nodes.length > 0  │         │ nodes.length = 0  │
        └───────────────────┘         └───────────────────┘
                    │                             │
                    ▼                             │
┌─────────────────────────────────────────────┐   │
│ 2. Callable: startTransformPipeline         │   │
│    - Creates Job document                    │   │
│    - Sets session.jobId                      │   │
│    - Sets session.jobStatus = 'pending'      │   │
│    - Queues Cloud Task                       │   │
└─────────────────────────────────────────────┘   │
                    │                             │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. Navigate to SharePage (or preshare)                              │
│    - Passes mainSessionId in URL                                     │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. SharePage subscribes to session                                  │
│    - useSubscribeSession(projectId, mainSessionId)                  │
│    - Real-time jobStatus updates via onSnapshot                     │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
        ┌───────────────────┐         ┌───────────────────┐
        │ jobStatus =       │         │ jobStatus =       │
        │ pending | running │         │ completed         │
        └───────────────────┘         └───────────────────┘
                    │                             │
                    ▼                             ▼
        ┌───────────────────┐         ┌───────────────────┐
        │ Show Loading      │         │ Show Ready        │
        │ ShareLoadingRender│         │ ShareReadyRenderer│
        └───────────────────┘         └───────────────────┘
```

## UI State Derivation

### SharePage State Logic

```typescript
// Derive UI state from session subscription
const session = useSubscribeSession(projectId, sessionId)

// No transform configured = immediate ready
const hasNoTransform = !hasTransformConfig(experience)

// Job status states
const isJobPending = session?.jobStatus === 'pending'
const isJobRunning = session?.jobStatus === 'running'
const isJobCompleted = session?.jobStatus === 'completed'
const isJobFailed = session?.jobStatus === 'failed'

// UI state
const showLoading = (isJobPending || isJobRunning) && !hasNoTransform
const showReady = isJobCompleted || hasNoTransform
const showError = isJobFailed
```

### PreviewModal State Logic

```typescript
// After ExperienceRuntime completes
const [showJobStatus, setShowJobStatus] = useState(false)

const handleComplete = () => {
  if (hasTransformConfig(experience)) {
    setShowJobStatus(true)  // Don't close modal, show job status
  } else {
    toast.success('Preview complete!')
    onOpenChange(false)  // Close modal
  }
}

// Render job status view when showJobStatus = true
// Subscribe to session.jobStatus for real-time updates
```
