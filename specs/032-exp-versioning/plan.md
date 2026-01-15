# Implementation Plan: Experience Designer Draft & Publish Versioning

**Branch**: `030-exp-versioning` | **Date**: 2026-01-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/030-exp-versioning/spec.md`

## Summary

Add `draftVersion` and `publishedVersion` fields to the Experience schema to enable reliable change detection in the Experience Designer. Draft updates will use Firestore's atomic `increment()` operation (same pattern as Event Designer). Publishing will sync versions by setting `publishedVersion = draftVersion`. The `EditorChangesBadge` in `ExperienceDesignerLayout` will use actual version numbers instead of the current hard-coded placeholder values.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: TanStack Start 1.132.0, TanStack Query 5.66.5, React 19.2.0, Zod 4.1.12, Firebase SDK 12.5.0
**Storage**: Firebase Firestore (client SDK) - workspace subcollection pattern `/workspaces/{workspaceId}/experiences/{experienceId}`
**Testing**: Vitest 3.0.5 with React Testing Library
**Target Platform**: Web (TanStack Start SSR + Client)
**Project Type**: Web application (monorepo with apps/clementine-app)
**Performance Goals**: Version comparison O(1) vs current deep object comparison O(n)
**Constraints**: Must maintain backward compatibility with existing experiences (no migration required - versions initialize on first edit)
**Scale/Scope**: ~5 files to modify, ~200 lines of changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | N/A | Backend/data layer change, no UI changes |
| II. Clean Code & Simplicity | PASS | Following established Event Designer pattern, no new abstractions |
| III. Type-Safe Development | PASS | Zod schemas with TypeScript strict mode, no `any` types |
| IV. Minimal Testing Strategy | PASS | Unit tests for schema and hook behavior |
| V. Validation Gates | PASS | Will run `pnpm app:check` before commit |
| VI. Frontend Architecture | PASS | Client-first with Firebase client SDK |
| VII. Backend & Firebase | PASS | Using Firestore transactions with atomic increment |
| VIII. Project Structure | PASS | Changes within existing experience domain structure |

**Gate Result**: PASS - No violations, proceed with Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/030-exp-versioning/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no API contracts needed)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── domains/experience/
│   ├── shared/
│   │   ├── schemas/
│   │   │   └── experience.schema.ts          # Add draftVersion, publishedVersion
│   │   └── lib/
│   │       └── updateExperienceConfigField.ts # NEW: Shared update helper with increment
│   └── designer/
│       ├── hooks/
│       │   ├── useUpdateExperienceDraft.ts   # Use new helper with version increment
│       │   └── usePublishExperience.ts       # Sync versions on publish
│       └── containers/
│           └── ExperienceDesignerLayout.tsx  # Use actual versions for badge
└── shared/
    └── editor-status/
        └── components/
            └── EditorChangesBadge.tsx        # No changes needed (already accepts version props)
```

**Structure Decision**: Changes follow existing vertical slice architecture within the experience domain. New shared helper `updateExperienceConfigField.ts` mirrors the Event domain's `updateEventConfigField.ts` pattern.

## Complexity Tracking

> No violations - feature follows established patterns with minimal complexity.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Constitution Check (Post-Design)

*Re-evaluated after Phase 1 design completion.*

| Principle | Status | Post-Design Notes |
|-----------|--------|-------------------|
| I. Mobile-First Design | N/A | No UI changes, data layer only |
| II. Clean Code & Simplicity | PASS | Mirrors Event Designer pattern exactly, no new abstractions |
| III. Type-Safe Development | PASS | Zod schema with proper defaults, TypeScript types inferred |
| IV. Minimal Testing Strategy | PASS | Schema tests + hook behavior tests planned |
| V. Validation Gates | PASS | Standard `pnpm app:check` workflow applies |
| VI. Frontend Architecture | PASS | Client-first Firestore SDK, TanStack Query integration |
| VII. Backend & Firebase | PASS | Atomic `increment()` in transactions, dot-notation updates |
| VIII. Project Structure | PASS | Changes within experience domain, new shared lib follows pattern |

**Post-Design Gate Result**: PASS - Design aligns with all constitution principles.

## Generated Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Plan | `specs/030-exp-versioning/plan.md` | Complete |
| Research | `specs/030-exp-versioning/research.md` | Complete |
| Data Model | `specs/030-exp-versioning/data-model.md` | Complete |
| Quickstart | `specs/030-exp-versioning/quickstart.md` | Complete |
| Contracts | N/A | Not applicable (client-side Firestore only) |
| Tasks | `specs/030-exp-versioning/tasks.md` | Pending (`/speckit.tasks`) |
