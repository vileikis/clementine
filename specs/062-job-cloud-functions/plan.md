# Implementation Plan: Job + Cloud Functions

**Branch**: `062-job-cloud-functions` | **Date**: 2026-02-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/062-job-cloud-functions/spec.md`

## Summary

Update job snapshot schema to capture `outcome` and `sessionResponses` (replacing legacy `sessionInputs`), and implement an outcome-based dispatcher with image outcome executor in Cloud Functions. This replaces the node-based pipeline with an outcome-focused architecture.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: Firebase Cloud Functions v2, Zod 4.x, @google/genai (Vertex AI)
**Storage**: Firebase Firestore, Firebase Storage
**Testing**: Vitest (functions package)
**Target Platform**: Firebase Cloud Functions (Node.js 20)
**Project Type**: Monorepo with `functions/` and `packages/shared/`
**Performance Goals**: Passthrough <5s, AI generation <60s
**Constraints**: Non-retryable errors, immutable job snapshots
**Scale/Scope**: Single image outcome executor (gif/video deferred)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | N/A | Backend-only feature |
| II. Clean Code & Simplicity | PASS | Single-purpose functions, no premature abstraction |
| III. Type-Safe Development | PASS | Zod schemas, strict TypeScript |
| IV. Minimal Testing Strategy | PASS | Unit tests for prompt resolution, integration tests for outcomes |
| V. Validation Gates | PASS | Type-check, lint before commit |
| VI. Frontend Architecture | N/A | Backend-only feature |
| VII. Backend & Firebase | PASS | Admin SDK for writes, follows existing patterns |
| VIII. Project Structure | PASS | Vertical slice in `services/transform/` |

## Project Structure

### Documentation (this feature)

```text
specs/062-job-cloud-functions/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (internal interfaces)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/shared/src/schemas/
├── job/
│   └── job.schema.ts              # MODIFY - Update jobSnapshotSchema

functions/src/
├── repositories/
│   └── job.ts                     # MODIFY - Update buildJobSnapshot()
├── callable/
│   └── startTransformPipeline.ts  # MODIFY - Validate outcome instead of transformNodes
├── tasks/
│   └── transformPipelineJob.ts    # MODIFY - Call runOutcome() instead of executeTransformPipeline()
└── services/transform/
    ├── index.ts                   # MODIFY - Update exports
    ├── types.ts                   # MODIFY - Add OutcomeContext
    ├── pipeline-runner.ts         # DELETE - Replaced by outcome dispatcher
    ├── overlay.ts                 # DELETE - Moved to executors/applyOverlay.ts
    ├── engine/
    │   └── runOutcome.ts          # CREATE - Outcome dispatcher
    ├── outcomes/
    │   └── imageOutcome.ts        # CREATE - Image outcome executor (orchestrates executors)
    ├── executors/
    │   ├── index.ts               # MODIFY - Update exports
    │   ├── ai-image.ts            # DELETE - Replaced by aiGenerateImage.ts
    │   ├── aiGenerateImage.ts     # CREATE - AI image generation (from ai-image.ts)
    │   └── applyOverlay.ts        # CREATE - Overlay application (from overlay.ts)
    └── bindings/
        └── resolvePromptMentions.ts # CREATE - Prompt resolution
```

**Structure Decision**:
- `executors/` = Atomic operations (aiGenerateImage, applyOverlay, future: swapBackground, aiGenerateVideo)
- `outcomes/` = Orchestration logic combining executors
- `engine/` = Dispatcher routing to outcomes
- `bindings/` = Data transformation utilities
- Delete old node-based pipeline files (`pipeline-runner.ts`, `overlay.ts`, `ai-image.ts`)

## Execution Flow

### Job Creation (`startTransformPipeline.ts`)

```
1. Validate request (projectId, sessionId)
2. Fetch session, check no active job
3. Fetch experience
4. NEW: Validate outcome.type !== null (was: transformNodes.length > 0)
5. NEW: Validate passthrough mode has captureStepId
6. Build job snapshot (with sessionResponses + outcome)
7. Create job document
8. Queue Cloud Task
```

### Job Execution (`transformPipelineJob.ts`)

```
1. Validate payload, fetch job (must be pending)
2. Create temp directory, mark job running
3. NEW: Call runOutcome(outcomeContext) (was: executeTransformPipeline)
4. Upload output, generate thumbnail
5. Update session.resultMedia
6. Mark job completed
```

## Complexity Tracking

No complexity violations. The design follows existing patterns and adds minimal new abstractions.
