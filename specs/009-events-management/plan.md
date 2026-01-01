# Implementation Plan: Events Management

**Branch**: `009-events-management` | **Date**: 2026-01-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-events-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable workspace admins to manage project events within a project through a comprehensive project events management interface. Admins can create new project events with default naming, view all active project events in a list, activate exactly one project event at a time (or none), rename project events for organization, and soft-delete project events to maintain workspace cleanliness. The implementation follows client-first architecture with Firebase Firestore subcollections for data persistence, TanStack Query for client-side data management, and strict type safety with Zod validation.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**: TanStack Start 1.132, React 19.2, Firebase SDK (Firestore, Auth), TanStack Router 1.132, TanStack Query 5.66, Zod 4.1, shadcn/ui, Radix UI, Tailwind CSS 4
**Storage**: Firebase Firestore (NoSQL database), Firebase Storage (media files)
**Testing**: Vitest (unit testing), Testing Library (component testing)
**Target Platform**: Web (mobile-first responsive design, primary viewport 320px-768px)
**Project Type**: Web application (TanStack Start full-stack framework)
**Performance Goals**: Page load < 2 seconds on 4G networks, real-time event list updates < 500ms, event operations (create/rename/delete/activate) < 2 seconds
**Constraints**: Mobile touch target minimum 44x44px, offline-capable reads via Firestore cache, client-first architecture with minimal server functions
**Scale/Scope**: Support 100+ events per project, 1000+ concurrent workspace admins, real-time updates across multiple sessions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Principle I: Mobile-First Design

- **Status**: COMPLIANT
- **Evidence**: Feature spec defines mobile-first targets (320px-768px viewport), 44x44px touch targets for all interactive elements (event items, switches, context menus), performance targets include mobile 4G networks
- **Implementation**: Will use Tailwind CSS 4 mobile-first breakpoints, test on real mobile devices, ensure all event management controls are touch-friendly

### ✅ Principle II: Clean Code & Simplicity

- **Status**: COMPLIANT
- **Evidence**: Feature is focused on single responsibility (events management), no premature abstractions planned, follows YAGNI principle
- **Implementation**: Small focused components (EventsList, EventItem, CreateEventButton), single-purpose hooks (useEvents, useCreateEvent, useDeleteEvent, useActivateEvent), no complex state machines or over-engineering

### ✅ Principle III: Type-Safe Development

- **Status**: COMPLIANT
- **Evidence**: TypeScript strict mode enabled, Zod schemas for Event entity and all mutations, runtime validation for all Firestore operations
- **Implementation**: Event schema with Zod validation, type-safe Firestore operations, strict null checks for deletedAt and activeEventId fields

### ✅ Principle IV: Minimal Testing Strategy

- **Status**: COMPLIANT
- **Evidence**: Testing focused on critical user flows (event creation, activation, deletion), behavior-driven tests using Testing Library
- **Implementation**: Unit tests for hooks (useCreateEvent, useActivateEvent), component tests for EventsList and EventItem, focus on user interactions over implementation details, target 70%+ overall coverage, 90%+ for critical paths

### ✅ Principle V: Validation Gates

- **Status**: COMPLIANT
- **Evidence**: Will run validation loop before commits (format, lint, type-check), standards compliance review for design system, Firestore patterns, and component libraries
- **Implementation**: Pre-commit: `pnpm app:check` for auto-fixes, `pnpm type-check` for strict TypeScript validation, manual review against `frontend/design-system.md`, `frontend/component-libraries.md`, `backend/firestore.md`, `global/project-structure.md`

### ✅ Principle VI: Frontend Architecture

- **Status**: COMPLIANT
- **Evidence**: Client-first pattern using Firebase client SDK for all data operations, Firestore security rules for authorization, TanStack Query for client-side caching, real-time updates via `onSnapshot`
- **Implementation**: All event CRUD operations use Firestore client SDK, security enforced via Firestore rules (workspace admins only), real-time event list updates with `onSnapshot`, minimal server code (SSR only for project detail page entry point)

