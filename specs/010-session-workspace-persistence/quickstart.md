# Quickstart: Session Workspace Persistence Implementation

**Feature**: Server Session Workspace Persistence
**Date**: 2026-01-03
**Phase**: Phase 1 (Design)

This document provides a step-by-step guide for implementing session-based workspace persistence.

---

## Overview

**Goal**: Migrate workspace preference from localStorage (Zustand) to server session storage for instant server-side redirects.

**Impact**:
- ✅ No loading flash on `/workspace` route
- ✅ Cross-device persistence (via cookie)
- ✅ Unified session management (auth + workspace)
- ✅ Simpler architecture (removes Zustand dependency)

**Time Estimate**: 2-3 hours

---

## Prerequisites

- TanStack Start app running locally (`pnpm dev` from `apps/clementine-app`)
- Understanding of TanStack Router `beforeLoad` and server functions
- Familiarity with auth domain structure

---

## Implementation Steps

### Step 1: Extend Session Types (10 minutes)

**File**: `apps/clementine-app/src/domains/auth/types/session.types.ts`

**Add field to SessionData**:
```typescript
export interface SessionData {
  userId?: string
  email?: string
  isAdmin?: boolean
  isAnonymous?: boolean
  lastVisitedWorkspaceSlug?: string // ADD THIS
}
```

**Add field to SessionUser**:
```typescript
export interface SessionUser {
  userId: string
  email?: string
  isAdmin: boolean
  isAnonymous: boolean
  lastVisitedWorkspaceSlug?: string // ADD THIS
}
```

**Verification**:
```bash
pnpm app:check  # Should pass type-check
```

---

### Step 2: Update getCurrentUserFn (5 minutes)

**File**: `apps/clementine-app/src/domains/auth/server/functions.ts`

**Find `getCurrentUserFn` (around line 100)**:
```typescript
export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionUser | null> => {
    return Sentry.startSpan(
      { name: 'getCurrentUserFn', op: 'auth.session' },
      async () => {
        const session = await useAppSession()
        const { userId, email, isAdmin, isAnonymous, lastVisitedWorkspaceSlug } = session.data
        //                                             ^^^^^^^^^^^^^^^^^^^^^^^ ADD THIS

        if (!userId) {
          return null
        }

        return {
          userId,
          email: email || undefined,
          isAdmin: isAdmin || false,
          isAnonymous: isAnonymous || false,
          lastVisitedWorkspaceSlug, // ADD THIS
        }
      },
    )
  },
)
```

**Verification**:
```bash
pnpm app:check  # Should pass type-check
```

---

### Step 3: Update createSessionFn to Preserve Workspace (10 minutes)

**File**: `apps/clementine-app/src/domains/auth/server/functions.ts`

**Find `createSessionFn` (around line 50)**:
```typescript
export const createSessionFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { idToken: string }) => data)
  .handler(async ({ data }) => {
    return Sentry.startSpan(
      { name: 'createSessionFn', op: 'auth.session.create' },
      async () => {
        try {
          const decodedToken = await adminAuth.verifyIdToken(data.idToken)
          const isAdmin = decodedToken.admin === true
          const isAnonymous = decodedToken.firebase.sign_in_provider === 'anonymous'

          const session = await useAppSession()

          // ADD THIS: Preserve existing workspace preference
          const existingWorkspaceSlug = session.data.lastVisitedWorkspaceSlug

          await session.update({
            userId: decodedToken.uid,
            email: decodedToken.email,
            isAdmin,
            isAnonymous,
            lastVisitedWorkspaceSlug: existingWorkspaceSlug, // ADD THIS
          })

          return { success: true }
        } catch (error) {
          Sentry.captureException(error)
          throw new Error('Failed to create session')
        }
      }
    )
  })
```

**Why**: Token refreshes happen every hour. Without this, workspace preference would be lost on refresh.

**Verification**:
```bash
pnpm app:check  # Should pass type-check
```

---

### Step 4: Create setLastVisitedWorkspaceFn (20 minutes)

