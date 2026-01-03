# PRD: Workspace Domain Refactoring

## Goal

Refactor the `workspace` domain to a cleaner subdomain-based structure and extract the core workspace schema to the shared package for cross-package type consistency.

---

## Scope

This PRD covers:

- Restructuring the workspace domain into subdomains (`settings`, `shared`)
- Adding workspace entity schema to `packages/shared/`
- Updating all modules in `apps/clementine-app/` to use the shared workspace type

**Not in scope:**

- Changing the projects subdomain (already properly structured)
- Modifying business logic or adding new features
- Changing Firestore data model or security rules

---

## Users

- **Developers** (internal code organization improvement)

---

## Current Structure

```
workspace/
├── components/
│   └── WorkspaceSettingsForm.tsx
├── constants/
│   └── workspace.constants.ts
├── containers/
│   └── WorkspacePage.tsx
├── hooks/
│   ├── useWorkspace.ts
│   └── useUpdateWorkspace.ts
├── schemas/
│   └── workspace.schemas.ts
├── store/
│   └── useWorkspaceStore.ts
├── types/
│   └── workspace.types.ts
├── projects/                    # ✓ Already properly structured
│   ├── components/
│   ├── containers/
│   ├── hooks/
│   ├── schemas/
│   └── types/
└── index.ts
```

---

## Target Structure

```
workspace/
├── settings/                    # NEW: Settings subdomain
│   ├── components/
│   │   └── WorkspaceSettingsForm.tsx
│   ├── containers/
│   │   └── WorkspaceSettingsPage.tsx (rename from WorkspacePage)
│   ├── hooks/
│   │   └── useUpdateWorkspace.ts
│   └── index.ts
│
├── shared/                      # NEW: Shared workspace utilities
│   ├── hooks/
│   │   └── useWorkspace.ts
│   ├── store/
│   │   └── useWorkspaceStore.ts
│   ├── constants/
│   │   └── workspace.constants.ts
│   ├── schemas/
│   │   └── workspace.schemas.ts  # Input/operation schemas (local)
│   └── index.ts
│
├── projects/                    # UNCHANGED
│   └── ... (already structured)
│
└── index.ts                     # Updated public API
```

---

## Shared Package Addition

### Workspace Entity Schema

Add workspace entity schema to `packages/shared/` following the established pattern for Project:

**Location:** `packages/shared/src/entities/workspace/workspace.schema.ts`

```
packages/shared/src/entities/
├── project/
│   ├── index.ts
│   └── project.schema.ts
└── workspace/                   # NEW
    ├── index.ts
    └── workspace.schema.ts
```

### Schema Contract

The shared workspace schema should contain **only the document read type** (not input/operation types):

```ts
// packages/shared/src/entities/workspace/workspace.schema.ts
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

**Note:** Input schemas (`createWorkspaceSchema`, `updateWorkspaceSchema`, `deleteWorkspaceSchema`) remain in the app-level domain (`workspace/shared/schemas/`) as they contain validation constants and app-specific logic.

---

## Functional Requirements

### 1. Create `workspace/settings/` Subdomain

**Move the following from root workspace domain:**

| Current Location | New Location |
|------------------|--------------|
| `components/WorkspaceSettingsForm.tsx` | `settings/components/WorkspaceSettingsForm.tsx` |
| `containers/WorkspacePage.tsx` | `settings/containers/WorkspaceSettingsPage.tsx` |
| `hooks/useUpdateWorkspace.ts` | `settings/hooks/useUpdateWorkspace.ts` |

**Create index file:**

```ts
// workspace/settings/index.ts
export { WorkspaceSettingsForm } from './components/WorkspaceSettingsForm'
export { WorkspaceSettingsPage } from './containers/WorkspaceSettingsPage'
export { useUpdateWorkspace } from './hooks/useUpdateWorkspace'
```

---

### 2. Create `workspace/shared/` Subdomain

**Move the following from root workspace domain:**

| Current Location | New Location |
|------------------|--------------|
| `hooks/useWorkspace.ts` | `shared/hooks/useWorkspace.ts` |
| `store/useWorkspaceStore.ts` | `shared/store/useWorkspaceStore.ts` |
| `constants/workspace.constants.ts` | `shared/constants/workspace.constants.ts` |
| `schemas/workspace.schemas.ts` | `shared/schemas/workspace.schemas.ts` |
| `types/workspace.types.ts` | **DELETE** (use `@clementine/shared`) |

**Create index file:**

```ts
// workspace/shared/index.ts

