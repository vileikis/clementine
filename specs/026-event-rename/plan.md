# Implementation Plan: Fix Event Rename Dialog Stale Name

**Branch**: `026-event-rename` | **Date**: 2026-01-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/026-event-rename/spec.md`

## Summary

Fix the rename dialog to always display the current event name when opened, instead of showing stale/cached names after a rename. The root cause is that `useState(initialName)` only initializes state once on mount, and the post-rename reset uses the stale closure value. Solution: Use `useEffect` to synchronize the input state with the `initialName` prop whenever the dialog opens.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: React 19.2.0, TanStack Query 5.66.5, shadcn/ui (Radix Dialog), Zod 4.1.12
**Storage**: Firebase Firestore (client SDK) - `/projects/{projectId}/events/{eventId}`
**Testing**: Vitest
**Target Platform**: Web (TanStack Start) - Mobile-first responsive
**Project Type**: Web application (monorepo)
**Performance Goals**: Dialog opens instantly, name synchronization within 1 render cycle
**Constraints**: Must preserve existing keyboard shortcuts, validation, and error handling
**Scale/Scope**: Single component fix (~10 lines changed)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | PASS | No UI changes; existing 44x44px buttons preserved |
| II. Clean Code & Simplicity | PASS | Minimal fix using standard React patterns |
| III. Type-Safe Development | PASS | No type changes needed; existing types sufficient |
| IV. Minimal Testing Strategy | PASS | Manual testing sufficient for UI state sync |
| V. Validation Gates | PASS | Will run `pnpm app:check` before commit |
| VI. Frontend Architecture | PASS | Client-first; no server changes needed |
| VII. Backend & Firebase | N/A | No backend changes |
| VIII. Project Structure | PASS | Modifying existing file in correct domain |

**Gate Result**: PASS - No violations. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/026-event-rename/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal - no schema changes)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/domains/project/events/
├── components/
│   ├── RenameProjectEventDialog.tsx  # PRIMARY: Fix state sync issue
│   └── ProjectEventItem.tsx          # No changes needed
├── hooks/
│   └── useRenameProjectEvent.ts      # No changes needed
└── schemas/
    └── project-event.schema.ts       # No changes needed
```

**Structure Decision**: Single file modification in existing domain structure. No new files needed.

## Complexity Tracking

> No violations - table not needed.
