# Implementation Plan: Projects List & Basic Project Management

**Branch**: `008-projects-list` | **Date**: 2025-12-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-projects-list/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable workspace admins to view, create, access, and soft-delete projects within a workspace. Projects are the organizational units for photo/video experiences, and this feature establishes the foundation for project management by providing CRUD operations with workspace-scoped access control. Implementation follows client-first architecture using Firebase Firestore for data persistence and real-time updates via TanStack Query.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**: TanStack Start 1.132, React 19.2, Firebase SDK (Firestore, Auth), TanStack Router 1.132, TanStack Query 5.66, Zod 4.1, shadcn/ui, Radix UI, Tailwind CSS 4
**Storage**: Firebase Firestore (NoSQL database), Firebase Storage (media files)
**Testing**: Vitest (unit tests), Testing Library (component tests)
**Target Platform**: Web application (responsive design, mobile-first)
**Project Type**: Web (full-stack TanStack Start application with client-first architecture)
**Performance Goals**: Projects list load <2 seconds (up to 100 projects), create project <3 seconds, soft delete <1 second
**Constraints**: Client-first architecture (Firebase client SDKs only, no custom server functions), workspace-scoped access control, real-time updates via Firestore listeners
**Scale/Scope**: <100 projects per workspace (no pagination needed), workspace admin authentication required

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Design ✅
- Primary viewport targets 320px-768px
- Interactive elements meet 44x44px minimum touch target
- Feature tested on mobile devices before completion
- Performance targets: <2s page load on 4G

**Status**: PASS - Feature is simple list/CRUD operations optimized for mobile

### Principle II: Clean Code & Simplicity ✅
- Follows YAGNI: implements only required functionality (list, create, delete, view)
- Single Responsibility: each component/hook has one clear purpose
- Functions kept small and focused
- No dead code or commented-out code
- DRY applied appropriately (common patterns extracted)

**Status**: PASS - Feature follows existing workspace patterns, no unnecessary complexity

### Principle III: Type-Safe Development ✅
- TypeScript strict mode enabled
- No `any` types used
- Strict null checks enforced
- Runtime validation with Zod for all Firestore operations
- Server-side validation via Firestore security rules

**Status**: PASS - All data validated with Zod, types defined, rules enforced

### Principle IV: Minimal Testing Strategy ✅
- Vitest unit tests for critical hooks (useProjects, useCreateProject, useDeleteProject)
- Testing Library tests for key components (ProjectsList, ProjectListItem)
- Focus on behavior, not implementation
- Critical path coverage: project creation, soft deletion

**Status**: PASS - Testing focused on critical user flows (list, create, delete)

### Principle V: Validation Gates ✅
- Format, lint, type-check before every commit
- Auto-fix with `pnpm check` command
- Local dev server verification before commit
- Standards compliance review (design system, project structure, security)

**Status**: PASS - Standard validation workflow applied

### Principle VI: Frontend Architecture ✅
- Client-first pattern: Firebase client SDK for all data operations
- SSR only for route entry points (metadata)
- Security via Firestore rules, not server code
- Real-time updates via `onSnapshot` listeners
- TanStack Query for client-side caching and state

**Status**: PASS - Follows client-first architecture, no custom server functions needed

### Principle VII: Backend & Firebase ✅
- Client SDK for reads and real-time subscriptions
- Admin SDK NOT needed (client SDK sufficient)
- Security rules enforce workspace-scoped access and soft delete validation
- Firestore document structure follows platform conventions

**Status**: PASS - Client SDK only, security enforced via Firestore rules

### Principle VIII: Project Structure ✅
- Vertical slice architecture: `domains/workspace/projects/` domain module (workspace-scoped, not admin-scoped)
- Organized by technical concern (components/, hooks/, containers/, types/, schemas/)
- Explicit file naming: `[domain].[purpose].[ext]` pattern
- Barrel exports in every folder
- Restricted public API (components, hooks, types only)

**Status**: PASS - New domain module follows established DDD structure

**Overall Constitution Check**: ✅ PASS - No violations, no complexity justification needed

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── domains/
│   └── workspace/
│       └── projects/                    # New feature domain module (workspace-scoped)
│           ├── components/              # UI components (ProjectListItem, DeleteProjectDialog)
│           │   ├── index.ts
│           │   ├── ProjectListItem.tsx
│           │   ├── ProjectListEmpty.tsx
│           │   └── DeleteProjectDialog.tsx
│           ├── containers/              # Page containers (ProjectsPage, ProjectDetailsPage)
│           │   ├── index.ts
│           │   ├── ProjectsPage.tsx
│           │   └── ProjectDetailsPage.tsx
│           ├── hooks/                   # Data hooks (useProjects, useCreateProject, useDeleteProject)
│           │   ├── index.ts
│           │   ├── useProjects.ts
│           │   ├── useCreateProject.ts
│           │   └── useDeleteProject.ts
│           ├── types/                   # TypeScript types
│           │   ├── index.ts
│           │   └── project.types.ts
│           ├── schemas/                 # Zod validation schemas
│           │   ├── index.ts
│           │   └── project.schemas.ts
│           └── index.ts                 # Public API (components, hooks, types only)
│
├── app/                                 # TanStack Router routes (thin wrappers)
│   └── workspace/
│       ├── $workspaceSlug.projects.tsx              # Projects list route (updated)
│       └── $workspaceSlug.projects.$projectId.tsx   # Project details route (new)
│
└── integrations/
    └── firebase/
        └── client.ts                    # Firestore client (existing, no changes)