### ✅ Principle VII: Backend & Firebase

- **Status**: COMPLIANT
- **Evidence**: Client SDK for reads and real-time subscriptions, Firestore security rules deny writes (force mutations through validated server functions if needed), public URLs stored in Firestore for media
- **Implementation**: Events collection with security rules enforcing workspace admin authorization, soft delete via status field (no actual deletion), activeEventId stored on project document (atomic activation constraint)

### ✅ Principle VIII: Project Structure

- **Status**: COMPLIANT
- **Evidence**: Vertical slice architecture with new top-level project domain, project events will be under `/domains/project/events`, organized by technical concern with barrel exports
- **Implementation**:
  ```
  src/domains/project/events/
  ├── components/       # ProjectEventsList, ProjectEventItem, CreateProjectEventButton
  ├── containers/       # ProjectEventsPage
  ├── hooks/           # useProjectEvents, useCreateProjectEvent, useDeleteProjectEvent, useActivateProjectEvent
  ├── schemas/         # projectEventSchema, createProjectEventSchema, updateProjectEventSchema
  ├── types/           # ProjectEvent, ProjectEventStatus
  └── index.ts         # Barrel export (components, hooks, types only)
  ```

### Standards Compliance Review

**Applicable Standards**:
- ✅ `global/project-structure.md` - Vertical slice architecture for events subdomain
- ✅ `global/client-first-architecture.md` - Client SDK for all operations, security via rules
- ✅ `global/code-quality.md` - Validation workflows, clean code principles
- ✅ `global/security.md` - Input validation with Zod, Firestore security rules
- ✅ `global/zod-validation.md` - Runtime validation for all external inputs
- ✅ `frontend/design-system.md` - Theme tokens, no hard-coded colors
- ✅ `frontend/component-libraries.md` - shadcn/ui (AlertDialog, Switch), Radix UI (DropdownMenu)
- ✅ `frontend/accessibility.md` - WCAG AA compliance, keyboard navigation
- ✅ `frontend/state-management.md` - TanStack Query for server state, minimal client state
- ✅ `backend/firestore.md` - Firestore client patterns, real-time subscriptions
- ✅ `backend/firestore-security.md` - Security rules for events collection

**Deviations**: None

**Gate Status**: ✅ PASSED - All principles compliant, all applicable standards identified, no deviations

## Project Structure

### Documentation (this feature)

```text
specs/009-events-management/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── events.graphql   # GraphQL-style contract (for documentation)
│   └── events.openapi.yaml  # OpenAPI contract (for documentation)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── domains/
│   ├── project/                           # NEW: Project domain (top-level)
│   │   └── events/                        # NEW: Project events subdomain
│   │       ├── components/
│   │       │   ├── ProjectEventsList.tsx  # List of project events with empty state
│   │       │   ├── ProjectEventItem.tsx   # Individual project event with activation switch and context menu
│   │       │   ├── CreateProjectEventButton.tsx  # Button to create new project event
│   │       │   ├── DeleteProjectEventDialog.tsx  # Confirmation dialog for deletion
│   │       │   └── RenameProjectEventDialog.tsx  # Dialog for renaming project event
│   │       ├── containers/
│   │       │   └── ProjectEventsPage.tsx  # Main page component for project detail page
│   │       ├── hooks/
│   │       │   ├── useProjectEvents.ts    # Real-time project events list subscription
│   │       │   ├── useCreateProjectEvent.ts  # Create project event mutation
│   │       │   ├── useDeleteProjectEvent.ts  # Soft delete project event mutation
│   │       │   ├── useRenameProjectEvent.ts  # Rename project event mutation
│   │       │   └── useActivateProjectEvent.ts # Activate/deactivate project event mutation
│   │       ├── schemas/
│   │       │   ├── project-event.schema.ts    # ProjectEvent entity Zod schema
│   │       │   ├── create-project-event.schema.ts  # Create project event input schema
│   │       │   ├── update-project-event.schema.ts  # Update project event input schema
│   │       │   └── index.ts               # Schema exports
│   │       ├── types/
│   │       │   ├── project-event.types.ts # ProjectEvent, ProjectEventStatus types
│   │       │   └── index.ts               # Type exports
│   │       └── index.ts                   # Barrel export (components, hooks, types only)
│   └── workspace/                         # Existing
│       ├── projects/                      # Existing - Projects list/management
│       │   ├── schemas/                   # MODIFIED: Add activeEventId to project schema
│       │   └── ...
│       └── ...
├── integrations/
│   └── firebase/
│       ├── client.ts                      # Existing - Firestore client SDK
│       └── admin.ts                       # Existing - Admin SDK (server only)
└── app/
    └── routes/
        └── workspace/
            └── $workspaceSlug/
                └── projects/
                    └── $projectId/
                        └── index.tsx      # MODIFIED: Import ProjectEventsPage
```

