# Implementation Plan: Project UX & Actions

**Branch**: `076-project-ux-actions` | **Date**: 2026-02-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/076-project-ux-actions/spec.md`

## Summary

Add three UX improvements to bring project management to parity with the experience domain: (1) a clickable project name badge in the designer TopNavBar that opens a rename dialog, (2) project duplication via context menu in the project list, and (3) fully clickable/hoverable cards for both project and experience list items.

All changes are client-side only — no new API endpoints or Cloud Functions. Mutations use existing Firestore client SDK patterns (transactions, `serverTimestamp`, query invalidation).

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: React 19, TanStack Router 1.132.0, TanStack Query 5.66.5, Firebase SDK 12.5.0, shadcn/ui, Radix UI, lucide-react, sonner (toasts), Zod 4.1.12
**Storage**: Firebase Firestore — `projects/{projectId}` (top-level collection)
**Testing**: Vitest (unit tests for utility functions; component testing deferred per constitution Principle IV)
**Target Platform**: Web (mobile-first, desktop secondary)
**Project Type**: Web application (TanStack Start monorepo)
**Performance Goals**: Rename completes in <10 seconds; duplicate appears within 3 seconds
**Constraints**: 44px minimum touch targets; hover effects instant on cursor enter
**Scale/Scope**: ~6 files modified, ~3 new files, purely frontend

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --------- | ------ | ----- |
| I. Mobile-First | PASS | 44px touch targets on all interactive elements; hover effects degrade gracefully on touch |
| II. Clean Code & Simplicity | PASS | Reuses existing patterns (identity badge, duplicate hook, context menu). No new abstractions |
| III. Type-Safe Development | PASS | All inputs validated with Zod schemas; strict TypeScript throughout |
| IV. Minimal Testing | PASS | Unit test for `generateDuplicateName` reuse; no new complex logic requiring tests |
| V. Validation Gates | PASS | `pnpm check` + `pnpm type-check` before commit; standards review for design system compliance |
| VI. Frontend Architecture | PASS | Client-first: Firestore client SDK for all mutations; no server functions |
| VII. Backend & Firebase | PASS | Client SDK transactions for rename and duplicate; query invalidation for cache consistency |
| VIII. Project Structure | PASS | Vertical slice: new files in correct domain directories; barrel exports updated |

**Post-design re-check**: All gates still pass. No new violations introduced during design.

## Project Structure

### Documentation (this feature)

```text
specs/076-project-ux-actions/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (client-side mutation contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── domains/
│   ├── project/
│   │   └── layout/
│   │       ├── components/
│   │       │   └── ProjectIdentityBadge.tsx    # NEW — clickable name badge
│   │       └── containers/
│   │           └── ProjectLayout.tsx            # MODIFIED — integrate badge + rename dialog
│   │
│   ├── workspace/
│   │   └── projects/
│   │       ├── components/
│   │       │   └── ProjectListItem.tsx          # MODIFIED — ContextDropdownMenu, full-card click, hover
│   │       ├── containers/
│   │       │   └── ProjectsPage.tsx             # MODIFIED — build menuSections, duplicate handler
│   │       ├── hooks/
│   │       │   ├── useDuplicateProject.ts       # NEW — duplicate mutation hook
│   │       │   └── index.ts                     # MODIFIED — export new hook
│   │       └── schemas/
│   │           └── project.schemas.ts           # MODIFIED — add duplicateProjectInputSchema
│   │
│   └── experience/
│       └── library/
│           └── components/
│               └── ExperienceListItem.tsx        # MODIFIED — full-card click, hover
│
└── shared/
    └── components/
        └── ContextDropdownMenu.tsx               # UNCHANGED — already supports MenuSection[]
```

**Structure Decision**: Existing monorepo web app structure. All changes within `apps/clementine-app/src/domains/`. New files follow the established vertical slice pattern — components in `/components/`, hooks in `/hooks/`, schemas in `/schemas/`.

## Implementation Details

### 1. ProjectIdentityBadge Component

**New file**: `domains/project/layout/components/ProjectIdentityBadge.tsx`

Renders a clickable `<button>` showing project name + hover pencil icon. Follows `ExperienceIdentityBadge` pattern but without thumbnail (projects have no cover image).

```
Props: { name: string; onClick: () => void }
Renders: <button> → name text (truncated 200px) + Pencil icon (opacity-0 → group-hover:opacity-100)
Classes: group flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-accent
```

### 2. ProjectLayout Integration

**Modified file**: `domains/project/layout/containers/ProjectLayout.tsx`

- Add `RenameProjectDialog` import and state (`isRenameOpen`)
- Replace static `project.name` breadcrumb label with `<ProjectIdentityBadge>` component
- Pass `onClick={() => setIsRenameOpen(true)}` to badge
- Render `<RenameProjectDialog>` with project props
- Need `workspaceId` — check if available from route params or project object

### 3. useDuplicateProject Hook

**New file**: `domains/workspace/projects/hooks/useDuplicateProject.ts`

Pattern from `useDuplicateExperience`:
1. Validate input with `duplicateProjectInputSchema`
2. Firestore transaction: read source project → verify exists and not deleted
3. `structuredClone(source.draftConfig)` for deep clone
4. Generate name with `generateDuplicateName(source.name)`
5. Set new doc with reset publish state (`publishedConfig: null`, `draftVersion: 1`)
6. On success: invalidate `['projects', workspaceId]`
7. On error: report to Sentry

Returns `{ workspaceId, projectId, name }`.

### 4. ProjectListItem Migration

**Modified file**: `domains/workspace/projects/components/ProjectListItem.tsx`

Changes:
- Remove inline `DropdownMenu` imports and markup
- Accept `menuSections?: MenuSection[]` prop (replaces `onDelete`/`isDeleting`)
- Use `ContextDropdownMenu` component with `sections={menuSections}`
- Remove internal `showDeleteDialog`/`showRenameDialog` state (moved to parent)
- Remove `DeleteProjectDialog` and `RenameProjectDialog` renders (moved to parent)
- Make entire card a `<Link>` wrapper with hover effect
- Context menu button uses `onClick stopPropagation` to prevent navigation

### 5. ProjectsPage Menu Construction

**Modified file**: `domains/workspace/projects/containers/ProjectsPage.tsx`

Changes:
- Import `useDuplicateProject`, `Copy`, `Pencil`, `Trash2` icons
- Add dialog state for rename target and delete target (like `ExperiencesPage`)
- Build `getMenuSections(project): MenuSection[]` function
- Add `handleDuplicate(project)` with toast feedback
- Pass `menuSections` to `ProjectListItem`
- Render `RenameProjectDialog` and `DeleteProjectDialog` at page level

### 6. Fully Clickable Cards

**Modified files**: `ProjectListItem.tsx` and `ExperienceListItem.tsx`

Pattern for both:
- Card becomes a `<Link>` (or Card wrapped in Link) with `transition-colors hover:bg-accent/50 cursor-pointer`
- All content inside the link navigates on click
- Context menu trigger wrapped in a `<div onClick={e => e.stopPropagation()}>` to isolate clicks
- Remove the inner `<Link>` that currently wraps only the content area
- Keyboard: `<Link>` renders as `<a>`, natively focusable + Enter-activatable
