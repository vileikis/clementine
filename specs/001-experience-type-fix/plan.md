# Implementation Plan: Experience Type System Consolidation

**Branch**: `001-experience-type-fix` | **Date**: 2025-11-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-experience-type-fix/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Consolidate Experience type definitions by removing legacy types and migration code, keeping only the new discriminated union schema from `schemas.ts`. This refactoring establishes a single source of truth for Experience types, eliminates dual-type handling complexity, and ensures all Experience data follows the validated schema structure with nested `config` and `aiConfig` objects.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js (from Next.js 16 runtime)
**Primary Dependencies**: Next.js 16 (App Router), React 19, Zod 4.x (validation), Firebase Admin SDK + Client SDK
**Storage**: Firebase Firestore (document database), Firebase Storage (images/media)
**Testing**: Jest (unit tests), React Testing Library (component tests)
**Target Platform**: Web application (Next.js SSR + Client Components), mobile-first design
**Project Type**: Monorepo (pnpm workspace) - `web/` workspace for Next.js app, `functions/` workspace (unused for this feature)
**Performance Goals**: TypeScript compilation with zero errors, schema validation overhead <10ms per document read
**Constraints**: No production data exists (development stage), clean slate migration approach (wipe Firestore data)
**Scale/Scope**: Affects 8 files across repository layer, server actions, and UI components; ~15-20 type imports to update

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Initial Check (Before Phase 0)

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: No UI changes required - refactoring maintains existing mobile-optimized Experience editor
- [x] **Clean Code & Simplicity**: Removes complexity by eliminating dual-type system and migration code; follows YAGNI (removing unused legacy code)
- [x] **Type-Safe Development**: Enforces TypeScript strict mode throughout; adds Zod validation at repository read layer; no `any` escapes
- [x] **Minimal Testing Strategy**: Existing Jest tests will be updated; no new test infrastructure needed; focus on repository validation tests
- [x] **Validation Loop Discipline**: Plan includes validation tasks (type-check, lint, manual testing) before completion
- [x] **Firebase Architecture Standards**: Maintains Admin SDK for writes (Server Actions), Client SDK for reads (repository); schemas remain in `web/src/lib/schemas/`; public image URLs unchanged
- [x] **Technical Standards**: Follows `global/coding-style.md` (naming conventions), `global/validation.md` (Zod schemas), `backend/firebase.md` (hybrid SDK pattern)

**Complexity Violations** (if any):

None - this feature actively reduces complexity by removing legacy types and migration code.

### Final Check (After Phase 1 Design)

**Re-evaluation Date**: 2025-11-20

All constitution principles remain satisfied after completing design phase:

- [x] **Mobile-First Responsive Design**: Design confirms no UI changes - component imports updated only, mobile experience unchanged
- [x] **Clean Code & Simplicity**: Design eliminates 2 migration files, 1 legacy types file, and dual-type handling across 7 components - significant complexity reduction
- [x] **Type-Safe Development**: Repository validation pattern follows existing codebase standards (Company, Event, Session repos); Zod validation at read layer ensures runtime type safety
- [x] **Minimal Testing Strategy**: No new test infrastructure - existing repository tests will be updated to use new schema; manual testing covers CRUD operations
- [x] **Validation Loop Discipline**: `quickstart.md` includes comprehensive validation steps (type-check, lint, codebase search, manual testing)
- [x] **Firebase Architecture Standards**: Design maintains hybrid pattern (Admin SDK for writes, Client SDK for reads); schemas in `web/src/lib/schemas/`; full public URLs for images
- [x] **Technical Standards**: All design decisions align with standards - validation patterns consistent with existing repos, naming follows conventions

**Changes Since Initial Check**: None - design confirmed initial assessment. All principles satisfied.

**Proceed to Implementation**: ✅ Yes - constitution compliance verified, ready for `/speckit.tasks` command.

## Project Structure

### Documentation (this feature)

```text
specs/001-experience-type-fix/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command) - N/A for refactoring
├── checklists/          # Quality validation checklists
│   └── requirements.md  # Spec quality checklist (already completed)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
web/src/features/experiences/
├── lib/
│   ├── schemas.ts                        # ✅ KEEP - Single source of truth for PhotoExperience type
│   ├── repository.ts                     # 🔧 UPDATE - Add Zod validation, return PhotoExperience
│   ├── migration.ts                      # ❌ DELETE - Remove migration utilities
│   └── migration.test.ts                 # ❌ DELETE - Remove migration tests
├── types/
│   └── experience.types.ts               # ❌ DELETE - Remove legacy Experience type
├── actions/
│   ├── photo-create.ts                   # 🔧 UPDATE - Simplify (already uses new schema)
│   ├── photo-update.ts                   # 🔧 UPDATE - Remove migration logic
│   ├── shared.ts                         # ✅ KEEP - No changes needed
│   └── legacy.ts                         # 🔧 MARK DEPRECATED - Add deprecation notice
└── components/
    └── shared/
        ├── ExperiencesList.tsx           # 🔧 UPDATE - Import from schemas.ts
        ├── ExperienceEditor.tsx          # 🔧 UPDATE - Remove dual-type handling
        ├── ExperienceEditorWrapper.tsx   # 🔧 UPDATE - Import from schemas.ts
        └── ExperienceTypeSelector.tsx    # 🔧 UPDATE - Import from schemas.ts

web/src/lib/schemas/
└── index.ts                              # ✅ KEEP - Central export for all schemas
```

**Structure Decision**: Single project (web workspace) with feature-based organization. All Experience-related code lives under `web/src/features/experiences/` following the existing architecture. The `schemas.ts` file becomes the single source of truth for Experience types, replacing the legacy `types/experience.types.ts` file.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - No complexity violations. This feature reduces complexity by removing dual-type system and migration code.