**Structure Decision**: Using vertical slice architecture with a new top-level `project` domain. This separates project-level features (project events list, sharing, settings) from workspace-level features and from future event editing features (which will live in `/domains/event`). The structure follows DDD principles with clear bounded contexts:
- `/domains/project` - Project details and management (events list, sharing, settings)
- `/domains/event` - Future: Individual event editing (welcome-editor, theme-editor, settings)

This parallel structure makes the architecture intuitive and scalable as both domains grow independently. Project events are stored as Firestore subcollections under `projects/{projectId}/events/{eventId}`, making ownership explicit and queries efficient.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - this section is not needed.

## Phase 0: Research & Unknowns

### Research Tasks

All technical context is known from existing codebase patterns. No research needed.

**Resolved**:
- ✅ Firebase Firestore patterns: Use subcollection structure `projects/{projectId}/events` with client SDK
- ✅ TanStack Query patterns: Use existing mutation and query hooks from workspace domain
- ✅ shadcn/ui components: Use AlertDialog (deletion confirmation), Switch (activation toggle), DropdownMenu (context menu for rename/delete)
- ✅ Radix UI primitives: Already integrated via shadcn/ui
- ✅ Real-time subscriptions: Use existing onSnapshot patterns with subcollection paths
- ✅ Soft delete patterns: Status field with "draft" | "deleted" enum
- ✅ Single active event constraint: Store activeEventId on project document, atomic update on activation
- ✅ Security rules: Simple admin checks only (per standards/backend/firestore-security.md)

### Technology Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Firestore subcollection structure | Clear ownership (events under projects), projectId implicit in path, aligns with domain model. | Top-level collection (rejected: less clear ownership, projectId as field redundant), separate collection with complex joins (rejected: Firestore doesn't support joins) |
| Client-first with Firestore client SDK | Aligns with constitution Principle VI and existing architecture. Enables real-time updates, reduces server complexity. | Server-first with API routes (rejected: increases complexity, loses real-time updates, violates architecture principles) |
| Simple admin-only security rules | Follows standards/backend/firestore-security.md. Simple authentication checks only, no data validation in rules. | Complex rules with data validation (rejected: violates standards, hard to maintain, expensive get() calls) |
| Zod for validation | Constitution Principle III mandates runtime validation. Already used throughout codebase. All data validation in application code, not security rules. | TypeScript only (rejected: no runtime validation), validation in security rules (rejected: violates standards) |
| TanStack Query for mutations | Existing pattern in workspace domain. Provides caching, optimistic updates, error handling. | Direct Firestore calls (rejected: loses caching and error handling), custom hooks (rejected: reinvents TanStack Query) |
| Soft delete via status field | Preserves data for potential recovery, simpler than hard delete with cascade. Spec explicitly requires soft delete. | Hard delete with cascade (rejected: spec requires soft delete), separate deleted collection (rejected: adds complexity) |
| activeEventId on project document | Atomic constraint enforcement (only one active event), simple to query and update. | activeEventId on event document (rejected: cannot enforce single active constraint atomically), separate activeEvents collection (rejected: over-engineering) |
| "ProjectEvent" terminology | Clear, unambiguous naming. Distinguishes from other event types (system events, analytics events). | "Event" (rejected: too generic, potential conflicts), "ProjectActivity" (rejected: less clear), keep subcollection named "events" (simpler paths) |
| shadcn/ui AlertDialog for deletion | Matches existing component library standard. Accessible, mobile-friendly confirmation. | Custom modal (rejected: reinvents AlertDialog), browser confirm() (rejected: not mobile-friendly, poor UX) |
| shadcn/ui Switch for activation | Mobile-friendly toggle control, clear visual feedback, accessible. | Checkbox (rejected: switch is clearer for activation state), button (rejected: less intuitive for on/off state) |
| Radix DropdownMenu for context menu | Matches existing component library standard. Accessible, mobile-friendly menu. | Custom context menu (rejected: reinvents DropdownMenu), right-click context menu (rejected: not mobile-friendly) |