**File**: `apps/clementine-app/src/domains/auth/server/functions.ts`

**Add new server function after `createSessionFn`**:
```typescript
/**
 * Update last visited workspace in server session
 *
 * Called from workspace layout route after workspace data is confirmed valid.
 * Preserves all existing session data while updating workspace preference.
 */
export const setLastVisitedWorkspaceFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { workspaceSlug: string }) => data)
  .handler(async ({ data }) => {
    return Sentry.startSpan(
      { name: 'setLastVisitedWorkspaceFn', op: 'workspace.session.update' },
      async () => {
        const session = await useAppSession()

        // Require authentication
        if (!session.data.userId) {
          return { success: false, error: 'Unauthenticated' }
        }

        // Preserve all existing session fields
        await session.update({
          ...session.data,
          lastVisitedWorkspaceSlug: data.workspaceSlug,
        })

        return { success: true }
      }
    )
  })
```

**Export from server index**:

**File**: `apps/clementine-app/src/domains/auth/server/index.ts`

```typescript
export {
  createSessionFn,
  getCurrentUserFn,
  clearSessionFn,
  setLastVisitedWorkspaceFn, // ADD THIS
} from './functions'
```

**Verification**:
```bash
pnpm app:check  # Should pass type-check
```

---

### Step 5: Update /workspace Index Route (20 minutes)

**File**: `apps/clementine-app/src/app/workspace/index.tsx`

**Replace entire file** with server-side redirect logic:
```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'
import { getCurrentUserFn } from '@/domains/auth/server/functions'
import { isAdmin } from '@/domains/auth/utils/authChecks'

/**
 * Workspace index route
 *
 * Route: /workspace
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Server-side redirect based on session data:
 * - Redirects to last visited workspace (if exists in session)
 * - Falls back to /admin/workspaces (if no workspace history)
 *
 * Uses beforeLoad for instant server-side redirect (no loading flash).
 */
export const Route = createFileRoute('/workspace/')({
  beforeLoad: async () => {
    const user = await getCurrentUserFn()

    // Parent route already enforces admin, but double-check for safety
    if (!isAdmin(user)) {
      throw redirect({ to: '/login' })
    }

    // Redirect to last visited workspace if exists
    if (user.lastVisitedWorkspaceSlug) {
      throw redirect({
        to: '/workspace/$workspaceSlug',
        params: { workspaceSlug: user.lastVisitedWorkspaceSlug },
        replace: true, // Don't add /workspace to history
      })
    }

    // No workspace history - redirect to workspaces list
    throw redirect({
      to: '/admin/workspaces',
      replace: true,
    })
  },
  component: () => null, // Never renders (always redirects in beforeLoad)
})
```

**What changed**:
- ❌ Removed: `WorkspaceRedirect` component with `useEffect` + `useWorkspaceStore`
- ✅ Added: `beforeLoad` with server-side redirect based on session
- ✅ Result: No loading flash, works during SSR

**Verification**:
```bash
pnpm app:check  # Should pass type-check
pnpm dev        # Test redirect in browser
```

---

### Step 6: Update /workspace/$workspaceSlug Route (15 minutes)

**File**: `apps/clementine-app/src/app/workspace/$workspaceSlug.tsx`

**Find `WorkspaceLayout` component** (around line 20):

**Before**:
```typescript
function WorkspaceLayout() {
  const { workspaceSlug } = Route.useParams()
  const { data: workspace, isLoading, isError } = useWorkspace(workspaceSlug)
  const setLastVisitedWorkspaceSlug = useWorkspaceStore(
    (state) => state.setLastVisitedWorkspaceSlug,
  )

  useEffect(() => {
    if (workspaceSlug) {
      setLastVisitedWorkspaceSlug(workspaceSlug)
    }
  }, [workspaceSlug, setLastVisitedWorkspaceSlug])

  // ... rest of component
}
```

