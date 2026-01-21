# Implementation Plan: Backend Pipeline Infrastructure

**Branch**: `038-pipeline-backend` | **Date**: 2026-01-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/038-pipeline-backend/spec.md`

## Summary

Implement the backend execution infrastructure for the Transform Pipeline feature. This includes an HTTP function (`startTransformPipeline`) to initiate jobs, a Cloud Task handler (`transformPipelineJob`) to execute jobs, job document lifecycle management, and session-job status synchronization. This phase builds the backbone with stub processing (no actual node execution).

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode, ES2020 target)
**Primary Dependencies**: Firebase Functions v2 (7.0.2), Firebase Admin SDK (13.6.0), Zod (4.1.12), @clementine/shared (workspace)
**Storage**: Firestore (jobs collection at `/projects/{projectId}/jobs/{jobId}`)
**Testing**: Vitest (functions workspace)
**Target Platform**: Firebase Cloud Functions (europe-west1), Cloud Tasks
**Project Type**: Monorepo - functions/ workspace
**Performance Goals**: Job ID returned within 3 seconds, status sync within 2 seconds
**Constraints**: 10-minute job timeout, no retries (maxAttempts: 0), sanitized client errors
**Scale/Scope**: MVP - single job per session, sequential node execution

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | N/A | Backend-only feature, no UI |
| II. Clean Code & Simplicity | ✅ PASS | Follow existing patterns in functions/, no new abstractions |
| III. Type-Safe Development | ✅ PASS | Use existing Zod schemas from @clementine/shared, TypeScript strict mode |
| IV. Minimal Testing Strategy | ✅ PASS | Unit tests for job lifecycle, integration tests for HTTP/Task handlers |
| V. Validation Gates | ✅ PASS | Run `pnpm functions:build` before commit |
| VI. Frontend Architecture | N/A | Backend-only feature |
| VII. Backend & Firebase | ✅ PASS | Admin SDK for writes, follow processMedia.ts and processMediaJob.ts patterns |
| VIII. Project Structure | ✅ PASS | New files in functions/src/http/, functions/src/tasks/, functions/src/lib/ |

**Standards to verify**:
- `backend/firebase-functions.md` - Cloud Functions patterns
- `backend/firestore.md` - Firestore operations
- `global/code-quality.md` - Validation workflows

## Project Structure

### Documentation (this feature)

```text
specs/038-pipeline-backend/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── start-transform-pipeline.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
functions/
├── src/
│   ├── index.ts                              # Export new functions
│   ├── http/
│   │   ├── processMedia.ts                   # Existing (legacy POC, pattern reference only)
│   │   ├── startTransformPipeline.ts         # NEW: HTTP endpoint
│   │   └── startTransformPipeline.test.ts    # NEW: Colocated test
│   ├── tasks/
│   │   ├── processMediaJob.ts                # Existing (legacy POC, pattern reference only)
│   │   ├── transformPipelineJob.ts           # NEW: Cloud Task handler
│   │   └── transformPipelineJob.test.ts      # NEW: Colocated test
│   └── lib/
│       ├── firebase-admin.ts                 # Existing: db, FieldValue
│       ├── session.ts                        # LEGACY: Uses old schema, DO NOT USE
│       ├── session-v2.ts                     # NEW: Session helpers with new schema/path
│       ├── session-v2.test.ts                # NEW: Colocated test
│       ├── job.ts                            # NEW: Job helpers
│       ├── job.test.ts                       # NEW: Colocated test
│       └── schemas/
│           └── transform-pipeline.schema.ts  # NEW: Request schemas

packages/shared/
└── src/schemas/
    ├── job/
    │   ├── job.schema.ts                     # Existing from Phase 1
    │   └── job-status.schema.ts              # Existing from Phase 1
    └── session/
        ├── session.schema.ts                 # Existing from Phase 1 (new schema)
        └── session.schemas.legacy.ts         # LEGACY: Used by old POC code
```

**Structure Decision**:
- Tests colocated with source files (not in separate tests/ directory)
- New `lib/project-session.ts` for session operations using new schema and path (`/projects/{projectId}/sessions/{sessionId}`)
- Do NOT reuse `lib/session.ts` - it uses legacy schema and old Firestore path
- Jobs stored at `/projects/{projectId}/jobs/{jobId}` (nested under projects for natural scoping)

## Complexity Tracking

> No constitution violations. All gates pass.
