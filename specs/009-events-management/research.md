# Research: Events Management

**Feature**: 009-events-management
**Date**: 2026-01-01
**Status**: Complete - All decisions confirmed (Updated for subcollection structure)

## Overview

All technical decisions and patterns for the Project Events Management feature are well-established in the existing Clementine codebase. This document consolidates the research findings and confirms all technology choices align with existing standards and constitution principles.

## Technology Stack (Confirmed)

### Frontend Framework
- **Decision**: TanStack Start 1.132 with React 19.2
- **Rationale**: Existing application framework, full-stack React with file-based routing
- **Source**: `apps/clementine-app/package.json`
- **Status**: ✅ Confirmed - No research needed

### State Management
- **Decision**: TanStack Query 5.66 for server state, Zustand 5.x for client state (if needed)
- **Rationale**: Existing pattern in workspace domain, provides caching, optimistic updates, real-time sync
- **Source**: `standards/frontend/state-management.md`, existing workspace hooks
- **Status**: ✅ Confirmed - No research needed

### Data Layer
- **Decision**: Firebase Firestore subcollections (client SDK) for all data operations
- **Structure**: `projects/{projectId}/events/{eventId}` (subcollection, not top-level)
- **Rationale**: Clear ownership, projectId implicit in path, aligns with domain model, efficient queries
- **Source**: `standards/global/client-first-architecture.md`, `standards/backend/firestore.md`
- **Status**: ✅ Confirmed - Subcollection structure chosen

### Validation
- **Decision**: Zod 4.1 for runtime validation (in application code, NOT security rules)
- **Rationale**: Constitution Principle III mandates runtime validation. Standards require validation in application code, not Firestore rules.
- **Source**: `standards/global/zod-validation.md`, `standards/backend/firestore-security.md`
- **Status**: ✅ Confirmed - Application-level validation only

### UI Components
- **Decision**: shadcn/ui + Radix UI for all UI primitives
- **Rationale**: Existing component library standard, accessible, mobile-friendly
- **Components Needed**: AlertDialog (deletion), Switch (activation), DropdownMenu (context menu)
- **Source**: `standards/frontend/component-libraries.md`, `apps/clementine-app/src/ui-kit/`
- **Status**: ✅ Confirmed - Components already available

### Styling
- **Decision**: Tailwind CSS 4 with design system tokens
- **Rationale**: Existing styling framework, mobile-first, theme-aware
- **Source**: `standards/frontend/design-system.md`
- **Status**: ✅ Confirmed - No research needed

### Security Rules
- **Decision**: Simple admin-only checks (NO data validation in rules)
- **Rationale**: Follows `standards/backend/firestore-security.md` - rules check WHO, Zod validates WHAT
- **Pattern**: `allow read, write: if isAdmin(); allow delete: if false`
- **Source**: `standards/backend/firestore-security.md`
- **Status**: ✅ Confirmed - Simple authentication checks only

## Architecture Patterns (Confirmed)

### Domain Structure
- **Decision**: Top-level `/domains/project/events/` domain
- **Rationale**: Clear separation from workspace features and future event editing features (/domains/event)
- **Structure**:
  ```
  /domains/project/events/
  ├── components/  # UI components
  ├── containers/  # ProjectEventsPage
  ├── hooks/       # React hooks (queries, mutations)
  ├── schemas/     # Zod validation schemas
  ├── types/       # TypeScript types
  └── index.ts     # Barrel export
  ```
- **Source**: `standards/global/project-structure.md`
- **Status**: ✅ Confirmed - New top-level project domain

### Firestore Subcollection Structure
- **Decision**: `projects/{projectId}/events/{eventId}` (subcollection)
- **Rationale**:
  - Clear ownership: events physically nested under projects
  - projectId implicit in path (not stored as field)
  - Simpler data model (one less field to manage)
  - Efficient queries within a project
  - Collection group queries available for cross-project scenarios
- **Source**: User decision, aligns with Firestore best practices
- **Status**: ✅ Confirmed - Subcollection chosen over top-level collection

