# Implementation Plan: Error Capture & Safety Filter Reporting

**Branch**: `090-error-capture-safety-filters` | **Date**: 2026-03-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/090-error-capture-safety-filters/spec.md`

## Summary

Improve error visibility across the AI generation pipeline by: (1) capturing safety filter reasons from Google Veo and Gemini API responses, (2) classifying errors with specific codes instead of generic `PROCESSING_FAILED`, (3) propagating error codes to session documents for frontend access, and (4) showing differentiated guest-facing error messages on the share page.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: `@google/genai` v1.38.0 (Veo + Gemini APIs), Firebase Admin SDK, Firebase Client SDK, Zod 4.1.12, React 19, TanStack Start
**Storage**: Firebase Firestore (job and session documents)
**Testing**: Vitest (shared package), manual verification (functions + frontend)
**Target Platform**: Firebase Cloud Functions v2 (backend), Web browser (frontend)
**Project Type**: Monorepo (functions/, packages/shared/, apps/clementine-app/)
**Performance Goals**: No performance impact — changes are on error paths only
**Constraints**: No breaking changes to existing documents; new fields must be optional with null defaults
**Scale/Scope**: 9 files modified across 3 workspaces

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | N/A | Error messages are text-only, already responsive via ThemedErrorState component |
| II. Clean Code & Simplicity | PASS | Extends existing error infrastructure with minimal new abstractions; one new field per schema, one new error code |
| III. Type-Safe Development | PASS | All new fields use Zod schemas; `AiTransformErrorCode` type extended; no `any` types |
| IV. Minimal Testing Strategy | PASS | Manual verification sufficient for error paths; shared package schema tests cover Zod changes |
| V. Validation Gates | PASS | Will run `pnpm app:check`, `pnpm functions:build`, `pnpm --filter @clementine/shared build` |
| VI. Frontend Architecture | PASS | Share page reads from Firestore session via existing `useSubscribeSession` hook; no new data fetch needed |
| VII. Backend & Firebase | PASS | Admin SDK used for job/session writes; no security rule changes needed |
| VIII. Project Structure | PASS | Changes are within existing files/domains; no new modules or directory restructuring |

**Post-Phase 1 re-check**: No violations. All changes extend existing patterns.

## Project Structure

### Documentation (this feature)

```text
specs/090-error-capture-safety-filters/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output — research findings
├── data-model.md        # Phase 1 output — schema changes
├── quickstart.md        # Phase 1 output — implementation guide
├── contracts/           # Phase 1 output — Firestore schema contracts
│   └── firestore-schemas.md
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
packages/shared/src/schemas/
├── job/
│   └── job.schema.ts              # Add `details` field to jobErrorSchema
└── session/
    └── session.schema.ts          # Add `jobErrorCode` field

functions/src/
├── services/
│   ├── ai/providers/
│   │   └── types.ts               # Extend AiTransformErrorCode + AiTransformError
│   └── transform/operations/
│       ├── aiGenerateVideo.ts      # Capture RAI filter data in extractVideoUri
│       └── aiGenerateImage.ts      # Capture safety metadata in extractImageFromResponse
├── repositories/
│   ├── job.ts                      # Add SAFETY_FILTERED code, update createSanitizedError
│   └── session.ts                  # Extend updateSessionJobStatus with error code
└── tasks/
    └── transformPipelineTask.ts    # Error classification in handleJobFailure

apps/clementine-app/src/domains/guest/
└── containers/
    └── SharePage.tsx               # Differentiated error messages
```

**Structure Decision**: All changes are modifications to existing files across the three workspaces (shared, functions, app). No new files or directories needed beyond the specs documentation.

## Architecture Decisions

### AD-1: Error Classification via `instanceof` Checks

**Approach**: Extend `AiTransformErrorCode` type with `'SAFETY_FILTERED'`. Throw `AiTransformError` instances from generation functions. In `handleJobFailure`, use `instanceof AiTransformError` to determine error type and map `error.code` to sanitized error codes.

**Why**: Follows the project's error-handling standard (use `instanceof` for error type checks). Avoids fragile string matching on error messages. Leverages existing `AiTransformError` class.

**Error code mapping**:
| `AiTransformError.code` | Sanitized Code |
|--------------------------|----------------|
| `SAFETY_FILTERED` | `SAFETY_FILTERED` |
| `API_ERROR` | `AI_MODEL_ERROR` |
| `TIMEOUT` | `TIMEOUT` |
| `INVALID_CONFIG` | `INVALID_INPUT` |
| `INVALID_INPUT_IMAGE` | `INVALID_INPUT` |
| `REFERENCE_IMAGE_NOT_FOUND` | `INVALID_INPUT` |

Fallback for non-`AiTransformError` errors: `PROCESSING_FAILED`.

### AD-2: Safety Filter Metadata via `AiTransformError.metadata`

**Approach**: Add an optional `metadata?: Record<string, unknown>` property to the `AiTransformError` class. Set it before throwing when safety filter data is available. Pass it through to `createSanitizedError` as the `details` parameter.

**Why**: Carries provider-specific data (Veo filter reasons, Gemini safety ratings) from throw site to job document storage without modifying the constructor signature or creating new error classes.

### AD-3: Session Error Code as Lightweight Reference

**Approach**: Add `jobErrorCode: string | null` to session schema. Write it alongside `jobStatus: 'failed'` in `updateSessionJobStatus`. Read it on the share page to determine which error message to show.

**Why**: Avoids requiring the frontend to fetch the job document (which contains sensitive `details`). The error code alone is sufficient for message differentiation. Keeps the session document lightweight.

### AD-4: Static Error Message Mapping on SharePage

**Approach**: A simple switch/map in `SharePage.tsx` that maps `jobErrorCode` values to predefined title + message strings. Three variants: safety-filtered, timeout, and generic fallback.

**Why**: Three message variants don't warrant a centralized error message service. Keeps the logic co-located with the UI that displays it. Easy to extend later.

## Complexity Tracking

No constitution violations. No complexity justifications needed.
