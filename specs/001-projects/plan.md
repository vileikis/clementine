# Implementation Plan: Projects - Foundation for Nested Events

**Branch**: `001-projects` | **Date**: 2025-12-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-projects/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This implementation refactors the existing Events feature module to Projects, establishing the foundation for nested events in Phase 5 of the scalable architecture roadmap. The refactor renames collections, types, and UI components while preserving all existing business logic (status transitions, soft deletion, theme management, QR generation). Key changes include renaming `/events` → `/projects`, updating field names (`ownerId` → `companyId`, `joinPath` → `sharePath`, `activeJourneyId` → `activeEventId`), and restructuring the admin UI with Projects List and Project Details pages (Events tab placeholder + Distribute tab with share link/QR code). This is a rename/refactor with temporary field preservation - some Event fields (theme, scheduling) remain at project level temporarily and will move to nested Events in Phase 5.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui, Firebase (Firestore + Storage), Zod 4.x
**Storage**: Firebase Firestore (collection rename `/events` → `/projects`), Firebase Storage (QR codes at `media/{companyId}/qr/{projectId}.png`)
**Testing**: Jest (unit tests), React Testing Library (component tests)
**Target Platform**: Web (mobile-first 320px-768px, desktop 1024px+)
**Project Type**: Web monorepo (pnpm workspace with `web/` and `functions/`)
**Performance Goals**: Projects List page load < 2 seconds, project creation < 1 minute, QR generation < 5 seconds, mobile-first 4G performance
**Constraints**: TypeScript strict mode (no `any` escapes), Firebase security rules (allow reads, deny writes), backwards compatibility NOT required (breaking rename)
**Scale/Scope**: Feature module refactor affecting `web/src/features/events/` → `web/src/features/projects/`, estimated ~30-50 files to rename/update, 3 new UI pages (Projects List, Project Details with 2 tabs)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Projects List and Project Details pages designed mobile-first (320px-768px primary), all touch targets ≥44x44px (project cards, tabs, buttons), typography ≥14px body text
- [x] **Clean Code & Simplicity**: Refactor preserves existing business logic without new abstractions, follows YAGNI (no nested Events yet - Phase 5), maintains single responsibility in feature module structure
- [x] **Type-Safe Development**: TypeScript strict mode maintained throughout refactor, no `any` escapes, Zod validation for Project create/update forms (name, status, companyId, sharePath)
- [x] **Minimal Testing Strategy**: Jest unit tests for critical paths (project creation, status transitions, soft delete), React Testing Library for UI components (ProjectCard, ProjectForm), tests co-located directly next to source files (e.g., ProjectCard.tsx + ProjectCard.test.tsx in same directory)
- [x] **Validation Loop Discipline**: Plan includes validation tasks after Phase 1 (pnpm lint, pnpm type-check, pnpm test) before completion
- [x] **Firebase Architecture Standards**: Admin SDK for writes (createProject, updateProject, deleteProject via Server Actions), Client SDK for real-time reads (project list subscriptions), schemas in `features/projects/schemas/`, QR codes stored as full public URLs
- [x] **Feature Module Architecture**: Feature module structure preserved: `features/projects/` with actions/, repositories/, schemas/, components/, types/ organized by technical concern
- [x] **Technical Standards**: Reviewed applicable standards: `global/tech-stack.md`, `global/feature-modules.md`, `global/coding-style.md`, `backend/firebase.md`, `frontend/components.md`, `frontend/responsive.md`

**Complexity Violations**: None - this is a straightforward rename/refactor that preserves existing architecture without introducing new abstraction layers or patterns.

## Project Structure

### Documentation (this feature)

