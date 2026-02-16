# Implementation Plan: Experience Loading Refactor — Scalable Connect & Fetch

**Branch**: `071-exp-connect-scale` | **Date**: 2026-02-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/071-exp-connect-scale/spec.md`

## Summary

Refactor experience data fetching in two areas: (1) WelcomeEditorPage switches from loading all workspace experiences to fetching only the connected experiences by ID, reusing the existing `useExperiencesByIds` hook. (2) ConnectExperienceDrawer switches from loading all compatible experiences at once to cursor-based paginated loading with a "Load More" button, using TanStack Query's `useInfiniteQuery` — the first paginated query in the codebase.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: React 19, TanStack Query 5.66.5, TanStack Router, Firebase SDK 12.5.0
**Storage**: Firebase Firestore (client SDK) — `workspaces/{workspaceId}/experiences` collection
**Testing**: Vitest + Testing Library
**Target Platform**: Web (desktop — creator dashboard)
**Project Type**: Web application (monorepo — `apps/clementine-app/`)
**Performance Goals**: Welcome Editor loads only connected experience data; drawer loads ≤ page-size experiences per fetch
**Constraints**: Firestore `in` clause limited to 30 values; `useInfiniteQuery` cursor pagination with `startAfter` + `limit`
**Scale/Scope**: 2 containers, 1 new hook, 1 modified hook, ~5 files changed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | N/A | Creator dashboard (desktop). Drawer already responsive via shadcn Sheet. |
| II. Clean Code & Simplicity | PASS | Reduces complexity by separating concerns. New hook is single-responsibility. |
| III. Type-Safe Development | PASS | All types already defined. No `any` needed. Zod validation via `convertFirestoreDoc`. |
| IV. Minimal Testing Strategy | PASS | Critical path testing for new pagination hook. |
| V. Validation Gates | PASS | `pnpm app:check` + `pnpm app:type-check` before commit. |
| VI. Frontend Architecture | PASS | Client-first Firestore queries. TanStack Query for caching. No server code. |
| VII. Backend & Firebase | PASS | Client SDK reads only. No security rule changes needed. |
| VIII. Project Structure | PASS | All changes within existing domain modules. Barrel exports updated. |

**Pre-Phase 0 gate: PASS** — No violations.

## Project Structure

### Documentation (this feature)

```text
specs/071-exp-connect-scale/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (internal hook contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── domains/
│   ├── project-config/
│   │   ├── welcome/
│   │   │   └── containers/
│   │   │       └── WelcomeEditorPage.tsx          # MODIFY: Replace useExperiencesForSlot with useExperiencesByIds
│   │   └── experiences/
│   │       ├── components/
│   │       │   └── ConnectExperienceDrawer.tsx     # MODIFY: Use paginated hook, add Load More UI
│   │       ├── hooks/
│   │       │   ├── useExperiencesForSlot.ts        # KEEP (still used by ConnectExperienceDrawer internally — will be replaced)
│   │       │   └── usePaginatedExperiencesForSlot.ts  # NEW: Paginated infinite query hook
│   │       └── index.ts                            # MODIFY: Add new hook export
│   └── experience/
│       └── shared/
│           ├── hooks/
│           │   └── useExperiencesByIds.ts          # REUSE (no changes needed)
│           └── queries/
│               └── experience.query.ts             # REUSE (no changes needed)
```

**Structure Decision**: All changes within existing domain modules. One new file (`usePaginatedExperiencesForSlot.ts`). No new directories needed. Follows vertical slice architecture within `project-config/experiences` domain.

## Post-Design Constitution Re-Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | N/A | No new UI surfaces. "Load More" button uses existing shadcn Button. |
| II. Clean Code & Simplicity | PASS | New hook is ~60 lines, single-responsibility. No new abstractions beyond what TanStack Query provides. |
| III. Type-Safe Development | PASS | `usePaginatedExperiencesForSlot` fully typed. Return type explicitly defined. Zod validation via `convertFirestoreDoc`. |
| IV. Minimal Testing Strategy | PASS | New hook is critical path — will have unit tests. |
| V. Validation Gates | PASS | All code will pass `pnpm app:check` + `pnpm app:type-check`. |
| VI. Frontend Architecture | PASS | Client-first pattern maintained. No server code. TanStack Query for caching. |
| VII. Backend & Firebase | PASS | Client SDK reads only. Same Firestore collection and indexes. No security rule changes. |
| VIII. Project Structure | PASS | Barrel exports updated. New hook follows naming convention. |

**Post-design gate: PASS** — No violations. No complexity tracking needed.
