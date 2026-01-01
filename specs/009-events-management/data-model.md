# Data Model: Events Management

**Feature**: 009-events-management
**Date**: 2026-01-01
**Status**: Final

## Overview

This document defines the data model for the Events Management feature, including entity schemas, relationships, validation rules, state transitions, and Firestore collection structure.

## Entities

### Event

Represents an AI-powered photo booth experience within a project. Events can be created, renamed, activated, and soft-deleted by workspace admins.

**Firestore Collection**: `events`

**Schema**:

```typescript
export type EventStatus = "draft" | "deleted"

export type Event = {
  id: string                 // Firestore document ID (auto-generated)
  projectId: string          // Reference to parent project (required)
  name: string               // Event display name (default: "Untitled event")
  status: EventStatus        // Event lifecycle status (default: "draft")
  createdAt: number          // Creation timestamp (milliseconds since epoch)
  updatedAt: number          // Last update timestamp (milliseconds since epoch)
  deletedAt: number | null   // Soft delete timestamp (null if not deleted)
}
```

**Field Constraints**:

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | Auto-generated | Firestore document ID |
| `projectId` | string | Yes | - | Must reference existing project |
| `name` | string | Yes | "Untitled event" | Min length: 1, Max length: 100 |
| `status` | EventStatus | Yes | "draft" | Enum: "draft" \| "deleted" |
| `createdAt` | number | Yes | `Date.now()` | Positive integer timestamp |
| `updatedAt` | number | Yes | `Date.now()` | Positive integer timestamp |
| `deletedAt` | number \| null | Yes | null | Positive integer or null |

**Indexes**:

```javascript
// Firestore composite indexes
{
  collectionGroup: "events",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "projectId", order: "ASCENDING" },
    { fieldPath: "status", order: "ASCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
}
```

**Validation Rules**:

```typescript
import { z } from 'zod'

export const eventStatusSchema = z.enum(['draft', 'deleted'])

export const eventSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1).max(100),
  status: eventStatusSchema,
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  deletedAt: z.number().int().positive().nullable()
})

export type Event = z.infer<typeof eventSchema>
export type EventStatus = z.infer<typeof eventStatusSchema>
```

**State Transitions**:

```
[INITIAL STATE]
      |
      v
   "draft" -----> "deleted" (soft delete)
      ^
      |
   (cannot transition back from "deleted")
```

**Business Rules**:

1. **Soft Delete Only**: Events are never hard-deleted. Deletion sets `status = "deleted"` and `deletedAt = Date.now()`
2. **Deleted Events Hidden**: Events with `status === "deleted"` are excluded from all queries
3. **Deleted Events Inaccessible**: Direct access to deleted events returns 404 Not Found
4. **No Activation When Deleted**: Deleted events cannot be activated
5. **No Rename When Deleted**: Deleted events cannot be renamed
6. **Creation Default**: New events always have `status = "draft"` and `deletedAt = null`

---

### Project (Updated)

Existing entity with new field added for active event management.

**Firestore Collection**: `projects`

**New Field**:

```typescript
export type Project = {
  // ... existing fields ...
  activeEventId: string | null   // Reference to currently active event (null if none)
}
```

**Field Constraints**:

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `activeEventId` | string \| null | Yes | null | Must reference existing non-deleted event or be null |

**Validation Rules**:

```typescript
// Add to existing projectSchema
export const projectSchema = z.object({
  // ... existing fields ...
  activeEventId: z.string().min(1).nullable()
})
```

**Business Rules**:

1. **Single Active Event**: `activeEventId` can reference at most one event at any time
2. **No Active Event Allowed**: `activeEventId` can be null (project has no active event)
3. **Atomic Activation**: Setting `activeEventId` must atomically clear previous value (Firestore transaction)
4. **Deleted Event Check**: If referenced event is deleted, `activeEventId` must be cleared to null
5. **Cross-Project Constraint**: An event can only be active in its parent project (enforced by `event.projectId === project.id`)

---

## Relationships

### Event → Project (Many-to-One)

**Relationship**: Each event belongs to exactly one project.

**Implementation**:
- **Foreign Key**: `event.projectId` references `project.id`
- **Cardinality**: Many events to one project
- **Cascade Behavior**: When project is deleted, all events should be soft-deleted (via Firestore security rules or application logic)

**Queries**:

```typescript
// Get all non-deleted events for a project
const eventsRef = collection(firestore, 'events')
const q = query(
  eventsRef,
  where('projectId', '==', projectId),
  where('status', '==', 'draft'),
  orderBy('createdAt', 'desc')
)
```

