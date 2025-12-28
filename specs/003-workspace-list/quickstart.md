# Quickstart: Implementing Admin Workspace Management

**Feature**: 003-workspace-list
**Date**: 2025-12-28
**Purpose**: Step-by-step implementation guide for workspace management feature

---

## Overview

This guide walks through implementing the admin workspace management feature in the TanStack Start application. Follow the steps in order to build the feature incrementally with testable milestones.

**Estimated Time**: 4-6 hours
**Prerequisites**: TanStack Start dev server running, Firebase project configured

---

## Implementation Steps

### Step 1: Set Up Firestore Security Rules (20 min)

**Goal**: Restrict workspace collection access to admins with client-side write permissions

**File**: `/firebase/firestore.rules`

**Action**: Add workspace rules to existing Firestore rules file

```javascript
// Add to firebase/firestore.rules

// Helper function to check admin claim (if not already defined)
function isAdmin() {
  return request.auth != null && request.auth.token.admin == true;
}

// Helper function to validate workspace data on create
function isValidWorkspaceCreate() {
  let data = request.resource.data;
  return data.status == 'active' &&
         data.deletedAt == null &&
         data.createdAt is number &&
         data.updatedAt is number &&
         data.name is string &&
         data.slug is string &&
         data.id is string;
}

// Helper function to validate workspace update (soft delete)
function isValidWorkspaceUpdate() {
  let data = request.resource.data;
  let oldData = resource.data;

  // Only allow status and deletedAt changes (soft delete)
  return data.diff(oldData).affectedKeys().hasOnly(['status', 'deletedAt', 'updatedAt']) &&
         data.status == 'deleted' &&
         data.deletedAt is number &&
         data.updatedAt is number;
}

// Workspace collection rules
match /workspaces/{workspaceId} {
  // Allow admins to read any workspace (including deleted for slug uniqueness checks)
  allow read: if isAdmin();

  // Allow admins to create workspaces (with validation)
  allow create: if isAdmin() && isValidWorkspaceCreate();

  // Allow admins to update workspaces (soft delete only)
  allow update: if isAdmin() && isValidWorkspaceUpdate();

  // Deny hard deletes
  allow delete: if false;
}
```

**Verification**:
```bash
# Deploy rules to Firebase
pnpm fb:deploy:rules

# Or deploy all Firebase resources
pnpm fb:deploy
```

**Checkpoint**: Firestore rules deployed, client-side writes enabled with validation

---

### Step 2: Create Firestore Indexes (10 min)

**Goal**: Enable efficient workspace queries

**File**: `/firebase/firestore.indexes.json`

**Action**: Add composite indexes for workspace queries

```json
{
  "indexes": [
    {
      "collectionGroup": "workspaces",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "slug", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "workspaces",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

**Verification**:
```bash
# Deploy indexes to Firebase
pnpm fb:deploy:indexes
```

**Checkpoint**: Firestore indexes deployed, ready for workspace queries

---

### Step 3: Create Workspace Domain Types & Constants (20 min)

**Goal**: Define TypeScript types and validation constants

**Files**:
- `apps/clementine-app/src/domains/workspace/types/workspace.types.ts`
- `apps/clementine-app/src/domains/workspace/constants/workspace.constants.ts`

**workspace.types.ts**:
```typescript
/**
 * Workspace lifecycle state
 */
export type WorkspaceStatus = 'active' | 'deleted'

/**
 * Workspace entity representing an organizational unit
 */
export interface Workspace {
  /** Unique workspace identifier (Firestore document ID) */
  id: string

  /** Human-readable workspace name (1-100 characters) */
  name: string

  /** URL-safe unique identifier (1-50 characters, lowercase) */
  slug: string

  /** Current lifecycle state */
  status: WorkspaceStatus

  /** Unix timestamp (ms) when workspace was soft deleted */
  deletedAt: number | null

  /** Unix timestamp (ms) when workspace was created */
  createdAt: number

  /** Unix timestamp (ms) of last modification */
  updatedAt: number
}
```

**workspace.constants.ts**:
```typescript
export const WORKSPACE_NAME = {
  min: 1,
  max: 100,
} as const

