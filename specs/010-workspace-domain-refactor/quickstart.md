# Quickstart: Workspace Domain Refactoring

**Feature**: Workspace Domain Refactoring
**Branch**: `010-workspace-domain-refactor`
**Status**: Ready for implementation

## Overview

This guide provides step-by-step instructions for implementing the workspace domain refactoring. Follow these steps in order to ensure a smooth migration with zero breaking changes.

## Prerequisites

- [ ] Currently on branch: `010-workspace-domain-refactor`
- [ ] Working directory is clean (no uncommitted changes)
- [ ] All existing tests pass: `cd apps/clementine-app && pnpm test`
- [ ] TypeScript compiles cleanly: `cd apps/clementine-app && pnpm type-check`

## Implementation Steps

### Step 1: Create Shared Package Workspace Schema

**Goal**: Add workspace entity schema to `packages/shared/` following the Project entity pattern.

#### 1.1 Create workspace entity directory

```bash
mkdir -p packages/shared/src/entities/workspace
```

#### 1.2 Create workspace.schema.ts

Create `packages/shared/src/entities/workspace/workspace.schema.ts`:

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

#### 1.3 Create workspace entity index

Create `packages/shared/src/entities/workspace/index.ts`:

```typescript
export { workspaceSchema, workspaceStatusSchema } from './workspace.schema'
export type { Workspace, WorkspaceStatus } from './workspace.schema'
```

#### 1.4 Update entities barrel export

Update `packages/shared/src/entities/index.ts`:

```typescript
export * from './project'
export * from './workspace'  // ADD this line
```

#### 1.5 Build shared package

```bash
cd packages/shared
pnpm build
cd ../..
```

**Checkpoint**: Shared package builds successfully with new workspace entity.

---

### Step 2: Create `workspace/shared/` Subdomain

**Goal**: Move shared workspace utilities into a subdomain.

#### 2.1 Create subdomain structure

```bash
cd apps/clementine-app/src/domains/workspace
mkdir -p shared/{hooks,store,constants,schemas}
```

#### 2.2 Move files to subdomain

```bash
# From workspace/ root
mv hooks/useWorkspace.ts shared/hooks/
mv store/useWorkspaceStore.ts shared/store/
mv constants/workspace.constants.ts shared/constants/
mv schemas/workspace.schemas.ts shared/schemas/
```

#### 2.3 Update workspace.schemas.ts imports

Edit `shared/schemas/workspace.schemas.ts`:

**Before**:
```typescript
import { WORKSPACE_NAME, WORKSPACE_SLUG } from '../constants/workspace.constants'
```

**After**:
```typescript
import { WORKSPACE_NAME, WORKSPACE_SLUG } from '../constants/workspace.constants'
```

(No change needed - relative path stays the same)

#### 2.4 Remove document schema from workspace.schemas.ts

Edit `shared/schemas/workspace.schemas.ts` to remove:

- `workspaceStatusSchema` enum (now in `@clementine/shared`)
- `workspaceSchema` (now in `@clementine/shared`)
- `WorkspaceSchema` type (now in `@clementine/shared`)

Keep only:
- `slugSchema`
- `createWorkspaceSchema`
- `updateWorkspaceSchema`
- `deleteWorkspaceSchema`
- Associated type exports

#### 2.5 Create shared subdomain index

Create `shared/index.ts`:

```typescript
// Re-export from shared package (document types only)
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

// Hooks
export { useWorkspace } from './hooks/useWorkspace'

// Store
export { useWorkspaceStore } from './store/useWorkspaceStore'
```

**Checkpoint**: All shared workspace code is now in `workspace/shared/` subdomain.

---

### Step 3: Create `workspace/settings/` Subdomain

**Goal**: Move workspace settings UI into a subdomain.

#### 3.1 Create subdomain structure

```bash
cd apps/clementine-app/src/domains/workspace
mkdir -p settings/{components,containers,hooks}
```

#### 3.2 Move files to subdomain

```bash
# From workspace/ root
mv components/WorkspaceSettingsForm.tsx settings/components/
mv containers/WorkspacePage.tsx settings/containers/
mv hooks/useUpdateWorkspace.ts settings/hooks/
```

#### 3.3 Rename WorkspacePage → WorkspaceSettingsPage

