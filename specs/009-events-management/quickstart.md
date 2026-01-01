# Quickstart Guide: Events Management

**Feature**: 009-events-management
**Date**: 2026-01-01
**Audience**: Developers implementing or maintaining this feature

## Overview

This guide provides a quick reference for developers working on the Events Management feature. It covers the feature's purpose, architecture, key files, common operations, and troubleshooting.

## What This Feature Does

**Events Management** allows workspace admins to:

1. ✅ View all events for a project in a list
2. ✅ Create new events with default naming ("Untitled event")
3. ✅ Rename events for better organization
4. ✅ Activate exactly one event per project (or none)
5. ✅ Deactivate the currently active event
6. ✅ Soft-delete events to keep the workspace clean

**Key Business Rules**:
- Only **one event can be active** per project at any time
- Events are **soft-deleted** (never hard-deleted)
- Deleted events are **hidden from all lists** and cannot be accessed
- Only **workspace admins** can manage events

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│  EventsManagementContainer → EventsList → EventItem             │
│  CreateEventButton, DeleteEventDialog, RenameEventDialog        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         React Hooks                              │
│  useEvents (real-time subscription via onSnapshot)              │
│  useCreateEvent, useRenameEvent, useDeleteEvent, useActivateEvent│
│  (TanStack Query mutations)                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Firebase Firestore (Client SDK)               │
│  events collection: { id, projectId, name, status, ... }        │
│  projects collection: { ..., activeEventId }                    │
│  Security Rules: Enforce workspace admin authorization          │
└─────────────────────────────────────────────────────────────────┘
```

**Architecture Pattern**: Client-first (Firestore client SDK for all operations)
**Security Enforcement**: Firestore security rules (not application code)
**Real-Time Updates**: `onSnapshot()` for live event list updates

## Directory Structure

```
apps/clementine-app/src/domains/workspace/projects/events/
├── components/
│   ├── EventsList.tsx              # List of events with empty state
│   ├── EventItem.tsx               # Individual event row (activation switch + context menu)
│   ├── CreateEventButton.tsx       # Button to create new event
│   ├── DeleteEventDialog.tsx       # Confirmation dialog for deletion
│   └── RenameEventDialog.tsx       # Dialog for renaming event
├── containers/
│   └── EventsManagementContainer.tsx  # Main container (integrates all components)
├── hooks/
│   ├── useEvents.ts                # Real-time event list subscription
│   ├── useCreateEvent.ts           # Create event mutation
│   ├── useDeleteEvent.ts           # Soft delete event mutation
│   ├── useRenameEvent.ts           # Rename event mutation
│   └── useActivateEvent.ts         # Activate/deactivate event mutation
├── schemas/
│   ├── event.schema.ts             # Event entity Zod schema
│   ├── createEvent.schema.ts       # Create event input schema
│   ├── updateEvent.schema.ts       # Update event input schema
│   └── index.ts                    # Schema exports
├── types/
│   ├── event.types.ts              # Event, EventStatus types
│   └── index.ts                    # Type exports
└── index.ts                        # Barrel export (components, hooks, types only)
```

## Quick Reference: Common Operations

### 1. Get Events for a Project (Real-Time)

**Hook**: `useEvents(projectId)`

```typescript
import { useEvents } from '@/domains/workspace/projects/events'

