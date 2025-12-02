# Repository API Contract: Projects

**Feature**: Projects - Foundation for Nested Events
**Date**: 2025-12-02
**Implementation**: `web/src/features/projects/repositories/projects.repository.ts`

## Overview

This document defines the API contract for Project repository functions. All read operations use Firebase Client SDK for real-time subscriptions and optimistic reads per Constitution Principle VI.

## Repository Functions

### getProject

**Description**: Fetches a single project by ID (real-time subscription or one-time read)

**Signature**:
```typescript
function getProject(
  projectId: string,
  options?: { subscribe?: boolean }
): Promise<Project | null> | Unsubscribe
```

**Parameters**:
- `projectId`: Firestore document ID
- `options.subscribe`: If true, returns real-time subscription; if false/undefined, returns one-time read

**Return**:
- **One-time read** (`subscribe: false`): `Promise<Project | null>`
- **Real-time subscription** (`subscribe: true`): `Unsubscribe` function, calls callback with updated project

**Behavior**:
1. Query Firestore `/projects/{projectId}`
2. If `subscribe: true`, attach `onSnapshot` listener
3. If `subscribe: false`, fetch with `get()`
4. Return parsed Project object or null if not found

**Error Cases**:
- Project not found: Returns `null`
- Firestore error: Throws error (caught by caller)

**Usage**:
```typescript
// One-time read
const project = await getProject('project123');

// Real-time subscription
const unsubscribe = getProject('project123', { subscribe: true }, (project) => {
  console.log('Project updated:', project);
});
// Later: unsubscribe();
```

---

### listProjects

**Description**: Fetches all projects for a company (filtered, sorted, paginated)

**Signature**:
```typescript
interface ListProjectsOptions {
  companyId: string;
  status?: ProjectStatus | ProjectStatus[];  // Filter by status
  excludeDeleted?: boolean;                  // Default true
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortOrder?: 'asc' | 'desc';                // Default desc
  limit?: number;                            // Pagination limit
  startAfter?: string;                       // Pagination cursor (project ID)
  subscribe?: boolean;                       // Real-time subscription
}

function listProjects(
  options: ListProjectsOptions
): Promise<Project[]> | Unsubscribe
```

**Parameters**:
- `companyId`: Filter by company (required)
- `status`: Filter by status (optional, supports array for multiple statuses)
- `excludeDeleted`: Filter out soft-deleted projects (default `true`)
- `sortBy`: Sort field (default `updatedAt`)
- `sortOrder`: Sort direction (default `desc`)
- `limit`: Max results (default 50, max 100)
- `startAfter`: Pagination cursor for next page
- `subscribe`: Real-time subscription (default `false`)

**Return**:
- **One-time read**: `Promise<Project[]>`
- **Real-time subscription**: `Unsubscribe` function, calls callback with updated project list

**Behavior**:
1. Build Firestore query with filters:
   - `companyId == {companyId}`
   - `status in [{statuses}]` (if provided)
   - `deletedAt == null` (if excludeDeleted)
2. Add sorting: `orderBy({sortBy}, {sortOrder})`
3. Add pagination: `limit({limit})`, `startAfter({cursor})`
4. If `subscribe: true`, attach `onSnapshot` listener
5. If `subscribe: false`, fetch with `get()`
6. Return parsed Project array

**Error Cases**:
- Invalid companyId: Returns empty array
- Firestore error: Throws error (caught by caller)

**Usage**:
```typescript
// One-time read - all live projects for company
const projects = await listProjects({
  companyId: 'company123',
  status: 'live',
});

// Real-time subscription - all non-deleted projects
const unsubscribe = listProjects(
  {
    companyId: 'company123',
    excludeDeleted: true,
    subscribe: true,
  },
  (projects) => {
    console.log('Projects updated:', projects);
  }
);

// Pagination - next page
const nextPage = await listProjects({
  companyId: 'company123',
  limit: 20,
  startAfter: lastProjectId,
});
```

---

### getProjectBySharePath

**Description**: Fetches a project by its share path (for guest access)

**Signature**:
```typescript
function getProjectBySharePath(
  sharePath: string
): Promise<Project | null>
```

**Parameters**:
- `sharePath`: Unique share path (e.g., `/p/abc123`)

**Return**:
- `Promise<Project | null>`

**Behavior**:
1. Query Firestore where `sharePath == {sharePath}`
2. Check project status: only return if `status == 'live'` and `deletedAt == null`
3. Check scheduling: if `publishStartAt` or `publishEndAt` set, verify current time is within range
4. Return parsed Project object or null if not found/not accessible

