# Quickstart: Backend Pipeline Infrastructure

**Feature**: 038-pipeline-backend
**Date**: 2026-01-21

## Prerequisites

1. Node.js 20+ and pnpm 10.18.1
2. Firebase CLI installed (`npm install -g firebase-tools`)
3. Firebase emulators running (for local development)
4. Phase 1 schemas implemented in @clementine/shared

## Setup

```bash
# From monorepo root
cd functions

# Install dependencies
pnpm install

# Build shared package (if not already)
pnpm --filter @clementine/shared build
```

## Key Files to Create

> **Warning**: Do NOT use `lib/session.ts` - it uses legacy schema and old Firestore path.
> Create new `lib/session-v2.ts` with the Phase 1 schema.

### 1. Session Helpers: `functions/src/lib/session-v2.ts`

```typescript
import { db } from './firebase-admin';
import { Session, sessionSchema, JobStatus } from '@clementine/shared';

/**
 * Fetch session from /projects/{projectId}/sessions/{sessionId}
 * Uses new schema from Phase 1 (NOT the legacy session.ts)
 */
export async function fetchSession(
  projectId: string,
  sessionId: string
): Promise<Session | null> {
  const doc = await db
    .collection('projects').doc(projectId)
    .collection('sessions').doc(sessionId)
    .get();

  if (!doc.exists) return null;
  return sessionSchema.parse({ id: doc.id, ...doc.data() });
}

export async function updateSessionJobStatus(
  projectId: string,
  sessionId: string,
  jobId: string,
  jobStatus: JobStatus
): Promise<void> {
  await db
    .collection('projects').doc(projectId)
    .collection('sessions').doc(sessionId)
    .update({ jobId, jobStatus, updatedAt: Date.now() });
}
```

### 2. Job Helpers: `functions/src/lib/job.ts`

```typescript
import { db, FieldValue } from './firebase-admin';
import { Job, JobStatus, JobError, JobOutput, JobProgress, jobSchema } from '@clementine/shared';

/**
 * Jobs stored at /projects/{projectId}/jobs/{jobId}
 */
export async function createJob(projectId: string, data: Omit<Job, 'id'>): Promise<string>;
export async function fetchJob(projectId: string, jobId: string): Promise<Job | null>;
export async function updateJobStatus(projectId: string, jobId: string, status: JobStatus): Promise<void>;
export async function updateJobProgress(projectId: string, jobId: string, progress: JobProgress): Promise<void>;
export async function updateJobOutput(projectId: string, jobId: string, output: JobOutput): Promise<void>;
export async function updateJobError(projectId: string, jobId: string, error: JobError): Promise<void>;
```

### 3. HTTP Endpoint: `functions/src/http/startTransformPipeline.ts`

```typescript
import { onRequest } from 'firebase-functions/v2/https';
import { getFunctions } from 'firebase-admin/functions';
import { z } from 'zod';
import { db } from '../lib/firebase-admin';
import { fetchSession, updateSessionJobStatus } from '../lib/session-v2';
import { createJob } from '../lib/job';

// Request schema
const requestSchema = z.object({
  sessionId: z.string().min(1),
  stepId: z.string().min(1),
});

export const startTransformPipeline = onRequest(
  { region: 'europe-west1', cors: true },
  async (req, res) => {
    // Implementation per contract
  }
);
```

### 4. Cloud Task: `functions/src/tasks/transformPipelineJob.ts`

```typescript
import { onTaskDispatched } from 'firebase-functions/v2/tasks';
import { fetchJob, updateJobStatus, updateJobOutput, updateJobError } from '../lib/job';
import { updateSessionJobStatus } from '../lib/session-v2';

export const transformPipelineJob = onTaskDispatched(
  {
    region: 'europe-west1',
    timeoutSeconds: 600, // 10 minutes
    retryConfig: { maxAttempts: 0 },
    rateLimits: { maxConcurrentDispatches: 10 },
  },
  async (req) => {
    // Implementation per contract
  }
);
```

### 5. Export Functions: `functions/src/index.ts`

```typescript
// Add to existing exports
export { startTransformPipeline } from './http/startTransformPipeline';
export { transformPipelineJob } from './tasks/transformPipelineJob';
```

## Development Workflow

```bash
# Build functions
pnpm functions:build

# Start emulators
firebase emulators:start

# Deploy to staging (when ready)
pnpm functions:deploy
```

## Testing

```bash
# Run unit tests
cd functions
pnpm test

# Test HTTP endpoint locally
curl -X POST http://localhost:5001/PROJECT_ID/europe-west1/startTransformPipeline \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test-session", "stepId": "transform-1"}'
```

## Validation Checklist

- [ ] `pnpm functions:build` passes without errors
- [ ] HTTP endpoint returns jobId on success
- [ ] Job document created at `/projects/{projectId}/jobs/{jobId}` with status 'pending'
- [ ] Session updated at `/projects/{projectId}/sessions/{sessionId}` with jobId and jobStatus
- [ ] Cloud Task transitions job to 'running'
- [ ] Stub processing completes job successfully
- [ ] Error handling returns sanitized messages
- [ ] 10-minute timeout configured
- [ ] Tests colocated with source files
- [ ] Using `lib/session-v2.ts` (NOT legacy `lib/session.ts`)

## File Structure (with colocated tests)

```
functions/src/
├── http/
│   ├── startTransformPipeline.ts
│   └── startTransformPipeline.test.ts    # Colocated
├── tasks/
│   ├── transformPipelineJob.ts
│   └── transformPipelineJob.test.ts      # Colocated
└── lib/
    ├── session-v2.ts                     # NEW (not session.ts!)
    ├── session-v2.test.ts                # Colocated
    ├── job.ts
    └── job.test.ts                       # Colocated
```

## Related Documentation

- [spec.md](./spec.md) - Feature specification
- [research.md](./research.md) - Technical decisions
- [data-model.md](./data-model.md) - Entity schemas
- [contracts/](./contracts/) - API contracts
- Pattern reference (POC code, don't reuse directly):
  - `functions/src/http/processMedia.ts`
  - `functions/src/tasks/processMediaJob.ts`
