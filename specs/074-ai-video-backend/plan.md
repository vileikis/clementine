# Implementation Plan: AI Video Backend

**Branch**: `074-ai-video-backend` | **Date**: 2026-02-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/074-ai-video-backend/spec.md`

## Summary

Implement the `aiVideoOutcome` executor and `aiGenerateVideo` operation in Firebase Cloud Functions to process AI Video jobs using Google's Veo model via the `@google/genai` SDK. This completes the AI Video pipeline: admins configure `ai.video` outcomes (Phase 2), guests upload photos, and the backend generates animated/transformed/reimagined videos. The implementation follows the established `aiImageOutcome` pattern exactly, adding Veo-specific async polling and multi-stage progress reporting.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: `@google/genai` ^1.38.0 (already installed), Firebase Admin SDK, FFmpeg
**Storage**: Firebase Storage (GCS) for video output + thumbnails, Firestore for job status
**Testing**: Vitest (shared package schema tests), manual E2E testing
**Target Platform**: Firebase Cloud Functions v2 (Node.js 20, linux server)
**Project Type**: Monorepo — backend changes in `functions/`, schema changes in `packages/shared/`
**Performance Goals**: Animate jobs < 5 min, Transform/Reimagine jobs < 8 min
**Constraints**: Cloud Functions v2 max timeout 9 min, Veo polling interval ~15s, video files 5-20MB
**Scale/Scope**: 2 new files, 6 modified files, ~400 lines of new code

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | N/A | Backend-only changes, no UI |
| II. Clean Code & Simplicity | PASS | Follows existing `aiImageOutcome` pattern, no new abstractions beyond what's needed |
| III. Type-Safe Development | PASS | TypeScript strict mode, Zod schemas for all config, no `any` |
| IV. Minimal Testing Strategy | PASS | Schema validation tests + manual E2E. No complex test infrastructure |
| V. Validation Gates | PASS | `pnpm functions:build` for type-check, `pnpm --filter @clementine/shared test` for schema tests |
| VI. Frontend Architecture | N/A | No frontend changes |
| VII. Backend & Firebase | PASS | Uses Admin SDK for elevated ops, standard Storage patterns |
| VIII. Project Structure | PASS | New files follow existing `outcomes/` and `operations/` conventions |

**Pre-design gate**: PASS — no violations.

**Post-design gate**: PASS — no new violations introduced. The `reportProgress` callback addition to `OutcomeContext` is the minimal change needed; existing executors are unaffected.

## Project Structure

### Documentation (this feature)

```text
specs/074-ai-video-backend/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Veo API research, design decisions
├── data-model.md        # Phase 1: Schema changes, entity definitions
├── quickstart.md        # Phase 1: Setup and testing guide
├── contracts/           # Phase 1: API contracts
│   └── ai-video-pipeline.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
packages/shared/
└── src/schemas/experience/
    └── outcome.schema.ts           # MODIFY: videoAspectRatio, duration constraints

functions/
├── src/
│   ├── callable/
│   │   └── startTransformPipeline.ts  # MODIFY: add 'ai.video' to IMPLEMENTED_OUTCOME_TYPES
│   ├── services/transform/
│   │   ├── types.ts                   # MODIFY: add reportProgress to OutcomeContext
│   │   ├── engine/
│   │   │   └── runOutcome.ts          # MODIFY: register aiVideoOutcome in registry
│   │   ├── outcomes/
│   │   │   └── aiVideoOutcome.ts      # NEW: ai.video executor
│   │   └── operations/
│   │       ├── aiGenerateVideo.ts     # NEW: Veo video generation operation
│   │       └── uploadOutput.ts        # MODIFY: support video format/dimensions/extension
│   └── tasks/
│       └── transformPipelineTask.ts   # MODIFY: progress callback, timeout/memory config
└── package.json                       # No changes (genai already installed)
```

**Structure Decision**: This feature fits entirely within the existing `functions/` and `packages/shared/` workspaces. No new projects, directories, or architectural patterns introduced. Two new files (`aiVideoOutcome.ts`, `aiGenerateVideo.ts`) follow the established conventions in `outcomes/` and `operations/`.

## Key Design Decisions

### 1. Veo Output via GCS (R-006)

Veo writes video output to a GCS URI (`config.outputGcsUri`). We'll use a temp prefix in the Firebase Storage bucket (`gs://{bucket}/tmp/veo-outputs/{jobId}/`), download the result locally, then use the standard `uploadOutput` flow. This keeps the upload path consistent with image outcomes.

### 2. Async Polling Pattern (R-001)

`generateVideos()` returns a long-running operation. The executor polls `client.operations.getVideosOperation()` every 15 seconds with a 5-minute max timeout. Progress updates are sent during polling to keep the guest informed.

### 3. Frame Generation Reuse (R-009)

Frame generation (for `transform` and `reimagine` tasks) reuses the existing `aiGenerateImage` operation unchanged. The generated image file path is then passed to `aiGenerateVideo` as a start/end frame. For `reimagine`, both frames are generated in parallel via `Promise.all`.

### 4. Schema Tightening (R-002, R-003)

The shared package schemas are updated to match Veo's actual constraints: aspect ratios `16:9 | 9:16` (drop `1:1`), durations `4 | 6 | 8` (drop arbitrary 1-60 range). Safe to change now since no production configs exist yet.

### 5. Overlay Skipped (R-007)

Overlays are not applied to video output. If `overlayChoice` is set, a warning is logged. This was an explicit product decision to ship the core pipeline faster.

## Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Feature Spec | `specs/074-ai-video-backend/spec.md` | Complete |
| Requirements Checklist | `specs/074-ai-video-backend/checklists/requirements.md` | Complete |
| Research | `specs/074-ai-video-backend/research.md` | Complete |
| Data Model | `specs/074-ai-video-backend/data-model.md` | Complete |
| Contracts | `specs/074-ai-video-backend/contracts/ai-video-pipeline.md` | Complete |
| Quickstart | `specs/074-ai-video-backend/quickstart.md` | Complete |
| Tasks | `specs/074-ai-video-backend/tasks.md` | Complete |