export const WORKSPACE_SLUG = {
  min: 1,
  max: 50,
  pattern: /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
} as const
```

**Verification**:
```bash
# Run type check
cd apps/clementine-app
pnpm type-check
```

**Checkpoint**: Types and constants defined, no TypeScript errors

---

### Step 4: Create Zod Validation Schemas (30 min)

**Goal**: Add runtime validation for workspace operations

**File**: `apps/clementine-app/src/domains/workspace/schemas/workspace.schemas.ts`

```typescript
import { z } from 'zod'
import { WORKSPACE_NAME, WORKSPACE_SLUG } from '../constants/workspace.constants'

/**
 * Workspace status enum schema
 */
export const workspaceStatusSchema = z.enum(['active', 'deleted'])

/**
 * Slug validation schema
 */
export const slugSchema = z
  .string()
  .min(WORKSPACE_SLUG.min, 'Slug is required')
  .max(WORKSPACE_SLUG.max, `Slug must be ${WORKSPACE_SLUG.max} characters or less`)
  .regex(
    WORKSPACE_SLUG.pattern,
    'Slug must contain only lowercase letters, numbers, and hyphens'
  )

/**
 * Complete workspace entity schema
 */
export const workspaceSchema = z
  .object({
    id: z.string(),
    name: z
      .string()
      .min(WORKSPACE_NAME.min, 'Name is required')
      .max(WORKSPACE_NAME.max, `Name must be ${WORKSPACE_NAME.max} characters or less`),
    slug: slugSchema,
    status: workspaceStatusSchema,
    deletedAt: z.number().nullable(),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .refine((data) => data.status === 'active' || data.deletedAt !== null, {
    message: 'deletedAt must be set when workspace is deleted',
    path: ['deletedAt'],
  })

/**
 * Input schema for creating a workspace
 */
export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(WORKSPACE_NAME.min, 'Name is required')
    .max(WORKSPACE_NAME.max, `Name must be ${WORKSPACE_NAME.max} characters or less`),
  slug: slugSchema.optional(),
})

/**
 * Input schema for soft deleting a workspace
 */
export const deleteWorkspaceSchema = z.object({
  id: z.string().min(1, 'Workspace ID is required'),
})

/**
 * Type inference
 */
export type WorkspaceSchema = z.infer<typeof workspaceSchema>
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>
export type DeleteWorkspaceInput = z.infer<typeof deleteWorkspaceSchema>
```

**Verification**:
```bash
# Create test file: workspace.schemas.test.ts
# Run tests
pnpm test workspace.schemas.test.ts
```

**Checkpoint**: Schemas created and validated with unit tests

---

### Step 5: Create Admin Workspace Hooks (60 min)

**Goal**: Implement admin-scoped CRUD hooks (list all, create, delete) with real-time updates and mutation logic

**Files**:
- `apps/clementine-app/src/domains/admin/workspace/hooks/useWorkspaces.ts`
- `apps/clementine-app/src/domains/admin/workspace/hooks/useCreateWorkspace.ts`
- `apps/clementine-app/src/domains/admin/workspace/hooks/useDeleteWorkspace.ts`

**Note**: These hooks are admin-only operations. Future workspace-scoped hooks (e.g., useCurrentWorkspace, useUpdateWorkspace) will live in `domains/workspace/hooks/` when needed.

---

**useWorkspaces.ts** (List all workspaces - admin only):

```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore'
import { db } from '@/integrations/firebase/client'
import type { Workspace } from '@/domains/workspace/types/workspace.types'

/**
 * List active workspaces with real-time updates (admin only)
 *
 * This hook is admin-scoped - it lists ALL workspaces for admin management.
 * For workspace-scoped features, use domains/workspace/hooks instead.
 */