### Client-First Architecture
- **Decision**: All CRUD operations via Firestore client SDK, security via simple Firestore rules
- **Rationale**: Constitution Principle VI, existing architecture pattern, standards compliance
- **Pattern**:
  - ✅ Read: `onSnapshot()` for real-time updates on subcollection
  - ✅ Create: `addDoc(collection(firestore, 'projects/{id}/events'))` with Zod-validated input
  - ✅ Update: `updateDoc()` on subcollection document with Zod-validated input
  - ✅ Delete: `updateDoc()` with status = "deleted" (soft delete)
  - ✅ Security: Simple admin checks (`isAdmin()` only, no data validation)
- **Source**: `standards/global/client-first-architecture.md`, `standards/backend/firestore-security.md`
- **Status**: ✅ Confirmed - Follows existing pattern with simplified security

### Real-Time Subscriptions
- **Decision**: Use `onSnapshot()` in custom hooks wrapped with TanStack Query
- **Rationale**: Existing pattern in workspace domain, provides real-time updates with caching
- **Pattern**:
  ```typescript
  export function useProjectEvents(projectId: string) {
    return useQuery({
      queryKey: ['projectEvents', projectId],
      queryFn: () => {
        return new Promise<ProjectEvent[]>((resolve) => {
          // Subcollection path (projectId in path, not query filter)
          const q = query(
            collection(firestore, `projects/${projectId}/events`),
            where('status', '==', 'draft'),
            orderBy('createdAt', 'desc')
          )
          const unsubscribe = onSnapshot(q, (snapshot) => {
            const events = snapshot.docs.map(doc =>
              projectEventSchema.parse({ id: doc.id, ...doc.data() })
            )
            resolve(events)
          })
          return () => unsubscribe()
        })
      }
    })
  }
  ```
- **Source**: Existing workspace hooks pattern
- **Status**: ✅ Confirmed - Adapted for subcollection paths

### Mutations with TanStack Query
- **Decision**: Use `useMutation()` for all write operations
- **Rationale**: Existing pattern, provides optimistic updates, error handling, onSuccess callbacks
- **Pattern**:
  ```typescript
  export function useCreateProjectEvent(projectId: string) {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async (input: CreateProjectEventInput) => {
        const validated = createProjectEventInputSchema.parse(input)
        // Subcollection path (projectId in path)
        const eventsRef = collection(firestore, `projects/${projectId}/events`)
        const docRef = await addDoc(eventsRef, {
          ...validated,
          status: 'draft',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          deletedAt: null
        })
        return { id: docRef.id, ...validated }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['projectEvents', projectId] })
      }
    })
  }
  ```
- **Source**: Existing workspace mutation hooks
- **Status**: ✅ Confirmed - Adapted for subcollection structure

## Data Model Design (Confirmed)

### ProjectEvent Entity
- **Decision**: Firestore subcollection `projects/{projectId}/events` with soft delete via `status` field
- **Fields**:
  - `id`: string (Firestore document ID)
  - ~~`projectId`: NOT STORED~~ (implicit in subcollection path)
  - `name`: string (default: "Untitled event")
  - `status`: "draft" | "deleted" (soft delete mechanism)
  - `createdAt`: number (timestamp)
  - `updatedAt`: number (timestamp)
  - `deletedAt`: number | null (soft delete timestamp)
- **Indexes**: Collection group composite: `status + createdAt`
- **Source**: Feature spec data model, Firestore subcollection patterns
- **Status**: ✅ Confirmed - Subcollection structure, projectId implicit

### Project Entity Update
- **Decision**: Add `activeEventId` field to existing `projects` collection
- **Field**: `activeEventId`: string | null (references single active event ID, null if none active)
- **Rationale**: Atomic enforcement of single active event constraint, simple field addition
- **Migration**: No migration script needed (null by default)
- **Source**: Feature spec requirements
- **Status**: ✅ Confirmed - Simple field addition

### Relationships
- **ProjectEvent → Project**: Many-to-One via subcollection path `projects/{projectId}/events/{eventId}`
- **Project → ActiveEvent**: Optional One-to-One via `project.activeEventId` field
- **Source**: Feature spec requirements
- **Status**: ✅ Confirmed - Clear relationships via subcollection path

