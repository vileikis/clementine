# Quickstart Guide: Project Events Management

**Feature**: 009-events-management
**Date**: 2026-01-01
**Audience**: Developers implementing or maintaining this feature

## Overview

This guide provides a quick reference for developers working on the Project Events Management feature. It covers the feature's purpose, architecture, key files, common operations, and troubleshooting.

## What This Feature Does

**Project Events Management** allows workspace admins to:

1. ✅ View all project events for a project in a list
2. ✅ Create new project events with default naming ("Untitled event")
3. ✅ Rename project events for better organization
4. ✅ Activate exactly one project event per project (or none)
5. ✅ Deactivate the currently active project event
6. ✅ Soft-delete project events to keep the workspace clean

**Key Business Rules**:
- Only **one project event can be active** per project at any time
- Project events are **soft-deleted** (never hard-deleted)
- Deleted project events are **hidden from all lists** and cannot be accessed
- Only **workspace admins** can manage project events

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│  ProjectEventsPage → ProjectEventsList → ProjectEventItem       │
│  CreateProjectEventButton, DeleteProjectEventDialog, etc.       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         React Hooks                              │
│  useProjectEvents (real-time subscription via onSnapshot)       │
│  useCreateProjectEvent, useRenameProjectEvent, etc.             │
│  (TanStack Query mutations)                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Firebase Firestore (Client SDK - Subcollection)     │
│  projects/{projectId}/events/{eventId}                          │
│  { id, name, status, createdAt, updatedAt, deletedAt }          │
│  projects/{projectId}: { ..., activeEventId }                   │
│  Security Rules: Simple admin-only checks (isAdmin())           │
└─────────────────────────────────────────────────────────────────┘
```

**Architecture Pattern**: Client-first (Firestore client SDK for all operations)
**Security Enforcement**: Simple admin-only Firestore rules (no data validation)
**Real-Time Updates**: `onSnapshot()` for live project events list updates
**Data Structure**: Subcollection `projects/{projectId}/events` (projectId implicit in path)

## Directory Structure

```
apps/clementine-app/src/domains/project/events/
├── components/
│   ├── ProjectEventsList.tsx           # List of project events with empty state
│   ├── ProjectEventItem.tsx            # Individual project event row (activation switch + context menu)
│   ├── CreateProjectEventButton.tsx    # Button to create new project event
│   ├── DeleteProjectEventDialog.tsx    # Confirmation dialog for deletion
│   └── RenameProjectEventDialog.tsx    # Dialog for renaming project event
├── containers/
│   └── ProjectEventsPage.tsx           # Main page component (integrates all components)
├── hooks/
│   ├── useProjectEvents.ts             # Real-time project events list subscription
│   ├── useCreateProjectEvent.ts        # Create project event mutation
│   ├── useDeleteProjectEvent.ts        # Soft delete project event mutation
│   ├── useRenameProjectEvent.ts        # Rename project event mutation
│   └── useActivateProjectEvent.ts      # Activate/deactivate project event mutation
├── schemas/
│   ├── project-event.schema.ts         # ProjectEvent entity Zod schema
│   ├── create-project-event.schema.ts  # Create project event input schema
│   ├── update-project-event.schema.ts  # Update project event input schema
│   └── index.ts                        # Schema exports
├── types/
│   ├── project-event.types.ts          # ProjectEvent, ProjectEventStatus types
│   └── index.ts                        # Type exports
└── index.ts                            # Barrel export (components, hooks, types only)
```

## Quick Reference: Common Operations

### 1. Get Project Events for a Project (Real-Time)

**Hook**: `useProjectEvents(projectId)`

```typescript
import { useProjectEvents } from '@/domains/project/events'

function MyComponent({ projectId }: { projectId: string }) {
  const { data: events, isLoading, error } = useProjectEvents(projectId)

  if (isLoading) return <div>Loading project events...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {events?.map((event) => (
        <li key={event.id}>{event.name}</li>
      ))}
    </ul>
  )
}
```

**What it does**: Subscribes to real-time updates for all non-deleted project events in a project via subcollection path.

**Under the hood**:
```typescript
// Subcollection path (projectId in path, not query filter)
const eventsRef = collection(firestore, `projects/${projectId}/events`)
const q = query(
  eventsRef,
  where('status', '==', 'draft'),
  orderBy('createdAt', 'desc')
)
```

---

### 2. Create a New Project Event

**Hook**: `useCreateProjectEvent(projectId)`

```typescript
import { useCreateProjectEvent } from '@/domains/project/events'
import { useNavigate } from '@tanstack/react-router'