## Phase 0: Research & Discovery

### Research Tasks

**Note**: This is a refactoring task with well-defined technical context. Research phase focuses on confirming current file dependencies and migration safety.

#### R1: Audit Current Type Usage

**Goal**: Identify all files importing from `experience.types.ts` vs `schemas.ts` to ensure complete migration coverage.

**Questions**:
- Which files import from `types/experience.types.ts`?
- Which files import from `lib/schemas.ts`?
- Are there any indirect imports through barrel exports?

**Method**: Codebase search using Grep tool for import statements.

**Findings**: [To be filled by research agent]

#### R2: Verify Firestore Data Structure

**Goal**: Confirm current Firestore Experience documents structure and validate clean slate approach.

**Questions**:
- What is the current Experience document structure in Firestore?
- Are there any existing documents that need manual backup?
- Can we safely delete all /events/{eventId}/experiences subcollections?

**Method**: Firebase Firestore console inspection or Admin SDK query.

**Findings**: [To be filled by research agent]

#### R3: Identify Repository Validation Patterns

**Goal**: Determine best practices for adding Zod validation to repository read operations.

**Questions**:
- Where should schema validation occur (repository layer vs action layer)?
- How should validation errors be handled and logged?
- What is the performance impact of parsing every document read?

**Method**: Review existing Zod usage in codebase, Firebase best practices.

**Findings**: [To be filled by research agent]

### Research Output

**Output File**: `research.md` (generated in Phase 0)

**Contents**:
- Complete list of files importing legacy types
- Current Firestore data structure assessment
- Validation error handling strategy
- Migration safety checklist

## Phase 1: Design & Contracts

### Design Artifacts

#### D1: Data Model

**File**: `data-model.md`

**Contents**:
- PhotoExperience schema structure (from `schemas.ts`)
- Field-by-field documentation
- Validation rules (Zod schema)
- Firestore document structure mapping

#### D2: API Contracts

**File**: `contracts/` directory

**Note**: This refactoring does not introduce new API endpoints. Existing Server Actions maintain their contracts with updated return types.

**Changes**:
- Repository functions return `PhotoExperience` instead of legacy `Experience`
- Server Action input/output types remain unchanged (already use new schema)

#### D3: Migration Strategy

**File**: Included in `quickstart.md`

**Contents**:
- Pre-migration checklist (backup current state, document test data)
- Step-by-step migration process
- File deletion order (tests first, then migration code, then legacy types)
- Repository update procedure (add validation, update return types)
- UI component update procedure (update imports)
- Validation steps (type-check, manual testing)
- Rollback plan (git revert, restore Firestore backup if needed)

### Agent Context Update

After Phase 1 design completion, run:

```bash
.specify/scripts/bash/update-agent-context.sh claude
```

This updates `.specify/memory/agent-context/claude.md` with:
- PhotoExperience schema structure
- Repository validation patterns
- Migration completion checklist

## Phase 2: Task Breakdown

**Note**: Phase 2 is handled by the `/speckit.tasks` command (NOT `/speckit.plan`).

The tasks will be organized by user story priority:

1. **P1 Tasks**: Establish single type system
   - Delete migration files
   - Delete legacy types file
   - Update repository return types and add validation
   - Run type-check and fix TypeScript errors

2. **P2 Tasks**: Ensure data schema consistency
   - Wipe Firestore data (if any exists)
   - Update Server Actions to remove migration logic
   - Manual test CRUD operations
   - Verify Firestore documents match new schema

3. **P3 Tasks**: Clean up UI components
   - Update component imports
   - Remove type guards and dual-type handling
   - Mark legacy.ts as deprecated
   - Final validation loop (lint, type-check, manual test)

## Success Validation

### Pre-Implementation Checklist

- [ ] Research tasks (R1-R3) completed with findings documented in `research.md`
- [ ] Data model documented in `data-model.md`
- [ ] Migration strategy documented in `quickstart.md`
- [ ] Agent context updated with new patterns

### Post-Implementation Checklist

- [ ] TypeScript type-check passes (`pnpm type-check`) with zero errors
- [ ] All ESLint rules pass (`pnpm lint`) with zero warnings
- [ ] Codebase search for `experience.types.ts` imports returns zero results
- [ ] Codebase search for `migration.ts` references returns zero results
- [ ] Repository functions return validated `PhotoExperience` types
- [ ] Manual test: Create new Experience → saved with nested `config`/`aiConfig`
- [ ] Manual test: Read Experience → validated against schema, no errors
- [ ] Manual test: Update Experience → saved with new schema structure
- [ ] Manual test: Delete Experience → successful deletion
- [ ] Firestore console inspection: All Experience documents match new schema

### Acceptance Criteria Mapping

From spec.md Success Criteria:

- **SC-001** (Single file location): Verified by searching codebase for Experience type imports
- **SC-002** (Zero TypeScript errors): Verified by `pnpm type-check` passing
- **SC-003** (CRUD operations work): Verified by manual testing checklist above
- **SC-004** (Zero legacy references): Verified by codebase search for `experience.types.ts` and `migration.ts`
- **SC-005** (Firestore schema consistency): Verified by Firestore console inspection
- **SC-006** (Validation catches errors): Verified by testing invalid data with repository functions

## Notes

- This is a one-way migration with no rollback to legacy types (clean slate approach)
- No production data exists, so Firestore data wipe is safe
- Future Experience types (video, gif, wheel) will follow the same discriminated union pattern
- Keep `schemas.ts` as single source of truth for all Experience types
