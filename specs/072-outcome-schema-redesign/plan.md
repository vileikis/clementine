# Implementation Plan: Outcome Schema Redesign — Photo & AI Photo

**Branch**: `072-outcome-schema-redesign` | **Date**: 2026-02-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/072-outcome-schema-redesign/spec.md`

## Summary

Refactor the outcome system from a flat, conditional schema (`type` + `aiEnabled` + top-level fields) to a per-type config architecture (`type` + nullable config objects per type). Deliver full-stack support for `photo` and `ai.photo` outcome types. Split the existing `imageOutcome` executor into `photoOutcome` and `aiPhotoOutcome`. Migrate existing Firestore documents. Update the editor UI with type picker, type-specific config forms, and type switching.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: Zod 4.1.12 (shared schemas), TanStack Start 1.132.0 + React 19 (frontend), Firebase Cloud Functions v2 (backend), Lexical (prompt editor)
**Storage**: Firestore (experience documents, job documents), Firebase Storage (media files)
**Testing**: Vitest (shared package), manual E2E verification
**Target Platform**: Web (mobile-first guest experience, desktop creator dashboard)
**Project Type**: pnpm monorepo — `packages/shared`, `apps/clementine-app`, `functions`
**Performance Goals**: No regression from current — autosave debounce 2s, AI generation < 60s
**Constraints**: Coordinated deployment (schema + frontend + backend + migration must deploy together)
**Scale/Scope**: ~15 files modified, ~5 new files, 1 migration script

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | PASS | Output type picker and config forms are within the existing mobile-optimized editor layout. No new pages or viewports. |
| II. Clean Code & Simplicity | PASS | Per-type config is simpler than conditional flat schema. Each executor handles one flow. No new abstractions — reuses existing patterns. |
| III. Type-Safe Development | PASS | Zod schemas define all new types. Strict TypeScript. Runtime validation at schema boundaries. `z.looseObject()` for migration compatibility. |
| IV. Minimal Testing Strategy | PASS | Shared package Zod schemas tested with Vitest. Backend executors tested via manual E2E. No new E2E framework needed. |
| V. Validation Gates | PASS | Will run `pnpm app:check`, type-check, and shared package tests before completion. Standards review for design system, project structure, and Firestore patterns. |
| VI. Frontend Architecture | PASS | Client-first pattern preserved. Autosave via TanStack Query mutations. No SSR changes. |
| VII. Backend & Firebase | PASS | Cloud Functions updated. Firestore documents read/written via existing patterns. Admin SDK for migration script only. |
| VIII. Project Structure | PASS | All changes within existing domain modules (`experience/create`, `transform/outcomes`). No new domains or modules. Barrel exports maintained. |

**Post-Phase 1 re-check**: All gates still pass. No new complexity violations introduced.

## Project Structure

### Documentation (this feature)

```text
specs/072-outcome-schema-redesign/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research output
├── data-model.md        # Phase 1 data model
├── quickstart.md        # Phase 1 quickstart guide
├── contracts/           # Phase 1 contracts
│   ├── outcome-schema.md
│   ├── outcome-executors.md
│   └── frontend-components.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
packages/shared/src/schemas/
├── experience/
│   ├── outcome.schema.ts          # REWRITE — new per-type config schema
│   ├── experience.schema.ts       # UPDATE — use new outcomeSchema
│   └── index.ts                   # UPDATE — new exports
└── media/
    ├── aspect-ratio.schema.ts     # NO CHANGE
    └── media-reference.schema.ts  # NO CHANGE

apps/clementine-app/src/domains/experience/
├── create/
│   ├── components/
│   │   ├── CreateTabForm/
│   │   │   ├── CreateTabForm.tsx      # REWRITE — conditional rendering by type
│   │   │   ├── OutcomeTypePicker.tsx   # REWRITE — two-group layout with coming soon
│   │   │   ├── OutcomeTypeSelector.tsx # UPDATE — new type options
│   │   │   ├── PhotoConfigForm.tsx     # NEW — photo config form
│   │   │   ├── AIPhotoConfigForm.tsx   # NEW — ai photo config form
│   │   │   ├── TaskSelector.tsx        # NEW — t2i/i2i toggle
│   │   │   ├── SourceImageSelector.tsx # NO CHANGE
│   │   │   ├── AspectRatioSelector.tsx # NO CHANGE
│   │   │   ├── AIGenerationToggle.tsx  # DELETE — replaced by type system
│   │   │   └── RemoveOutcomeAction.tsx # MINOR UPDATE — terminology
│   │   └── PromptComposer/            # NO CHANGE (entire directory)
│   ├── hooks/
│   │   ├── useUpdateOutcome.ts        # UPDATE — new mutation payload shape
│   │   ├── useOutcomeValidation.ts    # REWRITE — validate per-type configs
│   │   └── useRefMediaUpload.ts       # MINOR UPDATE — read from aiPhoto config
│   └── lib/
│       ├── outcome-operations.ts      # REWRITE — per-type config operations
│       └── model-options.ts           # MINOR UPDATE — new type constants
├── shared/
│   ├── schemas/
│   │   └── index.ts                   # UPDATE — re-export new schema types
│   └── lib/
│       └── outcome-validation.ts      # UPDATE — validate per-type configs

functions/src/
├── callable/
│   └── startTransformPipeline.ts      # UPDATE — read new schema, build snapshot
├── services/transform/
│   ├── engine/
│   │   └── runOutcome.ts              # UPDATE — new registry with 5 types
│   ├── outcomes/
│   │   ├── imageOutcome.ts            # DELETE — split into photo + aiPhoto
│   │   ├── photoOutcome.ts            # NEW — passthrough executor
│   │   └── aiPhotoOutcome.ts          # NEW — AI generation executor
│   ├── operations/                    # NO CHANGE (entire directory)
│   └── types.ts                       # NO CHANGE
├── repositories/
│   └── job.ts                         # MINOR UPDATE — snapshot shape
└── scripts/migrations/
    └── 072-outcome-schema-redesign.ts # NEW — migration script

packages/shared/src/schemas/job/
└── job.schema.ts                      # UPDATE — jobSnapshotSchema uses new outcomeSchema
```

**Structure Decision**: All changes follow existing monorepo structure. No new domains, modules, or architectural patterns introduced. Changes are localized within the `experience` domain (frontend) and `transform` service (backend).

## Complexity Tracking

No complexity violations. All changes follow existing patterns and stay within established architecture.