### Best Practices

| Technology | Best Practice | Source |
|------------|--------------|--------|
| Firestore Client SDK | Use onSnapshot for real-time subscriptions, handle cleanup in useEffect return | `standards/backend/firestore.md` |
| TanStack Query | Use mutations with onSuccess callbacks for navigation, optimistic updates for instant feedback | `standards/frontend/state-management.md` |
| Zod Validation | Validate all Firestore inputs and outputs, parse with .parse() not .safeParse() in server contexts | `standards/global/zod-validation.md` |
| shadcn/ui | Extend components with composition, preserve accessibility, use theme tokens | `standards/frontend/component-libraries.md` |
| Mobile-First | Touch targets 44x44px minimum, test on real devices, optimize for 4G networks | Constitution Principle I |

## Phase 1: Design & Contracts

### Data Model

See [data-model.md](./data-model.md) for complete entity definitions, relationships, validation rules, and state transitions.

**Summary**:
- **ProjectEvent Entity**: id, name, status, createdAt, updatedAt, deletedAt (stored in `projects/{projectId}/events` subcollection)
- **Project Entity Update**: Add activeEventId field (optional, references single active project event)
- **Relationships**: ProjectEvent belongs to Project (via subcollection path), Project has many ProjectEvents, Project has optional activeEvent reference
- **Security**: Simple admin-only rules (no data validation in rules, per standards)

### API Contracts

See [contracts/](./contracts/) for complete API specifications.

**Summary**:
- **Queries**: getProjectEvents(projectId) → ProjectEvent[], getProjectEvent(projectId, eventId) → ProjectEvent
- **Mutations**: createProjectEvent(projectId, name?) → ProjectEvent, updateProjectEvent(projectId, eventId, name) → ProjectEvent, deleteProjectEvent(projectId, eventId) → void, activateProjectEvent(projectId, eventId) → void, deactivateProjectEvent(projectId) → void

### Quickstart Guide

See [quickstart.md](./quickstart.md) for developer onboarding and implementation guide.

## Post-Design Constitution Check

*Re-evaluation after Phase 1 design completion*

### ✅ Principle I: Mobile-First Design

- **Status**: COMPLIANT
- **Design Evidence**: Components use shadcn/ui Switch (44x44px touch target), DropdownMenu (mobile-friendly), AlertDialog (responsive). EventItem entire row clickable (large touch area). Tailwind CSS 4 mobile-first breakpoints applied.
- **No Changes**: Design maintains mobile-first compliance

### ✅ Principle II: Clean Code & Simplicity

- **Status**: COMPLIANT
- **Design Evidence**: 5 focused components (ProjectEventsList, ProjectEventItem, CreateProjectEventButton, DeleteProjectEventDialog, RenameProjectEventDialog), 5 single-purpose hooks (useProjectEvents, useCreateProjectEvent, useRenameProjectEvent, useDeleteProjectEvent, useActivateProjectEvent). No complex abstractions. Subcollection structure simplifies queries (projectId in path, not field).
- **No Changes**: Design maintains simplicity

