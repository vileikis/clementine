# PRD: Server Session Workspace Persistence

## Goal

Migrate "last visited workspace" persistence from client-side localStorage (Zustand) to server-side session storage, enabling server-side redirects via `beforeLoad` and removing dependency on client-side hydration.

---

## Background

Currently, the "last visited workspace" feature uses:

- **Zustand store** (`useWorkspaceStore`) with `persist` middleware → localStorage
- **Client-side redirects** in `useEffect` hooks (runs after hydration)

This approach has limitations:

1. **Flash of loading state** - User sees "Loading..." before redirect
2. **Client-side dependency** - Cannot use `beforeLoad` for instant server-side redirects
3. **Inconsistent with auth architecture** - Auth uses server sessions, workspace uses localStorage
4. **localStorage unreliability** - Private browsing, quota exceeded, cross-device inconsistency

The auth domain already has a robust server session system using HTTP-only cookies. Storing `lastVisitedWorkspaceSlug` in the same session provides:

- **Server-side redirects** via `beforeLoad` (no loading flash)
- **Unified session management** (auth + workspace preferences in one place)
- **Cross-device persistence** (via cookie, not localStorage)
- **Security** (HTTP-only, encrypted)

---

## Scope

This PRD covers:

- Extending server session to include `lastVisitedWorkspaceSlug`
- Server function to update last visited workspace
- Server-side redirects in route `beforeLoad` handlers
- Removal of Zustand workspace store

**Out of scope:**

- Multi-workspace session history (only last visited)
- Workspace preferences beyond last visited slug
- Changes to Firebase/Firestore data model

---

## Users

- **Workspace Admin** (authenticated users with `admin: true` custom claim)

---

## Routes Affected

- `/workspace` (index route)
- `/workspace/$workspaceSlug` (workspace layout route)
- `/` (root route - already handles admin redirect)

---

## Data & Storage

### Session Data Structure

Extend the existing `SessionData` interface:

```ts
export interface SessionData {
  // Existing auth fields
  userId?: string
  email?: string
  isAdmin?: boolean
  isAnonymous?: boolean

  // NEW: Workspace session persistence
  lastVisitedWorkspaceSlug?: string
}
```

### Session User Structure

Extend `SessionUser` to include workspace data when returned to client:

```ts
export interface SessionUser {
  // Existing auth fields
  userId: string
  email?: string
  isAdmin: boolean
  isAnonymous: boolean

  // NEW: Workspace session persistence
  lastVisitedWorkspaceSlug?: string
}
```

---

## Functional Requirements

### 1. Session Extension

**Data Contract**

