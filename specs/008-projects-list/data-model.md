# Data Model: Projects List & Basic Project Management

**Feature**: `008-projects-list`
**Date**: 2025-12-30
**Status**: Draft

## Overview

This document defines the data model for the Projects feature. Projects are organizational units within workspaces that contain photo/video experience configurations. This feature establishes the foundational data structure for project management.

## Entities

### Project

**Description**: Represents a photo/video experience project within a workspace. Projects belong to exactly one workspace and are the primary container for events, media, and experience configurations.

**Firestore Collection**: `projects` (top-level collection)

**TypeScript Interface**:

```typescript
/**
 * Project lifecycle state
 * - draft: Project is being configured, not yet live
 * - live: Project is active and accessible to guests
 * - deleted: Project is soft-deleted (hidden from lists, inaccessible)
 */
export type ProjectStatus = 'draft' | 'live' | 'deleted'

/**
 * Project entity representing a photo/video experience
 */
export interface Project {
  /** Unique project identifier (Firestore document ID) */
  id: string

  /** Human-readable project name (1-100 characters) */
  name: string

  /** Reference to parent workspace (workspaceId) */
  workspaceId: string

  /** Current lifecycle state (draft | live | deleted) */
  status: ProjectStatus

  /** Reference to currently active event (null if no active event) */
  activeEventId: string | null

  /** Unix timestamp (ms) when project was soft deleted (null if active) */
  deletedAt: number | null

  /** Unix timestamp (ms) when project was created */
  createdAt: number

  /** Unix timestamp (ms) of last modification */
  updatedAt: number
}
```

**Firestore Document Structure**:

```javascript
{
  "id": "proj_abc123",                    // Auto-generated Firestore doc ID
  "name": "Untitled project",             // Default on creation
  "workspaceId": "workspace_xyz789",      // Parent workspace reference
  "status": "draft",                      // Lifecycle state
  "activeEventId": null,                  // Switchboard pattern for active event
  "deletedAt": null,                      // Soft delete timestamp (null = active)
  "createdAt": 1704067200000,             // Server timestamp on create
  "updatedAt": 1704067200000              // Server timestamp on create/update
}
```

**Field Validations**:

| Field | Type | Required | Validation Rules |
|-------|------|----------|-----------------|
| `id` | string | ✅ | Firestore auto-generated document ID |
| `name` | string | ✅ | 1-100 characters, non-empty |
| `workspaceId` | string | ✅ | Must reference existing workspace document |
| `status` | string | ✅ | Must be 'draft', 'live', or 'deleted' |
| `activeEventId` | string \| null | ✅ | Null or valid event ID (future: must reference existing event) |
| `deletedAt` | number \| null | ✅ | Null when active, Unix timestamp (ms) when deleted |
| `createdAt` | number | ✅ | Unix timestamp (ms), server-generated |
| `updatedAt` | number | ✅ | Unix timestamp (ms), server-generated |

**Indexes Required**:

```javascript
// Firestore composite indexes for efficient queries
[
  {
    collectionGroup: "projects",
    fields: [
      { fieldPath: "workspaceId", order: "ASCENDING" },
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" }
    ]
  }
]
```

**Query Patterns**:

1. **List active projects in workspace** (primary use case):
   ```typescript
   query(
     collection(firestore, 'projects'),
     where('workspaceId', '==', workspaceId),
     where('status', '==', 'active'),
     orderBy('createdAt', 'desc')
   )
   ```

2. **Get single project by ID** (project details page):
   ```typescript
   doc(firestore, 'projects', projectId)
   ```

3. **Count projects in workspace** (future analytics):
   ```typescript
   query(
     collection(firestore, 'projects'),
     where('workspaceId', '==', workspaceId),
     where('status', '==', 'active')
   )
   ```

### Workspace (Existing Entity - Reference Only)

**Description**: Organizational container for projects. Projects belong to exactly one workspace.

**Relationship**: One workspace has many projects (1:N)

**Firestore Collection**: `workspaces` (existing, no changes needed)

**Relevant Fields**:
- `id` - Referenced by `Project.workspaceId`
- `slug` - Used in route parameters (`/workspace/:workspaceSlug/projects`)
- `status` - Workspace must be 'active' for projects to be accessible

## Relationships

```
Workspace (1) ←──[has many]──→ (N) Projects
  ↓                                ↓
  id ────────[workspaceId]────────→ workspaceId
```

**Cascade Behavior**:
- Workspace soft delete → Projects remain (orphaned, but data preserved for potential restore)
- Workspace hard delete (future) → Projects hard delete (data loss)

**Access Control**:
- Workspace admin can CRUD projects in their workspace
- Projects are isolated by workspace (cross-workspace access forbidden)

## Data Integrity

### Constraints

1. **Workspace Reference Integrity**:
   - `Project.workspaceId` MUST reference an existing workspace
   - Enforced by Firestore security rules (validate workspace exists and user has access)

2. **Soft Delete Consistency**:
   - When `status` is 'deleted', `deletedAt` MUST be non-null
   - When `status` is 'draft' or 'live', `deletedAt` MUST be null
   - Enforced by Firestore security rules

3. **Timestamp Consistency**:
   - `createdAt` MUST be set on document creation (server timestamp)
   - `updatedAt` MUST be updated on every mutation (server timestamp)
   - Enforced by Firestore security rules