export function useWorkspaces() {
  const queryClient = useQueryClient()

  return useQuery<Workspace[]>({
    queryKey: ['workspaces', 'active'],
    queryFn: async () => {
      const q = query(
        collection(db, 'workspaces'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      )

      // Initial fetch
      const snapshot = await getDocs(q)
      const workspaces = snapshot.docs.map(doc => doc.data() as Workspace)

      // Set up real-time listener
      onSnapshot(q, (snapshot) => {
        const updatedWorkspaces = snapshot.docs.map(doc => doc.data() as Workspace)
        queryClient.setQueryData(['workspaces', 'active'], updatedWorkspaces)
      })

      return workspaces
    },
    staleTime: Infinity, // Real-time via onSnapshot
    refetchOnWindowFocus: false,
  })
}
```

---

**useCreateWorkspace.ts** (Create workspace - admin only):

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, query, where, limit, getDocs, doc, runTransaction } from 'firebase/firestore'
import { db } from '@/integrations/firebase/client'
import { generateSlug } from '@/shared/utils/slug-utils'
import { createWorkspaceSchema } from '@/domains/workspace/schemas/workspace.schemas'
import type { Workspace, CreateWorkspaceInput } from '@/domains/workspace/types/workspace.types'

/**
 * Create workspace mutation (dedicated hook with full business logic)
 *
 * Admin-only operation. Follows "mutations via dedicated hooks" pattern.
 * Mutation logic is directly in the hook, not in a separate service function.
 */
export function useCreateWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateWorkspaceInput) => {
      // Validate input
      const validated = createWorkspaceSchema.parse(data)
      const workspacesRef = collection(db, 'workspaces')

      // Generate or validate slug
      const slug = validated.slug?.toLowerCase() || generateSlug(validated.name)

      // Run transaction - Firestore ensures atomicity at database level
      return await runTransaction(db, async (transaction) => {
        // Check if slug exists (case-insensitive, includes deleted workspaces)
        const q = query(workspacesRef, where('slug', '==', slug), limit(1))
        const existingSnapshot = await getDocs(q)

        if (!existingSnapshot.empty) {
          throw new Error('Slug already exists')
        }

        // Create workspace
        const newWorkspaceRef = doc(workspacesRef)
        const now = Date.now()

        const workspaceData: Workspace = {
          id: newWorkspaceRef.id,
          name: validated.name,
          slug,
          status: 'active',
          deletedAt: null,
          createdAt: now,
          updatedAt: now,
        }

        transaction.set(newWorkspaceRef, workspaceData)

        return { id: newWorkspaceRef.id, slug }
      })
    },
    onSuccess: () => {
      // Real-time updates via onSnapshot, but invalidate for consistency
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
    onError: (error) => {
      console.error('Failed to create workspace:', error)
      // Error available in mutation.error for UI
    },
  })
}
```

---

**useDeleteWorkspace.ts** (Delete workspace - admin only):

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/integrations/firebase/client'

/**
 * Delete workspace mutation (dedicated hook with full business logic)
 *
 * Admin-only operation. Follows "mutations via dedicated hooks" pattern.
 * Performs soft delete by updating status and deletedAt fields.
 */
export function useDeleteWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (workspaceId: string) => {
      const workspaceRef = doc(db, 'workspaces', workspaceId)

      // Soft delete - Firestore rules validate admin access and structure
      const now = Date.now()
      await updateDoc(workspaceRef, {
        status: 'deleted',
        deletedAt: now,
        updatedAt: now,
      })

      return workspaceId
    },
    onSuccess: () => {
      // Real-time updates via onSnapshot, but invalidate for consistency
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
    onError: (error) => {
      console.error('Failed to delete workspace:', error)
      // Error available in mutation.error for UI
    },
  })
}
```

**Verification**:
```bash
# Test hooks in dev environment
pnpm dev

# Navigate to /admin/workspaces (will implement UI next)
```

**Checkpoint**: Hooks working with full mutation logic inline, real-time updates functioning, follows "mutations via dedicated hooks" pattern

---

### Step 6: Create Admin UI Components (90 min)

**Goal**: Build workspace list, empty state, create form, delete confirmation

**Files**:
- `apps/clementine-app/src/domains/admin/workspace/components/WorkspaceList.tsx`
- `apps/clementine-app/src/domains/admin/workspace/components/WorkspaceListEmpty.tsx`
- `apps/clementine-app/src/domains/admin/workspace/components/WorkspaceListItem.tsx`
- `apps/clementine-app/src/domains/admin/workspace/components/CreateWorkspaceSheet.tsx`
- `apps/clementine-app/src/domains/admin/workspace/components/DeleteWorkspaceDialog.tsx`

**WorkspaceList.tsx** (example):
```typescript
import { useWorkspaces } from '../hooks/useWorkspaces'
import { WorkspaceListEmpty } from './WorkspaceListEmpty'
import { WorkspaceListItem } from './WorkspaceListItem'

