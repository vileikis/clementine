# Implementation Plan: Journeys Module Cleanup

**Branch**: `018-journeys-cleanup` | **Date**: 2025-12-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/018-journeys-cleanup/spec.md`

## Summary

Delete the legacy `features/journeys/` module and related specs (`specs/005-journey-init/`, `specs/008-preview-runtime/`) as post-merge cleanup from Phase 3 Steps Consolidation. Update the sessions module to remove journey imports while preserving deprecated functions for backwards compatibility with existing guest module (intentionally broken until Phase 7).

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16, React 19, Firebase Admin SDK
**Storage**: Firestore (no changes - existing collections remain)
**Testing**: Jest (existing test file needs updates)
**Target Platform**: Web (Next.js App Router)
**Project Type**: Web monorepo (pnpm workspaces)
**Performance Goals**: N/A (deletion task)
**Constraints**: Must preserve backwards compatibility for guest module until Phase 7
**Scale/Scope**: ~30 files to delete, ~2 files to update

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: N/A - no UI changes (deletion task)
- [x] **Clean Code & Simplicity**: Removing deprecated code improves simplicity
- [x] **Type-Safe Development**: Will maintain TypeScript strict mode after cleanup
- [x] **Minimal Testing Strategy**: Will update/remove journey-related tests
- [x] **Validation Loop Discipline**: Plan includes lint, type-check, build verification
- [x] **Firebase Architecture Standards**: N/A - no Firebase changes
- [x] **Technical Standards**: Following feature module cleanup patterns

**Complexity Violations**: None - this is a simplification task.

## Project Structure

### Documentation (this feature)

```text
specs/018-journeys-cleanup/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # N/A (no new data models)
├── quickstart.md        # Implementation guide
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code Changes

```text
# Files/Directories to DELETE
web/src/features/journeys/          # Entire module (~30 files)
specs/005-journey-init/             # Legacy spec
specs/008-preview-runtime/          # Legacy spec

# Files to MODIFY
web/src/features/sessions/actions/sessions.actions.ts
  - Remove: import { getJourney, listStepsLegacy } from "@/features/journeys/repositories"
  - Remove: import type { Journey } from "@/features/journeys"
  - Remove: getJourneyForGuestAction (deprecated, unused)
  - Keep: startJourneySessionAction (still used by guest module)

web/src/features/sessions/repositories/sessions.repository.ts
  - Keep: startJourneySession (still used by startJourneySessionAction)

web/src/features/sessions/repositories/sessions.repository.test.ts
  - Review: startJourneySession tests (keep if function remains)

# Files INTENTIONALLY LEFT BROKEN (Phase 7 scope)
web/src/features/guest/hooks/useJourneyRuntime.ts
web/src/features/guest/components/JourneyGuestContainer.tsx
```

**Structure Decision**: Deletion task - remove legacy module and specs, update sessions module to eliminate journey imports.

## Complexity Tracking

> No violations - this is a simplification task that reduces complexity.
