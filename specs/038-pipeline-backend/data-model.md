# Data Model: Backend Pipeline Infrastructure

**Feature**: 038-pipeline-backend
**Date**: 2026-01-21

## Overview

Phase 2 uses existing schemas from Phase 1 (036-transform-foundation). This document describes the entities, their relationships, and the operations needed for the pipeline backend.

## Key Design Decisions

### Jobs Collection Path: `/projects/{projectId}/jobs/{jobId}`

Jobs are nested under projects (not root-level `/jobs/{jobId}`) for:
- **Natural scoping**: Queries for project jobs don't need composite indexes
- **Safer queries**: Impossible to accidentally query all jobs across projects
- **Consistent pattern**: Matches session path `/projects/{projectId}/sessions/{sessionId}`
- **Simpler security rules**: Project membership verified via path, not document field

### Session Helpers: New Module Required

The existing `functions/src/lib/session.ts` uses:
- Legacy schema (`session.schemas.legacy.ts`)
- Old Firestore path (`/sessions/{id}`)

Phase 2 requires new `functions/src/lib/session-v2.ts` with:
- New schema (`session.schema.ts` from Phase 1)
- New path (`/projects/{projectId}/sessions/{sessionId}`)

## Entities

### Job (Existing from Phase 1)

**Schema Location**: `packages/shared/src/schemas/job/job.schema.ts`
**Firestore Path**: `/projects/{projectId}/jobs/{jobId}`

```typescript
Job {
  // Identity
  id: string                    // Firestore document ID

  // Context References
  projectId: string             // Project this job belongs to
  sessionId: string             // Session that triggered this job
  experienceId: string          // Experience being processed
  stepId: string | null         // Transform step ID (optional)

  // Status Tracking
  status: JobStatus             // 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: JobProgress | null  // { currentStep, percentage, message }

  // Results
  output: JobOutput | null      // { assetId, url, format, dimensions, sizeBytes, thumbnailUrl, processingTimeMs }
  error: JobError | null        // { code, message, step, isRetryable, timestamp }

  // Execution Snapshot (immutable after creation)
  snapshot: JobSnapshot         // { sessionInputs, transformConfig, eventContext, versions }

  // Timestamps
  createdAt: number             // Unix timestamp (ms)
  updatedAt: number             // Unix timestamp (ms)
  startedAt: number | null      // When processing began
  completedAt: number | null    // When processing finished
}
```

### Session (Updated in Phase 1)

**Schema Location**: `packages/shared/src/schemas/session/session.schema.ts`
**Firestore Path**: `/projects/{projectId}/sessions/{sessionId}`

**Relevant Fields for Pipeline Backend**:
```typescript
Session {
  // ... existing fields ...

  // Job Tracking (added in Phase 1)
  jobId: string | null          // Reference to active/completed job
  jobStatus: JobStatus | null   // Synced status for client display
}
```

### Experience (Reference Only)

**Schema Location**: `packages/shared/src/schemas/experience/experience.schema.ts`
**Firestore Path**: `/workspaces/{workspaceId}/experiences/{experienceId}`

**Relevant Fields**:
```typescript
Experience {
  // ... existing fields ...

  draft: {
    steps: Step[]
    transform: TransformConfig | null  // Pipeline configuration
  }
  published: {
    steps: Step[]
    transform: TransformConfig | null
  }
}
```

## State Transitions

### Job Status Lifecycle

```
┌─────────────┐
│   (none)    │
└──────┬──────┘
       │ createJob()
       ▼
┌─────────────┐
│   pending   │
└──────┬──────┘
       │ startProcessing()
       ▼
┌─────────────┐
│   running   │
└──────┬──────┘
       │
       ├─────────────────┬──────────────────┐
       │ completeJob()   │ failJob()        │ cancelJob()
       ▼                 ▼                  ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  completed  │   │   failed    │   │  cancelled  │
└─────────────┘   └─────────────┘   └─────────────┘
```

### Valid Transitions

| From | To | Trigger |
|------|-----|---------|
| (none) | pending | Job creation |
| pending | running | Task handler starts |
| running | completed | Processing succeeds |
| running | failed | Processing fails / timeout |
| pending | cancelled | User cancellation |
| running | cancelled | User cancellation |

## Operations

### Create Job

**Trigger**: HTTP endpoint `startTransformPipeline`
**Inputs**: sessionId, stepId
**Outputs**: jobId

**Steps**:
1. Fetch session document
2. Validate session exists and has no active job
3. Fetch experience and transform config
4. Create job document with snapshot
5. Update session with jobId and jobStatus='pending'
6. Queue Cloud Task
7. Return jobId

### Start Processing

**Trigger**: Cloud Task `transformPipelineJob`
**Inputs**: jobId (from task payload)

**Steps**:
1. Fetch job document
2. Validate job status is 'pending'
3. Update job status to 'running', set startedAt
4. Update session jobStatus to 'running'

### Update Progress

**Trigger**: During pipeline execution
**Inputs**: jobId, progress data

**Steps**:
1. Update job progress field
2. Update job updatedAt timestamp

### Complete Job

**Trigger**: Pipeline execution completes successfully
**Inputs**: jobId, output data

**Steps**:
1. Update job status to 'completed'
2. Set job output, completedAt
3. Update session jobStatus to 'completed'

### Fail Job

**Trigger**: Pipeline execution fails or timeout
**Inputs**: jobId, error data

**Steps**:
1. Update job status to 'failed'
2. Set job error, completedAt
3. Update session jobStatus to 'failed'

## Indexes Required

No new composite indexes required for Phase 2. Existing indexes support:
- Query jobs by projectId
- Query jobs by sessionId

## Validation Rules

### Job Creation

- Session MUST exist
- Session MUST NOT have an active job (jobStatus = 'pending' | 'running')
- Experience MUST have a transform configuration

### Status Transitions

- Only valid transitions as defined above
- Cannot transition from terminal states (completed, failed, cancelled)

## Error Codes

From existing `jobErrorSchema`:

| Code | Description | Retryable |
|------|-------------|-----------|
| INVALID_INPUT | Invalid session or transform config | No |
| PROCESSING_FAILED | Generic processing failure | No |
| AI_MODEL_ERROR | AI service error | No |
| STORAGE_ERROR | Storage read/write failure | No |
| TIMEOUT | Job exceeded 10-minute limit | No |
| CANCELLED | Job was cancelled by user | No |
| UNKNOWN | Unexpected error | No |

Note: All errors are non-retryable per spec (D9 - no retries).
