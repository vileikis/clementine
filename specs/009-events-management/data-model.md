# Data Model: Events Management

**Feature**: 009-events-management
**Date**: 2026-01-01
**Status**: Final (Updated for subcollection structure)

## Overview

This document defines the data model for the Project Events Management feature, including entity schemas, relationships, validation rules, state transitions, and Firestore subcollection structure.

## Entities

### ProjectEvent

Represents an AI-powered photo booth experience within a project. Project events can be created, renamed, activated, and soft-deleted by workspace admins.

**Firestore Subcollection**: `projects/{projectId}/events/{eventId}`

**Schema**:

```typescript
export type ProjectEventStatus = "draft" | "deleted"

export type ProjectEvent = {
  id: string                      // Firestore document ID (auto-generated)
  // Note: projectId is implicit in the document path, not stored as a field
  name: string                    // Project event display name (default: "Untitled event")
  status: ProjectEventStatus      // Project event lifecycle status (default: "draft")
  createdAt: number               // Creation timestamp (milliseconds since epoch)
  updatedAt: number               // Last update timestamp (milliseconds since epoch)
  deletedAt: number | null        // Soft delete timestamp (null if not deleted)
}
```

**Field Constraints**:

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | Auto-generated | Firestore document ID |
| `name` | string | Yes | "Untitled event" | Min length: 1, Max length: 100 |
| `status` | ProjectEventStatus | Yes | "draft" | Enum: "draft" \| "deleted" |
| `createdAt` | number | Yes | `Date.now()` | Positive integer timestamp |
| `updatedAt` | number | Yes | `Date.now()` | Positive integer timestamp |
| `deletedAt` | number \| null | Yes | null | Positive integer or null |

**Note**: `projectId` is NOT stored as a field - it's implicit in the Firestore document path `projects/{projectId}/events/{eventId}`.

**Indexes**:

```javascript
// Firestore composite indexes
{
  collectionGroup: "events",
  queryScope: "COLLECTION_GROUP",
  fields: [
    { fieldPath: "status", order: "ASCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
}
```

**Validation Rules**:

```typescript
import { z } from 'zod'

export const projectEventStatusSchema = z.enum(['draft', 'deleted'])

export const projectEventSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  status: projectEventStatusSchema,
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  deletedAt: z.number().int().positive().nullable()
})

export type ProjectEvent = z.infer<typeof projectEventSchema>
export type ProjectEventStatus = z.infer<typeof projectEventStatusSchema>
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

1. **Soft Delete Only**: Project events are never hard-deleted. Deletion sets `status = "deleted"` and `deletedAt = Date.now()`
2. **Deleted Events Hidden**: Project events with `status === "deleted"` are excluded from all queries
3. **Deleted Events Inaccessible**: Direct access to deleted project events returns 404 Not Found
4. **No Activation When Deleted**: Deleted project events cannot be activated
5. **No Rename When Deleted**: Deleted project events cannot be renamed
6. **Creation Default**: New project events always have `status = "draft"` and `deletedAt = null`

---

### Project (Updated)

Existing entity with new field added for active project event management.

**Firestore Collection**: `projects/{projectId}`

**New Field**:

```typescript
export type Project = {
  // ... existing fields ...
  activeEventId: string | null   // Reference to currently active project event (null if none)
}
```

**Field Constraints**:

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `activeEventId` | string \| null | Yes | null | Must reference existing non-deleted project event or be null |

**Validation Rules**:

```typescript
// Add to existing projectSchema
export const projectSchema = z.object({
  // ... existing fields ...
  activeEventId: z.string().min(1).nullable()
})
```

**Business Rules**:

1. **Single Active Event**: `activeEventId` can reference at most one project event at any time
2. **No Active Event Allowed**: `activeEventId` can be null (project has no active event)
3. **Atomic Activation**: Setting `activeEventId` must atomically clear previous value (Firestore transaction)
4. **Deleted Event Check**: If referenced project event is deleted, `activeEventId` must be cleared to null
5. **Same Project Constraint**: An event can only be active in its parent project (enforced by subcollection path)

---

## Relationships

### ProjectEvent → Project (Many-to-One)

**Relationship**: Each project event belongs to exactly one project (via Firestore subcollection path).

**Implementation**:
- **Subcollection Path**: `projects/{projectId}/events/{eventId}`
- **Cardinality**: Many project events to one project
- **Implicit Parent Reference**: projectId is in the path, not stored as a field
- **Cascade Behavior**: When project is deleted, all project events should be soft-deleted (via application logic or scheduled job)

**Queries**:

```typescript
// Get all non-deleted project events for a project
const eventsRef = collection(firestore, `projects/${projectId}/events`)
const q = query(
  eventsRef,
  where('status', '==', 'draft'),
  orderBy('createdAt', 'desc')
)