**After**:
```typescript
import { useServerFn } from '@tanstack/react-start/client'
import { setLastVisitedWorkspaceFn } from '@/domains/auth/server/functions'

function WorkspaceLayout() {
  const { workspaceSlug } = Route.useParams()
  const { data: workspace, isSuccess, isLoading, isError } = useWorkspace(workspaceSlug)
  const setLastVisitedWorkspace = useServerFn(setLastVisitedWorkspaceFn)

  // Update server session after workspace successfully loads
  // Only runs when workspace exists (prevents saving invalid slugs)
  useEffect(() => {
    if (isSuccess && workspace) {
      // Fire-and-forget server function call
      // No need to await - session update is non-critical
      setLastVisitedWorkspace({ data: { workspaceSlug } })
    }
  }, [isSuccess, workspace, workspaceSlug, setLastVisitedWorkspace])

  // ... rest of component (unchanged)
}
```

**What changed**:
- ❌ Removed: `useWorkspaceStore` import and usage
- ✅ Added: `useServerFn` with `setLastVisitedWorkspaceFn`
- ✅ Added: `isSuccess` condition (only save if workspace valid)

**Verification**:
```bash
pnpm app:check  # Should pass type-check
```

---

### Step 7: Remove Zustand Store (10 minutes)

**Delete file**:
```bash
rm apps/clementine-app/src/domains/workspace/store/useWorkspaceStore.ts
```

**Update workspace domain index**:

**File**: `apps/clementine-app/src/domains/workspace/index.ts`

**Before**:
```typescript
export { useWorkspaceStore } from './store/useWorkspaceStore'
```

**After**:
```typescript
// Removed: useWorkspaceStore (migrated to server session)
```

**Verification**:
```bash
pnpm app:check  # Should pass (no unused imports)
```

---

### Step 8: Test End-to-End (30 minutes)

#### Test 1: First Workspace Visit

1. **Clear session**: Logout and login again
2. **Navigate to `/workspace`**
   - Expected: Redirected to `/admin/workspaces` (no history)
3. **Click on a workspace** (e.g., "Acme Corp")
   - Expected: Navigated to `/workspace/acme-corp`
4. **Check DevTools**:
   - Open Network tab, filter by "Fetch"
   - Should see POST request to `setLastVisitedWorkspaceFn`
5. **Navigate back to `/workspace`**
   - Expected: Instantly redirected to `/workspace/acme-corp` (no loading flash)

✅ **Pass criteria**: No "Loading..." visible, instant redirect

#### Test 2: Cross-Tab Persistence

1. **Visit a workspace** in Tab 1 (e.g., `/workspace/acme-corp`)
2. **Open Tab 2**, navigate to `/workspace`
   - Expected: Instantly redirected to `/workspace/acme-corp`

✅ **Pass criteria**: Session shared across tabs (cookie-based)

#### Test 3: Token Refresh Preservation

1. **Visit a workspace** (e.g., `/workspace/acme-corp`)
2. **Wait 1 hour** (or manually refresh token in AuthProvider)
3. **Navigate to `/workspace`**
   - Expected: Still redirected to `/workspace/acme-corp` (workspace preference preserved)

✅ **Pass criteria**: Workspace preference survives token refresh

#### Test 4: Invalid Workspace (404)

1. **Manually navigate to `/workspace/nonexistent`**
   - Expected: "Workspace Not Found" page
2. **Check session**: workspace preference should NOT be saved
3. **Navigate to `/workspace`**
   - Expected: Redirected to previous valid workspace (or `/admin/workspaces` if no history)

✅ **Pass criteria**: Invalid workspace doesn't corrupt session

#### Test 5: Logout Clears Preference

1. **Visit a workspace** (e.g., `/workspace/acme-corp`)
2. **Logout**
3. **Login again**
4. **Navigate to `/workspace`**
   - Expected: Redirected to `/admin/workspaces` (session cleared)

✅ **Pass criteria**: Logout clears workspace preference

---

### Step 9: Run Validation Gates (10 minutes)

**Technical Validation**:
```bash
cd apps/clementine-app
pnpm app:check  # Run lint, format, type-check
```

