# Implementation Plan: Gemini 3.1 Flash Image Model Support

**Branch**: `085-gemini-3-1-model` | **Date**: 2026-02-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/085-gemini-3-1-model/spec.md`

## Summary

Add `gemini-3.1-flash-image-preview` as a new AI image generation model. This follows the exact pattern established when `gemini-3-pro-image-preview` was added. Changes span three layers: the shared Zod schema (source of truth), the frontend model options (UI dropdown), and the backend region routing (global endpoint).

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: Zod 4.1.12, @google/genai (Vertex AI), TanStack Start 1.132.0, React 19
**Storage**: Firebase Firestore (experience config documents)
**Testing**: Vitest (no existing tests for model schema or model options)
**Target Platform**: Web (pnpm workspace monorepo)
**Project Type**: Web application (monorepo: apps/ + functions/ + packages/shared/)
**Performance Goals**: N/A — no new performance characteristics; inherits existing
**Constraints**: Model requires `global` region (same as gemini-3-pro-image-preview)
**Scale/Scope**: 3 files changed, ~5 lines added total

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | N/A | No UI layout changes — only adds an option to existing dropdown |
| II. Clean Code & Simplicity | Pass | Minimal change following established pattern; no new abstractions |
| III. Type-Safe Development | Pass | Zod enum extension provides compile-time and runtime type safety |
| IV. Minimal Testing Strategy | Pass | No existing tests for model schemas; manual verification sufficient |
| V. Validation Gates | Pass | Will run `pnpm app:check` and `pnpm functions:build` before commit |
| VI. Frontend Architecture | N/A | No architectural changes |
| VII. Backend & Firebase | Pass | Follows existing Vertex AI client initialization pattern |
| VIII. Project Structure | Pass | Changes only to existing files within established structure |

**Gate result: PASS** — No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/085-gemini-3-1-model/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
packages/shared/src/schemas/experience/
└── experience-config.schema.ts    # Add enum value to aiImageModelSchema

apps/clementine-app/src/domains/experience/create/lib/
└── model-options.ts               # Add entry to AI_IMAGE_MODELS array

functions/src/services/transform/operations/
└── aiGenerateImage.ts             # Update getLocationForModel() condition
```

**Structure Decision**: No new files or directories. All changes are additive edits to existing files within the established monorepo structure.
