# Implementation Plan: AI Video Editor v2

**Branch**: `075-ai-video-editor-v2` | **Date**: 2026-02-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/075-ai-video-editor-v2/spec.md`

## Summary

Redesign the AI Video task system with technical task identifiers (`image-to-video`, `ref-images-to-video`), replace `VideoGenerationSection` with `PromptComposer` for @mention support, add reference media for the Remix task, constrain duration to fixed values (4/6/8s), and mark transform/reimagine as "coming soon." Changes span shared schemas, frontend editor components, and the backend executor.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: TanStack Start 1.132.0, React 19, Zod 4.1.12, Firebase SDK 12.5.0, Firebase Cloud Functions v2, `@google/genai` (Veo API)
**Storage**: Firebase Firestore (experience configs), Firebase Storage (media files)
**Testing**: Vitest (shared package), manual validation (frontend/backend)
**Target Platform**: Web (mobile-first), Node.js (Cloud Functions)
**Project Type**: Monorepo (apps/clementine-app, functions/, packages/shared)
**Performance Goals**: Standard web app expectations, video generation < 60s
**Constraints**: Mobile-first UI (44px touch targets), Veo API limits (3 ASSET reference slots)
**Scale/Scope**: ~15 files modified across 3 workspaces

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | PASS | Task selector and PromptComposer already mobile-optimized; duration picker uses standard controls |
| II. Clean Code & Simplicity | PASS | Extending existing PromptComposer rather than creating new component; removing VideoGenerationSection |
| III. Type-Safe Development | PASS | All changes use Zod schemas with strict TypeScript; new `videoDurationSchema` validates at runtime |
| IV. Minimal Testing Strategy | PASS | Schema changes covered by existing shared package tests; add targeted tests for migration transform |
| V. Validation Gates | PASS | Will run `pnpm app:check` and verify against design system standards |
| VI. Frontend Architecture | PASS | Client-first pattern maintained; autosave via existing form infrastructure |
| VII. Backend & Firebase | PASS | Executor changes follow existing patterns; no new security rule changes |
| VIII. Project Structure | PASS | All changes within existing feature module structure; no new directories |

**Post-Phase 1 Re-check**: PASS — No violations introduced by design decisions.

## Project Structure

### Documentation (this feature)

```text
specs/075-ai-video-editor-v2/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A — no new API endpoints)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
packages/shared/
└── src/schemas/experience/
    └── outcome.schema.ts           # Schema changes (task enum, duration, refMedia)

apps/clementine-app/src/domains/experience/create/
├── components/
│   ├── PromptComposer/
│   │   ├── PromptComposer.tsx      # Add modelOptions, duration, hideRefMedia props
│   │   └── ControlRow.tsx          # Add optional duration picker
│   └── ai-video-config/
│       ├── AIVideoTaskSelector.tsx  # New task options + coming soon state
│       ├── AIVideoConfigForm.tsx    # Replace VideoGenerationSection with PromptComposer
│       ├── VideoGenerationSection.tsx  # DELETE (replaced by PromptComposer)
│       └── index.ts                # Remove VideoGenerationSection export
├── hooks/
│   └── useRefMediaUpload.ts        # Add maxCount param
└── lib/
    ├── model-options.ts            # Add DURATION_OPTIONS, MAX_VIDEO_REF_MEDIA_COUNT
    └── outcome-operations.ts       # Update createDefaultAIVideoConfig

functions/src/services/transform/outcomes/
└── aiVideoOutcome.ts               # Task-based routing, pass refMedia to prompt resolution
```

**Structure Decision**: Existing monorepo structure. All changes fit within existing feature modules. No new directories or files needed (one file deleted: `VideoGenerationSection.tsx`).