### ✅ Principle III: Type-Safe Development

- **Status**: COMPLIANT
- **Design Evidence**: All schemas defined with Zod (projectEventSchema, createProjectEventInputSchema, updateProjectEventInputSchema, activateProjectEventInputSchema, deactivateProjectEventInputSchema). Runtime validation for all Firestore operations in application code (NOT in security rules, per standards). Strict TypeScript types derived from Zod schemas.
- **No Changes**: Design maintains type safety with validation in application code only

### ✅ Principle IV: Minimal Testing Strategy

- **Status**: COMPLIANT
- **Design Evidence**: Unit tests for 5 hooks, component tests for 5 components. Focus on user interactions and critical flows (creation, activation, deletion). No over-testing.
- **No Changes**: Design maintains minimal testing strategy

### ✅ Principle V: Validation Gates

- **Status**: COMPLIANT
- **Design Evidence**: Pre-commit workflow defined (`pnpm app:check`, `pnpm type-check`). Standards compliance checklist identifies 11 applicable standards (all compliant).
- **No Changes**: Design maintains validation gates

### ✅ Principle VI: Frontend Architecture

- **Status**: COMPLIANT
- **Design Evidence**: All operations use Firestore client SDK with subcollection paths (collection, query, onSnapshot, addDoc, updateDoc, runTransaction). Security enforced via simple admin-only Firestore rules (per standards). Real-time updates via onSnapshot. Zero server functions.
- **No Changes**: Design maintains client-first architecture with subcollections

### ✅ Principle VII: Backend & Firebase

- **Status**: COMPLIANT
- **Design Evidence**: Client SDK for reads (onSnapshot on subcollection), writes (addDoc, updateDoc on subcollection), and transactions. Security rules use simple admin checks ONLY (no data validation in rules, per standards/backend/firestore-security.md). Soft delete via status field (no hard deletes).
- **Key Improvement**: Simplified security rules to follow standards (admin checks only, no expensive get() calls, no data validation)

### ✅ Principle VIII: Project Structure

- **Status**: COMPLIANT
- **Design Evidence**: Vertical slice architecture implemented under new top-level `/domains/project/events/` domain. Organized by technical concern (components/, containers/, hooks/, schemas/, types/). Barrel exports defined. Restricted public API (components, hooks, types only). Clear separation from future `/domains/event` (event editing).
- **Key Change**: New top-level `/domains/project` domain (vs nested under workspace)

### Standards Compliance Re-Check

All 11 applicable standards remain compliant:
- ✅ `global/project-structure.md` - Vertical slice implemented
- ✅ `global/client-first-architecture.md` - Client SDK only, no server functions
- ✅ `global/code-quality.md` - Validation workflows defined
- ✅ `global/security.md` - Zod validation, Firestore rules
- ✅ `global/zod-validation.md` - All schemas defined with Zod
- ✅ `frontend/design-system.md` - Theme tokens, no hard-coded colors
- ✅ `frontend/component-libraries.md` - shadcn/ui (AlertDialog, Switch, DropdownMenu)
- ✅ `frontend/accessibility.md` - WCAG AA via shadcn/ui components
- ✅ `frontend/state-management.md` - TanStack Query for all mutations
- ✅ `backend/firestore.md` - Client SDK patterns, onSnapshot, transactions
- ✅ `backend/firestore-security.md` - Security rules defined

**Post-Design Gate Status**: ✅ PASSED - All principles remain compliant, all standards remain compliant, no deviations introduced during design.

## Phase 2: Task Breakdown

**NOTE**: Task breakdown is created by the `/speckit.tasks` command, NOT by `/speckit.plan`.

See [tasks.md](./tasks.md) (created after running `/speckit.tasks`).
