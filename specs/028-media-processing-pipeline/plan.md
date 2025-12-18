# Implementation Plan: Media Processing Pipeline (Stage 1)

**Branch**: `028-media-processing-pipeline` | **Date**: 2025-12-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/028-media-processing-pipeline/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a basic media processing pipeline that accepts single images and multi-frame bursts (inputAssets array from session) and produces final outputs (image, GIF, or MP4 video) using FFmpeg. Processing is triggered via Cloud Function HTTP endpoint, executed asynchronously via Cloud Tasks, and results are stored in Firebase Storage with session document updates. Stage 1 focuses on passthrough processing (no AI transformations, overlays, or background removal) with configurable aspect ratios (square: 1080x1080, story: 1080x1920).

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20.x runtime for Cloud Functions v2)
**Primary Dependencies**: Firebase Cloud Functions v2, Firestore Admin SDK, Cloud Tasks, FFmpeg (via fluent-ffmpeg + ffmpeg-static)
**Storage**: Firebase Firestore (session documents with processing state), Firebase Storage (input assets, output media)
**Testing**: Jest unit tests for processing logic, validation functions, and error handling
**Target Platform**: Google Cloud Functions v2 (Gen 2, Node.js 20 runtime)
**Project Type**: Backend service within monorepo (`functions/` workspace)
**Performance Goals**: Single image <10s (p90), 4-frame GIF <30s (p90), 4-frame video <45s (p90)
**Constraints**: Cloud Functions timeout 30min (1800s), temp storage in /tmp limited, processing idempotency required
**Scale/Scope**: Concurrent processing for 10+ sessions, retry logic (max 3 attempts), comprehensive logging for debugging

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: N/A - This is a backend processing service with no UI components
- [x] **Clean Code & Simplicity**: YAGNI applied - only implementing Stage 1 passthrough processing, no AI transformations or overlays. Single responsibility maintained: one module for FFmpeg processing, separate Cloud Function endpoints for HTTP trigger vs async job execution
- [x] **Type-Safe Development**: TypeScript strict mode throughout, Zod validation for API request body (sessionId, outputFormat, aspectRatio), strongly typed interfaces for PipelineConfig, SessionOutputs, ProcessingState
- [x] **Minimal Testing Strategy**: Jest unit tests for pipeline configuration logic, FFmpeg command generation, session state updates, error handling. Tests co-located in `functions/src/services/media-pipeline/` with `*.test.ts` files
- [x] **Validation Loop Discipline**: Implementation plan includes validation tasks (lint, type-check, test) before marking feature complete
- [x] **Firebase Architecture Standards**: Admin SDK used exclusively for all Firestore reads/writes (sessions), Storage operations (upload/download), FieldValue.serverTimestamp() for timestamps, public URLs stored in session.outputs
- [x] **Feature Module Architecture**: N/A - This feature lives in `functions/` workspace (Cloud Functions), not `web/src/features/`. Feature module architecture applies to Next.js app features only
- [x] **Technical Standards**: Backend standards reviewed (`backend/firebase.md`, `backend/api.md`), global standards applied (`tech-stack.md`, `coding-style.md`, `validation.md`, `error-handling.md`)

**Complexity Violations**: None. This is a straightforward backend processing service using standard Firebase Cloud Functions v2 patterns with FFmpeg for media manipulation.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
functions/
├── src/
│   ├── http/
│   │   └── processMedia.ts              # HTTP Cloud Function - queue processing job
│   ├── tasks/
│   │   └── processMediaJob.ts           # Cloud Task handler - execute processing
│   ├── services/
│   │   └── media-pipeline/
│   │       ├── index.ts                 # Public API exports
│   │       ├── pipeline.ts              # Main pipeline orchestration
│   │       ├── pipeline.test.ts         # Pipeline unit tests
│   │       ├── config.ts                # Pipeline configuration (aspect ratios, formats)
│   │       ├── ffmpeg.ts                # FFmpeg operations (scale, crop, gif, video)
│   │       ├── ffmpeg.test.ts           # FFmpeg unit tests
│   │       ├── storage.ts               # Storage operations (download, upload)
│   │       └── session.ts               # Session state management
│   └── lib/
│       ├── firebase-admin.ts            # Admin SDK initialization
│       └── schemas/
│           └── media-pipeline.schema.ts # Zod validation schemas
└── package.json

web/
├── src/
│   └── features/
│       └── guest/                       # Future integration point
│           └── actions/
│               └── guests.actions.ts    # Server Action to trigger processMedia (future)
```

**Structure Decision**: Backend-focused implementation in `functions/` workspace using Cloud Functions v2. Media processing logic isolated in `services/media-pipeline/` module with co-located tests. HTTP endpoint and Cloud Task handler are thin wrappers that delegate to pipeline service. Web integration (Server Action to call Cloud Function) is out of scope for Stage 1 but structure anticipates future connection.

## Complexity Tracking

No complexity violations - Constitution Check passed cleanly.

---

## Planning Status

**Phase 0: Research** ✅ Complete
- Research findings documented in `research.md` covering FFmpeg, Cloud Tasks, and Firebase Storage best practices
- All technical unknowns resolved with concrete implementation decisions

**Phase 1: Design & Contracts** ✅ Complete
- Data model documented in `data-model.md` with Firestore schemas and type definitions
- API contracts defined in `contracts/processMedia.openapi.yaml` with request/response specs
- Quick start guide created in `quickstart.md` with setup and testing instructions
- Agent context updated with new technologies

**Phase 2: Task Generation** ⏭️ Next Step
- Run `/speckit.tasks` command to generate implementation tasks from this plan

**Constitution Re-Check** ✅ Passed
All principles remain compliant post-design:
- Clean Code & Simplicity: Using proven libraries (fluent-ffmpeg, Cloud Tasks), no over-engineering
- Type-Safe Development: Zod schemas for all external inputs, TypeScript strict mode
- Firebase Architecture: Admin SDK for all operations, public URLs for outputs
- No new complexity violations introduced
