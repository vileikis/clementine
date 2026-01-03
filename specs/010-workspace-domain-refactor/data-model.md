# Data Model: Workspace Domain

**Feature**: Workspace Domain Refactoring
**Phase**: Phase 1 - Design & Contracts
**Status**: ✅ Complete

## Overview

This document defines the Workspace entity schema and its location in the refactored structure. The refactoring extracts the core workspace document schema to `packages/shared/` while keeping input/operation schemas in the app domain.

## Entity: Workspace

### Purpose

A **Workspace** represents an organizational unit in Clementine. Each workspace:

- Contains multiple projects
- Has a unique human-readable name
- Has a unique URL-safe slug for routing
- Supports soft deletion (status lifecycle)

### Firestore Collection

```
workspaces/{workspaceId}
```

### Schema Location Strategy

The workspace schema is split across two locations:

1. **Document Schema** (`packages/shared/src/entities/workspace/workspace.schema.ts`)
   - Represents data as stored in Firestore
   - Used for type consistency across packages
   - Minimal validation (field presence, basic types)

2. **Input Schemas** (`apps/clementine-app/src/domains/workspace/shared/schemas/workspace.schemas.ts`)
   - Validation for create/update/delete operations
   - References validation constants (WORKSPACE_NAME, WORKSPACE_SLUG)
   - App-specific refinements and business rules

This follows the established pattern used by the Project entity.

## Workspace Entity Schema

### Location

```
packages/shared/src/entities/workspace/workspace.schema.ts
```

### Schema Definition

```typescript
import { z } from 'zod'

/**
 * Workspace status enum
 * Represents the lifecycle state of a workspace
 */
export const workspaceStatusSchema = z.enum(['active', 'deleted'])

/**
 * Workspace entity schema
 * Represents a workspace document in Firestore
 *
 * Collection: workspaces/{workspaceId}
 */
export const workspaceSchema = z.object({
  id: z.string().min(1, 'Workspace ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  slug: z.string().min(1, 'Slug is required').max(50, 'Slug too long'),
  status: workspaceStatusSchema,
  deletedAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

/**
 * Type exports
 */
export type Workspace = z.infer<typeof workspaceSchema>
export type WorkspaceStatus = z.infer<typeof workspaceStatusSchema>
```

### Field Definitions

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | `string` | No | Unique workspace identifier (Firestore document ID) |
| `name` | `string` | No | Human-readable workspace name (1-100 characters) |
| `slug` | `string` | No | URL-safe unique identifier (1-50 characters, lowercase, alphanumeric + hyphens) |
| `status` | `WorkspaceStatus` | No | Current lifecycle state (`active` \| `deleted`) |
| `deletedAt` | `number` | Yes | Unix timestamp (ms) when workspace was soft deleted (null if active) |
| `createdAt` | `number` | No | Unix timestamp (ms) when workspace was created |
| `updatedAt` | `number` | No | Unix timestamp (ms) of last modification |

### Status Enum

```typescript
type WorkspaceStatus = 'active' | 'deleted'
```

| Value | Description |
|-------|-------------|
| `active` | Workspace is accessible and visible in lists |
| `deleted` | Workspace is soft-deleted (hidden from lists, slug unavailable for reuse) |

### State Transitions

```
[Created] → active
active → deleted (soft delete)
deleted → [TERMINAL] (no restoration supported currently)
```

**Business Rule**: When `status = 'deleted'`, `deletedAt` must be set to the deletion timestamp.

## Input Schemas (App-Level)

### Location

```
apps/clementine-app/src/domains/workspace/shared/schemas/workspace.schemas.ts
```

### Schemas

#### 1. Create Workspace Schema

```typescript
export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(WORKSPACE_NAME.min, 'Name is required')
    .max(WORKSPACE_NAME.max, `Name must be ${WORKSPACE_NAME.max} characters or less`),
  slug: slugSchema.optional(), // Auto-generated from name if not provided
})

export type CreateWorkspaceSchemaType = z.infer<typeof createWorkspaceSchema>
```

**Fields**:
- `name` (required): Workspace name (1-100 characters)
- `slug` (optional): Custom slug (auto-generated if omitted)

#### 2. Update Workspace Schema

```typescript
export const updateWorkspaceSchema = z
  .object({
    id: z.string().min(1, 'Workspace ID is required'),
    name: z
      .string()
      .min(WORKSPACE_NAME.min, 'Name is required')
      .max(WORKSPACE_NAME.max, `Name must be ${WORKSPACE_NAME.max} characters or less`)
      .optional(),
    slug: slugSchema.optional(),
  })
  .refine((data) => data.name !== undefined || data.slug !== undefined, {
    message: 'At least one field (name or slug) must be provided',
    path: ['name'],
  })

export type UpdateWorkspaceSchemaType = z.infer<typeof updateWorkspaceSchema>
```

**Fields**:
- `id` (required): Workspace ID to update
- `name` (optional): New name (1-100 characters)
- `slug` (optional): New slug (1-50 characters, must be unique)

**Refinement**: At least one field (name or slug) must be provided.

#### 3. Delete Workspace Schema

```typescript
export const deleteWorkspaceSchema = z.object({
  id: z.string().min(1, 'Workspace ID is required'),
})

export type DeleteWorkspaceSchemaType = z.infer<typeof deleteWorkspaceSchema>
```

**Fields**:
- `id` (required): Workspace ID to soft delete

#### 4. Slug Schema (Shared Utility)