firebase/                                # Monorepo root (outside apps/clementine-app/)
├── firestore.rules                      # Security rules (updated for projects collection)
└── firestore.indexes.json               # Indexes (updated for projects queries)
```

**Structure Decision**: Feature follows vertical slice architecture within `domains/workspace/projects/` (workspace-scoped domain, not admin domain). Routes in `app/workspace/` import containers from the domain module. All business logic, hooks, and components are co-located in the domain module following DDD principles. Security enforced via Firestore rules (monorepo root level), not server code (client-first architecture).

**Reference Pattern**: Use `domains/admin/workspace/` as reference for hooks structure (useWorkspaces, useDeleteWorkspace) and component patterns (WorkspaceListItem, DeleteWorkspaceDialog, WorkspaceListEmpty).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No complexity violations - feature follows all constitution principles without exception.

---

## Constitution Check Re-Evaluation (Post-Design)

*GATE: Re-check after Phase 1 design completion*

### Design Phase Review

After completing Phase 0 (Research) and Phase 1 (Design), all design artifacts have been generated:

- ✅ `research.md` - Architectural patterns and technology decisions
- ✅ `data-model.md` - Complete data model with Firestore structure
- ✅ `contracts/firestore.rules` - Security rules specification
- ✅ `contracts/firestore.indexes.json` - Database indexes configuration
- ✅ `quickstart.md` - Implementation guide with code examples

### Constitution Principles Re-Evaluation

**Principle I: Mobile-First Design** ✅ PASS
- Design reviewed: Components use responsive design with mobile-first breakpoints
- Touch targets: 44x44px minimum enforced in UI kit components (Button, Card)
- No violations introduced during design phase

**Principle II: Clean Code & Simplicity** ✅ PASS
- Vertical slice architecture maintained (domains/workspace/projects/)
- No premature abstractions introduced
- Each component/hook has single responsibility
- No violations introduced during design phase

**Principle III: Type-Safe Development** ✅ PASS
- TypeScript types defined in `types/project.types.ts`
- Zod schemas defined in `schemas/project.schemas.ts`
- Runtime validation at Firestore rules level
- No `any` types used in design
- No violations introduced during design phase

**Principle IV: Minimal Testing Strategy** ✅ PASS
- Testing strategy defined: critical hooks + key components only
- No excessive testing infrastructure introduced
- Pragmatic approach maintained
- No violations introduced during design phase

**Principle V: Validation Gates** ✅ PASS
- Design artifacts reviewed against standards
- Firestore security rules follow existing patterns
- Component architecture follows workspace patterns
- No violations introduced during design phase

**Principle VI: Frontend Architecture** ✅ PASS
- Client-first architecture confirmed in design
- Firebase client SDK only (no custom server functions)
- Real-time updates via onSnapshot
- Security via Firestore rules
- No violations introduced during design phase

**Principle VII: Backend & Firebase** ✅ PASS
- Client SDK pattern maintained
- Admin SDK not needed (confirmed in design)
- Security rules enforce all validation
- No violations introduced during design phase

**Principle VIII: Project Structure** ✅ PASS
- Vertical slice architecture maintained
- Domain module structure follows existing patterns
- Barrel exports defined correctly
- Restricted public API (no internal schemas exported)
- No violations introduced during design phase

### Standards Compliance Review

**Global Standards**:
- ✅ **Project Structure** - Follows DDD vertical slice architecture
- ✅ **Code Quality** - Design enforces validation workflow
- ✅ **Security** - Firestore rules enforce all security constraints
- ✅ **Zod Validation** - Runtime validation schemas defined

**Frontend Standards**:
- ✅ **Architecture** - Client-first pattern confirmed
- ✅ **Component Libraries** - Uses shadcn/ui (Button, Card, Dialog, Badge)
- ✅ **Design System** - No hard-coded colors (uses theme tokens)
- ✅ **State Management** - TanStack Query for server state, no unnecessary client state
- ✅ **Routing** - TanStack Router patterns followed

**Backend Standards**:
- ✅ **Firestore** - Security rules follow existing patterns
- ✅ **Firestore Security** - Read filtering + write validation enforced
- ✅ **Firebase Functions** - Not needed (client SDK sufficient)

**Testing Standards**:
- ✅ **Testing** - Minimal testing strategy defined (critical paths only)

### Final Constitution Status

**Overall Re-Evaluation**: ✅ **PASS** - No violations introduced during design phase

All design artifacts adhere to constitution principles and standards. Feature is ready for Phase 2 (Tasks Generation) and Phase 3 (Implementation).

**Risk Assessment**: **LOW**
- Design follows proven patterns from workspace feature
- No new architectural patterns introduced
- Security model is well-established (Firestore rules)
- Performance constraints validated (<100 projects per workspace)

**Recommendation**: Proceed to `/speckit.tasks` to generate implementation tasks.