function MyComponent({ projectId }: { projectId: string }) {
  const { data: events, isLoading, error } = useEvents(projectId)

  if (isLoading) return <div>Loading events...</div>
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

**What it does**: Subscribes to real-time updates for all non-deleted events in a project.

---

### 2. Create a New Event

**Hook**: `useCreateEvent()`

```typescript
import { useCreateEvent } from '@/domains/workspace/projects/events'
import { useNavigate } from '@tanstack/react-router'

function CreateEventButton({ projectId }: { projectId: string }) {
  const navigate = useNavigate()
  const createEvent = useCreateEvent()

  const handleCreate = async () => {
    const newEvent = await createEvent.mutateAsync({ projectId })
    navigate({ to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId', params: { eventId: newEvent.id } })
  }

  return <button onClick={handleCreate}>Create Event</button>
}
```

**What it does**: Creates a new event with default name "Untitled event" and status "draft".

---

### 3. Rename an Event

**Hook**: `useRenameEvent()`

```typescript
import { useRenameEvent } from '@/domains/workspace/projects/events'

function RenameEventDialog({ eventId }: { eventId: string }) {
  const renameEvent = useRenameEvent()
  const [name, setName] = useState('')

  const handleRename = async () => {
    await renameEvent.mutateAsync({ eventId, name })
    // Dialog closes automatically via onSuccess callback
  }

  return (
    <form onSubmit={handleRename}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button type="submit">Rename</button>
    </form>
  )
}
```

**What it does**: Updates the event name and reflects changes in real-time across all views.

---

### 4. Delete an Event (Soft Delete)

**Hook**: `useDeleteEvent()`

```typescript
import { useDeleteEvent } from '@/domains/workspace/projects/events'

function DeleteEventDialog({ eventId, projectId }: { eventId: string; projectId: string }) {
  const deleteEvent = useDeleteEvent()

  const handleDelete = async () => {
    await deleteEvent.mutateAsync({ eventId, projectId })
    // Event disappears from list via real-time update
  }

  return (
    <AlertDialog>
      <AlertDialogContent>
        <AlertDialogTitle>Delete Event?</AlertDialogTitle>
        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

**What it does**: Soft-deletes the event (sets status to "deleted"). If the event was active, clears the project's activeEventId.

---

### 5. Activate/Deactivate an Event

**Hook**: `useActivateEvent()`

```typescript
import { useActivateEvent } from '@/domains/workspace/projects/events'

function EventItem({ event, projectId, isActive }: { event: Event; projectId: string; isActive: boolean }) {
  const activateEvent = useActivateEvent()

  const handleToggle = async () => {
    if (isActive) {
      await activateEvent.mutateAsync({ projectId, eventId: null }) // Deactivate
    } else {
      await activateEvent.mutateAsync({ projectId, eventId: event.id }) // Activate
    }
  }

  return (
    <div>
      <span>{event.name}</span>
      <Switch checked={isActive} onCheckedChange={handleToggle} />
    </div>
  )
}
```

**What it does**: Activates the event (atomically clears any previously active event) or deactivates it.

---

## Key Files to Know

### Core Hooks

| File | Purpose | Key Function |
|------|---------|--------------|
| `hooks/useEvents.ts` | Real-time event list subscription | Returns `{ data: Event[], isLoading, error }` |
| `hooks/useCreateEvent.ts` | Create event mutation | `mutateAsync({ projectId, name? })` → `Event` |
| `hooks/useRenameEvent.ts` | Rename event mutation | `mutateAsync({ eventId, name })` → `Event` |
| `hooks/useDeleteEvent.ts` | Soft delete event mutation | `mutateAsync({ eventId, projectId })` → `void` |
| `hooks/useActivateEvent.ts` | Activate/deactivate event mutation | `mutateAsync({ projectId, eventId \| null })` → `void` |

### Core Components

| File | Purpose | Props |
|------|---------|-------|
| `containers/EventsManagementContainer.tsx` | Main container for project detail page | `{ projectId: string }` |
| `components/EventsList.tsx` | List of events with empty state | `{ events: Event[], projectId, activeEventId? }` |
| `components/EventItem.tsx` | Individual event row | `{ event: Event, isActive, projectId }` |
| `components/CreateEventButton.tsx` | Button to create new event | `{ projectId: string }` |
| `components/DeleteEventDialog.tsx` | Confirmation dialog for deletion | `{ eventId, projectId, open, onOpenChange }` |
| `components/RenameEventDialog.tsx` | Dialog for renaming event | `{ eventId, initialName, open, onOpenChange }` |

### Schemas & Types

| File | Purpose | Exports |
|------|---------|---------|
| `schemas/event.schema.ts` | Event entity Zod schema | `eventSchema`, `eventStatusSchema` |
| `schemas/createEvent.schema.ts` | Create event input schema | `createEventInputSchema` |
| `schemas/updateEvent.schema.ts` | Update event input schema | `updateEventInputSchema` |
| `types/event.types.ts` | TypeScript types | `Event`, `EventStatus` |

---

## Data Model Quick Reference

### Event Entity

```typescript
type Event = {
  id: string                // Firestore document ID
  projectId: string         // Parent project reference
  name: string              // Display name (default: "Untitled event")
  status: "draft" | "deleted"  // Lifecycle status
  createdAt: number         // Timestamp (ms)
  updatedAt: number         // Timestamp (ms)
  deletedAt: number | null  // Soft delete timestamp (null if not deleted)
}
```

### Project Entity (Updated)

```typescript
type Project = {
  // ... existing fields ...
  activeEventId: string | null  // Reference to active event (null if none)
}
```

---

## Firestore Queries

### Get All Non-Deleted Events for a Project

```typescript
const eventsRef = collection(firestore, 'events')
const q = query(
  eventsRef,
  where('projectId', '==', projectId),
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

### Get Active Event for a Project

```typescript
const projectRef = doc(firestore, 'projects', projectId)
const projectDoc = await getDoc(projectRef)
const activeEventId = projectDoc.data()?.activeEventId

if (activeEventId) {
  const eventRef = doc(firestore, 'events', activeEventId)
  const eventDoc = await getDoc(eventRef)
  const activeEvent = { id: eventDoc.id, ...eventDoc.data() }
}
```

---

## Firestore Security Rules

```javascript
match /events/{eventId} {
  // Read: Allow workspace admins of parent project's workspace
  allow read: if isWorkspaceAdmin(getProject(resource.data.projectId).data.workspaceId);

  // Create: Allow workspace admins
  allow create: if isWorkspaceAdmin(getProject(request.resource.data.projectId).data.workspaceId);

  // Update: Allow workspace admins (prevent changing projectId)
  allow update: if isWorkspaceAdmin(getProject(resource.data.projectId).data.workspaceId) &&
                   request.resource.data.projectId == resource.data.projectId;

  // Delete: Deny hard deletes (soft delete only)
  allow delete: if false;
}
```

**Key Points**:
- ✅ Only workspace admins can read/write events
- ✅ Hard deletes are prevented (soft delete only via update)
- ✅ `projectId` cannot be changed after creation

---

## Testing

### Unit Tests (Hooks)

```typescript
// hooks/__tests__/useCreateEvent.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useCreateEvent } from '../useCreateEvent'

test('creates event with default name', async () => {
  const { result } = renderHook(() => useCreateEvent())

  await act(async () => {
    const event = await result.current.mutateAsync({ projectId: 'proj-123' })
    expect(event.name).toBe('Untitled event')
    expect(event.status).toBe('draft')
  })
})
```

### Component Tests (Testing Library)

```typescript
// components/__tests__/EventsList.test.tsx
import { render, screen } from '@testing-library/react'
import { EventsList } from '../EventsList'

test('shows empty state when no events', () => {
  render(<EventsList events={[]} projectId="proj-123" />)
  expect(screen.getByText(/no events/i)).toBeInTheDocument()
})

test('renders event list when events exist', () => {
  const events = [{ id: '1', name: 'Event 1', ... }]
  render(<EventsList events={events} projectId="proj-123" />)
  expect(screen.getByText('Event 1')).toBeInTheDocument()
})
```

---

## Common Troubleshooting

### Issue: Events not updating in real-time

**Cause**: `onSnapshot` listener not set up correctly or unsubscribed too early

**Solution**: Ensure `useEvents` hook returns cleanup function:

```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(q, (snapshot) => {
    // Update state
  })
  return () => unsubscribe() // Cleanup on unmount
}, [projectId])
```

---

### Issue: Cannot activate event (Firestore permission denied)

**Cause**: User is not workspace admin or Firestore security rules are incorrect

**Solution**: Verify user is workspace admin and check Firestore rules:

```javascript
allow update: if isWorkspaceAdmin(getProject(resource.data.projectId).data.workspaceId);
```

---

### Issue: Deleted event still appears in list

**Cause**: Query not filtering by `status !== "deleted"`

**Solution**: Update query to exclude deleted events:

```typescript
where('status', '==', 'draft')  // Only show draft events
```

---

### Issue: Multiple events active at once

**Cause**: Not using Firestore transaction for activation

**Solution**: Use `runTransaction()` to atomically update `project.activeEventId`:

```typescript
await runTransaction(firestore, async (transaction) => {
  const projectRef = doc(firestore, 'projects', projectId)
  transaction.update(projectRef, { activeEventId: eventId })
})
```

---

## Performance Considerations

### Real-Time Updates

- **Target**: < 500ms from Firestore change to UI update
- **Optimization**: Use Firestore composite index on `projectId + status + createdAt`
- **Monitoring**: Track real-time update latency in Sentry

### Event List Pagination

- **Current**: Load all events (spec supports up to 100 events per project)
- **Future**: If projects exceed 100 events, implement pagination with `limit()` and `startAfter()`

### Mobile Performance

- **Touch Targets**: 44x44px minimum for all interactive elements
- **Page Load**: < 2 seconds on 4G networks
- **Optimization**: Code-split events management container, lazy-load dialogs

---

## Standards & Best Practices

### Must Follow

- ✅ **Client-first architecture**: Use Firestore client SDK for all operations
- ✅ **Zod validation**: Validate all inputs and outputs
- ✅ **Mobile-first design**: 44x44px touch targets, test on real devices
- ✅ **shadcn/ui components**: Use AlertDialog, Switch, DropdownMenu (don't reinvent)
- ✅ **Real-time updates**: Use `onSnapshot()` for live data
- ✅ **Security via rules**: Enforce authorization in Firestore rules, not application code

### Avoid

- ❌ **Hard deletes**: Use soft delete (status field) only
- ❌ **Server functions**: Use client SDK unless absolutely necessary
- ❌ **Custom modals**: Use shadcn/ui Dialog and AlertDialog
- ❌ **Storing activation on event**: Use `project.activeEventId` for atomic constraint

---

## Related Documentation

- **Feature Spec**: [spec.md](./spec.md)
- **Implementation Plan**: [plan.md](./plan.md)
- **Data Model**: [data-model.md](./data-model.md)
- **API Contracts**: [contracts/](./contracts/)
- **Standards**:
  - `standards/global/client-first-architecture.md`
  - `standards/backend/firestore.md`
  - `standards/frontend/component-libraries.md`
  - `standards/global/zod-validation.md`

---

## Next Steps

1. ✅ Review this quickstart guide
2. ✅ Read the feature spec and implementation plan
3. ✅ Set up development environment (`pnpm dev`)
4. ✅ Create events subdomain structure
5. ✅ Implement core hooks (useEvents, useCreateEvent)
6. ✅ Build UI components (EventsList, EventItem)
7. ✅ Write tests (unit tests for hooks, component tests for UI)
8. ✅ Run validation loop (`pnpm app:check`, `pnpm type-check`)
9. ✅ Test on real mobile devices
10. ✅ Deploy Firestore security rules and indexes

---

**Questions?** Check the feature spec, implementation plan, or reach out to the team.
