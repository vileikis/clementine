# Research: Backend Pipeline Infrastructure

**Feature**: 038-pipeline-backend
**Date**: 2026-01-21

## Overview

Phase 2 of Transform Pipeline builds the execution backbone using Firebase Cloud Functions. All unknowns were resolved through codebase exploration - existing patterns provide clear guidance.

## Research Topics

### 1. HTTP Function Pattern

**Decision**: Follow `processMedia.ts` pattern using `onRequest` from firebase-functions/v2/https

**Rationale**:
- Consistent with existing codebase patterns
- Proven pattern for session-based operations
- Includes Zod validation, error handling, and Cloud Task queuing

**Existing Pattern Reference**: `functions/src/http/processMedia.ts`

```typescript
export const processMedia = onRequest(
  { region: 'europe-west1', cors: true },
  async (req, res) => {
    // Validate → Fetch → Business Logic → Queue Task → Update → Response
  }
);
```

**Alternatives Considered**:
- `onCall` (Callable functions) - Rejected: Less control over request/response format
- Direct Cloud Task invocation - Rejected: No HTTP entry point for client

---

### 2. Cloud Task Handler Pattern

**Decision**: Follow `processMediaJob.ts` pattern using `onTaskDispatched` from firebase-functions/v2/tasks

**Rationale**:
- Consistent with existing media processing pipeline
- Supports configuration for retries, rate limits, and secrets
- Matches spec requirement: no retries (`maxAttempts: 0`)

**Existing Pattern Reference**: `functions/src/tasks/processMediaJob.ts`

```typescript
export const processMediaJob = onTaskDispatched(
  {
    region: 'europe-west1',
    retryConfig: { maxAttempts: 0, minBackoffSeconds: 30 },
    rateLimits: { maxConcurrentDispatches: 10 },
  },
  async (req) => { /* ... */ }
);
```

**Alternatives Considered**:
- Cloud Run Jobs - Rejected: More complex setup, not needed for this use case
- Pub/Sub trigger - Rejected: Less control over payload structure

---

### 3. Job Document Collection Path

**Decision**: `/projects/{projectId}/jobs/{jobId}` (nested under projects)

**Rationale**:
- **Natural query scoping**: Project-scoped queries don't need composite indexes
- **Safer queries**: Impossible to accidentally query all jobs across all projects
- **Consistent pattern**: Matches `/projects/{projectId}/sessions/{sessionId}`
- **Simpler security rules**: Project membership verified via path, not document field lookup
- **Guest subscription**: Still works - session has both `projectId` and `jobId`

**Query Comparison**:
```typescript
// Nested (chosen) - naturally scoped
db.collection('projects').doc(projectId).collection('jobs').get()

// Root level - needs filter, risk of unfiltered query
db.collection('jobs').where('projectId', '==', projectId).get()
```

**Scale consideration**: ~100k jobs per project is well within Firestore limits for either approach. Performance is identical - Firestore uses indexes regardless of path depth.

**Alternatives Considered**:
- Root `/jobs/{jobId}` - Rejected: Risk of unfiltered queries, inconsistent with sessions
- Subcollection of session - Rejected: Jobs are project-level resources

---

### 4. Session Helpers: New Module Required

**Decision**: Create new `lib/session-v2.ts` instead of reusing `lib/session.ts`

**Rationale**:
The existing `functions/src/lib/session.ts` has two incompatibilities:
1. Uses legacy schema (`session.schemas.legacy.ts`)
2. Uses old Firestore path (`/sessions/{id}` instead of `/projects/{projectId}/sessions/{sessionId}`)

This exists because `processMedia.ts` and `processMediaJob.ts` were POC code built before the Phase 1 schema updates.

**Implementation**:
```typescript
// NEW: lib/session-v2.ts
import { Session } from '@clementine/shared' // New schema

export async function fetchSession(
  projectId: string,
  sessionId: string
): Promise<Session | null> {
  const doc = await db
    .collection('projects').doc(projectId)
    .collection('sessions').doc(sessionId)
    .get()
  // ...
}
```

**Alternatives Considered**:
- Reuse `lib/session.ts` - Rejected: Wrong schema and path
- Migrate `lib/session.ts` - Rejected: Out of scope, risks breaking POC code
- Inline session fetches - Rejected: Code duplication across handlers

