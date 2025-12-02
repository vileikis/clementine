# Server Actions API Contract: Projects

**Feature**: Projects - Foundation for Nested Events
**Date**: 2025-12-02
**Implementation**: `web/src/features/projects/actions/projects.actions.ts`

## Overview

This document defines the API contract for Project Server Actions. All mutations (create, update, delete, status changes) go through Server Actions using Firebase Admin SDK per Constitution Principle VI.

## Actions

### createProject

**Description**: Creates a new project with generated share path and QR code

**Input**:
```typescript
interface CreateProjectInput {
  name: string;              // min 1, max 100 chars
  companyId: string | null;  // FK to /companies (null for legacy)
  theme?: ProjectTheme;      // Optional - uses default if not provided
}
```

**Output**:
```typescript
interface CreateProjectResult {
  success: boolean;
  projectId?: string;        // Firestore document ID of created project
  error?: string;            // Error message if success = false
}
```

**Behavior**:
1. Validate input with Zod schema
2. Generate unique share path (e.g., `/p/{randomId}`)
3. Create QR code image with share link, upload to Firebase Storage
4. Get full public URL for QR code
5. Create project document in Firestore `/projects` collection with:
   - Generated ID
   - Input fields (name, companyId, theme or default)
   - Generated fields (sharePath, qrPngPath)
   - Status: `draft`
   - Timestamps: createdAt, updatedAt (current Unix ms)
   - Null fields: publishStartAt, publishEndAt, activeEventId, deletedAt
6. Return success with projectId

**Error Cases**:
- Invalid input (validation fails): `success: false, error: "Validation error: [details]"`
- Firestore write fails: `success: false, error: "Failed to create project"`
- QR generation fails: `success: false, error: "Failed to generate QR code"`
- Share path collision (rare): Retry with new random ID

**Authorization**: Requires authenticated user (Next.js middleware)

---

### updateProject

**Description**: Updates project fields (name, theme, scheduling, activeEventId)

**Input**:
```typescript
interface UpdateProjectInput {
  projectId: string;                     // Required
  name?: string;                         // min 1, max 100 chars
  theme?: Partial<ProjectTheme>;         // Partial theme update
  publishStartAt?: number | null;        // Unix timestamp ms
  publishEndAt?: number | null;          // Unix timestamp ms
  activeEventId?: string | null;         // FK to Experience (Phase 4) or Event (Phase 5)
}
```

**Output**:
```typescript
interface UpdateProjectResult {
  success: boolean;
  error?: string;            // Error message if success = false
}
```

**Behavior**:
1. Validate input with Zod schema
2. Check project exists in Firestore
3. Update project document with provided fields
4. Set updatedAt to current Unix ms
5. Return success

**Error Cases**:
- Invalid input: `success: false, error: "Validation error: [details]"`
- Project not found: `success: false, error: "Project not found"`
- Firestore write fails: `success: false, error: "Failed to update project"`

**Authorization**: Requires authenticated user + project ownership (companyId match)

**Note**: Does NOT update status - use `updateProjectStatus` for status transitions

---

### updateProjectStatus

**Description**: Updates project status with business rule validation

**Input**:
```typescript
interface UpdateProjectStatusInput {
  projectId: string;
  status: "draft" | "live" | "archived";  // Cannot set to "deleted" - use deleteProject
}
```

**Output**:
```typescript
interface UpdateProjectStatusResult {
  success: boolean;
  error?: string;
}
```

**Behavior**:
1. Validate input with Zod schema
2. Check project exists and current status
3. Validate status transition (see data-model.md for rules)
4. Update project status
5. Set updatedAt to current Unix ms
6. Return success

**Error Cases**:
- Invalid input: `success: false, error: "Validation error: [details]"`
- Project not found: `success: false, error: "Project not found"`
- Invalid transition: `success: false, error: "Cannot transition from {current} to {target}"`
- Firestore write fails: `success: false, error: "Failed to update status"`

**Authorization**: Requires authenticated user + project ownership

**Status Transition Rules** (all allowed in Phase 4):
```
draft → live | archived | deleted
live → draft | archived | deleted
archived → live | deleted
deleted → (none) - final state
```

---

### deleteProject

**Description**: Soft deletes a project by setting deletedAt timestamp

**Input**:
```typescript
interface DeleteProjectInput {
  projectId: string;
}
```

**Output**:
```typescript
interface DeleteProjectResult {
  success: boolean;
  error?: string;
}
```

**Behavior**:
1. Validate input with Zod schema
2. Check project exists
3. Set project status to `deleted`
4. Set deletedAt to current Unix ms
5. Set updatedAt to current Unix ms
6. Return success

