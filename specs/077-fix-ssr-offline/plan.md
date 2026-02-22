# Implementation Plan: Fix SSR Firestore Offline Crash

**Branch**: `077-fix-ssr-offline` | **Date**: 2026-02-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/077-fix-ssr-offline/spec.md`

## Summary

Remove the broken server-side Firestore `getDoc()` call from the `$projectId.tsx` route loader that causes 500 errors on page refresh. Replace with client-side data fetching using the existing `useProject` hook and three-state rendering (loading/not-found/success), following the established pattern from the `$workspaceSlug.tsx` route.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**: TanStack Start 1.132.0, TanStack Router 1.132.0, TanStack Query 5.66.5, Firebase SDK 12.5.0
**Storage**: Firebase Firestore (client SDK — `onSnapshot` real-time listener)
**Testing**: Vitest (unit), manual verification (SSR behavior requires production build)
**Target Platform**: Web (SSR via TanStack Start, client hydration)
**Project Type**: Web application (monorepo — `apps/clementine-app/`)
**Performance Goals**: Page loads without 500 error; loading feedback within 1 second
**Constraints**: Must follow client-first architecture; no server-side Firebase client SDK calls
**Scale/Scope**: Single file change (`$projectId.tsx`), affects all project sub-routes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | N/A | Bug fix, no UI layout changes |
| II. Clean Code & Simplicity | PASS | Removing code (loader) and simplifying component — net reduction in complexity |
| III. Type-Safe Development | PASS | Existing `useProject` hook returns typed `Project \| null`; no new `any` types |
| IV. Minimal Testing Strategy | PASS | Manual verification of SSR behavior; no new test infrastructure needed |
| V. Validation Gates | PASS | Will run `pnpm app:check` and `pnpm app:type-check` before commit |
| VI. Frontend Architecture | PASS | Fix **restores** compliance — removes server-side Firebase client SDK call, relies on client-side hook |
| VII. Backend & Firebase | PASS | Client SDK used correctly (reads via `onSnapshot`); no Admin SDK needed |
| VIII. Project Structure | PASS | No structural changes; existing domain organization preserved |

**Pre-design gate**: PASS — all principles satisfied. No violations to justify.

**Post-design re-check**: PASS — the design removes a violation (server-side `getDoc()`) and aligns with the existing workspace route pattern.

## Project Structure

### Documentation (this feature)

```text
specs/077-fix-ssr-offline/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Research findings
├── data-model.md        # Phase 1: Data model (no changes)
├── quickstart.md        # Phase 1: Verification guide
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── app/workspace/$workspaceSlug.projects/
│   └── $projectId.tsx         # ← MODIFIED: Remove loader, add loading/not-found states
├── domains/project/shared/
│   └── hooks/useProject.ts    # Existing hook (unchanged) — provides real-time data
└── shared/components/
    └── NotFound.tsx            # Existing component (unchanged) — used by ProjectNotFound
```

**Structure Decision**: Single-file modification within the existing TanStack Start app. No new files, directories, or dependencies needed. The fix leverages existing infrastructure (`useProject` hook, `NotFound` component).

## Design

### Current Implementation (broken)

```
$projectId.tsx
├── loader: async ({ params })     ← Server-side getDoc() — FAILS on SSR
│   ├── getDoc(firestore, 'projects', projectId)
│   ├── convertFirestoreDoc(projectDoc, projectSchema)
│   └── return { project }
├── component: ProjectLayoutRoute
│   ├── useProject(projectId)      ← Client-side hook (redundant with loader)
│   └── if (!project) return null  ← Blank flash
└── notFoundComponent: ProjectNotFound
```

### Target Implementation (fixed)

```
$projectId.tsx
├── component: ProjectLayoutRoute
│   ├── useProject(projectId)            ← Client-side hook (sole data source)
│   ├── if (isLoading) → loading state   ← New: loading feedback
│   ├── if (!project || deleted) → not found  ← Moved from loader
│   └── return <ProjectLayout />         ← Existing render
└── notFoundComponent: ProjectNotFound   ← Preserved for router integration
```

### Exact Changes to `$projectId.tsx`

**Remove**:
- `loader` property and all its contents (lines 21-42)
- Imports: `doc`, `getDoc` from `firebase/firestore`
- Imports: `projectSchema` from `@clementine/shared`
- Imports: `firestore` from `@/integrations/firebase/client`
- Imports: `convertFirestoreDoc` from `@/shared/utils/firestore-utils`
- Import: `notFound` from `@tanstack/react-router`

**Modify** `ProjectLayoutRoute` component:
- Destructure `isLoading` from `useProject(projectId)` return value
- Add loading state: when `isLoading` is true, render centered loading text (matching workspace route pattern)
- Add not-found check: when `!project || project.status === 'deleted'`, render `<ProjectNotFound />`
- Remove the `return null` guard

**Keep unchanged**:
- `notFoundComponent: ProjectNotFound` in route definition
- `ProjectNotFound` component
- `ProjectLayout` rendering
- Route path and params

### Reference Pattern (`$workspaceSlug.tsx`)

The workspace route provides the exact pattern to follow:

```tsx
function WorkspaceLayout() {
  const { workspaceSlug } = Route.useParams()
  const { data: workspace, isLoading, isError } = useWorkspace(workspaceSlug)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading workspace...</div>
      </div>
    )
  }

  if (isError || !workspace) {
    return <WorkspaceNotFound />
  }

  return <Outlet />
}
```

The project route will mirror this with `useProject` instead of `useWorkspace`, and additionally check `project.status === 'deleted'`.
