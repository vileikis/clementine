# Implementation Plan: Events Management

**Branch**: `009-events-management` | **Date**: 2026-01-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-events-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable workspace admins to manage events within a project through a comprehensive events management interface. Admins can create new events with default naming, view all active events in a list, activate exactly one event at a time (or none), rename events for organization, and soft-delete events to maintain workspace cleanliness. The implementation follows client-first architecture with Firebase Firestore for data persistence, TanStack Query for client-side data management, and strict type safety with Zod validation.

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
- **Evidence**: Vertical slice architecture within workspace domain, events will be a subdomain under `workspace/projects/events`, organized by technical concern with barrel exports
- **Implementation**:
  ```
  src/domains/workspace/projects/events/
  ├── components/       # EventsList, EventItem, CreateEventButton
  ├── containers/       # EventsManagementContainer
  ├── hooks/           # useEvents, useCreateEvent, useDeleteEvent, useActivateEvent
  ├── schemas/         # eventSchema, createEventSchema, updateEventSchema
  ├── types/           # Event, EventStatus
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
│   └── workspace/
│       ├── projects/
│       │   ├── events/                    # NEW: Events management subdomain
│       │   │   ├── components/
│       │   │   │   ├── EventsList.tsx     # List of events with empty state
│       │   │   │   ├── EventItem.tsx      # Individual event with activation switch and context menu
│       │   │   │   ├── CreateEventButton.tsx  # Button to create new event
│       │   │   │   ├── DeleteEventDialog.tsx  # Confirmation dialog for deletion
│       │   │   │   └── RenameEventDialog.tsx  # Dialog for renaming event
│       │   │   ├── containers/
│       │   │   │   └── EventsManagementContainer.tsx  # Main container for project detail page
│       │   │   ├── hooks/
│       │   │   │   ├── useEvents.ts       # Real-time event list subscription
│       │   │   │   ├── useCreateEvent.ts  # Create event mutation
│       │   │   │   ├── useDeleteEvent.ts  # Soft delete event mutation
│       │   │   │   ├── useRenameEvent.ts  # Rename event mutation
│       │   │   │   └── useActivateEvent.ts # Activate/deactivate event mutation
│       │   │   ├── schemas/
│       │   │   │   ├── event.schema.ts    # Event entity Zod schema
│       │   │   │   ├── createEvent.schema.ts  # Create event input schema
│       │   │   │   ├── updateEvent.schema.ts  # Update event input schema
│       │   │   │   └── index.ts           # Schema exports
│       │   │   ├── types/
│       │   │   │   ├── event.types.ts     # Event, EventStatus types
│       │   │   │   └── index.ts           # Type exports
│       │   │   └── index.ts               # Barrel export (components, hooks, types)
│       │   ├── components/                # Existing
│       │   ├── containers/                # Existing
│       │   ├── hooks/                     # Existing
│       │   ├── schemas/                   # Existing - may need to add activeEventId to project schema
│       │   └── types/                     # Existing
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
                        └── index.tsx      # MODIFIED: Import EventsManagementContainer
```

**Structure Decision**: Using vertical slice architecture within the existing `workspace/projects` domain. Events management is a subdomain under projects (since events belong to projects). This follows DDD principles and keeps event-related code co-located. The structure supports independent development, testing, and modification of the events feature without affecting other workspace or project functionality.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - this section is not needed.

## Phase 0: Research & Unknowns

### Research Tasks

All technical context is known from existing codebase patterns. No research needed.

**Resolved**:
- ✅ Firebase Firestore patterns: Use existing client SDK patterns from workspace/projects domain
- ✅ TanStack Query patterns: Use existing mutation and query hooks from workspace domain
- ✅ shadcn/ui components: Use AlertDialog (deletion confirmation), Switch (activation toggle), DropdownMenu (context menu for rename/delete)
- ✅ Radix UI primitives: Already integrated via shadcn/ui
- ✅ Real-time subscriptions: Use existing onSnapshot patterns from workspace hooks
- ✅ Soft delete patterns: Status field with "draft" | "deleted" enum
- ✅ Single active event constraint: Store activeEventId on project document, atomic update on activation

### Technology Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Client-first with Firestore client SDK | Aligns with constitution Principle VI and existing architecture. Enables real-time updates, reduces server complexity. | Server-first with API routes (rejected: increases complexity, loses real-time updates, violates architecture principles) |
| Zod for validation | Constitution Principle III mandates runtime validation. Already used throughout codebase. | TypeScript only (rejected: no runtime validation), io-ts (rejected: Zod already standard in codebase) |
| TanStack Query for mutations | Existing pattern in workspace domain. Provides caching, optimistic updates, error handling. | Direct Firestore calls (rejected: loses caching and error handling), custom hooks (rejected: reinvents TanStack Query) |
| Soft delete via status field | Preserves data for potential recovery, simpler than hard delete with cascade. Spec explicitly requires soft delete. | Hard delete with cascade (rejected: spec requires soft delete), separate deleted collection (rejected: adds complexity) |
| activeEventId on project document | Atomic constraint enforcement (only one active event), simple to query and update. | activeEventId on event document (rejected: cannot enforce single active constraint atomically), separate activeEvents collection (rejected: over-engineering) |
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
- **Event Entity**: id, projectId, name, status, createdAt, updatedAt, deletedAt
- **Project Entity Update**: Add activeEventId field (optional, references single active event)
- **Relationships**: Event belongs to Project, Project has many Events, Project has optional activeEvent reference

### API Contracts

See [contracts/](./contracts/) for complete API specifications.

**Summary**:
- **Queries**: getEvents(projectId) → Event[], getEvent(eventId) → Event
- **Mutations**: createEvent(projectId, name?) → Event, updateEvent(eventId, name) → Event, deleteEvent(eventId) → void, activateEvent(projectId, eventId) → void, deactivateEvent(projectId) → void

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
- **Design Evidence**: 5 focused components (EventsList, EventItem, CreateEventButton, DeleteEventDialog, RenameEventDialog), 5 single-purpose hooks (useEvents, useCreateEvent, useRenameEvent, useDeleteEvent, useActivateEvent). No complex abstractions.
- **No Changes**: Design maintains simplicity

### ✅ Principle III: Type-Safe Development

- **Status**: COMPLIANT
- **Design Evidence**: All schemas defined with Zod (eventSchema, createEventInputSchema, updateEventInputSchema, activateEventInputSchema, deactivateEventInputSchema). Runtime validation for all Firestore operations. Strict TypeScript types derived from Zod schemas.
- **No Changes**: Design maintains type safety

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
- **Design Evidence**: All operations use Firestore client SDK (collection, query, onSnapshot, addDoc, updateDoc, runTransaction). Security enforced via Firestore rules. Real-time updates via onSnapshot. Zero server functions.
- **No Changes**: Design maintains client-first architecture

### ✅ Principle VII: Backend & Firebase

- **Status**: COMPLIANT
- **Design Evidence**: Client SDK for reads (onSnapshot), writes (addDoc, updateDoc), and transactions. Security rules enforce workspace admin authorization. Soft delete via status field (no hard deletes).
- **No Changes**: Design maintains Firebase best practices

### ✅ Principle VIII: Project Structure

- **Status**: COMPLIANT
- **Design Evidence**: Vertical slice architecture implemented under `workspace/projects/events/`. Organized by technical concern (components/, hooks/, schemas/, types/). Barrel exports defined. Restricted public API (components, hooks, types only).
- **No Changes**: Design maintains vertical slice architecture

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