```bash
cd settings/containers
mv WorkspacePage.tsx WorkspaceSettingsPage.tsx
```

Edit `WorkspaceSettingsPage.tsx`:

**Before**:
```typescript
export function WorkspacePage() {
  // ...
}
```

**After**:
```typescript
export function WorkspaceSettingsPage() {
  // ...
}
```

#### 3.4 Update imports in settings files

For each file in `settings/`:

**WorkspaceSettingsForm.tsx**:
```typescript
// Update workspace imports to use shared subdomain
import { useUpdateWorkspace } from '../hooks/useUpdateWorkspace'
import { Workspace, UpdateWorkspaceSchemaType } from '../index'
```

**WorkspaceSettingsPage.tsx**:
```typescript
// Update imports
import { WorkspaceSettingsForm } from '../components/WorkspaceSettingsForm'
import { useWorkspace } from '../../shared/hooks/useWorkspace'
```

**useUpdateWorkspace.ts**:
```typescript
// Update imports
import { UpdateWorkspaceSchemaType } from '../../shared'
```

#### 3.5 Create settings subdomain index

Create `settings/index.ts`:

```typescript
export { WorkspaceSettingsForm } from './components/WorkspaceSettingsForm'
export { WorkspaceSettingsPage } from './containers/WorkspaceSettingsPage'
export { useUpdateWorkspace } from './hooks/useUpdateWorkspace'
```

**Checkpoint**: All workspace settings code is now in `workspace/settings/` subdomain.

---

### Step 4: Update Root `workspace/index.ts`

**Goal**: Update workspace domain barrel export to re-export from subdomains.

Edit `apps/clementine-app/src/domains/workspace/index.ts`:

```typescript
// Shared (re-export for convenience)
export * from './shared'

// Settings subdomain
export * from './settings'

// Projects subdomain
export * from './projects'
```

**Checkpoint**: Root workspace domain exports all subdomains.

---

### Step 5: Delete Deprecated Files

**Goal**: Remove empty directories and deprecated type file.

```bash
cd apps/clementine-app/src/domains/workspace

# Remove types directory (replaced by @clementine/shared)
rm -rf types/

# Remove empty root-level directories
rmdir components/  # Should be empty
rmdir containers/  # Should be empty
rmdir hooks/       # Should be empty
rmdir schemas/     # Should be empty
rmdir store/       # Should be empty
rmdir constants/   # Should be empty
```

**Checkpoint**: Only `shared/`, `settings/`, `projects/`, and `index.ts` remain at workspace root.

---

### Step 6: Update Consumers

**Goal**: Update all imports from workspace domain to use new structure.

#### 6.1 Find all workspace imports

```bash
cd apps/clementine-app
grep -r "from '@/domains/workspace'" src/
```

#### 6.2 Update route files

Common import locations:
- `src/app/routes/**/*.tsx`
- `src/domains/admin/workspace/**/*`

**Example Changes**:

**Before**:
```typescript
import { WorkspacePage } from '@/domains/workspace'
import { Workspace } from '@/domains/workspace'
```

**After**:
```typescript
import { WorkspaceSettingsPage } from '@/domains/workspace'
// OR import directly from shared package
import { Workspace } from '@clementine/shared'
```

**Note**: If root `workspace/index.ts` re-exports correctly, most imports should continue to work unchanged. Only `WorkspacePage` → `WorkspaceSettingsPage` rename requires updates.

#### 6.3 Update admin domain (if applicable)

Check if `src/domains/admin/workspace/` exists and update its imports similarly.

**Checkpoint**: All consumers updated and TypeScript compiles cleanly.

---

### Step 7: Run Validation Gates

**Goal**: Ensure all code quality checks pass.

#### 7.1 Format and lint

```bash
cd apps/clementine-app
pnpm check  # Auto-fix formatting and linting
```

#### 7.2 Type check

```bash
pnpm type-check
```

Expected output: `✓ No TypeScript errors`

#### 7.3 Run tests

```bash
pnpm test
```

Expected output: All tests pass

#### 7.4 Build the app

```bash
pnpm build
```

Expected output: Build succeeds

**Checkpoint**: All validation gates pass. ✅

---

### Step 8: Manual Verification

**Goal**: Verify the refactoring works in development.

#### 8.1 Start dev server

```bash
pnpm dev
```