```text
specs/001-projects/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (in progress)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (Server Actions API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
web/src/features/projects/          # Feature module (renamed from events/)
├── actions/                         # Server Actions (Admin SDK mutations)
│   └── projects.actions.ts         # createProject, updateProject, deleteProject, updateProjectStatus
├── repositories/                    # Firestore queries
│   └── projects.repository.ts      # getProject, listProjects, getProjectBySharePath
├── schemas/                         # Zod validation schemas
│   ├── project.schema.ts           # Project, ProjectTheme schemas
│   └── index.ts                    # Barrel exports
├── components/                      # React components (PascalCase file names)
│   ├── ProjectCard.tsx             # Project list item (renamed from EventCard)
│   ├── ProjectForm.tsx             # Create/edit form (renamed from EventForm)
│   ├── ProjectStatusBadge.tsx      # Status indicator
│   ├── ProjectDetailsHeader.tsx    # Details page header with status switcher
│   ├── ProjectEventsTab.tsx        # Events tab (placeholder for Phase 5)
│   ├── ProjectDistributeTab.tsx    # Distribute tab (share link + QR)
│   └── index.ts                    # Barrel exports (components/hooks only)
├── hooks/                          # React hooks (camelCase file names)
│   ├── useProject.ts               # Single project subscription
│   ├── useProjects.ts              # Projects list subscription
│   └── index.ts                    # Barrel exports
├── types/                          # TypeScript types
│   ├── project.types.ts            # Project, ProjectTheme, ProjectStatus types
│   └── index.ts                    # Barrel exports
└── index.ts                        # Public API (components, hooks, types only)

web/src/app/                        # Next.js App Router pages
├── (authenticated)/                # Protected routes
│   └── projects/                   # Projects feature routes
│       ├── page.tsx                # Projects List page
│       └── [projectId]/            # Project Details routes
│           └── page.tsx            # Project Details page (tabs: Events, Distribute)

# Note: Tests are co-located next to source files (not in separate __tests__ folders)
# Example test locations:
#   actions/projects.actions.test.ts (next to projects.actions.ts)
#   components/ProjectCard.test.tsx (next to ProjectCard.tsx)
#   repositories/projects.repository.test.ts (next to projects.repository.ts)
#   hooks/useProjects.test.ts (next to useProjects.ts)
```

**Structure Decision**: Web monorepo structure (Option 2 variant) with Next.js App Router. Feature module follows vertical slice architecture (`features/projects/`) with all domain logic, components, and data access co-located. Tests are co-located directly next to source files (e.g., `ProjectCard.tsx` + `ProjectCard.test.tsx` in same directory). Pages live in App Router structure under `app/(authenticated)/projects/`.

## Complexity Tracking

No complexity violations - all Constitution Check items passed. This refactor maintains existing architecture without introducing new patterns or abstractions.

## Post-Design Constitution Check

**Re-evaluation Date**: 2025-12-02 (after Phase 1 design completion)

After completing Phase 0 (Research) and Phase 1 (Design & Contracts), re-evaluating all Constitution principles:

- [x] **Mobile-First Responsive Design**: ✅ CONFIRMED - Projects List and Project Details pages designed with mobile-first approach (320px-768px primary), all touch targets ≥44x44px per design specs
- [x] **Clean Code & Simplicity**: ✅ CONFIRMED - Refactor preserves existing business logic without new abstractions, maintains single responsibility, no premature optimization
- [x] **Type-Safe Development**: ✅ CONFIRMED - All data models defined with TypeScript strict mode, Zod schemas created for validation (see data-model.md), no `any` escapes
- [x] **Minimal Testing Strategy**: ✅ CONFIRMED - Testing strategy defined in research.md (Jest unit tests for actions/repositories, React Testing Library for components, tests co-located directly next to source files)
- [x] **Validation Loop Discipline**: ✅ CONFIRMED - Validation loop documented in quickstart.md Phase 5 (pnpm lint, type-check, test)
- [x] **Firebase Architecture Standards**: ✅ CONFIRMED - API contracts follow hybrid pattern (Admin SDK for writes via Server Actions, Client SDK for real-time reads), schemas in features/projects/schemas/, QR codes stored as full public URLs
- [x] **Feature Module Architecture**: ✅ CONFIRMED - Feature module structure documented in plan.md Project Structure section, follows vertical slice with technical concern organization
- [x] **Technical Standards**: ✅ CONFIRMED - All applicable standards referenced (global/tech-stack.md, global/feature-modules.md, backend/firebase.md, frontend/responsive.md)

**Design Changes Since Initial Check**: None - design phase confirmed all initial assumptions. No new violations introduced.

**Ready for Phase 2**: ✅ All Constitution principles validated post-design. Ready to proceed to task generation (`/speckit.tasks`).

## Phase Summary

**Phase 0 Complete** ✅
- Research findings documented in [research.md](research.md)
- All technology decisions confirmed (no new dependencies)
- Migration strategy defined (manual refactor + data migration script)

**Phase 1 Complete** ✅
- Data model defined in [data-model.md](data-model.md)
- API contracts generated:
  - [Server Actions contract](contracts/projects.actions.md) - createProject, updateProject, updateProjectStatus, deleteProject, updateProjectTheme
  - [Repository contract](contracts/projects.repository.md) - getProject, listProjects, getProjectBySharePath
- Implementation quickstart created in [quickstart.md](quickstart.md)
- Agent context updated (CLAUDE.md)

**Next Step**: Run `/speckit.tasks` to generate actionable task breakdown from this implementation plan.
