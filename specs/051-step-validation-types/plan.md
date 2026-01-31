# Implementation Plan: Strongly Typed Step Validation and Simplified Answer Schema

**Branch**: `051-step-validation-types` | **Date**: 2026-01-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/051-step-validation-types/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This refactor improves type safety and consistency in the step validation system by replacing loose typing (`Record<string, unknown>`) with specific typed configs from the `ExperienceStepConfig` discriminated union. Additionally, simplifies the answer value schema from `string | number | boolean | string[]` to just `string | string[]` for uniform data handling across all step types. This change provides full TypeScript autocomplete, compile-time error detection, and eliminates type-specific handling in analytics and data storage.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode enabled)
**Primary Dependencies**:
- Zod 4.1.12 (schema validation)
- @clementine/shared (shared schemas package)
- React 19.2.0 (renderer components)

**Storage**: Firebase Firestore (NoSQL, JSON serialization)
**Testing**: Vitest (unit tests for validators)
**Target Platform**: Web (TanStack Start app + Node.js Firebase Functions)
**Project Type**: Monorepo (apps/clementine-app + packages/shared)

**Performance Goals**:
- Type checking: No performance impact (compile-time only)
- Runtime validation: <1ms per step validation call
- Answer storage: No performance change (same Firestore operations)

**Constraints**:
- Must maintain backward compatibility with existing validation logic
- No breaking changes to schema structure (only value type union)
- Pre-launch: No session data migration required

**Scale/Scope**:
- 7 step types (info, 5 input types, 1 capture type)
- 4 validator functions to update
- 2 renderer components to modify (InputYesNoRenderer, InputScaleRenderer)
- 1 schema file to update (session.schema.ts)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Design
**Status**: ✅ PASS (Not Applicable)
**Rationale**: This is a backend/type system refactor with no UI changes. Existing mobile-first implementation remains unchanged.

### Principle II: Clean Code & Simplicity
**Status**: ✅ PASS
**Rationale**: This refactor *improves* simplicity by:
- Eliminating type-specific handling branches
- Reducing cognitive load (fewer primitive types to handle)
- Making code more predictable and consistent
No new abstractions or complexity introduced.

### Principle III: Type-Safe Development
**Status**: ✅ PASS (STRENGTHENED)
**Rationale**: This refactor *strengthens* type safety by:
- Replacing `Record<string, unknown>` with specific discriminated union types
- Enabling compile-time error detection for invalid config access
- Providing full TypeScript autocomplete for config properties
TypeScript strict mode compliance improved, not weakened.

### Principle IV: Minimal Testing Strategy
**Status**: ✅ PASS
**Rationale**: Existing validator unit tests remain. No new test infrastructure needed. Type safety reduces need for extensive runtime testing.

### Principle V: Validation Gates
**Status**: ✅ PASS
**Rationale**: Standard validation loop applies:
- Format: `pnpm app:check` (lint + format)
- Type-check: `pnpm app:type-check` (TypeScript compilation)
- Test: `pnpm app:test` (Vitest unit tests)

**Standards Compliance**:
- `global/code-quality.md`: Applies (clean, simple refactor)
- `global/zod-validation.md`: Applies (updating Zod schema)
- `frontend/architecture.md`: Not applicable (no architecture change)
- `backend/firestore.md`: Applies (Firestore schema change)

### Principle VI: Frontend Architecture
**Status**: ✅ PASS (Not Applicable)
**Rationale**: No changes to client-first pattern. Renderers continue using Firebase client SDK for answer storage.

### Principle VII: Backend & Firebase
**Status**: ✅ PASS
**Rationale**: Firestore schema change (answer value type) maintains JSON serialization compatibility. No security rule changes needed.

### Principle VIII: Project Structure
**Status**: ✅ PASS
**Rationale**: Changes are isolated to existing files within established structure:
- `apps/clementine-app/src/domains/experience/steps/` (validators, renderers)
- `packages/shared/src/schemas/session/` (answer schema)
No new feature modules or structure changes.

### Overall Gate Status: ✅ PASS

All constitution principles are satisfied. This refactor improves type safety and simplicity without introducing complexity or violating architectural patterns.

## Project Structure

### Documentation (this feature)

```text
specs/051-step-validation-types/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Monorepo structure (pnpm workspace)
apps/clementine-app/
├── src/
│   └── domains/
│       └── experience/
│           └── steps/
│               ├── registry/
│               │   ├── step-validation.ts        # UPDATE: Add specific config types
│               │   └── step-registry.ts          # UPDATE: Update AnswerValue type
│               └── renderers/
│                   ├── InputYesNoRenderer.tsx    # UPDATE: Save "yes"/"no" strings
│                   └── InputScaleRenderer.tsx    # UPDATE: Save number as string
└── tests/
    └── domains/
        └── experience/
            └── steps/
                └── step-validation.test.ts        # VERIFY: Existing tests still pass

packages/shared/
├── src/
│   └── schemas/
│       └── session/
│           └── session.schema.ts                  # UPDATE: Simplify answerSchema.value
└── tests/
    └── schemas/
        └── session/
            └── session.schema.test.ts             # UPDATE: Test cases for new schema
```

**Structure Decision**: Monorepo with app and shared package. Changes are isolated to existing files within the experience domain (validators, renderers) and shared session schema. No new files or directories created.

## Post-Design Constitution Re-Check

*Phase 1 design artifacts completed. Re-evaluating constitution compliance.*

### Design Artifacts Review

**Created**:
- ✅ `research.md` - All technical decisions documented with rationale
- ✅ `data-model.md` - Schema changes and type definitions documented
- ✅ `quickstart.md` - Implementation guide with step-by-step instructions
- ✅ `contracts/` - Type contracts for validators, renderers, and schemas

**Constitution Compliance**:

### Principle II: Clean Code & Simplicity
**Status**: ✅ CONFIRMED - Design maintains simplicity
- Research shows discriminated union is standard TypeScript pattern (not over-engineered)
- Type conversions at renderer boundary are simple (single line: `value ? 'yes' : 'no'`)
- No new abstractions or complexity introduced
- Removes type-specific handling branches (net simplification)

### Principle III: Type-Safe Development
**Status**: ✅ CONFIRMED - Design strengthens type safety
- Specific config types provide compile-time safety
- Type contracts documented in `contracts/` directory
- Zod schema simplified (fewer types to validate)
- No `any` escapes or type safety compromises

### Principle V: Validation Gates
**Status**: ✅ READY FOR IMPLEMENTATION
- Design confirms no new validation tooling needed
- Standard TypeScript type checking sufficient
- Existing test suite covers validation logic
- Quickstart includes verification checklist

### Overall Gate Status: ✅ PASS (Post-Design)

Design phase confirms initial assessment. All constitution principles remain satisfied. Ready to proceed to implementation (Phase 2).

## Complexity Tracking

> **Not applicable**: Constitution Check passed with no violations. This refactor reduces complexity rather than adding it.