function CreateProjectEventButton({ projectId }: { projectId: string }) {
  const navigate = useNavigate()
  const createProjectEvent = useCreateProjectEvent(projectId)

  const handleCreate = async () => {
    const newEvent = await createProjectEvent.mutateAsync({
      name: 'Untitled event' // Optional, defaults to "Untitled event"
    })

    // Navigate to event detail page (future feature)
    navigate({
      to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId',
      params: { eventId: newEvent.id }
    })
  }

  return (
    <button onClick={handleCreate} disabled={createProjectEvent.isPending}>
      {createProjectEvent.isPending ? 'Creating...' : 'Create Event'}
    </button>
  )
}
```

**What it does**: Creates a new project event in the subcollection with default name and status "draft".

**Under the hood**:
```typescript
// Subcollection path (projectId in path)
const eventsRef = collection(firestore, `projects/${projectId}/events`)
await addDoc(eventsRef, {
  name: 'Untitled event',
  status: 'draft',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  deletedAt: null
})
```

---

### 3. Rename a Project Event

**Hook**: `useRenameProjectEvent(projectId)`

```typescript
import { useRenameProjectEvent } from '@/domains/project/events'
import { useState } from 'react'

function RenameProjectEventDialog({
  projectId,
  eventId,
  initialName
}: {
  projectId: string
  eventId: string
  initialName: string
}) {
  const renameProjectEvent = useRenameProjectEvent(projectId)
  const [name, setName] = useState(initialName)

  const handleRename = async () => {
    await renameProjectEvent.mutateAsync({ eventId, name })
    // Dialog closes automatically via onSuccess callback
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleRename(); }}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Event name"
      />
      <button type="submit" disabled={renameProjectEvent.isPending}>
        {renameProjectEvent.isPending ? 'Saving...' : 'Rename'}
      </button>
    </form>
  )
}
```

**What it does**: Updates the project event name and reflects changes in real-time across all views.

**Under the hood**:
```typescript
const eventRef = doc(firestore, `projects/${projectId}/events`, eventId)
await updateDoc(eventRef, {
  name: validatedName,
  updatedAt: Date.now()
})
```

---

### 4. Delete a Project Event (Soft Delete)

**Hook**: `useDeleteProjectEvent(projectId)`

```typescript
import { useDeleteProjectEvent } from '@/domains/project/events'
import { AlertDialog, AlertDialogAction, AlertDialogContent } from '@/ui-kit/components/alert-dialog'