---

### Project → ActiveEvent (Optional One-to-One)

**Relationship**: Each project has at most one active event (or none).

**Implementation**:
- **Foreign Key**: `project.activeEventId` references `event.id` (nullable)
- **Cardinality**: One project to zero or one event
- **Constraint**: `project.activeEventId` must reference an event where `event.status === "draft"` and `event.projectId === project.id`

**Queries**:

```typescript
// Get active event for a project
const projectRef = doc(firestore, 'projects', projectId)
const projectDoc = await getDoc(projectRef)
const activeEventId = projectDoc.data()?.activeEventId

if (activeEventId) {
  const eventRef = doc(firestore, 'events', activeEventId)
  const eventDoc = await getDoc(eventRef)
  const activeEvent = eventSchema.parse({ id: eventDoc.id, ...eventDoc.data() })
}
```

**Activation Transaction**:

```typescript
// Atomically activate event (ensure single active constraint)
await runTransaction(firestore, async (transaction) => {
  const projectRef = doc(firestore, 'projects', projectId)
  const eventRef = doc(firestore, 'events', eventId)

  // Verify event exists and belongs to project
  const eventDoc = await transaction.get(eventRef)
  if (!eventDoc.exists()) throw new Error('Event not found')
  if (eventDoc.data().projectId !== projectId) throw new Error('Event does not belong to project')
  if (eventDoc.data().status === 'deleted') throw new Error('Cannot activate deleted event')

  // Atomically update activeEventId (clears previous active event)
  transaction.update(projectRef, { activeEventId: eventId })
})
```

---

## Firestore Security Rules

Security rules enforce workspace admin authorization and prevent invalid state transitions.

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function: Check if user is workspace admin
    function isWorkspaceAdmin(workspaceId) {
      return request.auth != null &&
             exists(/databases/$(database)/documents/workspaces/$(workspaceId)/members/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/workspaces/$(workspaceId)/members/$(request.auth.uid)).data.role == 'admin';
    }

    // Helper function: Get project document
    function getProject(projectId) {
      return get(/databases/$(database)/documents/projects/$(projectId));
    }

    // Events collection
    match /events/{eventId} {
      // Read: Allow workspace admins of parent project's workspace
      allow read: if isWorkspaceAdmin(getProject(resource.data.projectId).data.workspaceId);

      // Create: Allow workspace admins, validate required fields
      allow create: if isWorkspaceAdmin(getProject(request.resource.data.projectId).data.workspaceId) &&
                       request.resource.data.keys().hasAll(['projectId', 'name', 'status', 'createdAt', 'updatedAt', 'deletedAt']) &&
                       request.resource.data.status == 'draft' &&
                       request.resource.data.deletedAt == null;

      // Update: Allow workspace admins, prevent changing projectId
      allow update: if isWorkspaceAdmin(getProject(resource.data.projectId).data.workspaceId) &&
                       request.resource.data.projectId == resource.data.projectId;

      // Delete: Deny hard deletes (soft delete only via update)
      allow delete: if false;
    }

    // Projects collection (existing rules with activeEventId addition)
    match /projects/{projectId} {
      // ... existing rules ...

      // Update activeEventId: Allow workspace admins, validate event belongs to project
      allow update: if isWorkspaceAdmin(resource.data.workspaceId) &&
                       (request.resource.data.activeEventId == null ||
                        (exists(/databases/$(database)/documents/events/$(request.resource.data.activeEventId)) &&
                         get(/databases/$(database)/documents/events/$(request.resource.data.activeEventId)).data.projectId == projectId &&
                         get(/databases/$(database)/documents/events/$(request.resource.data.activeEventId)).data.status == 'draft'));
    }
  }
}
```

**Security Guarantees**:

1. ✅ Only workspace admins can read, create, update events
2. ✅ Hard deletes are prevented (soft delete only)
3. ✅ `projectId` cannot be changed after creation (prevents moving events between projects)
4. ✅ Active event must belong to project and not be deleted
5. ✅ Required fields are enforced on creation

---

## Input/Output Schemas

### Create Event Input

```typescript
export const createEventInputSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(100).optional().default('Untitled event')
})

export type CreateEventInput = z.infer<typeof createEventInputSchema>
```

**Usage**:

```typescript
const input = createEventInputSchema.parse({ projectId: 'project-123' })
// => { projectId: 'project-123', name: 'Untitled event' }
```

---

### Update Event Input

```typescript
export const updateEventInputSchema = z.object({
  name: z.string().min(1).max(100)
})