// Re-export from shared package (document types only)
export { 
  workspaceSchema, 
  workspaceStatusSchema,
  type Workspace, 
  type WorkspaceStatus 
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

// Hooks
export { useWorkspace } from './hooks/useWorkspace'

// Store
export { useWorkspaceStore } from './store/useWorkspaceStore'
```

---

### 3. Update `packages/shared/`

**Add workspace entity:**

1. Create `packages/shared/src/entities/workspace/workspace.schema.ts`
2. Create `packages/shared/src/entities/workspace/index.ts`
3. Update `packages/shared/src/entities/index.ts` to export workspace

**Updated barrel export:**

```ts
// packages/shared/src/entities/index.ts
export * from './project'
export * from './workspace'
```

---

### 4. Update Root `workspace/index.ts`

**New public API:**

```ts
// workspace/index.ts

// Shared (re-export for convenience)
export * from './shared'

// Settings subdomain
export * from './settings'

// Projects subdomain
export * from './projects'
```

---

### 5. Update Imports Across `apps/clementine-app/`

All modules importing from the workspace domain must be updated to reflect the new structure.

**Key files to update:**

- Route files under `src/app/routes/`
- Admin workspace domain (`src/domains/admin/workspace/`)
- Any other files importing workspace types/hooks

**Import changes:**

```ts
// Before
import { useWorkspace, Workspace } from '@/domains/workspace'

// After (same import path works if index.ts re-exports correctly)
import { useWorkspace, Workspace } from '@/domains/workspace'

// Or import from shared package directly
import { Workspace } from '@clementine/shared'
```

---

## Migration Steps

1. **Create shared package workspace schema**
   - Add `workspace.schema.ts` to `packages/shared/`
   - Export from entities barrel

2. **Create `workspace/shared/` subdomain**
   - Move hooks, store, constants, schemas
   - Update internal imports
   - Create barrel export

3. **Create `workspace/settings/` subdomain**
   - Move components, containers, hooks
   - Rename `WorkspacePage` → `WorkspaceSettingsPage`
   - Update internal imports
   - Create barrel export

4. **Update root `workspace/index.ts`**
   - Re-export from subdomains
   - Maintain backward compatibility where possible

5. **Delete deprecated files**
   - Remove `workspace/types/workspace.types.ts`
   - Remove empty root-level directories

6. **Update all consumers**
   - Find all imports from workspace domain
   - Update to use new paths or shared package

7. **Run type checks and tests**
   - Ensure no breaking changes
   - Verify all imports resolve correctly

---

## File Movements Summary

| Action | From | To |
|--------|------|-----|
| Move | `workspace/components/WorkspaceSettingsForm.tsx` | `workspace/settings/components/` |
| Move + Rename | `workspace/containers/WorkspacePage.tsx` | `workspace/settings/containers/WorkspaceSettingsPage.tsx` |
| Move | `workspace/hooks/useUpdateWorkspace.ts` | `workspace/settings/hooks/` |
| Move | `workspace/hooks/useWorkspace.ts` | `workspace/shared/hooks/` |
| Move | `workspace/store/useWorkspaceStore.ts` | `workspace/shared/store/` |
| Move | `workspace/constants/workspace.constants.ts` | `workspace/shared/constants/` |
| Move | `workspace/schemas/workspace.schemas.ts` | `workspace/shared/schemas/` |
| Delete | `workspace/types/workspace.types.ts` | N/A (replaced by shared package) |
| Create | N/A | `packages/shared/src/entities/workspace/` |

---

## Acceptance Criteria

- [ ] Workspace schema exists in `packages/shared/` with proper exports
- [ ] `Workspace` and `WorkspaceStatus` types are imported from `@clementine/shared` throughout the app
- [ ] `workspace/settings/` subdomain contains all settings-related code
- [ ] `workspace/shared/` subdomain contains hooks, store, constants, and input schemas
- [ ] `workspace/projects/` subdomain remains unchanged
- [ ] Root `workspace/index.ts` provides clean public API
- [ ] All existing tests pass
- [ ] TypeScript compilation succeeds with no errors
- [ ] No orphaned files in root workspace domain directories

---

## Non-Goals

- Adding new features or functionality
- Changing API signatures or behavior
- Modifying Firestore data model
- Changing security rules
- Refactoring the projects subdomain

---

## Technical Notes

### Why Separate Document vs Input Schemas?

- **Document schemas** (`workspaceSchema`): Represent data as stored in Firestore. Shared across packages for type consistency.
- **Input schemas** (`createWorkspaceSchema`, etc.): Contain validation rules, app-specific constraints (constants), and refinements. Kept local to the app.

### Type-Only Exports for Shared Package

The shared package exports **types for reading documents only**:

```ts
// ✓ Shared package exports
export type Workspace = z.infer<typeof workspaceSchema>
export type WorkspaceStatus = z.infer<typeof workspaceStatusSchema>

// ✗ NOT in shared package (app-level concerns)
export type CreateWorkspaceInput = ...
export type UpdateWorkspaceInput = ...
```

This follows the established pattern from the Project entity.