function DeleteProjectEventDialog({
  projectId,
  eventId,
  open,
  onOpenChange
}: {
  projectId: string
  eventId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const deleteProjectEvent = useDeleteProjectEvent(projectId)

  const handleDelete = async () => {
    await deleteProjectEvent.mutateAsync({ eventId })
    onOpenChange(false)
    // Event disappears from list via real-time update
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle>Delete Event?</AlertDialogTitle>
        <AlertDialogDescription>
          This action cannot be undone. The event will be permanently deleted.
        </AlertDialogDescription>
        <AlertDialogAction onClick={handleDelete}>
          Delete
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

**What it does**: Soft-deletes the project event (sets status to "deleted"). If the event was active, clears the project's activeEventId.

**Under the hood**:
```typescript
await runTransaction(firestore, async (transaction) => {
  const eventRef = doc(firestore, `projects/${projectId}/events`, eventId)
  const projectRef = doc(firestore, 'projects', projectId)

  // Soft delete event
  transaction.update(eventRef, {
    status: 'deleted',
    deletedAt: Date.now(),
    updatedAt: Date.now()
  })

  // Clear activeEventId if this event was active
  const projectDoc = await transaction.get(projectRef)
  if (projectDoc.data()?.activeEventId === eventId) {
    transaction.update(projectRef, { activeEventId: null })
  }
})
```

---

### 5. Activate/Deactivate a Project Event

**Hook**: `useActivateProjectEvent(projectId)`

```typescript
import { useActivateProjectEvent } from '@/domains/project/events'
import { Switch } from '@/ui-kit/components/switch'

function ProjectEventItem({
  event,
  projectId,
  isActive
}: {
  event: ProjectEvent
  projectId: string
  isActive: boolean
}) {
  const activateProjectEvent = useActivateProjectEvent(projectId)

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      // Activate this event
      await activateProjectEvent.mutateAsync({ eventId: event.id })
    } else {
      // Deactivate (set activeEventId to null)
      await activateProjectEvent.mutateAsync({ eventId: null })
    }
  }

  return (
    <div className="flex items-center justify-between">
      <span>{event.name}</span>
      <Switch
        checked={isActive}
        onCheckedChange={handleToggle}
        disabled={activateProjectEvent.isPending}
      />
    </div>
  )
}
```

**What it does**: Activates the project event (atomically clears any previously active event) or deactivates it.

**Under the hood**:
```typescript
await runTransaction(firestore, async (transaction) => {
  const projectRef = doc(firestore, 'projects', projectId)
  const eventRef = doc(firestore, `projects/${projectId}/events`, eventId)

  // Verify event exists and is not deleted
  const eventDoc = await transaction.get(eventRef)
  if (!eventDoc.exists()) throw new Error('Project event not found')
  if (eventDoc.data().status === 'deleted') {
    throw new Error('Cannot activate deleted project event')
  }

  // Atomically update activeEventId (clears previous active event)
  transaction.update(projectRef, { activeEventId: eventId })
})
```

---

## Key Files to Know

### Core Hooks

| File | Purpose | Key Function |
|------|---------|--------------|
| `hooks/useProjectEvents.ts` | Real-time project events list subscription | Returns `{ data: ProjectEvent[], isLoading, error }` |
| `hooks/useCreateProjectEvent.ts` | Create project event mutation | `mutateAsync({ name? })` → `ProjectEvent` |
| `hooks/useRenameProjectEvent.ts` | Rename project event mutation | `mutateAsync({ eventId, name })` → `ProjectEvent` |
| `hooks/useDeleteProjectEvent.ts` | Soft delete project event mutation | `mutateAsync({ eventId })` → `void` |
| `hooks/useActivateProjectEvent.ts` | Activate/deactivate project event mutation | `mutateAsync({ eventId \| null })` → `void` |

### Core Components

| File | Purpose | Props |
|------|---------|-------|
| `containers/ProjectEventsPage.tsx` | Main page for project detail page | `{ projectId: string }` |
| `components/ProjectEventsList.tsx` | List of project events with empty state | `{ events: ProjectEvent[], projectId, activeEventId? }` |
| `components/ProjectEventItem.tsx` | Individual project event row | `{ event: ProjectEvent, isActive, projectId }` |
| `components/CreateProjectEventButton.tsx` | Button to create new project event | `{ projectId: string }` |
| `components/DeleteProjectEventDialog.tsx` | Confirmation dialog for deletion | `{ eventId, projectId, open, onOpenChange }` |
| `components/RenameProjectEventDialog.tsx` | Dialog for renaming project event | `{ eventId, projectId, initialName, open, onOpenChange }` |

### Schemas & Types

| File | Purpose | Exports |
|------|---------|---------|
| `schemas/project-event.schema.ts` | ProjectEvent entity Zod schema | `projectEventSchema`, `projectEventStatusSchema` |
| `schemas/create-project-event.schema.ts` | Create project event input schema | `createProjectEventInputSchema` |
| `schemas/update-project-event.schema.ts` | Update project event input schema | `updateProjectEventInputSchema` |
| `types/project-event.types.ts` | TypeScript types | `ProjectEvent`, `ProjectEventStatus` |

---

## Data Model Quick Reference

### ProjectEvent Entity

```typescript
type ProjectEvent = {
  id: string                       // Firestore document ID
  // projectId is implicit in subcollection path (NOT stored as field)
  name: string                     // Display name (default: "Untitled event")
  status: "draft" | "deleted"      // Lifecycle status
  createdAt: number                // Timestamp (ms)
  updatedAt: number                // Timestamp (ms)
  deletedAt: number | null         // Soft delete timestamp (null if not deleted)
}
```

### Project Entity (Updated)

```typescript
type Project = {
  // ... existing fields ...
  activeEventId: string | null  // Reference to active project event (null if none)
}
```

---

## Firestore Queries

### Get All Non-Deleted Project Events for a Project

```typescript
// Subcollection path (projectId in path, not query filter)
const eventsRef = collection(firestore, `projects/${projectId}/events`)
const q = query(
  eventsRef,
  where('status', '==', 'draft'),
  orderBy('createdAt', 'desc')
)

const unsubscribe = onSnapshot(q, (snapshot) => {
  const events = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }))
  setEvents(events)
})
```

### Get Active Project Event for a Project

```typescript
const projectRef = doc(firestore, 'projects', projectId)
const projectDoc = await getDoc(projectRef)
const activeEventId = projectDoc.data()?.activeEventId

if (activeEventId) {
  const eventRef = doc(firestore, `projects/${projectId}/events`, activeEventId)
  const eventDoc = await getDoc(eventRef)
  if (eventDoc.exists()) {
    const activeEvent = { id: eventDoc.id, ...eventDoc.data() }
  }
}
```

### Get All Project Events Across All Projects (Collection Group Query)

```typescript
// Use collection group query for cross-project queries
const eventsRef = collectionGroup(firestore, 'events')
const q = query(
  eventsRef,
  where('status', '==', 'draft'),
  orderBy('createdAt', 'desc')
)

const snapshot = await getDocs(q)
const allEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
```

---

## Firestore Security Rules

**Key Principle**: Rules check **WHO** can access. Zod schemas validate **WHAT** is valid.

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function: Check if user is admin
    function isAdmin() {
      return request.auth != null &&
             request.auth.token.admin == true;
    }

    // Project events subcollection (simple admin check only)
    match /projects/{projectId}/events/{eventId} {
      // Read: Allow admins only
      allow read: if isAdmin();

      // Write: Allow admins only
      allow create, update: if isAdmin();

      // Delete: Deny hard deletes (soft delete only via update)
      allow delete: if false;
    }

    // Projects collection (existing rules with activeEventId addition)
    match /projects/{projectId} {
      // Read: Public (for guest links)
      allow read: if true;

      // Write: Admins only
      allow create, update: if isAdmin();

      // Delete: Deny hard deletes
      allow delete: if false;
    }
  }
}
```

**Key Points**:
- ✅ Simple admin checks only (no data validation)
- ✅ No expensive `get()` calls
- ✅ Data validation happens in application code with Zod
- ✅ Follows `standards/backend/firestore-security.md`

---

## Testing

### Unit Tests (Hooks)

```typescript
// hooks/__tests__/useCreateProjectEvent.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useCreateProjectEvent } from '../useCreateProjectEvent'

test('creates project event with default name', async () => {
  const { result } = renderHook(() => useCreateProjectEvent('proj-123'))

  await act(async () => {
    const event = await result.current.mutateAsync({})
    expect(event.name).toBe('Untitled event')
    expect(event.status).toBe('draft')
  })
})
```

### Component Tests (Testing Library)

```typescript
// components/__tests__/ProjectEventsList.test.tsx
import { render, screen } from '@testing-library/react'
import { ProjectEventsList } from '../ProjectEventsList'

test('shows empty state when no project events', () => {
  render(<ProjectEventsList events={[]} projectId="proj-123" />)
  expect(screen.getByText(/no events/i)).toBeInTheDocument()
})

test('renders project events list when events exist', () => {
  const events = [{ id: '1', name: 'Event 1', status: 'draft', ... }]
  render(<ProjectEventsList events={events} projectId="proj-123" />)
  expect(screen.getByText('Event 1')).toBeInTheDocument()
})
```

---

## Common Troubleshooting

### Issue: Project events not updating in real-time

**Cause**: `onSnapshot` listener not set up correctly or unsubscribed too early

**Solution**: Ensure `useProjectEvents` hook returns cleanup function:

```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(q, (snapshot) => {
    // Update state
  })
  return () => unsubscribe() // Cleanup on unmount
}, [projectId])
```

---

### Issue: Cannot activate project event (Firestore permission denied)

**Cause**: User is not admin or Firestore security rules are incorrect

**Solution**: Verify user is admin and check Firestore rules:

```javascript
// Check user has admin custom claim
allow read, write: if isAdmin();
```

---

### Issue: Deleted project event still appears in list

**Cause**: Query not filtering by `status !== "deleted"`

**Solution**: Update query to exclude deleted events:

```typescript
where('status', '==', 'draft')  // Only show draft events
```

---

### Issue: Multiple project events active at once

**Cause**: Not using Firestore transaction for activation

**Solution**: Use `runTransaction()` to atomically update `project.activeEventId`:

```typescript
await runTransaction(firestore, async (transaction) => {
  const projectRef = doc(firestore, 'projects', projectId)
  transaction.update(projectRef, { activeEventId: eventId })
})
```

---

### Issue: projectId field missing in query results

**Cause**: projectId is implicit in subcollection path (not stored as field)

**Solution**: Extract projectId from document path if needed:

```typescript
const projectId = doc.ref.parent.parent?.id  // Get parent project ID from subcollection path
```

---

## Performance Considerations

### Real-Time Updates

- **Target**: < 500ms from Firestore change to UI update
- **Optimization**: Use Firestore collection group index on `status + createdAt`
- **Monitoring**: Track real-time update latency in Sentry

### Project Events List Pagination

- **Current**: Load all events (spec supports up to 100 events per project)
- **Future**: If projects exceed 100 events, implement pagination with `limit()` and `startAfter()`

### Mobile Performance

- **Touch Targets**: 44x44px minimum for all interactive elements
- **Page Load**: < 2 seconds on 4G networks
- **Optimization**: Code-split project events page, lazy-load dialogs

---

## Standards & Best Practices

### Must Follow

- ✅ **Client-first architecture**: Use Firestore client SDK for all operations
- ✅ **Subcollection structure**: `projects/{projectId}/events` (projectId in path)
- ✅ **Zod validation**: Validate all inputs and outputs in application code
- ✅ **Simple security rules**: Admin checks only (no data validation in rules)
- ✅ **Mobile-first design**: 44x44px touch targets, test on real devices
- ✅ **shadcn/ui components**: Use AlertDialog, Switch, DropdownMenu (don't reinvent)
- ✅ **Real-time updates**: Use `onSnapshot()` for live data
- ✅ **Security via rules**: Enforce authorization in Firestore rules, not application code

### Avoid

- ❌ **Hard deletes**: Use soft delete (status field) only
- ❌ **Server functions**: Use client SDK unless absolutely necessary
- ❌ **Custom modals**: Use shadcn/ui Dialog and AlertDialog
- ❌ **Storing activation on event**: Use `project.activeEventId` for atomic constraint
- ❌ **Data validation in security rules**: Violates standards, use Zod in app code
- ❌ **Storing projectId as field**: It's implicit in subcollection path

---

## Related Documentation

- **Feature Spec**: [spec.md](./spec.md)
- **Implementation Plan**: [plan.md](./plan.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Research**: [research.md](./research.md)
- **API Contracts**: [contracts/](./contracts/)
- **Standards**:
  - `standards/global/client-first-architecture.md`
  - `standards/backend/firestore.md`
  - `standards/backend/firestore-security.md` ⭐ **Important: Simple rules only**
  - `standards/frontend/component-libraries.md`
  - `standards/global/zod-validation.md`

---

## Next Steps

1. ✅ Review this quickstart guide
2. ✅ Read the feature spec and implementation plan
3. ✅ Set up development environment (`pnpm dev`)
4. ✅ Create project events domain structure (`/domains/project/events`)
5. ✅ Implement core hooks (useProjectEvents, useCreateProjectEvent)
6. ✅ Build UI components (ProjectEventsList, ProjectEventItem)
7. ✅ Write tests (unit tests for hooks, component tests for UI)
8. ✅ Run validation loop (`pnpm app:check`, `pnpm type-check`)
9. ✅ Deploy Firestore security rules (simple admin checks only)
10. ✅ Deploy Firestore indexes (collection group index)
11. ✅ Test on real mobile devices

---

**Questions?** Check the feature spec, implementation plan, or reach out to the team.

**Remember**:
- Subcollection structure: `projects/{projectId}/events`
- Simple security rules: `isAdmin()` only, no data validation
- Validation in app code: Zod schemas, not Firestore rules
