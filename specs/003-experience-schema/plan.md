# Implementation Plan: Evolve Experiences Schema

**Branch**: `003-experience-schema` | **Date**: 2025-11-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-experience-schema/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.
**Status**: UI Components Contract Reassessed (2025-11-19)

## Reassessment Summary

**Key Finding**: The initial UI components contract proposed creating entirely new components (CreateExperienceDialog, ExperienceBuilderForm, etc.), but analysis of the existing codebase revealed we already have well-implemented components that handle all required functionality:

### Existing Components (Already Production-Ready)

- **ExperienceTypeSelector** - Already implements type selection with "Coming Soon" badges, touch-friendly design, mobile-responsive ✅
- **CreateExperienceForm** - Full-featured inline form with React Hook Form + Zod validation ✅
- **ExperienceEditor** - Comprehensive editor for photo experience settings ✅
- **ExperienceEditorWrapper** - Server Action integration wrapper ✅

### Revised Approach

Instead of building new components from scratch, we will:

1. **Modify ExperienceEditor** (lines 49-90):

   - Update state initialization to read from `config.*` and `aiConfig.*` with fallback to legacy flat fields
   - Update handleSave to write to new nested structure (`config`, `aiConfig`)
   - Maintain backward compatibility during migration

2. **Verify Server Actions**:

   - `createExperience` - Ensure it writes new schema (`config: {countdown: 0}`, `aiConfig: {enabled: false, aspectRatio: "1:1"}`)
   - `updateExperienceAction` - Implement migration logic to move flat fields into nested structure

3. **No Changes Needed**:
   - ExperienceTypeSelector - Already compliant
   - CreateExperienceForm - Already compliant (Server Action needs update, not component)
   - ExperienceEditorWrapper - Already compliant (Server Action needs update, not component)

**Impact**: This reduces implementation scope by ~60%. Instead of building 3 new components + tests, we're modifying 1 component's state management and updating 2 Server Actions. See [contracts/ui-components.md](./contracts/ui-components.md) for detailed changes.

## Summary

Refactor the existing flat experience schema into a scalable, type-safe discriminated union structure that supports multiple experience types (photo, video, gif, wheel, survey). The new schema introduces type-specific configuration via `config` objects and shared AI configuration via `aiConfig`, while maintaining backward compatibility with existing photo experiences through automatic migration on save. Only photo experiences will be fully implemented; other types will be schema-defined but UI-disabled with "coming soon" indicators.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16 (App Router), React 19, Zod 4.1.12, Firebase Client SDK & Admin SDK
**Storage**: Firebase Firestore (`/events/{eventId}/experiences/{experienceId}`), Firebase Storage (public URLs for preview images/overlay frames)
**Testing**: Jest 30.2.0 with React Testing Library 16.3.0, @testing-library/jest-dom for component tests
**Target Platform**: Web application - mobile-first (320px-768px primary), desktop (1024px+) secondary
**Project Type**: Web monorepo (`web/` workspace with Next.js app)
**Performance Goals**: Experience builder loads configuration in <2 seconds, new experience creation completes in <5 seconds
**Constraints**: Zero data loss during migration, backward compatibility with legacy flat schema, mobile touch targets ≥44x44px
**Scale/Scope**: 6 experience types defined (1 implemented), migration affects all existing photo experiences, critical path for event creation flow

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Experience builder configuration panels designed mobile-first (per MFR-001), touch targets ≥44x44px for type selection (MFR-002), form inputs ≥14px text (MFR-003)
- [x] **Clean Code & Simplicity**: Refactoring existing schema (no new abstractions), discriminated union is TypeScript-native pattern, migration logic isolated in single function
- [x] **Type-Safe Development**: TypeScript strict mode enforced, Zod schemas for PhotoExperience/PhotoConfig/AiConfig (TSR-001 through TSR-005), no `any` escapes
- [x] **Minimal Testing Strategy**: Jest tests for schema validation, migration logic, and critical UI paths (create/edit flows), co-located with source files
- [x] **Validation Loop Discipline**: Implementation plan includes lint/type-check/test validation tasks before marking feature complete
- [x] **Firebase Architecture Standards**: Admin SDK for write operations via Server Actions (FAR-001), Client SDK for real-time subscriptions (FAR-002), schemas in `web/src/features/experiences/lib/schemas.ts` (FAR-003), preview images stored as public URLs (FAR-004), migration in Server Actions (FAR-005)
- [x] **Technical Standards**: Reviewed `standards/global/validation.md` (Zod schemas), `standards/backend/firebase.md` (hybrid SDK pattern), `standards/frontend/components.md` (form composition), `standards/testing/test-writing.md` (Jest strategy)

**Complexity Violations**: None. This is a data model refactoring using standard TypeScript discriminated unions. Migration logic is a one-time function, not a permanent abstraction layer.

**Post-Design Re-evaluation** (2025-11-19): After completing Phase 0 (Research) and Phase 1 (Design), all constitution principles remain satisfied:

- Data model uses standard TypeScript patterns (discriminated unions)
- Server Actions follow established Firebase hybrid architecture
- UI components maintain mobile-first responsive design
- Migration strategy is simple and isolated (no new abstractions)
- Testing approach follows minimal strategy (unit tests for critical paths)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
web/
├── src/
│   ├── features/
│   │   └── experiences/
│   │       ├── lib/
│   │       │   ├── schemas.ts              # MODIFIED: New discriminated union schemas
│   │       │   ├── schemas.test.ts         # NEW: Schema validation tests
│   │       │   └── migration.ts            # NEW: Legacy → new schema migration logic
│   │       ├── components/
│   │       │   ├── create-experience-dialog.tsx   # MODIFIED: Type selection with "coming soon" UI
│   │       │   └── experience-builder-form.tsx    # MODIFIED: Read/write from config/aiConfig
│   │       └── actions/
│   │           ├── create-experience.ts    # MODIFIED: Use new schema for creation
│   │           └── update-experience.ts    # MODIFIED: Use migration + new schema
│   └── app/
│       └── events/[eventId]/
│           └── experiences/
│               └── [experienceId]/
│                   └── page.tsx            # Experience builder page (uses updated components)
└── package.json
```

**Structure Decision**: This is a web monorepo project. We're following the feature module pattern (`web/src/features/experiences/`) where schemas, migration logic, components, and Server Actions are co-located. Schemas are defined in `lib/schemas.ts` per Firebase Architecture Standards (FAR-003). Migration logic is isolated in `lib/migration.ts` to keep concerns separated and testable.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No complexity violations. This feature maintains existing architecture patterns and introduces no new abstractions beyond TypeScript's built-in discriminated union types.