// Real-time subscription
const unsubscribe = onSnapshot(q, (snapshot) => {
  const events = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
})
```

---

### Project → ActiveEvent (Optional One-to-One)

**Relationship**: Each project has at most one active project event (or none).

**Implementation**:
- **Foreign Key**: `project.activeEventId` references project event ID (nullable)
- **Cardinality**: One project to zero or one project event
- **Constraint**: `project.activeEventId` must reference an event where `event.status === "draft"` and event exists in `projects/{projectId}/events/`

**Queries**:

```typescript
// Get active project event for a project
const projectRef = doc(firestore, 'projects', projectId)
const projectDoc = await getDoc(projectRef)
const activeEventId = projectDoc.data()?.activeEventId

if (activeEventId) {
  const eventRef = doc(firestore, `projects/${projectId}/events`, activeEventId)
  const eventDoc = await getDoc(eventRef)
  if (eventDoc.exists()) {
    const activeEvent = projectEventSchema.parse({ id: eventDoc.id, ...eventDoc.data() })
  }
}
```

**Activation Transaction**:

```typescript
// Atomically activate project event (ensure single active constraint)
await runTransaction(firestore, async (transaction) => {
  const projectRef = doc(firestore, 'projects', projectId)
  const eventRef = doc(firestore, `projects/${projectId}/events`, eventId)

  // Verify event exists and is not deleted
  const eventDoc = await transaction.get(eventRef)
  if (!eventDoc.exists()) throw new Error('Project event not found')
  if (eventDoc.data().status === 'deleted') throw new Error('Cannot activate deleted project event')

  // Atomically update activeEventId (clears previous active event)
  transaction.update(projectRef, { activeEventId: eventId })
})
```

---

## Firestore Security Rules

Security rules enforce workspace admin authorization with simple authentication checks (per `standards/backend/firestore-security.md`).

**Key Principle**: Security rules check **WHO** can access data. Data validation happens with Zod schemas in application code.

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

**Security Guarantees**:

1. ✅ Only admins can read, create, update project events
2. ✅ Hard deletes are prevented (soft delete only)
3. ✅ Projects are publicly readable (for guest links)
4. ✅ **Simple authentication checks only** (no data validation)
5. ✅ **No expensive get() calls** (no nested database lookups)
6. ✅ **Easy to understand and maintain**

**Data Validation**: All data validation (status, required fields, name length, etc.) happens in Zod schemas in application code, NOT in security rules.

---

## Input/Output Schemas

### Create Project Event Input

```typescript
export const createProjectEventInputSchema = z.object({
  // projectId is NOT in the input - it's derived from the subcollection path
  name: z.string().min(1).max(100).optional().default('Untitled event')
})

export type CreateProjectEventInput = z.infer<typeof createProjectEventInputSchema>
```

**Usage**:

```typescript
const input = createProjectEventInputSchema.parse({ name: 'Summer Festival' })
// => { name: 'Summer Festival' }

// Create in subcollection (projectId in path, not data)
const eventsRef = collection(firestore, `projects/${projectId}/events`)
await addDoc(eventsRef, {
  ...input,
  status: 'draft',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  deletedAt: null
})
```

---

### Update Project Event Input

```typescript
export const updateProjectEventInputSchema = z.object({
  name: z.string().min(1).max(100)
})

export type UpdateProjectEventInput = z.infer<typeof updateProjectEventInputSchema>
```

**Usage**:

```typescript
const input = updateProjectEventInputSchema.parse({ name: 'Summer Festival 2026' })
// => { name: 'Summer Festival 2026' }
```

---

### Delete Project Event Input

```typescript
export const deleteProjectEventInputSchema = z.object({
  projectId: z.string().min(1),  // Needed to construct subcollection path
  eventId: z.string().min(1)
})