**Error Cases**:
- Invalid input: `success: false, error: "Validation error: [details]"`
- Project not found: `success: false, error: "Project not found"`
- Already deleted: `success: false, error: "Project already deleted"`
- Firestore write fails: `success: false, error: "Failed to delete project"`

**Authorization**: Requires authenticated user + project ownership

**Note**: This is a soft delete - document remains in Firestore with `deletedAt` timestamp. Admin queries filter `deletedAt == null`.

---

### updateProjectTheme

**Description**: Updates project theme configuration (convenience action for partial theme updates)

**Input**:
```typescript
interface UpdateProjectThemeInput {
  projectId: string;
  theme: Partial<ProjectTheme>;  // Partial theme - deep merge with existing
}
```

**Output**:
```typescript
interface UpdateProjectThemeResult {
  success: boolean;
  error?: string;
}
```

**Behavior**:
1. Validate input with Zod schema
2. Check project exists
3. Deep merge provided theme with existing theme
4. Update project.theme field
5. Set updatedAt to current Unix ms
6. Return success

**Error Cases**:
- Invalid input: `success: false, error: "Validation error: [details]"`
- Project not found: `success: false, error: "Project not found"`
- Firestore write fails: `success: false, error: "Failed to update theme"`

**Authorization**: Requires authenticated user + project ownership

**Note**: This is a convenience wrapper around `updateProject` for theme-specific updates. Uses deep merge to preserve nested theme properties.

---

## Shared Types

```typescript
// Zod validation schemas (web/src/features/projects/schemas/)
const createProjectInputSchema = z.object({
  name: z.string().min(1).max(100),
  companyId: z.string().nullable(),
  theme: projectThemeSchema.optional(),
});

const updateProjectInputSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(100).optional(),
  theme: projectThemeSchema.partial().optional(),
  publishStartAt: z.number().nullable().optional(),
  publishEndAt: z.number().nullable().optional(),
  activeEventId: z.string().nullable().optional(),
});

const updateProjectStatusInputSchema = z.object({
  projectId: z.string(),
  status: z.enum(["draft", "live", "archived"]),
});

const deleteProjectInputSchema = z.object({
  projectId: z.string(),
});

const updateProjectThemeInputSchema = z.object({
  projectId: z.string(),
  theme: projectThemeSchema.partial(),
});
```

## Error Handling

All Server Actions follow consistent error handling pattern:

```typescript
try {
  // Validate input
  const validated = schema.parse(input);

  // Business logic with Admin SDK
  const result = await db.collection('projects')...;

  return { success: true, ...data };
} catch (error) {
  if (error instanceof z.ZodError) {
    return { success: false, error: `Validation error: ${error.message}` };
  }
  console.error('Action error:', error);
  return { success: false, error: 'Internal server error' };
}
```

## Usage Examples

**Client Component**:
```typescript
import { createProject } from '@/features/projects/actions/projects.actions';

async function handleCreateProject(name: string) {
  const result = await createProject({
    name,
    companyId: currentCompanyId,
  });

  if (result.success) {
    router.push(`/projects/${result.projectId}`);
  } else {
    toast.error(result.error);
  }
}
```

**Form Integration** (React Hook Form):
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectInputSchema } from '@/features/projects/schemas';

const form = useForm({
  resolver: zodResolver(createProjectInputSchema),
});

async function onSubmit(data) {
  const result = await createProject(data);
  if (result.success) {
    // Handle success
  }
}
```

## Testing

**Unit Tests** (`projects.actions.test.ts`):
```typescript
describe('createProject', () => {
  it('creates project with valid input', async () => {
    const result = await createProject({
      name: 'Test Project',
      companyId: 'company123',
    });
    expect(result.success).toBe(true);
    expect(result.projectId).toBeDefined();
  });

  it('rejects invalid name (too long)', async () => {
    const result = await createProject({
      name: 'x'.repeat(101),
      companyId: 'company123',
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Validation error');
  });
});
```

## Implementation Checklist

- [ ] Implement `createProject` action with QR generation
- [ ] Implement `updateProject` action
- [ ] Implement `updateProjectStatus` action with transition rules
- [ ] Implement `deleteProject` action (soft delete)
- [ ] Implement `updateProjectTheme` action (convenience wrapper)
- [ ] Add Zod input validation schemas
- [ ] Add unit tests for all actions (happy path + error cases)
- [ ] Add integration tests for status transitions
- [ ] Document error messages for client-side display