## Security & Authorization (Confirmed)

### Firestore Security Rules (Simplified)
- **Decision**: Simple admin-only checks (per `standards/backend/firestore-security.md`)
- **Pattern**:
  ```javascript
  // Simple admin check only (NO data validation)
  match /projects/{projectId}/events/{eventId} {
    allow read: if isAdmin();
    allow create, update: if isAdmin();
    allow delete: if false;  // Soft delete only
  }
  ```
- **Key Principles**:
  - ✅ Rules check WHO can access (authentication/authorization)
  - ✅ Zod schemas validate WHAT is valid (data validation in app code)
  - ✅ No expensive `get()` calls
  - ✅ No data validation in rules (violates standards)
  - ✅ Easy to understand and maintain
- **Source**: `standards/backend/firestore-security.md`
- **Status**: ✅ Confirmed - Simplified to follow standards

### Client-Side Authorization
- **Decision**: UI controls hide/show based on auth state, but security enforced server-side
- **Pattern**: Check `currentUser` and `admin` custom claim in hooks, disable/hide controls if not admin
- **Source**: `standards/global/security.md`, existing auth patterns
- **Status**: ✅ Confirmed - Security in rules, UX in client

## Technology Decisions Summary

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| **Firestore subcollection** | Clear ownership, projectId implicit in path, aligns with domain model | Top-level collection (rejected: projectId as redundant field, less clear ownership) |
| **Simple admin-only security rules** | Follows standards (rules check WHO, Zod validates WHAT), easy to maintain | Complex rules with data validation (rejected: violates standards, expensive get() calls, hard to maintain) |
| **"ProjectEvent" terminology** | Clear, unambiguous, distinguishes from other event types | "Event" (rejected: too generic), "ProjectActivity" (rejected: less clear) |
| **Top-level /domains/project** | Clear bounded context, scales as project features grow, parallel to future /domains/event | Nested under /domains/workspace (rejected: less clear separation, harder to scale) |
| Client-first with Firestore client SDK | Constitution Principle VI, real-time updates, reduces complexity | Server-first (rejected: loses real-time, increases complexity) |
| Zod for validation (app code only) | Constitution Principle III, standards compliance | Validation in security rules (rejected: violates standards) |
| TanStack Query for mutations | Existing pattern, caching, optimistic updates | Direct Firestore calls (rejected: loses caching) |
| Soft delete via status field | Data preservation, spec requirement | Hard delete (rejected: spec requires soft delete) |
| activeEventId on project document | Atomic single-active constraint | activeEventId on event (rejected: cannot enforce atomically) |
| shadcn/ui components | Existing standard, accessible, mobile-friendly | Custom components (rejected: reinvents wheel) |

## Best Practices Summary

### Firestore Subcollections
- ✅ Use subcollection path for parent reference (not stored field)
- ✅ Query subcollection with `collection(firestore, 'projects/{id}/events')`
- ✅ Use collection group queries for cross-project scenarios
- ✅ Keep subcollection name simple ("events" not "projectEvents")
- **Source**: Firestore best practices

### Firestore Security Rules
- ✅ **Simple authentication checks only** (`isAdmin()`)
- ✅ **No data validation** (use Zod in app code)
- ✅ **No expensive get() calls**
- ✅ **Easy to understand and maintain**
- **Source**: `standards/backend/firestore-security.md`

### TanStack Query
- ✅ Use `useQuery()` for subscriptions with `queryKey: ['projectEvents', projectId]`
- ✅ Use `useMutation()` for write operations
- ✅ Invalidate queries in `onSuccess` callbacks
- ✅ Use optimistic updates for instant feedback (optional)
- **Source**: `standards/frontend/state-management.md`

### Zod Validation
- ✅ Define schemas for ProjectEvent, CreateProjectEventInput, UpdateProjectEventInput
- ✅ Use `.parse()` for server-side validation (throws on error)
- ✅ Use `.safeParse()` for client-side validation (returns result object)
- ✅ **Validate in application code, NOT security rules**
- **Source**: `standards/global/zod-validation.md`, `standards/backend/firestore-security.md`