---

### 5. Session-Job Synchronization

**Decision**: Write-through pattern - update session.jobId and session.jobStatus on every job state change

**Rationale**:
- Client already subscribes to session document
- Avoids need for separate job subscription
- Matches spec FR-003, FR-005

**Implementation**:
```typescript
// On job creation
await sessionRef.update({ jobId, jobStatus: 'pending' });

// On status change
await sessionRef.update({ jobStatus: newStatus });
```

**Alternatives Considered**:
- Client subscribes to job document directly - Rejected: Additional subscription complexity
- Batch writes only at completion - Rejected: Client needs real-time status

---

### 6. Timeout Enforcement

**Decision**: Cloud Task timeout configuration (10 minutes = 600 seconds)

**Rationale**:
- Spec FR-009 requires 10-minute timeout
- Cloud Tasks natively support timeout
- On timeout, mark job as failed with TIMEOUT error code

**Implementation**:
```typescript
export const transformPipelineJob = onTaskDispatched(
  {
    region: 'europe-west1',
    timeoutSeconds: 600, // 10 minutes
    retryConfig: { maxAttempts: 0 },
  },
  async (req) => { /* ... */ }
);
```

**Alternatives Considered**:
- Application-level timeout - Rejected: Cloud Tasks handles this better
- Shorter timeout with retries - Rejected: Spec says no retries (D9)

---

### 7. Error Handling & Sanitization

**Decision**: Log full details server-side, return sanitized error codes to client

**Rationale**:
- Spec FR-008: detailed server logs, sanitized client messages
- Decision D6: Sanitized errors prevent prompt/config leakage
- Decision D29: Friendly error UX

**Implementation**:
```typescript
// Job error schema (from @clementine/shared)
const jobErrorSchema = z.object({
  code: z.enum(['INVALID_INPUT', 'PROCESSING_FAILED', 'AI_MODEL_ERROR', 'STORAGE_ERROR', 'TIMEOUT', 'CANCELLED', 'UNKNOWN']),
  message: z.string(), // Sanitized message for client
  step: z.string().nullable(), // Which node failed
  isRetryable: z.boolean(),
  timestamp: z.number(),
});
```

**Alternatives Considered**:
- Full error passthrough - Rejected: Security risk (prompt leakage)
- No client error details - Rejected: Poor debugging experience for admins

---

### 8. Stub Processing Implementation

**Decision**: Simulate success after short delay, no actual node execution

**Rationale**:
- Spec FR-015: Support stub processing for infrastructure validation
- Allows testing full lifecycle without AI/image processing
- Phase 5-7 will add actual node executors

**Implementation**:
```typescript
async function executeStubPipeline(job: Job): Promise<void> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mark complete with stub output
  await updateJobOutput(job.id, {
    assetId: 'stub-asset',
    url: 'https://placeholder.com/stub.png',
    format: 'image',
    // ... other fields
  });
}
```

**Alternatives Considered**:
- Skip job execution entirely - Rejected: Need to test full lifecycle
- Use real AI processing - Rejected: Out of scope for Phase 2

---

## Dependencies Verified

| Dependency | Version | Purpose |
|------------|---------|---------|
| firebase-functions | 7.0.2 | Cloud Functions v2 API |
| firebase-admin | 13.6.0 | Firestore Admin SDK |
| @clementine/shared | workspace | Job/Session schemas |
| zod | 4.1.12 | Runtime validation |

## Patterns Verified

| Pattern | Source File | Applicable To | Notes |
|---------|-------------|---------------|-------|
| HTTP Function | `functions/src/http/processMedia.ts` | `startTransformPipeline` | Pattern only, POC code |
| Cloud Task | `functions/src/tasks/processMediaJob.ts` | `transformPipelineJob` | Pattern only, POC code |
| Session Helpers | `functions/src/lib/session.ts` | ❌ DO NOT USE | Legacy schema/path |
| Firebase Admin | `functions/src/lib/firebase-admin.ts` | Firestore operations | Reuse directly |

**New modules to create**:
- `functions/src/lib/session-v2.ts` - Session helpers with new schema/path
- `functions/src/lib/job.ts` - Job CRUD helpers

## Conclusion

All NEEDS CLARIFICATION items resolved. Proceed to Phase 1 (Design & Contracts) using established patterns from existing codebase.