**Standards Compliance Review**:
- ✅ `frontend/architecture.md` - Client-first pattern maintained, server functions for session only
- ✅ `global/code-quality.md` - Clean code, no dead code, explicit types
- ✅ `global/project-structure.md` - Auth domain owns session, workspace domain simplified

**Local Dev Server**:
```bash
pnpm dev
# Test all redirect flows manually
```

---

### Step 10: Commit Changes (5 minutes)

**Stage changes**:
```bash
git add apps/clementine-app/src/domains/auth/
git add apps/clementine-app/src/app/workspace/
git add specs/010-session-workspace-persistence/
```

**Create commit**:
```bash
git commit -m "feat(workspace): migrate session persistence to server

- Extend SessionData and SessionUser with lastVisitedWorkspaceSlug
- Add setLastVisitedWorkspaceFn server function
- Update createSessionFn to preserve workspace preference on token refresh
- Replace client-side redirect in /workspace with beforeLoad server redirect
- Remove Zustand store dependency (useWorkspaceStore)

Benefits:
- No loading flash on /workspace route (instant server redirect)
- Cross-device persistence via HTTP-only cookie
- Unified session management (auth + workspace preferences)
- Simpler architecture (removes localStorage dependency)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Troubleshooting

### Issue: Type errors after adding field

**Symptom**: TypeScript complains about missing field in SessionData

**Solution**:
```bash
# Restart TypeScript server
pnpm app:check
# Or restart dev server
pnpm dev
```

### Issue: Redirect loop on /workspace

**Symptom**: Browser shows "too many redirects" error

**Diagnosis**:
- Check that `/workspace/$workspaceSlug` route doesn't redirect back to `/workspace`
- Verify `replace: true` is set in redirect calls

**Solution**: Review `beforeLoad` logic in `workspace/index.tsx` - should only redirect to terminal routes (`/workspace/$slug` or `/admin/workspaces`)

### Issue: Session not persisting across tabs

**Symptom**: Tab 2 doesn't see workspace preference from Tab 1

**Diagnosis**:
- Check browser cookies (DevTools → Application → Cookies)
- Verify `clementine-session` cookie exists
- Verify `sameSite: 'lax'` allows cross-tab sharing

**Solution**: Clear all cookies and re-login. If issue persists, check `useAppSession` configuration.

### Issue: Invalid workspace saved to session

**Symptom**: Visiting `/workspace/nonexistent` saves "nonexistent" to session

**Diagnosis**:
- Check `useEffect` condition in `$workspaceSlug.tsx`
- Should only run when `isSuccess && workspace` (not just `workspaceSlug`)

**Solution**: Ensure condition is `if (isSuccess && workspace)` not `if (workspaceSlug)`

---

## Rollback Plan

If issues arise after deployment:

1. **Revert commits**:
   ```bash
   git revert HEAD
   git push
   ```

2. **Restore Zustand store**:
   - Restore `useWorkspaceStore.ts` from git history
   - Restore client-side redirect in `workspace/index.tsx`
   - Restore Zustand usage in `workspace/$workspaceSlug.tsx`

3. **Remove session fields** (optional - additive changes are safe):
   - Session fields are optional, so leaving them won't break anything
   - If desired, can remove `lastVisitedWorkspaceSlug` from types in future cleanup

---

## Next Steps

After implementation:

1. **Monitor Sentry** for server function errors
2. **Collect user feedback** on redirect experience
3. **Consider future enhancements**:
   - Multi-workspace history (recent workspaces list)
   - Workspace preferences (collapsed sidebar, theme, etc.)
   - Server-side workspace validation (security hardening)

---

## References

- **Research**: [research.md](./research.md) - Technical decisions and patterns
- **Data Model**: [data-model.md](./data-model.md) - Session structure and types
- **Contracts**: [contracts/server-functions.md](./contracts/server-functions.md) - API contracts
- **Spec**: [spec.md](./spec.md) - Original PRD (moved from requirements/)