**Error Cases**:
- Share path not found: Returns `null`
- Project not live: Returns `null`
- Project outside publish window: Returns `null`
- Firestore error: Throws error (caught by caller)

**Usage**:
```typescript
// Guest accesses /p/abc123
const project = await getProjectBySharePath('/p/abc123');
if (project) {
  // Load active experience
  const experience = await getExperience(project.activeEventId);
}
```

**Security**: This function is called from public guest routes - no authentication required. Access control is enforced by:
1. Status check (`live` only)
2. Scheduling window check
3. Firestore security rules (allow reads on `/projects`)

---

### getProjectStats

**Description**: Fetches aggregate statistics for a project (optional - future enhancement)

**Signature**:
```typescript
interface ProjectStats {
  totalSessions: number;      // Count of guest sessions
  completedSessions: number;  // Count of completed sessions
  averageDuration: number;    // Average session duration (seconds)
  lastSessionAt: number | null; // Most recent session timestamp
}

function getProjectStats(
  projectId: string
): Promise<ProjectStats | null>
```

**Note**: This function is a placeholder for future analytics integration. Not implemented in Phase 4.

---

## Firestore Queries

**Indexes Required** (firebase.json):
```json
{
  "indexes": [
    {
      "collectionGroup": "projects",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "companyId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "projects",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "companyId", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "projects",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "sharePath", "order": "ASCENDING" }
      ]
    }
  ]
}
```

## Type Parsing

All repository functions parse Firestore documents to TypeScript types:

```typescript
function parseProject(doc: DocumentSnapshot): Project | null {
  if (!doc.exists()) return null;

  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    status: data.status,
    companyId: data.companyId ?? null,
    sharePath: data.sharePath,
    qrPngPath: data.qrPngPath,
    publishStartAt: data.publishStartAt ?? null,
    publishEndAt: data.publishEndAt ?? null,
    activeEventId: data.activeEventId ?? null,
    theme: data.theme,
    deletedAt: data.deletedAt ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
```

## Error Handling

All repository functions follow consistent error handling:

```typescript
try {
  const snapshot = await db.collection('projects').doc(projectId).get();
  return parseProject(snapshot);
} catch (error) {
  console.error('Repository error:', error);
  throw new Error('Failed to fetch project');
}
```

## Testing

**Unit Tests** (`projects.repository.test.ts`):
```typescript
describe('getProject', () => {
  it('fetches project by ID', async () => {
    const project = await getProject('project123');
    expect(project).toBeDefined();
    expect(project.id).toBe('project123');
  });

  it('returns null for non-existent project', async () => {
    const project = await getProject('nonexistent');
    expect(project).toBeNull();
  });
});

describe('listProjects', () => {
  it('filters by companyId', async () => {
    const projects = await listProjects({ companyId: 'company123' });
    projects.forEach(p => {
      expect(p.companyId).toBe('company123');
    });
  });

  it('excludes deleted projects by default', async () => {
    const projects = await listProjects({ companyId: 'company123' });
    projects.forEach(p => {
      expect(p.deletedAt).toBeNull();
    });
  });

  it('filters by status', async () => {
    const projects = await listProjects({
      companyId: 'company123',
      status: 'live',
    });
    projects.forEach(p => {
      expect(p.status).toBe('live');
    });
  });
});

describe('getProjectBySharePath', () => {
  it('fetches live project by share path', async () => {
    const project = await getProjectBySharePath('/p/abc123');
    expect(project).toBeDefined();
    expect(project.status).toBe('live');
  });

  it('returns null for draft project', async () => {
    // Create draft project with share path /p/draft123
    const project = await getProjectBySharePath('/p/draft123');
    expect(project).toBeNull();
  });

  it('returns null for project outside publish window', async () => {
    // Create project with publishEndAt in past
    const project = await getProjectBySharePath('/p/expired123');
    expect(project).toBeNull();
  });
});
```

## Implementation Checklist

- [ ] Implement `getProject` (one-time read + subscription)
- [ ] Implement `listProjects` with filtering, sorting, pagination
- [ ] Implement `getProjectBySharePath` with status and scheduling checks
- [ ] Add Firestore query builders
- [ ] Add type parsing function (`parseProject`)
- [ ] Add unit tests for all repository functions
- [ ] Add integration tests for real-time subscriptions
- [ ] Create Firestore indexes (firebase.json)
- [ ] Document query performance characteristics