- Add `lastVisitedWorkspaceSlug?: string` to `SessionData` interface
- Add `lastVisitedWorkspaceSlug?: string` to `SessionUser` interface
- Field is optional (null/undefined for users who haven't visited any workspace)

**Preservation**

- When `createSessionFn` updates the session (on token refresh), preserve existing `lastVisitedWorkspaceSlug`
- Only `setLastVisitedWorkspaceFn` should modify this field

---

### 2. Server Function: Set Last Visited Workspace

**Endpoint**

- Create `setLastVisitedWorkspaceFn` server function

**Input**

- `workspaceSlug: string` - The workspace slug to store

**Behavior**

- Update only the `lastVisitedWorkspaceSlug` field in session
- Preserve all other session data (userId, email, isAdmin, isAnonymous)
- No validation of workspace existence (trust client-side workspace resolution)

**Authorization**

- Must be authenticated (userId exists in session)
- No admin check required (admins are the only users visiting workspaces)

---

### 3. Get Current User Enhancement

**Existing Function**

- `getCurrentUserFn` already returns session data

**Enhancement**

- Include `lastVisitedWorkspaceSlug` in returned `SessionUser` object

---

### 4. Route: `/workspace` (Index)

**Current Behavior**

- Uses `useEffect` + Zustand to redirect client-side
- Shows "Loading..." while determining redirect target

**New Behavior**

- Use `beforeLoad` to fetch session and redirect server-side
- No loading state visible to user (instant redirect)

**Redirect Logic (in `beforeLoad`)**

```
1. Get current user from session
2. If not admin → redirect to /login
3. If lastVisitedWorkspaceSlug exists → redirect to /workspace/$lastVisitedWorkspaceSlug
4. Else → redirect to /admin/workspaces
```

**Component**

- Route component can be minimal or removed entirely (redirect happens in beforeLoad)

---

### 5. Route: `/workspace/$workspaceSlug` (Layout)

**Current Behavior**

- Uses `useEffect` to save workspace slug to Zustand store
- Happens after component mounts (client-side)

**New Behavior**

- Call `setLastVisitedWorkspaceFn` when workspace is successfully loaded
- Still happens client-side (after workspace data confirmed valid)
- Use `onSuccess` callback from workspace query OR separate effect

**Trigger Timing**

- Only save after workspace data is confirmed to exist
- Do not save if workspace query fails (404)
- This prevents saving invalid workspace slugs to session

---

### 6. Cleanup: Remove Zustand Store

**Files to Remove**

- `src/domains/workspace/store/useWorkspaceStore.ts`
- Update `src/domains/workspace/index.ts` barrel export (remove store export)

**Usage Cleanup**

- Remove `useWorkspaceStore` import from `/workspace/index.tsx`
- Remove `useWorkspaceStore` import from `/workspace/$workspaceSlug.tsx`

---

## Implementation Details

### Session Update in createSessionFn

When updating session with new token data, preserve workspace preference:

```ts
// In createSessionFn
const session = await useAppSession()
const existingWorkspaceSlug = session.data.lastVisitedWorkspaceSlug

await session.update({
  userId: decodedToken.uid,
  email: decodedToken.email,
  isAdmin,
  isAnonymous,
  lastVisitedWorkspaceSlug: existingWorkspaceSlug, // Preserve existing value
})
```

### BeforeLoad Redirect Pattern

```ts
// In /workspace/index.tsx
export const Route = createFileRoute('/workspace/')({
  beforeLoad: async () => {
    const user = await getCurrentUserFn()
    
    if (!isAdmin(user)) {
      throw redirect({ to: '/login' })
    }
    
    if (user.lastVisitedWorkspaceSlug) {
      throw redirect({
        to: '/workspace/$workspaceSlug',
        params: { workspaceSlug: user.lastVisitedWorkspaceSlug },
      })
    }
    
    throw redirect({ to: '/admin/workspaces' })
  },
  component: () => null, // Never renders (always redirects)
})
```

### Client-Side Workspace Save

```ts
// In /workspace/$workspaceSlug.tsx
function WorkspaceLayout() {
  const { workspaceSlug } = Route.useParams()
  const { data: workspace, isSuccess } = useWorkspace(workspaceSlug)
  const setLastVisitedWorkspace = useServerFn(setLastVisitedWorkspaceFn)

  useEffect(() => {
    if (isSuccess && workspace) {
      setLastVisitedWorkspace({ data: { workspaceSlug } })
    }
  }, [isSuccess, workspace, workspaceSlug, setLastVisitedWorkspace])

  // ... rest of component
}
```

---

## Non-Goals

- Validating workspace existence server-side before redirect
- Multi-workspace history/recent workspaces list
- Syncing workspace preference to Firestore user profile
- Cross-session workspace preference (different browsers)

---

## Security Considerations

- Session data is stored in encrypted HTTP-only cookie
- `lastVisitedWorkspaceSlug` is protected by same security as auth session
- Server function requires authentication (session must have userId)
- No sensitive data stored (just workspace slug string)

---

## Migration Path

1. **Phase 1**: Add new session fields and server function
2. **Phase 2**: Update routes to use beforeLoad + server function
3. **Phase 3**: Remove Zustand store and related code
4. **Phase 4**: Test and verify no localStorage dependencies remain

**Backwards Compatibility**

- Existing localStorage data will be ignored after migration
- Users will need to visit a workspace once to establish new session preference
- No data migration needed (localStorage → session)

---

## Acceptance Criteria

- [ ] Admin visiting `/workspace` is instantly redirected to last workspace (no loading state)
- [ ] Admin visiting `/workspace` with no history redirects to `/admin/workspaces`
- [ ] Visiting a valid workspace updates session preference
- [ ] Visiting an invalid workspace does NOT update session preference
- [ ] Token refresh preserves `lastVisitedWorkspaceSlug`
- [ ] Logout clears `lastVisitedWorkspaceSlug` (session cleared)
- [ ] Zustand store completely removed from codebase
- [ ] No localStorage usage for workspace persistence

---

## Technical Dependencies

- TanStack Start server functions (`createServerFn`)
- TanStack Router `beforeLoad` and `redirect`
- Existing auth session infrastructure (`useAppSession`)
- Firebase Admin SDK (for token verification in `createSessionFn`)

