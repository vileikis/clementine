# Research: Session Workspace Persistence Patterns

**Feature**: Server Session Workspace Persistence
**Date**: 2026-01-03
**Phase**: Phase 0 (Research)

This document captures technical research for migrating workspace persistence from localStorage to server session storage.

---

## 1. TanStack Start Session Update Patterns

### Decision
**Use `session.update()` with explicit field preservation** - Always spread existing session data when updating to prevent field loss.

### Rationale
While Vinxi's `session.update()` documentation suggests it performs partial updates (merge behavior), the TanStack Start authentication guide lacks explicit merge semantics documentation. The safest pattern is to **explicitly preserve existing fields** by reading current session data and spreading it into the update call.

This approach:
- **Guarantees no data loss** regardless of underlying merge implementation
- **Makes intent explicit** in code (clear what you're preserving)
- **Follows existing codebase pattern** (existing `createSessionFn` updates all fields)
- **Type-safe** - TypeScript catches missing required fields

### Alternatives Considered

**Alternative 1: Trust implicit merge behavior**
```typescript
await session.update({ lastVisitedWorkspaceSlug: workspaceSlug })
```
❌ Rejected - Documentation doesn't guarantee merge behavior, risk of field loss

**Alternative 2: Separate session storage for workspace data**
```typescript
const workspaceSession = useSession({ name: 'workspace-session' })
```
❌ Rejected - Creates unnecessary complexity, splits related data across cookies

### Code Pattern

**In `createSessionFn` (preserve workspace slug during auth refresh):**
```typescript
const session = await useAppSession()

// Preserve existing workspace preference
const existingWorkspaceSlug = session.data.lastVisitedWorkspaceSlug

await session.update({
  userId: decodedToken.uid,
  email: decodedToken.email,
  isAdmin,
  isAnonymous,
  lastVisitedWorkspaceSlug: existingWorkspaceSlug, // Explicitly preserve
})
```

**New `setLastVisitedWorkspaceFn` server function:**
```typescript
export const setLastVisitedWorkspaceFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { workspaceSlug: string }) => data)
  .handler(async ({ data }) => {
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
  })
```

---

## 2. BeforeLoad Redirect Patterns (TanStack Router)

### Decision
**Use server-side `beforeLoad` with conditional redirects** - Leverage TanStack Router's `beforeLoad` for instant server-side redirects based on session data.

### Rationale
TanStack Router's `beforeLoad` is specifically designed for:
- **Pre-route validation** - Runs before child routes load
- **Server-side execution** - Works during SSR (no flash of loading state)
- **Blocking behavior** - Prevents component rendering if redirecting
- **Middleware pattern** - Guards entire route trees

This matches the requirement perfectly: redirect from `/workspace` based on server session data without client-side flash.

The existing codebase already uses this pattern in auth guards (`requireAdmin`, `handleRootRoute`).

### Alternatives Considered

**Alternative 1: Client-side redirect in component (current implementation)**
```typescript
function WorkspaceRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate({ to: '/workspace/$workspaceSlug' })
  }, [])
  return <div>Loading...</div>
}
```
❌ Rejected - Causes flash of loading state, requires hydration, inconsistent with auth patterns

**Alternative 2: Loader function redirect**
```typescript
loader: async () => {
  const user = await getCurrentUserFn()
  throw redirect({ to: '/workspace/$slug' })
}
```
⚠️ Considered - Works but `beforeLoad` is more appropriate for guards (loaders are for data fetching)

### Code Pattern

**Update `/workspace/index.tsx` route:**
```typescript
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

**Infinite Loop Prevention:**

The pattern is safe from infinite loops because:
1. **Terminal redirects** - Each path leads to a concrete route (`/workspace/$slug` or `/admin/workspaces`)
2. **No circular dependencies** - `/workspace/$slug` doesn't redirect back to `/workspace`
3. **Replace: true** - Prevents back button loops by replacing history entry
4. **Parent guard protection** - `requireAdmin` in `/workspace/route.tsx` prevents unauthorized access

---

## 3. Server Function Call Timing (Client-side)

### Decision
**Use `useEffect` with success condition check** - Call `setLastVisitedWorkspaceFn` in a `useEffect` that depends on workspace query success state.

### Rationale

React Query v5 **removed `onSuccess` callbacks** from `useQuery` due to:
1. **Inconsistent behavior** - Callbacks fire per component, not per query
2. **State sync issues** - Creates intermediate renders with stale derived state
3. **Stale callback problem** - Doesn't fire when returning cached data

The recommended pattern from TkDodo (React Query maintainer) is:
- **For side effects**: Use `useEffect` with `query.data` dependency
- **For derived state**: Compute directly from `query.data`
- **For global callbacks**: Use `QueryCache.onSuccess`

In this case, we need a **side effect** (update server session), so `useEffect` is appropriate.

### Alternatives Considered

**Alternative 1: onSuccess callback (deprecated in React Query v5)**
```typescript
const { data } = useWorkspace(workspaceSlug, {
  onSuccess: (workspace) => {
    setLastVisitedWorkspaceFn({ data: { workspaceSlug } })
  }
})
```
❌ Rejected - Removed in React Query v5, causes duplicate calls, doesn't fire with cached data

**Alternative 2: Immediate call after useWorkspace**
```typescript
const { data: workspace } = useWorkspace(workspaceSlug)
if (workspace) {
  setLastVisitedWorkspaceFn({ data: { workspaceSlug } })
}
```
❌ Rejected - Calls on every render, causes infinite loops, not a side effect pattern

**Alternative 3: Call in workspace query itself**
```typescript
queryFn: async () => {
  const workspace = await fetchWorkspace()
  await setLastVisitedWorkspaceFn({ data: { workspaceSlug } })
  return workspace
}
```
❌ Rejected - Mixing data fetching with side effects, breaks query caching, violates separation of concerns

### Code Pattern

**Update `/workspace/$workspaceSlug.tsx`:**
```typescript
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

  if (isLoading) {
    return <div>Loading workspace...</div>
  }

  if (isError || !workspace) {
    return <WorkspaceNotFound />
  }

  return <Outlet />
}
```

**Why this pattern works:**

1. **Conditional execution** - Only runs when `isSuccess && workspace` (workspace confirmed valid)
2. **Proper dependencies** - Effect runs when workspace changes or first loads
3. **Fire-and-forget** - Don't need to await (session update is non-critical background operation)
4. **No duplicate calls** - `useServerFn` is stable, `isSuccess` only true once per query
5. **Prevents invalid saves** - Never saves if workspace query fails (404)
6. **StrictMode safe** - Effect runs twice in dev but that's okay (idempotent session update)

**Preventing Duplicate Calls:**

The dependencies are carefully chosen:
- `isSuccess` - Only `true` after initial fetch (stays `true` with cached data)
- `workspace` - Only changes if different workspace loaded
- `workspaceSlug` - Param change triggers new query
- `setLastVisitedWorkspace` - Stable function from `useServerFn`

This prevents the effect from running on every render - only when workspace actually changes.

---

## Summary of Decisions

| Aspect | Pattern | Rationale |
|--------|---------|-----------|
| **Session Updates** | Explicit field preservation with spread | Guarantees no data loss, type-safe, clear intent |
| **Route Redirects** | Server-side `beforeLoad` | Instant redirects, no loading flash, SSR compatible |
| **Server Function Calls** | `useEffect` with success condition | React Query v5 best practice, prevents duplicates |

All patterns align with:
- **Existing codebase conventions** (auth guards, session management)
- **Official TanStack documentation** (Router, Query, Start)
- **Modern React patterns** (removed onSuccess callbacks, explicit side effects)

---

## References

### TanStack Start Session Management
- [TanStack Start Authentication Guide](https://tanstack.com/start/latest/docs/framework/react/guide/authentication)
- [Vinxi Session API Documentation](https://vinxi.vercel.app/api/server/session.html)

### TanStack Router Redirects
- [TanStack Router Data Loading](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading)
- [TanStack Router Authenticated Routes](https://tanstack.com/router/v1/docs/framework/react/guide/authenticated-routes)
- [TanStack Router redirect Function](https://tanstack.com/router/v1/docs/framework/react/api/router/redirectFunction)

### React Query & Server Function Timing
- [TkDodo - Breaking React Query's API on Purpose](https://tkdodo.eu/blog/breaking-react-querys-api-on-purpose)
- [React useEffect Hook](https://react.dev/reference/react/useEffect)
