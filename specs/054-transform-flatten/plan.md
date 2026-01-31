# Implementation Plan: Flatten Transform Configuration

**Branch**: `054-transform-flatten` | **Date**: 2026-01-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/054-transform-flatten/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Refactor `ExperienceConfig` schema to flatten `transform.nodes` to a top-level `transformNodes` array, removing the intermediate `transformConfigSchema` wrapper and unused `outputFormatSchema`. This simplifies developer experience from `config.transform?.nodes ?? []` to `config.transformNodes` and aligns with the existing `steps` array pattern.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: Zod 4.1.12, TanStack Start 1.132.0, Firebase Admin SDK
**Storage**: Firebase Firestore (NoSQL)
**Testing**: Vitest
**Target Platform**: Web (TanStack Start app), Node.js (Cloud Functions)
**Project Type**: Web monorepo (pnpm workspaces)
**Performance Goals**: N/A (schema refactor, no performance impact)
**Constraints**: Pre-launch (no data migration required), TypeScript strict mode
**Scale/Scope**: 3 workspaces affected (packages/shared, apps/clementine-app, functions)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | N/A | Schema-only refactor, no UI changes |
| II. Clean Code & Simplicity | ✅ PASS | Simplifies access pattern, removes unused code |
| III. Type-Safe Development | ✅ PASS | Maintains TypeScript strict mode, Zod validation |
| IV. Minimal Testing Strategy | ✅ PASS | Update existing tests to new schema |
| V. Validation Gates | ✅ PASS | Run `pnpm app:check` before completion |
| VI. Frontend Architecture | N/A | No architectural changes |
| VII. Backend & Firebase | N/A | No security rule changes |
| VIII. Project Structure | ✅ PASS | Follows vertical slice architecture |

**Gate Status**: ✅ PASSED - No violations, proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/054-transform-flatten/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/shared/
├── src/schemas/experience/
│   ├── transform.schema.ts          # MODIFY: Remove transformConfigSchema, outputFormatSchema
│   ├── transform.schema.test.ts     # MODIFY: Update tests for new schema
│   ├── experience.schema.ts         # MODIFY: Replace transform with transformNodes
│   └── nodes/
│       └── ai-image-node.schema.ts  # NO CHANGE: Node schema stays the same
└── src/index.ts                     # MODIFY: Update exports

apps/clementine-app/
├── src/domains/experience/
│   ├── generate/lib/
│   │   ├── transform-operations.ts       # MODIFY: Update to use transformNodes
│   │   └── transform-operations.test.ts  # MODIFY: Update test fixtures
│   └── shared/schemas/
│       └── index.ts                      # MODIFY: Update re-exports
└── ... (other files using transform.nodes)

functions/
├── src/repositories/
│   └── job.ts                       # MODIFY: Update buildJobSnapshot()
└── src/services/
    └── (various files using transform.nodes)
```

**Structure Decision**: pnpm monorepo with 3 workspaces - shared package provides schemas, frontend app and functions consume them. Changes propagate from shared → app/functions.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - this refactor reduces complexity by:
- Eliminating unnecessary nesting (`transform.nodes` → `transformNodes`)
- Removing unused code (`outputFormatSchema`, `transformConfigSchema`)
- Simplifying null-checking patterns

## Constitution Check (Post-Design)

*Re-evaluated after Phase 1 design artifacts are complete.*

| Principle | Status | Notes |
|-----------|--------|-------|
| II. Clean Code & Simplicity | ✅ PASS | Design removes ~50 LOC, simplifies all access patterns |
| III. Type-Safe Development | ✅ PASS | Zod schemas maintain type safety, discriminated unions preserved |
| V. Validation Gates | ✅ PASS | Will run `pnpm app:check` + `pnpm app:test` + `pnpm --filter @clementine/shared test` |
| VIII. Project Structure | ✅ PASS | Changes follow existing domain structure, barrel exports maintained |

**Post-Design Gate Status**: ✅ PASSED - Design complete, ready for task generation

## Generated Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Plan | `specs/054-transform-flatten/plan.md` | ✅ Complete |
| Research | `specs/054-transform-flatten/research.md` | ✅ Complete |
| Data Model | `specs/054-transform-flatten/data-model.md` | ✅ Complete |
| Quickstart | `specs/054-transform-flatten/quickstart.md` | ✅ Complete |
| Contracts | `specs/054-transform-flatten/contracts/schema-changes.md` | ✅ Complete |
| Tasks | `specs/054-transform-flatten/tasks.md` | ✅ Complete
