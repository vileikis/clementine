# Implementation Plan: LLM Models Cleanup & UI Adjustments

**Branch**: `090-llm-models-cleanup` | **Date**: 2026-03-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/090-llm-models-cleanup/spec.md`

## Summary

Remove the deprecated `gemini-3-pro-image-preview` AI image model from all layers of the codebase (shared schemas, backend functions, frontend UI) and hide the "Enhance Prompt" toggle control in the PromptComposer component without deleting its code. This is a cleanup task with no new features — it simplifies the model surface and hides a UI control reserved for future Veo versions.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: TanStack Start 1.132.0, React 19, Firebase Cloud Functions v2, Zod 4.1.12, `@google/genai` v1.38.0, shadcn/ui
**Storage**: Firebase Firestore (experience config documents)
**Testing**: Vitest
**Target Platform**: Web (mobile-first)
**Project Type**: Monorepo (apps/clementine-app, functions, packages/shared)
**Performance Goals**: N/A (cleanup task, no new functionality)
**Constraints**: Must not break existing workflows; must preserve enhance code for reactivation
**Scale/Scope**: ~5 source files modified across 3 workspaces

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --------- | ------ | ----- |
| I. Mobile-First Design | PASS | No UI changes beyond hiding a control; layout must remain correct |
| II. Clean Code & Simplicity | PASS | Removing dead code (deprecated model) aligns with this principle. Hiding enhance via conditional render is simple and reversible |
| III. Type-Safe Development | PASS | Schema enum removal will be type-safe; Zod schema updated accordingly |
| IV. Minimal Testing Strategy | PASS | Verify type-check and lint pass; no new test files needed |
| V. Validation Gates | PASS | Will run `pnpm app:check` and `pnpm app:type-check` before completion |
| VI. Frontend Architecture | PASS | No architectural changes |
| VII. Backend & Firebase | PASS | Removing model reference from backend config; no schema migration needed for Firestore documents |
| VIII. Project Structure | PASS | No structural changes |

**Gate result: PASS** — No violations. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/090-llm-models-cleanup/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (empty — no new contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (files to modify)

```text
packages/shared/src/schemas/experience/
└── experience-config.schema.ts    # Remove from aiImageModelSchema enum

functions/src/services/
├── ai/config.ts                   # Remove from MOCKED_AI_CONFIG
├── ai/providers/types.ts          # Remove from comment
└── transform/operations/
    └── aiGenerateImage.ts         # Remove from getLocationForModel()

apps/clementine-app/src/domains/experience/create/
├── lib/model-options.ts           # Remove from AI_IMAGE_MODELS array
└── components/PromptComposer/
    └── ControlRow.tsx             # Hide enhance control via conditional flag
```

**Structure Decision**: Existing monorepo structure. No new files or directories needed — this is purely a modification/removal task across the three existing workspaces.
