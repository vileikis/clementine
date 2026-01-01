# Research: Events Management

**Feature**: 009-events-management
**Date**: 2026-01-01
**Status**: Complete - No research needed (all patterns known from existing codebase)

## Overview

All technical decisions and patterns for the Events Management feature are well-established in the existing Clementine codebase. This document consolidates the research findings and confirms all technology choices align with existing standards and constitution principles.

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
- **Decision**: Firebase Firestore (client SDK) for all data operations
- **Rationale**: Client-first architecture (Constitution Principle VI), real-time updates, security via rules
- **Source**: `standards/global/client-first-architecture.md`, `standards/backend/firestore.md`
- **Status**: ✅ Confirmed - No research needed

### Validation
- **Decision**: Zod 4.1 for runtime validation
- **Rationale**: Constitution Principle III mandates runtime validation, existing standard in codebase
- **Source**: `standards/global/zod-validation.md`, existing schemas in workspace domain
- **Status**: ✅ Confirmed - No research needed

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

## Architecture Patterns (Confirmed)

### Domain Structure
- **Decision**: Vertical slice under `workspace/projects/events/`
- **Rationale**: Constitution Principle VIII, DDD principles, co-locates related code
- **Structure**:
  ```
  events/
  ├── components/  # UI components
  ├── containers/  # Container components
  ├── hooks/       # React hooks (queries, mutations)
  ├── schemas/     # Zod validation schemas
  ├── types/       # TypeScript types
  └── index.ts     # Barrel export
  ```
- **Source**: `standards/global/project-structure.md`, existing workspace/projects structure
- **Status**: ✅ Confirmed - Follows existing pattern

### Client-First Architecture
- **Decision**: All CRUD operations via Firestore client SDK, security via Firestore rules
- **Rationale**: Constitution Principle VI, existing architecture pattern
- **Pattern**:
  - ✅ Read: `onSnapshot()` for real-time updates
  - ✅ Create: `addDoc()` with Zod-validated input
  - ✅ Update: `updateDoc()` with Zod-validated input
  - ✅ Delete: `updateDoc()` with status = "deleted" (soft delete)
  - ✅ Security: Firestore rules enforce workspace admin authorization
- **Source**: `standards/global/client-first-architecture.md`, existing workspace hooks
- **Status**: ✅ Confirmed - Follows existing pattern

### Real-Time Subscriptions
- **Decision**: Use `onSnapshot()` in custom hooks wrapped with TanStack Query
- **Rationale**: Existing pattern in workspace domain, provides real-time updates with caching
- **Pattern**:
  ```typescript
  export function useEvents(projectId: string) {
    return useQuery({
      queryKey: ['events', projectId],
      queryFn: () => {
        return new Promise<Event[]>((resolve) => {
          const q = query(
            collection(firestore, 'events'),
            where('projectId', '==', projectId),
            where('status', '!=', 'deleted')
          )
          const unsubscribe = onSnapshot(q, (snapshot) => {
            const events = snapshot.docs.map(doc => eventSchema.parse({ id: doc.id, ...doc.data() }))
            resolve(events)
          })
          return () => unsubscribe()
        })
      }
    })
  }
  ```
- **Source**: Existing workspace hooks pattern
- **Status**: ✅ Confirmed - Will adapt existing pattern

### Mutations with TanStack Query
- **Decision**: Use `useMutation()` for all write operations
- **Rationale**: Existing pattern, provides optimistic updates, error handling, onSuccess callbacks
- **Pattern**:
  ```typescript
  export function useCreateEvent() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async ({ projectId, name }: CreateEventInput) => {
        const input = createEventSchema.parse({ projectId, name })
        const docRef = await addDoc(collection(firestore, 'events'), {
          ...input,
          status: 'draft',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          deletedAt: null
        })
        return { id: docRef.id, ...input }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['events'] })
      }
    })
  }
  ```
- **Source**: Existing workspace mutation hooks
- **Status**: ✅ Confirmed - Will adapt existing pattern

## Data Model Design (Confirmed)

### Event Entity
- **Decision**: Firestore collection `events` with soft delete via `status` field
- **Fields**:
  - `id`: string (Firestore document ID)
  - `projectId`: string (reference to parent project)
  - `name`: string (default: "Untitled event")
  - `status`: "draft" | "deleted" (soft delete mechanism)
  - `createdAt`: number (timestamp)
  - `updatedAt`: number (timestamp)
  - `deletedAt`: number | null (soft delete timestamp)
- **Indexes**: `projectId`, `status`, composite `projectId + status`
- **Source**: Feature spec data model, existing Firestore patterns
- **Status**: ✅ Confirmed - Aligns with spec