export function WorkspaceList() {
  const { data: workspaces, isLoading, error } = useWorkspaces()

  if (isLoading) {
    return <div>Loading workspaces...</div>
  }

  if (error) {
    return <div>Error loading workspaces: {error.message}</div>
  }

  if (!workspaces || workspaces.length === 0) {
    return <WorkspaceListEmpty />
  }

  return (
    <div className="space-y-2">
      {workspaces.map((workspace) => (
        <WorkspaceListItem key={workspace.id} workspace={workspace} />
      ))}
    </div>
  )
}
```

*Implement remaining components following shadcn/ui patterns and design system guidelines.*

**Verification**:
```bash
# Test components in Storybook or dev server
pnpm dev

# Navigate to /admin/workspaces
```

**Checkpoint**: UI components render correctly, responsive on mobile

---

### Step 7: Create Routes (30 min)

**Goal**: Add workspace management routes

**Files**:
- `apps/clementine-app/src/routes/admin/workspaces.tsx`
- `apps/clementine-app/src/routes/workspace/$workspaceSlug.tsx`

**workspaces.tsx**:
```typescript
import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/domains/auth/guards/guards'
import { WorkspacesPage } from '@/domains/admin/workspace/containers/WorkspacesPage'

export const Route = createFileRoute('/admin/workspaces')({
  beforeLoad: async () => {
    await requireAdmin()
  },
  component: WorkspacesPage,
})
```

**$workspaceSlug.tsx**:
```typescript
import { createFileRoute, notFound } from '@tanstack/react-router'
import { requireAdmin } from '@/domains/auth/guards/guards'
// Note: useWorkspace would be created later in domains/workspace/hooks/ for workspace-scoped features
// For now, this route would use a different approach or be implemented in a future iteration

export const Route = createFileRoute('/workspace/$workspaceSlug')({
  beforeLoad: async () => {
    await requireAdmin()
  },
  component: WorkspaceDetailPage,
})

function WorkspaceDetailPage() {
  const { workspaceSlug } = Route.useParams()
  const { data: workspace, isLoading } = useWorkspace(workspaceSlug)

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!workspace) {
    throw notFound()
  }

  return <div>Workspace: {workspace.name}</div>
}
```

**Verification**:
```bash
# Test routes
pnpm dev

# Navigate to /admin/workspaces and /workspace/[slug]
```

**Checkpoint**: Routes working, admin guards active

---

### Step 8: Barrel Exports (15 min)

**Goal**: Create index.ts files for clean imports

**Files**:
- `apps/clementine-app/src/domains/workspace/index.ts`
- `apps/clementine-app/src/domains/admin/workspace/index.ts`

**workspace/index.ts** (shared entity - reused across contexts):
```typescript
// Types (public API - reused by admin and workspace contexts)
export type { Workspace, WorkspaceStatus, CreateWorkspaceInput } from './types/workspace.types'

// Schemas (public API - reused for validation)
export { createWorkspaceSchema, updateWorkspaceSchema } from './schemas/workspace.schemas'

// Constants (public API for validation messages)
export { WORKSPACE_NAME, WORKSPACE_SLUG } from './constants/workspace.constants'

// NOTE: Hooks are NOT here - they're context-specific:
// - Admin CRUD hooks → domains/admin/workspace/hooks
// - Workspace-scoped hooks → domains/workspace/hooks (future)
```

**admin/workspace/index.ts** (admin-scoped operations):
```typescript
// Admin hooks (public API)
export { useWorkspaces } from './hooks/useWorkspaces'
export { useCreateWorkspace } from './hooks/useCreateWorkspace'
export { useDeleteWorkspace } from './hooks/useDeleteWorkspace'

// Admin components (public API)
export { WorkspaceList } from './components/WorkspaceList'
export { CreateWorkspaceSheet } from './components/CreateWorkspaceSheet'
export { DeleteWorkspaceDialog } from './components/DeleteWorkspaceDialog'

// Containers (public API)
export { WorkspacesPage } from './containers/WorkspacesPage'
```

**Verification**:
```bash
# Test imports from domains
# Shared types/schemas:
import { Workspace, createWorkspaceSchema } from '@/domains/workspace'
# Admin hooks/components:
import { useWorkspaces } from '@/domains/admin/workspace'

