# Feature Specification: Journeys Module Cleanup

**Feature Branch**: `018-journeys-cleanup`
**Created**: 2025-12-03
**Status**: Draft
**Input**: User description: "Delete journeys module - Post-merge cleanup from Phase 3 steps consolidation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clean Codebase After Migration (Priority: P1)

As a developer working on this codebase, I need the legacy journeys module removed so that there is a single source of truth for experience flows, eliminating confusion about which module to use.

**Why this priority**: The journeys module is fully deprecated and creates confusion. Developers may accidentally import from it or wonder which module is canonical. Removing it reduces cognitive load and prevents accidental usage.

**Independent Test**: Build passes (`pnpm build`), type-check passes (`pnpm type-check`), and no runtime errors occur in the admin experience editor.

**Acceptance Scenarios**:

1. **Given** the journeys module exists at `web/src/features/journeys/`, **When** the cleanup is complete, **Then** the entire `journeys/` directory is deleted
2. **Given** the sessions module imports from journeys, **When** the cleanup is complete, **Then** all journey imports are replaced with equivalent experience imports or removed entirely
3. **Given** `pnpm type-check` is run, **When** the cleanup is complete, **Then** it passes with zero errors

---

### User Story 2 - Remove Outdated Specifications (Priority: P2)

As a developer maintaining documentation, I need outdated spec directories removed so that only current and relevant specifications exist in the `specs/` folder.

**Why this priority**: Outdated specs can mislead developers into implementing deprecated patterns. Removing them maintains documentation hygiene.

**Independent Test**: The `specs/005-journey-init/` and `specs/008-preview-runtime/` directories no longer exist.

**Acceptance Scenarios**:

1. **Given** legacy specs exist at `specs/005-journey-init/` and `specs/008-preview-runtime/`, **When** cleanup is complete, **Then** these directories are deleted
2. **Given** a developer searches for journey-related specs, **When** looking in `specs/`, **Then** no journey-specific specs remain

---

### User Story 3 - Preserve Guest Module for Phase 7 (Priority: P3)

As a developer planning Phase 7 (Experience Engine), I understand that the guest module will be completely rewritten. The guest module's broken journey references are intentional and will remain until Phase 7.

**Why this priority**: The guest module (`features/guest/`) is out of scope for this cleanup. It uses legacy journey patterns but will be entirely replaced in Phase 7 Experience Engine. Attempting to fix it now would be wasted effort.

**Independent Test**: Grep for `features/journeys` imports shows only files in `features/guest/`.

**Acceptance Scenarios**:

1. **Given** the guest module imports from journeys, **When** cleanup is complete, **Then** guest module imports are intentionally left as-is (broken)
2. **Given** `grep -r "features/journeys" web/src/ | grep -v "features/guest"` is run, **When** cleanup is complete, **Then** zero results are returned

---

### Edge Cases

- What happens if sessions module depends on journey-specific functionality?
  - Sessions must be updated to use equivalent experience-based functions or have deprecated functions removed
- What happens if type definitions from journeys are used elsewhere?
  - All type imports must be replaced with `Experience` types from `features/experiences`
- What happens to the guest module's journey imports?
  - They are intentionally left broken per Phase 3 PRD Section 7 - will be fixed in Phase 7

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST delete the entire `web/src/features/journeys/` directory
- **FR-002**: System MUST delete `specs/005-journey-init/` directory
- **FR-003**: System MUST delete `specs/008-preview-runtime/` directory
- **FR-004**: Sessions module MUST NOT import from `@/features/journeys`
- **FR-005**: Sessions module MUST replace deprecated journey session actions with experience equivalents or remove if unused
- **FR-006**: All imports from `features/journeys` MUST be removed except in `features/guest/` (intentionally broken for Phase 7)
- **FR-007**: Build (`pnpm build`) MUST pass after cleanup
- **FR-008**: Type-check (`pnpm type-check`) MUST pass after cleanup
- **FR-009**: Lint (`pnpm lint`) MUST pass after cleanup

### Key Entities

- **Experience**: The replacement entity for Journey - represents a reusable flow template with steps (already implemented in `features/experiences/`)
- **Step**: Screen configuration that now lives under experiences (`/experiences/{experienceId}/steps`) - already migrated in Phase 3
- **Session**: Guest interaction record that tracks progress through an experience

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero files exist in `web/src/features/journeys/` after cleanup
- **SC-002**: Zero files exist in `specs/005-journey-init/` after cleanup
- **SC-003**: Zero files exist in `specs/008-preview-runtime/` after cleanup
- **SC-004**: Running `grep -r "features/journeys" web/src/ --include="*.ts" --include="*.tsx" | grep -v "features/guest"` returns zero results
- **SC-005**: `pnpm build` completes successfully with exit code 0
- **SC-006**: `pnpm type-check` completes successfully with exit code 0
- **SC-007**: `pnpm lint` completes successfully with exit code 0