### Project Entity Update
- **Decision**: Add `activeEventId` field to existing `projects` collection
- **Field**: `activeEventId`: string | null (references single active event, null if none active)
- **Rationale**: Atomic enforcement of single active event constraint
- **Migration**: Field will be added via Firestore update (no migration script needed, null by default)
- **Source**: Feature spec requirements
- **Status**: ✅ Confirmed - Simple field addition

### Relationships
- **Event → Project**: Many-to-One (event.projectId references project.id)
- **Project → ActiveEvent**: Optional One-to-One (project.activeEventId references event.id or null)
- **Source**: Feature spec requirements
- **Status**: ✅ Confirmed - Clear relationships

## Security & Authorization (Confirmed)

### Firestore Security Rules
- **Decision**: Enforce workspace admin authorization via Firestore rules
- **Pattern**:
  ```javascript
  match /events/{eventId} {
    // Read: Allow workspace admins of parent project's workspace
    allow read: if isWorkspaceAdmin(getProject(resource.data.projectId).workspaceId);

    // Write: Allow workspace admins only
    allow create: if isWorkspaceAdmin(getProject(request.resource.data.projectId).workspaceId);
    allow update: if isWorkspaceAdmin(getProject(resource.data.projectId).workspaceId);
    allow delete: if false; // Soft delete only, no hard deletes
  }
  ```
- **Source**: `standards/backend/firestore-security.md`, existing workspace rules
- **Status**: ✅ Confirmed - Will adapt existing workspace admin pattern

### Client-Side Authorization
- **Decision**: UI controls hide/show based on auth state, but security enforced server-side
- **Pattern**: Check `currentUser` in hooks, disable/hide controls if not workspace admin
- **Source**: `standards/global/security.md`, existing auth patterns
- **Status**: ✅ Confirmed - Security in rules, UX in client

## UI Component Decisions (Confirmed)

### Components from shadcn/ui
All components already available in `apps/clementine-app/src/ui-kit/components/`:

1. **AlertDialog** - Deletion confirmation
   - **Usage**: Confirm before soft-deleting event
   - **Status**: ✅ Available - `ui-kit/components/alert-dialog.tsx`

2. **Switch** - Event activation toggle
   - **Usage**: Toggle active/inactive state for events
   - **Status**: ✅ Available - `ui-kit/components/switch.tsx`

3. **DropdownMenu** - Context menu for rename/delete
   - **Usage**: Right-click or three-dot menu on event items
   - **Status**: ✅ Needs installation - `pnpm dlx shadcn@latest add dropdown-menu`

4. **Button** - Create event button
   - **Usage**: Primary action to create new event
   - **Status**: ✅ Available - `ui-kit/components/button.tsx`

5. **Dialog** - Rename event dialog
   - **Usage**: Modal for renaming event
   - **Status**: ✅ Available - `ui-kit/components/dialog.tsx`

6. **Input** - Text input for event name
   - **Usage**: Name input in rename dialog
   - **Status**: ✅ Available - `ui-kit/components/input.tsx`

### Custom Components Needed
- **EventsList**: List container with empty state
- **EventItem**: Individual event row with activation switch and context menu
- **CreateEventButton**: Button with create icon
- **DeleteEventDialog**: AlertDialog wrapper with confirmation logic
- **RenameEventDialog**: Dialog wrapper with form and validation

**Source**: `standards/frontend/component-libraries.md`
**Status**: ✅ Confirmed - Build on shadcn/ui primitives

## Mobile-First Design (Confirmed)

### Touch Targets
- **Decision**: All interactive elements 44x44px minimum
- **Elements**: Event items (entire row clickable), activation switch, context menu trigger
- **Source**: Constitution Principle I
- **Status**: ✅ Confirmed - Will enforce in implementation

### Responsive Breakpoints
- **Decision**: Use Tailwind CSS 4 mobile-first breakpoints
- **Breakpoints**: `sm: 640px`, `md: 768px`, `lg: 1024px`
- **Primary Target**: 320px-768px (mobile and tablet)
- **Source**: `standards/frontend/responsive.md`
- **Status**: ✅ Confirmed - Existing standard

### Performance Targets
- **Page Load**: < 2 seconds on 4G networks
- **Real-Time Updates**: < 500ms from Firestore change to UI update
- **Event Operations**: < 2 seconds (create, rename, delete, activate)
- **Source**: Constitution Principle I, feature spec success criteria
- **Status**: ✅ Confirmed - Will measure in implementation

## Testing Strategy (Confirmed)

### Unit Tests (Vitest)
- **Hooks**: `useEvents`, `useCreateEvent`, `useDeleteEvent`, `useRenameEvent`, `useActivateEvent`
- **Pattern**: Mock Firestore, test hook behavior and error handling
- **Source**: `standards/testing/testing.md`
- **Status**: ✅ Confirmed - Will write unit tests for all hooks

