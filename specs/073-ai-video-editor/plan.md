# Implementation Plan: AI Video Editor

**Branch**: `073-ai-video-editor` | **Date**: 2026-02-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/073-ai-video-editor/spec.md`

## Summary

Add AI Video configuration UI to the experience designer, enabling admins to fully configure `ai.video` outcomes with three tasks (animate, transform, reimagine). This is a frontend-only change — the backend executor is not implemented until Phase 3. The implementation follows the per-type config architecture from Phase 1, adding new components that mirror the existing AI Image config form pattern.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: TanStack Start 1.132.0, React 19, Zod 4.1.12, shadcn/ui, Radix UI, Lexical (mentions), Zustand
**Storage**: Firebase Firestore (existing `outcome.aiVideo` field in experience document)
**Testing**: Vitest
**Target Platform**: Web (mobile-first, 320px-768px primary viewport)
**Project Type**: Monorepo — pnpm workspace with `apps/clementine-app` (frontend) + `packages/shared` (schemas)
**Performance Goals**: Page load < 2s on 4G, autosave debounce 2000ms
**Constraints**: Mobile-first, 44x44px min touch targets, no backend changes in this phase
**Scale/Scope**: 4 new components, ~8 modified files, 1 shared package export change

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | PASS | All new components follow existing mobile-first patterns (space-y layout, grid cols responsive). Touch targets via shadcn/ui defaults (min 44x44). |
| II. Clean Code & Simplicity | PASS | Follows established patterns — no new abstractions. Each component does one thing. PromptComposer reused, not duplicated. |
| III. Type-Safe Development | PASS | All types from Zod schemas in @clementine/shared. Strict mode. No `any` escapes. Export missing `AIVideoTask` type. |
| IV. Minimal Testing Strategy | PASS | Focus on critical paths: config persistence across task/type switches. Unit tests for outcome operations. |
| V. Validation Gates | PASS | Run `pnpm app:check` + `pnpm app:type-check` before commit. Standards compliance review for UI work. |
| VI. Frontend Architecture | PASS | Client-first. Firebase client SDK for Firestore persistence. No server functions needed. |
| VII. Backend & Firebase | PASS | No backend changes. Existing Firestore write path via `useUpdateOutcome`. |
| VIII. Project Structure | PASS | New components in `domains/experience/create/components/ai-video-config/` following vertical slice. Barrel exports. |

**Post-Phase 1 Re-check**: All gates still pass. No new violations introduced by the design.

## Project Structure

### Documentation (this feature)

```text
specs/073-ai-video-editor/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research decisions
├── data-model.md        # Entity model and relationships
├── quickstart.md        # Developer setup guide
├── contracts/           # Component interface contracts
│   └── component-contracts.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/shared/
└── src/schemas/experience/
    └── outcome.schema.ts              # Export aiVideoTaskSchema/AIVideoTask, add aiVideoModelSchema/AIVideoModel, update videoGenerationConfigSchema

apps/clementine-app/src/domains/experience/create/
├── components/
│   ├── CreateTabForm.tsx              # Add AI Video render branch + handler
│   ├── ai-video-config/              # NEW — AI Video config components
│   │   ├── index.ts                   # Barrel exports
│   │   ├── AIVideoConfigForm.tsx      # Main config form (orchestrator)
│   │   ├── AIVideoTaskSelector.tsx    # Task picker (animate/transform/reimagine)
│   │   ├── VideoGenerationSection.tsx # Video gen fields (prompt, model, duration)
│   │   └── FrameGenerationSection.tsx # Frame image gen section (wraps PromptComposer)
│   ├── outcome-picker/
│   │   ├── OutcomeTypePicker.tsx      # Enable AI Video card
│   │   └── OutcomeTypeSelector.tsx    # Add AI Video toggle
│   └── PromptComposer/
│       └── PromptComposer.tsx         # Add modelOptions prop for flexibility
├── hooks/
│   ├── useOutcomeValidation.ts        # Add AI Video validation
│   └── useRefMediaUpload.ts           # Generalize to accept currentRefMedia
└── lib/
    ├── model-options.ts               # Enable AI Video, add video model constants
    └── outcome-operations.ts          # Add createDefaultAIVideoConfig, update initializeOutcomeType
```

**Structure Decision**: Follows existing vertical slice architecture in `domains/experience/create/`. New AI Video components mirror the `ai-image-config/` directory structure. No new domains or modules — this is an extension of the existing experience create feature.

## Complexity Tracking

No violations. All changes follow established patterns with minimal new complexity.
