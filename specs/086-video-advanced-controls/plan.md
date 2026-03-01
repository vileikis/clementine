# Implementation Plan: AI Video Advanced Controls

**Branch**: `086-video-advanced-controls` | **Date**: 2026-02-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/086-video-advanced-controls/spec.md`

## Summary

Add four advanced video controls to the AI video configuration form. **Resolution, Sound, and Enhance** are integrated into the PromptComposer's ControlRow using the existing modality system. **Negative Prompt** is a standalone textarea rendered below the PromptComposer in AIVideoConfigForm. All four map directly to existing Veo API parameters (`resolution`, `negativePrompt`, `generateAudio`, `enhancePrompt`). The implementation extends the shared `VideoGenerationConfig` schema with four new defaulted fields, extends `ModalitySupports` with a `resolution` flag, flips `sound`/`enhance` to `true` for video, and updates the backend `buildVeoParams` to pass the new parameters through. Resolution options filter dynamically based on the selected model (fast model: 720p/1080p only).

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: TanStack Start 1.132.0, React 19, Zod 4.1.12, shadcn/ui, `@google/genai` v1.38.0
**Storage**: Firebase Firestore (experience config documents, job snapshots)
**Testing**: Vitest
**Target Platform**: Web (mobile-first), Firebase Cloud Functions (Node.js)
**Project Type**: Web application (monorepo: frontend + backend + shared)
**Performance Goals**: No new performance requirements — advanced controls add negligible overhead to existing video generation flow
**Constraints**: Resolution options must be model-aware (fast model excludes 4K); negative prompt max 500 chars
**Scale/Scope**: ~8 files modified/created across 3 workspaces (shared, app, functions)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --------- | ------ | ----- |
| I. Mobile-First Design | PASS | Controls integrated into existing ControlRow (inline selects/toggles). Touch targets use existing shadcn/ui components that meet 44x44px minimum. Negative prompt textarea below PromptComposer. |
| II. Clean Code & Simplicity | PASS | Four flat fields added to existing schema. Leverages existing modality system (flip flags + extend ControlRow). No new abstractions or wrapper components. |
| III. Type-Safe Development | PASS | New fields are Zod-validated with strict enum/boolean types. No `any` escapes. Runtime validation via shared schema. |
| IV. Minimal Testing Strategy | PASS | Schema validation tests for new fields. No E2E tests needed. |
| V. Validation Gates | PASS | Will run `pnpm app:check` and type-check before completion. Standards compliance review planned. |
| VI. Frontend Architecture | PASS | Client-first pattern preserved. New controls are purely form state — no new server-side logic in frontend. |
| VII. Backend & Firebase | PASS | No Firestore rule changes needed. New fields are part of existing experience config structure. Backend reads from job snapshot (existing Admin SDK pattern). |
| VIII. Project Structure | PASS | Changes span existing files in `PromptComposer/`, `ai-video-config/`, and `lib/`. No new directories. Follows vertical slice architecture. |

**Post-Phase 1 Re-check**: PASS — No design decisions introduced complexity violations. All changes are additive to existing patterns.

## Project Structure

### Documentation (this feature)

```text
specs/086-video-advanced-controls/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Veo API research, schema strategy, UI patterns
├── data-model.md        # Phase 1: VideoGenerationConfig extension
├── quickstart.md        # Phase 1: Dev onboarding guide
├── contracts/
│   └── veo-params-extension.md  # Phase 1: Schema → Veo API mapping
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
packages/shared/
└── src/schemas/experience/
    └── experience-config.schema.ts    # MODIFY: Add videoResolutionSchema, extend videoGenerationConfigSchema

apps/clementine-app/src/domains/experience/create/
├── lib/
│   ├── modality-definitions.ts        # MODIFY: Add resolution to ModalitySupports, flip sound/enhance to true for VIDEO_MODALITY
│   ├── model-options.ts               # MODIFY: Add RESOLUTION_OPTIONS, MODEL_RESOLUTION_MAP
│   └── experience-config-operations.ts # MODIFY: Update createDefaultAIVideoConfig()
├── components/PromptComposer/
│   ├── ControlRow.tsx                 # MODIFY: Render resolution selector, sound toggle, enhance toggle based on modality flags
│   └── PromptComposerContext.tsx      # MODIFY: Add resolution/sound/enhance to ModalityControlValues
└── components/ai-video-config/
    └── AIVideoConfigForm.tsx          # MODIFY: Add negative prompt textarea below PromptComposer, wire model-resolution coupling

functions/src/services/transform/
├── operations/
│   └── aiGenerateVideo.ts             # MODIFY: Extend GenerateVideoRequest, update buildVeoParams
└── outcomes/
    └── aiVideoOutcome.ts              # MODIFY: Pass new fields to GenerateVideoRequest
```

**Structure Decision**: Existing monorepo structure (web application pattern). All changes fit within established files — no new files or directories needed. Resolution, Sound, and Enhance extend the existing ControlRow via the modality system. Negative prompt is a simple textarea added to AIVideoConfigForm.

## Complexity Tracking

No constitution violations. All changes are additive to existing patterns.