### Component Tests (Testing Library)
- **Components**: `EventsList`, `EventItem`, `CreateEventButton`, `DeleteEventDialog`, `RenameEventDialog`
- **Pattern**: Render with mock data, test user interactions (click, toggle, submit)
- **Source**: `standards/testing/testing.md`
- **Status**: ✅ Confirmed - Will write component tests

### Coverage Goals
- **Overall**: 70%+
- **Critical Paths**: 90%+ (event creation, activation, deletion)
- **Source**: Constitution Principle IV
- **Status**: ✅ Confirmed - Minimal testing strategy

## Best Practices Summary

### Firestore Client SDK
- ✅ Use `onSnapshot()` for real-time subscriptions
- ✅ Handle cleanup in `useEffect` return
- ✅ Validate all inputs with Zod before writing
- ✅ Parse all outputs with Zod after reading
- ✅ Use composite queries for filtering (projectId + status)
- **Source**: `standards/backend/firestore.md`

### TanStack Query
- ✅ Use `useQuery()` for subscriptions with `queryKey: ['events', projectId]`
- ✅ Use `useMutation()` for write operations
- ✅ Invalidate queries in `onSuccess` callbacks
- ✅ Use optimistic updates for instant feedback (optional)
- **Source**: `standards/frontend/state-management.md`

### Zod Validation
- ✅ Define schemas for Event, CreateEventInput, UpdateEventInput
- ✅ Use `.parse()` for server-side validation (throws on error)
- ✅ Use `.safeParse()` for client-side validation (returns result object)
- ✅ Validate both inputs and outputs from Firestore
- **Source**: `standards/global/zod-validation.md`

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

### 1. Server-First Architecture
- **Alternative**: Use TanStack Start server functions for all CRUD operations
- **Rejected Because**: Violates Constitution Principle VI (client-first architecture), loses real-time updates, increases complexity, adds latency
- **Decision**: ✅ Use client-first with Firestore client SDK

### 2. Hard Delete
- **Alternative**: Permanently delete events from Firestore
- **Rejected Because**: Feature spec explicitly requires soft delete, loses data for potential recovery, complicates audit trails
- **Decision**: ✅ Use soft delete via status field

### 3. Active Flag on Event
- **Alternative**: Store `isActive: boolean` on each event document
- **Rejected Because**: Cannot atomically enforce single active event constraint, requires complex queries and race condition handling
- **Decision**: ✅ Store `activeEventId` on project document

### 4. Custom Modal Components
- **Alternative**: Build custom dialog/modal components from scratch
- **Rejected Because**: Reinvents shadcn/ui AlertDialog and Dialog, loses accessibility, violates component library standard
- **Decision**: ✅ Use shadcn/ui AlertDialog and Dialog

### 5. Right-Click Context Menu
- **Alternative**: Use browser's native context menu (right-click)
- **Rejected Because**: Not mobile-friendly (no right-click on touch devices), poor UX on mobile
- **Decision**: ✅ Use Radix DropdownMenu (works on both desktop and mobile)

### 6. Custom Switch Component
- **Alternative**: Build custom toggle switch from scratch
- **Rejected Because**: Reinvents shadcn/ui Switch, loses accessibility, violates component library standard
- **Decision**: ✅ Use shadcn/ui Switch

## Risks & Mitigations

### Risk 1: Concurrent Activation
- **Risk**: Two admins activate different events simultaneously, violating single active constraint
- **Mitigation**: Use Firestore transaction for activation to ensure atomic update of `project.activeEventId`
- **Status**: ✅ Mitigated

### Risk 2: Deleted Event Still Active
- **Risk**: Admin deletes the currently active event, leaving stale `activeEventId` reference
- **Mitigation**: Firestore transaction: when deleting event, check if it's active and clear `project.activeEventId` if so
- **Status**: ✅ Mitigated

### Risk 3: Real-Time Update Performance
- **Risk**: Large number of events causes slow real-time updates
- **Mitigation**: Firestore composite index on `projectId + status`, client-side pagination if needed (spec supports up to 100 events)
- **Status**: ✅ Mitigated

### Risk 4: Mobile Touch Target Size
- **Risk**: Small touch targets cause accidental taps on mobile
- **Mitigation**: Enforce 44x44px minimum touch targets, test on real mobile devices, use larger tap areas for critical actions
- **Status**: ✅ Mitigated

## Summary

**Research Status**: ✅ COMPLETE - No unknowns remain

All technology decisions, architecture patterns, and implementation approaches are confirmed and aligned with existing codebase standards. The Events Management feature will follow established patterns from the workspace domain, use existing component libraries (shadcn/ui, Radix UI), and adhere to all constitution principles.

**Next Phase**: Proceed to Phase 1 (Design & Contracts) to create data-model.md and API contracts.
