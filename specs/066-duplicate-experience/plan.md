# Implementation Plan: Duplicate Experience

**Branch**: `066-duplicate-experience` | **Date**: 2026-02-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/066-duplicate-experience/spec.md`

## Summary

Add a "Duplicate" action to the experience library context menu that creates a deep copy of an experience with all draft and published configuration preserved, but in an unpublished state. The action is instant (no confirmation modal), appends "(Copy)" to the name, and shows a toast notification on completion. The implementation follows existing mutation patterns (`useCreateExperience`, `useDeleteExperience`) and refactors the list item context menu to use the shared `ContextDropdownMenu` component.

## Technical Context

**Language/Version**: TypeScript 5.7, React 19, ES2022
**Primary Dependencies**: TanStack Query 5.x (mutations), Firebase Firestore (client SDK), sonner (toasts), lucide-react (icons), Zod 4.x (validation)
**Storage**: Firebase Firestore — `workspaces/{workspaceId}/experiences/{experienceId}`
**Testing**: Vitest (unit tests for naming utility)
**Target Platform**: Web (mobile-first), modern browsers
**Project Type**: Web application (TanStack Start monorepo)
**Performance Goals**: Duplicate appears in list within 2 seconds (SC-001)
**Constraints**: Client-first architecture — all operations via Firebase client SDK
**Scale/Scope**: Single mutation hook, 1 new utility function, 3 file modifications

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --------- | ------ | ----- |
| I. Mobile-First Design | PASS | Context menu uses 44px touch targets via `ContextDropdownMenu` |
| II. Clean Code & Simplicity | PASS | Minimal new code — 1 hook, 1 utility, 3 modifications. No new abstractions. |
| III. Type-Safe Development | PASS | Zod input schema, typed mutation hook, typed utility function |
| IV. Minimal Testing Strategy | PASS | Unit test for `generateDuplicateName` pure function |
| V. Validation Gates | PASS | Will run `pnpm check` + `pnpm type-check` before completion |
| VI. Frontend Architecture | PASS | Client-first: Firestore client SDK transaction, TanStack Query mutation |
| VII. Backend & Firebase | PASS | Client SDK for read + write within transaction. No Admin SDK needed. |
| VIII. Project Structure | PASS | Files placed in existing domain structure, barrel exports updated |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/066-duplicate-experience/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Research decisions
├── data-model.md        # Phase 1: Data model & field mapping
├── quickstart.md        # Phase 1: Implementation quickstart
├── contracts/
│   └── duplicate-experience.md  # Phase 1: Mutation & UI contracts
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── domains/experience/
│   ├── shared/
│   │   ├── hooks/
│   │   │   ├── useDuplicateExperience.ts    # NEW: Mutation hook
│   │   │   └── index.ts                      # MODIFY: Add export
│   │   ├── lib/
│   │   │   └── generate-duplicate-name.ts    # NEW: Naming utility
│   │   └── schemas/
│   │       └── experience.input.schemas.ts   # MODIFY: Add input schema
│   └── library/
│       ├── components/
│       │   └── ExperienceListItem.tsx        # MODIFY: Use ContextDropdownMenu
│       └── containers/
│           └── ExperiencesPage.tsx           # MODIFY: Wire duplicate action
└── shared/components/
    └── ContextDropdownMenu.tsx               # EXISTING: Reused as-is
```

**Structure Decision**: All new files placed within the existing `experience` domain structure. No new directories needed except `shared/lib/` if it doesn't exist yet.