### shadcn/ui Components
- ✅ Use existing components from `ui-kit/components/`
- ✅ Extend via composition, not modification
- ✅ Preserve accessibility attributes
- ✅ Use theme tokens for colors (no hard-coded values)
- **Source**: `standards/frontend/component-libraries.md`

### Mobile-First
- ✅ Design for 320px-768px first
- ✅ Touch targets 44x44px minimum
- ✅ Test on real mobile devices
- ✅ Optimize for 4G networks
- **Source**: Constitution Principle I

## Alternatives Considered & Rejected

### 1. Top-Level Collection vs Subcollection
- **Alternative**: Use top-level `events` collection with `projectId` field
- **Rejected Because**: Subcollection provides clearer ownership, eliminates redundant projectId field, aligns better with domain model
- **Decision**: ✅ Use subcollection `projects/{projectId}/events`

### 2. Complex Security Rules with Data Validation
- **Alternative**: Validate data shape, field values, business logic in Firestore security rules
- **Rejected Because**: Violates `standards/backend/firestore-security.md`, hard to maintain, expensive get() calls, poor error messages
- **Decision**: ✅ Use simple admin checks only, validate with Zod in app code

### 3. Nested Under Workspace Domain
- **Alternative**: Place events under `/domains/workspace/projects/events`
- **Rejected Because**: Less clear bounded context, harder to scale as project features grow, doesn't parallel future /domains/event structure
- **Decision**: ✅ Use top-level `/domains/project` domain

### 4. Server-First Architecture
- **Alternative**: Use TanStack Start server functions for all CRUD operations
- **Rejected Because**: Violates Constitution Principle VI, loses real-time updates, increases complexity
- **Decision**: ✅ Use client-first with Firestore client SDK

### 5. Hard Delete
- **Alternative**: Permanently delete events from Firestore
- **Rejected Because**: Spec requires soft delete, loses data for recovery
- **Decision**: ✅ Use soft delete via status field

### 6. Active Flag on Event
- **Alternative**: Store `isActive: boolean` on each event document
- **Rejected Because**: Cannot enforce single active constraint atomically, race conditions
- **Decision**: ✅ Store `activeEventId` on project document

## Risks & Mitigations

### Risk 1: Concurrent Activation
- **Risk**: Two admins activate different events simultaneously
- **Mitigation**: Use Firestore transaction for activation to ensure atomic update of `project.activeEventId`
- **Status**: ✅ Mitigated with transaction pattern

### Risk 2: Deleted Event Still Active
- **Risk**: Admin deletes currently active event, leaving stale `activeEventId`
- **Mitigation**: Firestore transaction: when deleting event, check if active and clear `project.activeEventId`
- **Status**: ✅ Mitigated with transaction pattern

### Risk 3: Real-Time Update Performance
- **Risk**: Large number of events causes slow real-time updates
- **Mitigation**: Firestore collection group index on `status + createdAt`, subcollection queries are already scoped to project
- **Status**: ✅ Mitigated with indexes and subcollection structure

### Risk 4: Mobile Touch Target Size
- **Risk**: Small touch targets cause accidental taps
- **Mitigation**: Enforce 44x44px minimum, test on real devices
- **Status**: ✅ Mitigated with mobile-first design

## Summary

**Research Status**: ✅ COMPLETE - All decisions confirmed

All technology decisions, architecture patterns, and implementation approaches are confirmed and aligned with existing codebase standards. The Project Events Management feature will follow established patterns from the workspace domain, use existing component libraries (shadcn/ui, Radix UI), adhere to all constitution principles, and follow simplified security rules per standards.

**Key Architectural Decisions**:
1. ✅ Firestore subcollection structure (`projects/{projectId}/events`)
2. ✅ Simple admin-only security rules (no data validation in rules)
3. ✅ Top-level `/domains/project` domain (parallel to future `/domains/event`)
4. ✅ "ProjectEvent" terminology for clarity
5. ✅ Validation in application code with Zod (not in security rules)

**Next Phase**: Proceed to implementation with confirmed architecture and patterns.
