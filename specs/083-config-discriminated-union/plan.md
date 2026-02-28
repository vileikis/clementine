# Implementation Plan: Experience Config Discriminated Union

**Branch**: `083-config-discriminated-union` | **Date**: 2026-02-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/083-config-discriminated-union/spec.md`

## Summary

Refactor `ExperienceConfig` from a flat object with 5 nullable type-specific fields into a Zod discriminated union keyed on `type`. Remove top-level `experience.type`, introduce denormalized `draftType` query field. Each config variant (survey, photo, ai.image, ai.video, gif, video) becomes self-describing, enabling TypeScript type narrowing and eliminating manual structural validation. A one-time migration script transforms existing Firestore documents.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: Zod 4.1.12, Firebase SDK 12.5.0, TanStack Query 5.66.5, TanStack Start 1.132.0
**Storage**: Firebase Firestore (NoSQL) — `/workspaces/{wId}/experiences/{eId}`
**Testing**: Vitest (unit tests for schema parsing, migration logic)
**Target Platform**: Web (TanStack Start app) + Firebase Cloud Functions v2 (Node.js)
**Project Type**: Monorepo (apps/clementine-app + functions + packages/shared)
**Performance Goals**: No performance regression — pure schema refactor
**Constraints**: Pre-launch, one-time migration acceptable. Firestore 500 batch write limit.
**Scale/Scope**: ~20 files across 3 workspaces (shared, app, functions). ~100 existing experience documents.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | N/A | Schema refactor, no UI layout changes |
| II. Clean Code & Simplicity | PASS | Reduces complexity — eliminates nullable field pattern and manual structural validation |
| III. Type-Safe Development | PASS | Core goal — discriminated union enables compile-time type narrowing, eliminates null-checks |
| IV. Minimal Testing | PASS | Unit tests for schema parsing + migration script |
| V. Validation Gates | PASS | `pnpm app:check` + `pnpm app:type-check` must pass |
| VI. Frontend Architecture | PASS | Client-first pattern unchanged, all writes remain client-side with Firestore transactions |
| VII. Backend & Firebase | PASS | Firestore document structure updated, security rules unaffected (field-level rules not in use) |
| VIII. Project Structure | PASS | Changes stay within existing domain structure, no new domains or modules |

**Post-Phase 1 Re-check**: All gates still pass. The discriminated union simplifies the data model (Principle II) and strengthens type safety (Principle III). No complexity violations.

## Project Structure

### Documentation (this feature)

```text
specs/083-config-discriminated-union/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Research findings
├── data-model.md        # Phase 1: Data model changes
├── quickstart.md        # Phase 1: Implementation quickstart
└── tasks.md             # Phase 2: Task list (via /speckit.tasks)
```

### Source Code (repository root)

```text
packages/shared/src/schemas/experience/
├── experience.schema.ts          # Experience document schema (remove type, add draftType)
└── experience-config.schema.ts   # Config schemas (add discriminated union variants)

apps/clementine-app/src/domains/experience/
├── shared/
│   ├── hooks/
│   │   ├── useCreateExperience.ts       # Write: set draftType, build discriminated draft
│   │   ├── useDuplicateExperience.ts    # Write: set draftType from source
│   │   └── useWorkspaceExperiences.ts   # Query: filter on draftType
│   ├── lib/
│   │   ├── switchExperienceType.ts      # Write: replace draft with new variant
│   │   ├── config-validation.ts          # Rename from outcome-validation.ts, remove structural checks
│   │   └── updateExperienceConfigField.ts  # No change (sub-field updates)
│   ├── queries/
│   │   └── experience.query.ts          # Query keys: update filter field
│   └── utils/
│       └── config-checks.ts             # Rename from hasTransformConfig.ts, simplify with union
├── create/
│   └── components/
│       ├── CreateTabForm.tsx            # Read: draft.type instead of experience.type
│       └── ExperienceTypeSwitch.tsx     # Read/write: draft.type
├── designer/
│   ├── containers/
│   │   └── StepConfigPanelContainer.tsx # Read: narrow config via draft.type
│   └── hooks/
│       └── usePublishExperience.ts      # Read: draft.type for validation
├── library/
│   ├── containers/
│   │   └── ExperiencesPage.tsx          # Read: draftType for filter
│   └── components/
│       └── ExperienceListItem.tsx       # Read: draftType for badge
└── steps/registry/
    └── step-utils.ts                    # Read: accept type from config

functions/
├── src/
│   ├── callable/startTransformPipeline.ts  # Read: published.type
│   └── repositories/job.ts                 # Read: published.type for snapshot
└── scripts/migrations/
    └── 083-config-discriminated-union.ts    # NEW: one-time migration script

firebase/
└── firestore.indexes.json                   # Replace type → draftType index
```

**Structure Decision**: Existing monorepo structure. Changes span 3 workspaces (shared schemas, app, functions) following the established vertical slice architecture. No new modules or directories needed (except migration script).
