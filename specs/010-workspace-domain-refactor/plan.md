# Implementation Plan: Workspace Domain Refactoring

**Branch**: `010-workspace-domain-refactor` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-workspace-domain-refactor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Refactor the `workspace` domain into a cleaner subdomain-based structure (`settings/`, `shared/`) and extract the core workspace schema to `packages/shared/` for cross-package type consistency. This is a code organization improvement with no functional changes - pure refactoring to align with the established project structure pattern used by the `projects` subdomain.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**:
- React 19.2
- TanStack Start 1.132
- Zod 4.1.12 (schema validation)
- pnpm 10.18.1 (package manager)

**Storage**: N/A (pure code refactoring, no data migration)
**Testing**: Vitest (existing tests must continue to pass)
**Target Platform**: Web (TanStack Start application)
**Project Type**: Monorepo web application (apps/clementine-app + packages/shared)
**Performance Goals**: N/A (refactoring should not affect performance)
**Constraints**:
- Zero breaking changes to existing imports
- Maintain backward compatibility during migration
- All TypeScript compilation must succeed
- All existing tests must pass

**Scale/Scope**:
- ~10 files to move/rename
- ~20-30 import statements to update
- 2 packages affected (apps/clementine-app, packages/shared)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Design
**Status**: ✅ **PASS** (Not Applicable)
**Rationale**: This is a code refactoring task with no UI changes. No impact on mobile-first design.

### Principle II: Clean Code & Simplicity
**Status**: ✅ **PASS**
**Rationale**: This refactoring improves code organization by:
- Following established subdomain pattern (already used by `projects/`)
- Reducing cognitive load (clear separation of concerns)
- Improving discoverability (settings vs shared utilities)
- Removing type duplication (shared package schema)
- This is a simplification effort, not adding complexity

### Principle III: Type-Safe Development
**Status**: ✅ **PASS**
**Rationale**:
- TypeScript strict mode remains enforced
- Zod schemas for workspace entity maintained
- Shared package schema improves type consistency across packages
- Runtime validation patterns unchanged

### Principle IV: Minimal Testing Strategy
**Status**: ✅ **PASS**
**Rationale**:
- All existing tests must continue to pass
- No new tests required (pure refactoring, no behavior changes)
- Validation via TypeScript compilation and existing test suite

### Principle V: Validation Gates
**Status**: ✅ **PASS**
**Rationale**: Will run full validation loop before completion:
- Format → Lint → Type-check → Test
- Standards compliance review (project-structure.md)
- Auto-fix command: `pnpm check` (apps/clementine-app)

### Principle VI: Frontend Architecture
**Status**: ✅ **PASS** (Not Applicable)
**Rationale**: No changes to client-first architecture. File moves only.

### Principle VII: Backend & Firebase
**Status**: ✅ **PASS** (Not Applicable)
**Rationale**: No Firebase integration changes. Firestore schema unchanged.

### Principle VIII: Project Structure
**Status**: ✅ **PASS**
**Rationale**: This refactoring **enforces** vertical slice architecture:
- Aligns workspace domain with established project structure standard
- Follows subdomain pattern already used by `projects/`
- Maintains proper barrel exports
- Improves domain encapsulation

### Standards Compliance
**Applicable Standards**:
- ✅ `global/project-structure.md` - Primary driver of this refactoring
- ✅ `global/code-quality.md` - Validation workflows
- ✅ `global/zod-validation.md` - Schema patterns maintained

**Status**: ✅ **ALL GATES PASS**

This refactoring is **constitution-compliant** and actively improves adherence to Principle VIII (Project Structure) by aligning the workspace domain with established standards.

## Project Structure

### Documentation (this feature)

```text
specs/010-workspace-domain-refactor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (skipped - no unknowns to research)
├── data-model.md        # Phase 1 output (workspace entity schema)
├── quickstart.md        # Phase 1 output (migration guide)
├── contracts/           # Phase 1 output (skipped - no API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

**Affected Packages**:

```text
# Monorepo structure
workspace-polish/
├── apps/
│   └── clementine-app/
│       └── src/
│           └── domains/
│               └── workspace/                    # Primary refactoring target
│                   ├── settings/                 # NEW subdomain
│                   │   ├── components/
│                   │   │   └── WorkspaceSettingsForm.tsx
│                   │   ├── containers/
│                   │   │   └── WorkspaceSettingsPage.tsx
│                   │   ├── hooks/
│                   │   │   └── useUpdateWorkspace.ts
│                   │   └── index.ts
│                   │
│                   ├── shared/                   # NEW subdomain
│                   │   ├── hooks/
│                   │   │   └── useWorkspace.ts
│                   │   ├── store/
│                   │   │   └── useWorkspaceStore.ts
│                   │   ├── constants/
│                   │   │   └── workspace.constants.ts
│                   │   ├── schemas/
│                   │   │   └── workspace.schemas.ts
│                   │   └── index.ts
│                   │
│                   ├── projects/                 # UNCHANGED (already structured)
│                   │   └── ...
│                   │
│                   └── index.ts                  # Updated barrel export
│
└── packages/
    └── shared/
        └── src/
            └── entities/
                └── workspace/                    # NEW entity schema
                    ├── workspace.schema.ts
                    └── index.ts
