# Implementation Plan: Schema Foundations (PRD 1A)

**Branch**: `058-schema-foundations` | **Date**: 2026-02-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/058-schema-foundations/spec.md`

## Summary

Add foundational Zod schemas to the shared package for Transform v3's outcome-based Create system. This includes:
1. **mediaDisplayNameSchema** - Mention-safe validation for media display names
2. **createOutcomeSchema** - Configuration for outcome generation (image/gif/video)
3. **sessionResponseSchema** - Unified response format replacing answers[] and capturedMedia[]

Pure schema work with no runtime changes. These schemas enable PRD 1B (experience config), PRD 1C (session responses), and PRD 3 (job processing).

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode, ES2020 target)
**Primary Dependencies**: Zod 4.1.12
**Storage**: N/A (schema definitions only, no direct storage)
**Testing**: Vitest (run via `pnpm --filter @clementine/shared test`)
**Target Platform**: Shared package consumed by TanStack Start app and Firebase Functions
**Project Type**: Monorepo shared package (`packages/shared/`)
**Performance Goals**: N/A (compile-time schema definitions)
**Constraints**: Must be backward compatible with existing media documents
**Scale/Scope**: 3 new schema files, 2 modified index files, 1 modified schema file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | N/A | Schema-only, no UI |
| II. Clean Code & Simplicity | ✅ PASS | Small focused schemas, single responsibility |
| III. Type-Safe Development | ✅ PASS | Zod schemas with strict TypeScript, runtime validation |
| IV. Minimal Testing Strategy | ✅ PASS | Unit tests for schema validation |
| V. Validation Gates | ✅ PASS | Will run format/lint/type-check before commit |
| VI. Frontend Architecture | N/A | Shared package, not frontend-specific |
| VII. Backend & Firebase | N/A | No Firebase operations |
| VIII. Project Structure | ✅ PASS | Following existing schema directory structure |

**Applicable Standards**:
- `global/zod-validation.md` - Zod patterns
- `global/code-quality.md` - Validation workflows
- `global/project-structure.md` - Barrel exports

## Project Structure

### Documentation (this feature)

```text
specs/058-schema-foundations/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
packages/shared/src/schemas/
├── media/
│   ├── media-reference.schema.ts    # MODIFY: Add mediaDisplayNameSchema
│   └── index.ts                     # MODIFY: Export mediaDisplayNameSchema
├── experience/
│   ├── create-outcome.schema.ts     # CREATE: New outcome schema (self-contained)
│   └── index.ts                     # MODIFY: Export create-outcome
└── session/
    ├── session-response.schema.ts   # CREATE: New response schema
    └── index.ts                     # MODIFY: Export session-response
```

**Important**: `create-outcome.schema.ts` does NOT import from `nodes/ai-image-node.schema.ts`. The model and aspect ratio enums are defined locally in the new schema to avoid coupling to the deprecated `transformNodes` system (which will be removed in PRD 4).

**Structure Decision**: Following existing vertical slice pattern in `packages/shared/src/schemas/`. Each domain has its own directory with schema files and barrel exports.

## Complexity Tracking

No constitution violations. This feature is straightforward schema work following established patterns.

---

## Phase 0: Research

**Status**: ✅ Complete (see [research.md](./research.md))

No external research needed. All technical decisions are already defined in:
- PRD 1A specifies exact schema shapes
- Existing codebase provides patterns (aiImageModelSchema, mediaReferenceSchema)
- Zod 4.x patterns already established in codebase

**Research Items Resolved**:

| Item | Decision | Rationale |
|------|----------|-----------|
| Schema location | `packages/shared/src/schemas/` | Matches existing pattern |
| Display name validation regex | `/^[a-zA-Z0-9 \-_.]+$/` | PRD specifies mention-safe characters |
| Backward compatibility | `.catch('Untitled')` | PRD specifies fallback |
| Discriminated union pattern | `kind` field | PRD specifies, matches Zod best practices |
| looseObject vs object | `z.object()` for new schemas | looseObject for forward compat on top-level documents only |

---

## Phase 1: Design & Contracts

**Status**: ✅ Complete

### Generated Artifacts

| Artifact | Status | Path |
|----------|--------|------|
| Data Model | ✅ | [data-model.md](./data-model.md) |
| Schema Contracts | ✅ | [contracts/schemas.md](./contracts/schemas.md) |
| Quickstart Guide | ✅ | [quickstart.md](./quickstart.md) |

### Constitution Re-check (Post-Design)

| Principle | Status | Notes |
|-----------|--------|-------|
| II. Clean Code & Simplicity | ✅ PASS | Data model shows small, focused schemas |
| III. Type-Safe Development | ✅ PASS | Full Zod type inference documented |
| VIII. Project Structure | ✅ PASS | Barrel exports clearly defined |

**All gates pass. Ready for task generation.**

---

## Next Steps

Run `/speckit.tasks` to generate implementation tasks from this plan.

Tasks will cover:
1. Add `mediaDisplayNameSchema` to media-reference.schema.ts
2. Create `create-outcome.schema.ts` with all sub-schemas
3. Create `session-response.schema.ts`
4. Update barrel exports (3 index files)
5. Write unit tests for each schema
6. Run validation gates (build, lint, type-check, test)