```typescript
export const slugSchema = z
  .string()
  .min(WORKSPACE_SLUG.min, 'Slug is required')
  .max(WORKSPACE_SLUG.max, `Slug must be ${WORKSPACE_SLUG.max} characters or less`)
  .regex(
    WORKSPACE_SLUG.pattern,
    'Slug must contain only lowercase letters, numbers, and hyphens (no leading/trailing hyphens)',
  )
```

**Validation**:
- Length: 1-50 characters
- Pattern: `^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$`
  - Lowercase letters, numbers, and hyphens only
  - No leading or trailing hyphens
  - Single character slugs allowed (alphanumeric only)

## Validation Constants

### Location

```
apps/clementine-app/src/domains/workspace/shared/constants/workspace.constants.ts
```

### Constants

```typescript
/**
 * Workspace name validation constraints
 */
export const WORKSPACE_NAME = {
  min: 1,
  max: 100,
} as const

/**
 * Workspace slug validation constraints
 */
export const WORKSPACE_SLUG = {
  min: 1,
  max: 50,
  pattern: /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
} as const
```

## Relationships

### Parent Entity

**None** - Workspace is the top-level organizational entity.

### Child Entities

1. **Project** (`projects/{projectId}`)
   - Field: `workspaceId` (references `workspace.id`)
   - Relationship: One workspace → Many projects

## Schema Migration

### Before (Current)

```
apps/clementine-app/src/domains/workspace/
├── types/workspace.types.ts          # TypeScript interfaces
├── schemas/workspace.schemas.ts      # Zod schemas (all)
└── constants/workspace.constants.ts  # Validation constants
```

**Issue**: Workspace type not shareable across packages.

### After (Refactored)

```
packages/shared/src/entities/workspace/
└── workspace.schema.ts               # Document schema only

apps/clementine-app/src/domains/workspace/shared/
├── schemas/workspace.schemas.ts      # Input schemas only
└── constants/workspace.constants.ts  # Validation constants
```

**Improvement**: Workspace type is now shareable via `@clementine/shared`.

## Type Exports

### Shared Package Exports

```typescript
// packages/shared/src/entities/workspace/index.ts
export { workspaceSchema, workspaceStatusSchema } from './workspace.schema'
export type { Workspace, WorkspaceStatus } from './workspace.schema'

// packages/shared/src/entities/index.ts
export * from './project'
export * from './workspace'  // NEW
```

### App Domain Exports

```typescript
// apps/clementine-app/src/domains/workspace/shared/index.ts

// Re-export from shared package (document types)
export {
  workspaceSchema,
  workspaceStatusSchema,
  type Workspace,
  type WorkspaceStatus,
} from '@clementine/shared'

// Local schemas (input/operation types)
export {
  slugSchema,
  createWorkspaceSchema,
  updateWorkspaceSchema,
  deleteWorkspaceSchema,
  type CreateWorkspaceSchemaType,
  type UpdateWorkspaceSchemaType,
  type DeleteWorkspaceSchemaType,
} from './schemas/workspace.schemas'

// Constants
export { WORKSPACE_NAME, WORKSPACE_SLUG } from './constants/workspace.constants'
```

## Usage Examples

### Import Document Type (from shared package)

```typescript
import { Workspace, WorkspaceStatus } from '@clementine/shared'

function displayWorkspace(workspace: Workspace) {
  console.log(workspace.name, workspace.slug)
}
```

### Import Input Type (from app domain)

```typescript
import { CreateWorkspaceSchemaType, createWorkspaceSchema } from '@/domains/workspace'

function createWorkspace(input: CreateWorkspaceSchemaType) {
  const validated = createWorkspaceSchema.parse(input)
  // ...
}
```

### Validation with Zod

```typescript
import { createWorkspaceSchema } from '@/domains/workspace'

const result = createWorkspaceSchema.safeParse({
  name: 'My Workspace',
  slug: 'my-workspace',
})

if (result.success) {
  console.log('Valid:', result.data)
} else {
  console.error('Errors:', result.error.issues)
}
```

## Constraints & Invariants

1. **Unique Slug**: Each workspace must have a globally unique slug (enforced by Firestore security rules)
2. **Status-DeletionDate Invariant**: When `status = 'deleted'`, `deletedAt` must be set (enforced by app-level schema refinement)
3. **Slug Format**: Slug must match pattern (lowercase alphanumeric + hyphens, no leading/trailing hyphens)
4. **Name Length**: 1-100 characters
5. **Slug Length**: 1-50 characters

## Security Considerations

1. **Firestore Rules**: Workspace creation/update/delete operations must be validated by Firestore security rules
2. **Input Validation**: All user inputs must pass through Zod schema validation before database operations
3. **Slug Uniqueness**: Slug collision must be prevented at the database level (Firestore rules or server-side validation)

## Future Considerations

1. **Workspace Restoration**: Add support for restoring deleted workspaces (`deleted → active` transition)
2. **Slug History**: Consider maintaining slug history to prevent slug reuse after deletion
3. **Workspace Members**: Add member management (users associated with workspaces)
4. **Workspace Settings**: Extend schema with settings object for workspace-level configuration

## Summary

This data model refactoring:

- ✅ Extracts core workspace schema to `packages/shared/` for type sharing
- ✅ Keeps input schemas in app domain for app-specific validation
- ✅ Follows established pattern from Project entity
- ✅ Maintains all existing validation rules and constraints
- ✅ Improves type consistency across packages
- ✅ No data migration required (Firestore schema unchanged)