#### 8.2 Test workspace features

1. Navigate to workspace settings page
2. Verify workspace name/slug editing works
3. Check that no console errors appear
4. Verify workspace selection/switching works

**Checkpoint**: All workspace features work as expected.

---

## Import Migration Guide

### Document Types (Workspace, WorkspaceStatus)

**Before**:
```typescript
import { Workspace, WorkspaceStatus } from '@/domains/workspace'
```

**After (Option 1 - Recommended)**:
```typescript
import { Workspace, WorkspaceStatus } from '@clementine/shared'
```

**After (Option 2 - Via domain)**:
```typescript
import { Workspace, WorkspaceStatus } from '@/domains/workspace'
// Still works because workspace/index.ts re-exports from shared
```

### Input Types

**Before**:
```typescript
import { CreateWorkspaceInput } from '@/domains/workspace'
```

**After**:
```typescript
import { CreateWorkspaceSchemaType } from '@/domains/workspace'
```

### Schemas

**Before**:
```typescript
import { createWorkspaceSchema } from '@/domains/workspace'
```

**After**:
```typescript
import { createWorkspaceSchema } from '@/domains/workspace'
// Same - still works via barrel export
```

### Components

**Before**:
```typescript
import { WorkspacePage } from '@/domains/workspace'
```

**After**:
```typescript
import { WorkspaceSettingsPage } from '@/domains/workspace'
// Component renamed to clarify purpose
```

### Hooks

**Before**:
```typescript
import { useWorkspace, useUpdateWorkspace } from '@/domains/workspace'
```

**After**:
```typescript
import { useWorkspace, useUpdateWorkspace } from '@/domains/workspace'
// Same - still works via barrel export
```

## Troubleshooting

### Error: "Cannot find module '@clementine/shared'"

**Cause**: Shared package not built.

**Solution**:
```bash
cd packages/shared
pnpm build
cd ../..
```

### Error: "Module not found" for workspace imports

**Cause**: Barrel export paths incorrect.

**Solution**: Check `workspace/index.ts`, `workspace/shared/index.ts`, and `workspace/settings/index.ts` for correct re-exports.

### Type errors after refactoring

**Cause**: Missing type exports or imports.

**Solution**:
1. Verify `packages/shared/src/entities/index.ts` exports workspace
2. Check `workspace/shared/index.ts` re-exports from `@clementine/shared`
3. Run `pnpm type-check` to see specific errors

### Tests failing

**Cause**: Test imports may need updating.

**Solution**: Update test imports following the migration guide above.

## Rollback Plan

If issues arise, rollback with:

```bash
git reset --hard HEAD
git clean -fd
```

Then re-attempt implementation starting from Step 1.

## Verification Checklist

Before marking complete:

- [ ] Shared package builds without errors
- [ ] `workspace/shared/` subdomain exists with all files
- [ ] `workspace/settings/` subdomain exists with all files
- [ ] `workspace/types/` directory deleted
- [ ] Root workspace directories (components, containers, etc.) deleted
- [ ] Root `workspace/index.ts` re-exports all subdomains
- [ ] All imports updated (especially `WorkspacePage` → `WorkspaceSettingsPage`)
- [ ] `pnpm check` passes (format + lint)
- [ ] `pnpm type-check` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` succeeds
- [ ] Dev server runs without errors
- [ ] Workspace features work in browser

## Post-Implementation

After completing the refactoring:

1. **Commit changes**:
   ```bash
   git add .
   git commit -m "refactor(workspace): restructure domain into subdomains and extract schema to shared package"
   ```

2. **Push branch**:
   ```bash
   git push -u origin 010-workspace-domain-refactor
   ```

3. **Create pull request**:
   ```bash
   gh pr create --title "Workspace Domain Refactoring" --body "See specs/010-workspace-domain-refactor/spec.md"
   ```

## Summary

This refactoring:

- ✅ Extracts workspace schema to `packages/shared/` for type consistency
- ✅ Organizes workspace domain into clear subdomains (`settings/`, `shared/`)
- ✅ Follows established pattern from `projects/` subdomain
- ✅ Maintains backward compatibility during migration
- ✅ Zero breaking changes (barrel exports preserve import paths)
- ✅ Improves code organization and maintainability

**Estimated Time**: 30-45 minutes for implementation + validation.