4. **Status Lifecycle**:
   - Valid transitions: draft → live, draft → deleted, live → deleted
   - Invalid transition: deleted → (any) (deletion is permanent from UI perspective)
   - Enforced by application logic (Firestore rules allow restoration for potential admin feature)

### Validation Rules (Zod Schemas)

```typescript
import { z } from 'zod'

export const projectStatusSchema = z.enum(['draft', 'live', 'deleted'])

export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  workspaceId: z.string().min(1),
  status: projectStatusSchema,
  activeEventId: z.string().nullable(),
  deletedAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const createProjectInputSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1).max(100).optional().default('Untitled project'),
})

export const deleteProjectInputSchema = z.object({
  id: z.string().min(1),
})
```

## Security Model

### Firestore Security Rules

Projects are secured at the database level via Firestore security rules. All operations enforce workspace-scoped access control.

**Rules Pattern** (to be added to `firestore.rules`):

```javascript
// Projects collection rules
match /projects/{projectId} {
  // Helper: Check if user is admin of the project's workspace
  function isWorkspaceAdmin(workspaceId) {
    return request.auth != null
      && request.auth.uid != null
      && exists(/databases/$(database)/documents/workspaces/$(workspaceId))
      && get(/databases/$(database)/documents/workspaces/$(workspaceId)).data.status == 'active';
    // Note: Assumes workspace admins stored in workspace document or separate collection
    // Actual implementation depends on existing auth model
  }

  // Read: Allow if user is admin of project's workspace AND project is not deleted
  allow read: if isWorkspaceAdmin(resource.data.workspaceId)
    && resource.data.status != 'deleted';

  // Create: Allow if user is admin of the workspace AND sets valid initial data
  allow create: if isWorkspaceAdmin(request.resource.data.workspaceId)
    && request.resource.data.status == 'draft'
    && request.resource.data.deletedAt == null
    && request.resource.data.name.size() >= 1
    && request.resource.data.name.size() <= 100;

  // Update (soft delete): Allow if user is admin AND setting status to 'deleted'
  allow update: if isWorkspaceAdmin(resource.data.workspaceId)
    && request.resource.data.status == 'deleted'
    && request.resource.data.deletedAt is timestamp
    && request.resource.data.updatedAt is timestamp;

  // Delete (hard delete): Not allowed from client (future admin operation)
  allow delete: if false;
}
```

**Security Principles**:
1. All operations require authentication (`request.auth != null`)
2. All operations require workspace admin access (enforced by helper function)
3. Soft-deleted projects are not readable (filtered at database level)
4. Hard deletes are forbidden (data preservation for potential restore)
5. All validations happen at database level (no trust in client code)

## Migration & Backwards Compatibility

**Impact**: New feature, no existing data to migrate.

**Database Changes**:
1. Create `projects` collection (empty initially)
2. Add Firestore composite index for workspace-scoped queries
3. Deploy Firestore security rules for projects collection

**Rollback Strategy**: Drop `projects` collection and remove security rules (no impact on existing features)

## Future Considerations

1. **Events Relationship**: Projects will have 1:N relationship with Events (not in this feature scope)
2. **Project Templates**: Ability to create projects from templates (data model supports via additional fields)
3. **Project Duplication**: Copy project with all settings (requires deep clone logic)
4. **Project Restoration**: UI for restoring soft-deleted projects (rules already permit this)
5. **Project Archiving**: Separate 'archived' status distinct from 'deleted' (requires status enum expansion)
6. **Project Sharing**: Cross-workspace project sharing (requires permissions model redesign)

## Appendix

### Example Project Lifecycle

1. **Creation**: Admin creates project in workspace
   ```javascript
   {
     id: "proj_abc123",
     name: "Untitled project",
     workspaceId: "ws_xyz789",
     status: "draft",
     activeEventId: null,
     deletedAt: null,
     createdAt: 1704067200000,
     updatedAt: 1704067200000
   }
   ```

2. **Update** (future feature): Admin renames project
   ```javascript
   {
     id: "proj_abc123",
     name: "Summer Festival 2024",
     workspaceId: "ws_xyz789",
     status: "draft",
     activeEventId: null,
     deletedAt: null,
     createdAt: 1704067200000,
     updatedAt: 1704070800000  // Updated timestamp
   }
   ```

3. **Soft Delete**: Admin deletes project
   ```javascript
   {
     id: "proj_abc123",
     name: "Summer Festival 2024",
     workspaceId: "ws_xyz789",
     status: "deleted",          // Status changed
     activeEventId: null,
     deletedAt: 1704074400000,   // Deletion timestamp set
     createdAt: 1704067200000,
     updatedAt: 1704074400000    // Updated timestamp
   }
   ```

### Performance Considerations

**Query Performance**:
- Composite index ensures fast queries even with 100+ projects per workspace
- Real-time listeners use index for efficient updates
- Soft delete filter prevents deleted projects from impacting query performance

**Write Performance**:
- Server timestamps add negligible latency (<10ms)
- Soft deletes are single-document updates (fast)
- No cascading operations required

**Cost Optimization**:
- Single query per workspace (no pagination needed for <100 projects)
- Real-time listeners reuse existing connections
- Minimal document reads (list query + individual project reads only when needed)