export type DeleteProjectEventInput = z.infer<typeof deleteProjectEventInputSchema>
```

**Usage**:

```typescript
const input = deleteProjectEventInputSchema.parse({ projectId: 'proj-123', eventId: 'event-456' })
// => { projectId: 'proj-123', eventId: 'event-456' }
```

---

### Activate Project Event Input

```typescript
export const activateProjectEventInputSchema = z.object({
  projectId: z.string().min(1),
  eventId: z.string().min(1)
})

export type ActivateProjectEventInput = z.infer<typeof activateProjectEventInputSchema>
```

**Usage**:

```typescript
const input = activateProjectEventInputSchema.parse({ projectId: 'proj-123', eventId: 'event-456' })
// => { projectId: 'proj-123', eventId: 'event-456' }
```

---

### Deactivate Project Event Input

```typescript
export const deactivateProjectEventInputSchema = z.object({
  projectId: z.string().min(1)
})

export type DeactivateProjectEventInput = z.infer<typeof deactivateProjectEventInputSchema>
```

**Usage**:

```typescript
const input = deactivateProjectEventInputSchema.parse({ projectId: 'proj-123' })
// => { projectId: 'proj-123' }
```

---

## Error Scenarios

### Project Event Not Found

**Scenario**: Client requests project event that doesn't exist or is deleted

**Response**: 404 Not Found (treat deleted events as non-existent)

**Validation**:

```typescript
const eventDoc = await getDoc(doc(firestore, `projects/${projectId}/events`, eventId))
if (!eventDoc.exists() || eventDoc.data().status === 'deleted') {
  throw new Error('Project event not found')
}
```

---

### Project Not Found

**Scenario**: Client creates project event for non-existent project

**Response**: 400 Bad Request (invalid projectId in path)

**Validation**:

```typescript
const projectDoc = await getDoc(doc(firestore, 'projects', projectId))
if (!projectDoc.exists() || projectDoc.data().status === 'deleted') {
  throw new Error('Project not found')
}
```

---

### Unauthorized Access

**Scenario**: User is not admin

**Response**: 403 Forbidden (Firestore security rules block access)

**Enforcement**: Firestore security rules check `request.auth.token.admin == true`

---

### Invalid Activation

**Scenario**: Attempt to activate deleted project event

**Response**: 400 Bad Request (cannot activate deleted project event)

**Validation**:

```typescript
const eventDoc = await getDoc(doc(firestore, `projects/${projectId}/events`, eventId))
if (eventDoc.data().status === 'deleted') {
  throw new Error('Cannot activate deleted project event')
}
```

---

### Concurrent Activation

**Scenario**: Two admins activate different project events simultaneously

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

---

### Create Project Events Subcollection

**Required**: Yes (new subcollection structure)

**Migration Strategy**: No migration needed (new feature, no existing data)

**Initial State**: Empty subcollections (will be populated as admins create project events)

---

### Firestore Indexes

**Required**: Yes (collection group index for cross-project queries)

**Index Configuration**:

Add to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
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

**Data Model Status**: ✅ COMPLETE (Updated for subcollection structure)

**Entities**: 2 (ProjectEvent, Project)
**New Subcollections**: 1 (`projects/{projectId}/events`)
**Modified Collections**: 1 (projects - add activeEventId field)
**Relationships**: 2 (ProjectEvent → Project via subcollection path, Project → ActiveEvent via activeEventId)
**Validation Schemas**: 7 (projectEvent, createProjectEventInput, updateProjectEventInput, deleteProjectEventInput, activateProjectEventInput, deactivateProjectEventInput, projectEventStatus)
**Security Rules**: Simple admin checks only (per standards)
**Migration Required**: No (new feature, backward-compatible field addition)

**Key Changes from Original Plan**:
- ✅ Subcollection structure instead of top-level collection
- ✅ projectId implicit in path (not stored as field)
- ✅ Simplified security rules (admin checks only, no data validation)
- ✅ Renamed from "Event" to "ProjectEvent" for clarity

**Next Step**: Update API contracts in `contracts/` directory.