export type UpdateEventInput = z.infer<typeof updateEventInputSchema>
```

**Usage**:

```typescript
const input = updateEventInputSchema.parse({ name: 'Summer Festival 2026' })
// => { name: 'Summer Festival 2026' }
```

---

### Delete Event Input

```typescript
export const deleteEventInputSchema = z.object({
  eventId: z.string().min(1)
})

export type DeleteEventInput = z.infer<typeof deleteEventInputSchema>
```

**Usage**:

```typescript
const input = deleteEventInputSchema.parse({ eventId: 'event-456' })
// => { eventId: 'event-456' }
```

---

### Activate Event Input

```typescript
export const activateEventInputSchema = z.object({
  projectId: z.string().min(1),
  eventId: z.string().min(1)
})

export type ActivateEventInput = z.infer<typeof activateEventInputSchema>
```

**Usage**:

```typescript
const input = activateEventInputSchema.parse({ projectId: 'project-123', eventId: 'event-456' })
// => { projectId: 'project-123', eventId: 'event-456' }
```

---

### Deactivate Event Input

```typescript
export const deactivateEventInputSchema = z.object({
  projectId: z.string().min(1)
})

export type DeactivateEventInput = z.infer<typeof deactivateEventInputSchema>
```

**Usage**:

```typescript
const input = deactivateEventInputSchema.parse({ projectId: 'project-123' })
// => { projectId: 'project-123' }
```

---

## Error Scenarios

### Event Not Found

**Scenario**: Client requests event that doesn't exist or is deleted

**Response**: 404 Not Found (treat deleted events as non-existent)

**Validation**:

```typescript
const eventDoc = await getDoc(doc(firestore, 'events', eventId))
if (!eventDoc.exists() || eventDoc.data().status === 'deleted') {
  throw new Error('Event not found')
}
```

---

### Project Not Found

**Scenario**: Client creates event for non-existent project

**Response**: 400 Bad Request (invalid projectId reference)

**Validation**:

```typescript
const projectDoc = await getDoc(doc(firestore, 'projects', projectId))
if (!projectDoc.exists() || projectDoc.data().status === 'deleted') {
  throw new Error('Project not found')
}
```

---

### Unauthorized Access

**Scenario**: User is not workspace admin for project's workspace

**Response**: 403 Forbidden (Firestore security rules block access)

**Enforcement**: Firestore security rules (see above)

---

### Invalid Activation

**Scenario**: Attempt to activate deleted event

**Response**: 400 Bad Request (cannot activate deleted event)

**Validation**:

```typescript
const eventDoc = await getDoc(doc(firestore, 'events', eventId))
if (eventDoc.data().status === 'deleted') {
  throw new Error('Cannot activate deleted event')
}
```

---

### Concurrent Activation

**Scenario**: Two admins activate different events simultaneously

**Response**: Last write wins (Firestore transaction ensures atomic update)

**Mitigation**: Use Firestore transaction for activation (see "Activation Transaction" above)

---

## Migration Plan

### Add activeEventId to Projects

**Required**: Yes (new field on existing collection)

**Migration Strategy**: No migration script needed

**Rationale**:
- New field `activeEventId` defaults to `null` (no active event)
- Existing projects without this field will read as `null` (Firestore returns `undefined`, Zod coerces to `null`)
- No data transformation required

**Firestore Update**:

```typescript
// No migration needed - field will be added on first activation
// Existing projects: activeEventId = undefined (coerced to null by Zod)
// New projects: activeEventId = null (explicit default)
```

---

### Create Events Collection

**Required**: Yes (new collection)

**Migration Strategy**: No migration needed (new feature, no existing data)

**Initial State**: Empty collection (will be populated as admins create events)

---

### Firestore Indexes

**Required**: Yes (composite index for efficient queries)

**Index Configuration**:

Add to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "projectId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**Deploy Command**:

```bash
firebase deploy --only firestore:indexes
```

---

## Summary

**Data Model Status**: ✅ COMPLETE

**Entities**: 2 (Event, Project)
**New Collections**: 1 (events)
**Modified Collections**: 1 (projects - add activeEventId field)
**Relationships**: 2 (Event → Project, Project → ActiveEvent)
**Validation Schemas**: 7 (event, createEventInput, updateEventInput, deleteEventInput, activateEventInput, deactivateEventInput, eventStatus)
**Security Rules**: Defined for events collection and project activeEventId updates
**Migration Required**: No (new feature, backward-compatible field addition)

**Next Step**: Define API contracts in `contracts/` directory.