pnpm type-check
```

**Checkpoint**: Barrel exports working, encapsulation preserved

---

### Step 9: Clean Up Mock Data (10 min)

**Goal**: Remove mock workspace data from navigation domain

**File**: `apps/clementine-app/src/domains/navigation/constants/mockWorkspaces.ts`

**Action**: Delete file or comment out mock data

**Update**: `apps/clementine-app/src/domains/navigation/components/WorkspaceSelector.tsx`
- Replace mock data with real workspace query using `useWorkspaces()` hook

**Verification**:
```bash
# Ensure no references to mockWorkspaces remain
git grep -i "mockWorkspaces"

pnpm type-check
```

**Checkpoint**: Mock data removed, real data integrated

---

### Step 10: Validation Loop (30 min)

**Goal**: Ensure code passes all quality gates

**Actions**:
```bash
cd apps/clementine-app

# Auto-fix format and lint issues
pnpm app:check

# Manual type check
pnpm type-check

# Run tests
pnpm test

# Test in dev server
pnpm dev
```

**Manual Tests**:
1. Navigate to `/admin/workspaces` as admin
2. Create workspace with custom slug
3. Create workspace with auto-generated slug
4. Try to create duplicate slug (should fail)
5. Soft delete workspace
6. Verify deleted workspace disappears from list
7. Try to access deleted workspace by slug (should 404)
8. Test on mobile device (responsive design)

**Checkpoint**: All validation gates pass, feature works end-to-end

---

### Step 11: Standards Compliance Review (20 min)

**Goal**: Verify adherence to project standards

**Review Checklist**:

- [ ] **Design System** (`frontend/design-system.md`):
  - Using theme tokens? (no hard-coded colors)
  - Paired background/foreground colors?
  - Proper contrast ratios?

- [ ] **Component Libraries** (`frontend/component-libraries.md`):
  - Using shadcn/ui components? (Button, Input, Sheet)
  - Following accessibility patterns?

- [ ] **Project Structure** (`global/project-structure.md`):
  - Vertical slice architecture? (domains/workspace, domains/admin/workspace)
  - Barrel exports? (index.ts in each folder)
  - Restricted API? (not exporting server functions)

- [ ] **Code Quality** (`global/code-quality.md`):
  - Clean, simple code?
  - No dead code?
  - Proper naming conventions?

- [ ] **Firestore** (`backend/firestore.md`):
  - Client SDK for reads?
  - Admin SDK in server functions only?
  - Security rules enforced?

**Verification**:
```bash
# Review code against standards
git diff main...003-workspace-list
```

**Checkpoint**: Feature complies with all applicable standards

---

## Deployment

### Deploy to Staging

```bash
# From monorepo root

# Deploy Firestore rules and indexes
pnpm fb:deploy

# Build and deploy TanStack Start app
cd apps/clementine-app
pnpm build
# (Deploy to Vercel/Netlify/hosting platform)
```

### Deploy to Production

1. **Test thoroughly in staging** (all acceptance scenarios from spec.md)
2. **Merge to main** (PR review required)
3. **Deploy Firestore resources** first: `pnpm fb:deploy`
4. **Deploy application** second: Build + deploy to hosting platform
5. **Verify in production**: Test critical paths (create, list, delete)

---

## Troubleshooting

### Slug uniqueness not working

**Symptom**: Duplicate slugs created under concurrent load

**Solution**: Verify transaction is being used in `createWorkspaceFn`, not separate read + write operations

### Real-time updates not working

**Symptom**: Workspace list doesn't auto-update after creation/deletion

**Solution**: Check `onSnapshot` listener is set up in `useWorkspaces` hook, verify `queryClient.setQueryData` is called

### Admin guard failing

**Symptom**: Redirected to login even as admin

**Solution**: Verify `admin: true` custom claim is set in Firebase Auth, check session cookie is present

### Workspace not found by slug

**Symptom**: 404 when accessing `/workspace/[slug]` for valid workspace

**Solution**: Check slug is stored in lowercase, verify composite index (slug + status) is deployed

---

## Next Steps

After completing this feature:

1. **Run `/speckit.tasks`** to generate implementation tasks
2. **Implement tasks** incrementally (test after each task)
3. **Create pull request** with feature complete
4. **Code review** (verify standards compliance)
5. **Merge to main** after approval
6. **Deploy to production**

---

## Reference Implementation

See Next.js app for reference patterns:
- **Company feature**: `web/src/features/companies/` (analogous to workspace management)
- **Server actions**: `web/src/features/companies/actions/`
- **UI components**: `web/src/features/companies/components/`