```

**Structure Decision**: Monorepo web application following vertical slice architecture. The workspace domain is split into subdomains (`settings/`, `shared/`) matching the pattern already established by `projects/`. Core entity schema is extracted to the shared package for cross-package type consistency.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations.** All constitution gates pass. This refactoring actively improves adherence to Principle VIII (Project Structure).

---

## Post-Design Constitution Re-Evaluation

*GATE: Re-check after Phase 1 design artifacts generated.*

### Design Review

**Artifacts Generated**:
- ✅ `research.md` - Documented no unknowns (all patterns established)
- ✅ `data-model.md` - Workspace entity schema and location strategy
- ✅ `quickstart.md` - Step-by-step migration guide

### Constitution Re-Check

#### Principle I: Mobile-First Design
**Status**: ✅ **PASS** (Not Applicable)
**Post-Design**: No UI changes. Mobile-first unaffected.

#### Principle II: Clean Code & Simplicity
**Status**: ✅ **PASS** ⭐ **IMPROVED**
**Post-Design**: Design confirms simplification:
- Subdomain structure reduces cognitive load
- Clear separation: settings vs shared utilities
- Follows established `projects/` pattern (no new patterns invented)
- Shared package eliminates type duplication

#### Principle III: Type-Safe Development
**Status**: ✅ **PASS** ⭐ **IMPROVED**
**Post-Design**: Design strengthens type safety:
- Shared package schema ensures cross-package type consistency
- Zod validation patterns preserved (see `data-model.md`)
- TypeScript strict mode enforced throughout
- No `any` escapes introduced

#### Principle IV: Minimal Testing Strategy
**Status**: ✅ **PASS**
**Post-Design**: No new tests required. Existing tests validate refactoring correctness via type-check and test suite.

#### Principle V: Validation Gates
**Status**: ✅ **PASS**
**Post-Design**: Quickstart includes comprehensive validation checklist:
- Format → Lint → Type-check → Test
- Build verification
- Manual feature testing
- Standards compliance review

#### Principle VI: Frontend Architecture
**Status**: ✅ **PASS** (Not Applicable)
**Post-Design**: Client-first architecture unchanged. Pure file organization.

#### Principle VII: Backend & Firebase
**Status**: ✅ **PASS** (Not Applicable)
**Post-Design**: No Firestore schema changes. No security rule changes.

#### Principle VIII: Project Structure
**Status**: ✅ **PASS** ⭐ **PRIMARY DRIVER**
**Post-Design**: Design **enforces** vertical slice architecture:
- `workspace/settings/` - Settings-specific UI and logic
- `workspace/shared/` - Cross-subdomain utilities
- Matches `workspace/projects/` pattern exactly
- Proper barrel exports at each level
- Clear public API via `workspace/index.ts`

### Standards Compliance (Post-Design)

**Applicable Standards**:

1. ✅ **`global/project-structure.md`** - **PRIMARY DRIVER**
   - Subdomain structure matches standard
   - Barrel exports correct
   - Feature encapsulation proper

2. ✅ **`global/code-quality.md`**
   - Validation workflow documented in quickstart
   - Auto-fix command specified (`pnpm check`)

3. ✅ **`global/zod-validation.md`**
   - Schema patterns preserved (see `data-model.md`)
   - Document vs input schema separation maintained

### Final Gate Status

**Status**: ✅ **ALL GATES PASS**

**Post-Design Confirmation**: The design artifacts (research.md, data-model.md, quickstart.md) confirm that:

1. **No unknowns remain** - All patterns are established in codebase
2. **Type safety improved** - Shared package schema ensures consistency
3. **Simplicity preserved** - Following existing patterns, not inventing new ones
4. **Constitution compliance** - Actively improves Principle VIII adherence

**Recommendation**: ✅ **PROCEED TO IMPLEMENTATION**

This refactoring is **constitution-compliant** and **actively improves** code organization quality.
