# Server Function Contracts

**Feature**: Server Session Workspace Persistence
**Date**: 2026-01-03
**Phase**: Phase 1 (Design)

This document defines the API contracts for server functions used in session workspace persistence.

---

## 1. setLastVisitedWorkspaceFn

**Purpose**: Update the last visited workspace slug in server session storage

**Method**: `POST`

**Authentication**: Required (userId must exist in session)

**Location**: `apps/clementine-app/src/domains/auth/server/functions.ts`

### Request

**Type**: TanStack Start server function (RPC-style)

**Input Schema**:
```typescript
interface SetLastVisitedWorkspaceInput {
  workspaceSlug: string
}
```

**Example Usage (Client)**:
```typescript
import { useServerFn } from '@tanstack/react-start/client'
import { setLastVisitedWorkspaceFn } from '@/domains/auth/server/functions'

const setLastVisitedWorkspace = useServerFn(setLastVisitedWorkspaceFn)

// Call in useEffect after workspace loads
await setLastVisitedWorkspace({
  data: { workspaceSlug: 'acme-corp-events' }
})
```

**Validation**:
- `workspaceSlug`: Required, non-empty string
- No workspace existence validation (trust client-side resolution)

### Response

**Output Schema**:
```typescript
interface SetLastVisitedWorkspaceResult {
  success: boolean
  error?: string
}
```

**Success Response**:
```typescript
{
  success: true
}
```

**Error Responses**:

| Error Case | Response | HTTP Equivalent |
|------------|----------|-----------------|
| Unauthenticated | `{ success: false, error: 'Unauthenticated' }` | 401 Unauthorized |
| Invalid input | Throws error (caught by TanStack Start) | 400 Bad Request |

### Side Effects

**Session Update**:
```typescript
// Before
SessionData = {
  userId: "abc123",
  email: "admin@example.com",
  isAdmin: true,
  isAnonymous: false
}

// After setLastVisitedWorkspaceFn({ workspaceSlug: "acme-corp" })
SessionData = {
  userId: "abc123",
  email: "admin@example.com",
  isAdmin: true,
  isAnonymous: false,
  lastVisitedWorkspaceSlug: "acme-corp" // ADDED
}
```

**Preservation**:
- All existing session fields MUST be preserved
- Only `lastVisitedWorkspaceSlug` is updated
- Uses spread operator: `{ ...session.data, lastVisitedWorkspaceSlug }`

### Security

**Authorization**:
- Checks `session.data.userId` exists
- No admin role check (UX ensures only admins visit workspaces)
- No workspace ownership check (workspace query handles authorization)

**Input Sanitization**:
- Input validated via `.inputValidator()`
- No special character escaping needed (stored in encrypted cookie)

**Rate Limiting**:
- Not required (low-frequency operation, user-initiated)

### Error Handling

**Client-side**:
```typescript
// Fire-and-forget pattern (don't await or check result)
setLastVisitedWorkspace({ data: { workspaceSlug } })

// If critical, handle errors:
try {
  const result = await setLastVisitedWorkspace({ data: { workspaceSlug } })
  if (!result.success) {
    console.error('Failed to save workspace preference:', result.error)
  }
} catch (error) {
  console.error('Server function error:', error)
}
```

**Server-side**:
```typescript
// Sentry integration for monitoring
return Sentry.startSpan(
  { name: 'setLastVisitedWorkspaceFn', op: 'workspace.session.update' },
  async () => {
    // ... implementation
  }
)
```

---

## 2. getCurrentUserFn (Enhanced)

**Purpose**: Get authenticated user data from server session (now includes workspace preference)

**Method**: `GET`

**Authentication**: Optional (returns `null` if unauthenticated)

**Location**: `apps/clementine-app/src/domains/auth/server/functions.ts`

### Request

**Type**: TanStack Start server function (RPC-style)

**Input**: None (GET request)

**Example Usage (Client)**:
```typescript
import { getCurrentUserFn } from '@/domains/auth/server/functions'

// In beforeLoad (works on server and client)
const user = await getCurrentUserFn()

if (!user) {
  throw redirect({ to: '/login' })
}

// Access workspace preference
const lastWorkspace = user.lastVisitedWorkspaceSlug
```

**Example Usage (Server)**:
```typescript
// In route guards
export async function requireAdmin() {
  const user = await getCurrentUserFn()

  if (!isAdmin(user)) {
    throw redirect({ to: '/login' })
  }

  return user // Includes lastVisitedWorkspaceSlug
}
```

### Response

**Output Schema**:
```typescript
type GetCurrentUserResult = SessionUser | null

interface SessionUser {
  userId: string
  email?: string
  isAdmin: boolean
  isAnonymous: boolean
  lastVisitedWorkspaceSlug?: string // NEW FIELD
}
```

**Authenticated Response**:
```typescript
{
  userId: "abc123def456",
  email: "admin@example.com",
  isAdmin: true,
  isAnonymous: false,
  lastVisitedWorkspaceSlug: "acme-corp-events" // May be undefined
}
```

**Unauthenticated Response**:
```typescript
null
```

**New Field Semantics**:
```typescript
// Never visited workspace
{
  userId: "abc123",
  email: "admin@example.com",
  isAdmin: true,
  isAnonymous: false,
  lastVisitedWorkspaceSlug: undefined
}

// Previously visited workspace
{
  userId: "abc123",
  email: "admin@example.com",
  isAdmin: true,
  isAnonymous: false,
  lastVisitedWorkspaceSlug: "acme-corp-events"
}
```

### Changes from Previous Version

**Before**:
```typescript
interface SessionUser {
  userId: string
  email?: string
  isAdmin: boolean
  isAnonymous: boolean
}
```

**After**:
```typescript
interface SessionUser {
  userId: string
  email?: string
  isAdmin: boolean
  isAnonymous: boolean
  lastVisitedWorkspaceSlug?: string // NEW
}
```

**Backwards Compatibility**:
- New field is optional (doesn't break existing consumers)
- Existing code that doesn't use workspace preference continues to work
- Type change is non-breaking (additive)

---

## 3. createSessionFn (Enhanced)

**Purpose**: Create server session from Firebase ID token (now preserves workspace preference)

**Method**: `POST`

**Authentication**: Requires valid Firebase ID token

**Location**: `apps/clementine-app/src/domains/auth/server/functions.ts`

### Request

**Type**: TanStack Start server function (RPC-style)

**Input Schema**:
```typescript
interface CreateSessionInput {
  idToken: string
}
```

**Example Usage (Client)**:
```typescript
import { useServerFn } from '@tanstack/react-start/client'
import { createSessionFn } from '@/domains/auth/server/functions'

const createSession = useServerFn(createSessionFn)

// After Firebase Auth sign-in
const idToken = await firebaseUser.getIdToken()
await createSession({ data: { idToken } })
```

### Response

**Output Schema**:
```typescript
interface CreateSessionResult {
  success: boolean
}
```

**Success Response**:
```typescript
{
  success: true
}
```

### Changes from Previous Version

**Before** (overwrites entire session):
```typescript
await session.update({
  userId: decodedToken.uid,
  email: decodedToken.email,
  isAdmin,
  isAnonymous,
  // lastVisitedWorkspaceSlug lost on token refresh!
})
```

**After** (preserves workspace preference):
```typescript
// Read existing workspace preference before update
const existingWorkspaceSlug = session.data.lastVisitedWorkspaceSlug

await session.update({
  userId: decodedToken.uid,
  email: decodedToken.email,
  isAdmin,
  isAnonymous,
  lastVisitedWorkspaceSlug: existingWorkspaceSlug, // PRESERVED
})
```

**Why This Matters**:
- Firebase ID tokens expire every 1 hour
- TanStack Start's AuthProvider refreshes tokens automatically
- Without preservation, workspace preference would be lost every hour
- Users would see `/admin/workspaces` instead of their last workspace after token refresh

**Side Effects**:

```typescript
// Initial login (no existing session)
Before: SessionData = {}
After:  SessionData = {
  userId: "abc123",
  email: "admin@example.com",
  isAdmin: true,
  isAnonymous: false
  // lastVisitedWorkspaceSlug: undefined (no history yet)
}

// Token refresh (with workspace history)
Before: SessionData = {
  userId: "old-token",
  email: "admin@example.com",
  isAdmin: true,
  isAnonymous: false,
  lastVisitedWorkspaceSlug: "acme-corp" // Existing preference
}
After:  SessionData = {
  userId: "new-token",
  email: "admin@example.com",
  isAdmin: true,
  isAnonymous: false,
  lastVisitedWorkspaceSlug: "acme-corp" // PRESERVED
}
```

---

## 4. Server Function Call Patterns

### Fire-and-Forget Pattern (Recommended for setLastVisitedWorkspaceFn)

**When to use**: Non-critical background operations

```typescript
// Don't await, don't check result
useEffect(() => {
  if (isSuccess && workspace) {
    setLastVisitedWorkspace({ data: { workspaceSlug } })
  }
}, [isSuccess, workspace, workspaceSlug, setLastVisitedWorkspace])
```

**Pros**:
- Doesn't block UI
- Simpler code
- Appropriate for non-critical operations

**Cons**:
- Can't handle errors
- No confirmation of success

### Await Pattern (If Error Handling Needed)

**When to use**: Critical operations requiring confirmation

```typescript
useEffect(() => {
  if (isSuccess && workspace) {
    setLastVisitedWorkspace({ data: { workspaceSlug } })
      .then(result => {
        if (!result.success) {
          console.error('Failed to save preference:', result.error)
        }
      })
      .catch(error => {
        console.error('Server function error:', error)
      })
  }
}, [isSuccess, workspace, workspaceSlug, setLastVisitedWorkspace])
```

**Pros**:
- Error handling
- Confirmation of success

**Cons**:
- More complex
- May block subsequent operations

### Recommendation

Use **fire-and-forget** for `setLastVisitedWorkspaceFn` because:
- Workspace preference is non-critical (UX enhancement, not core functionality)
- Failure has minimal impact (user clicks workspace manually next time)
- Simpler code, better performance
- Sentry monitoring catches server errors automatically

---

## 5. API Contract Summary

| Function | Method | Auth Required | Input | Output | Side Effect |
|----------|--------|---------------|-------|--------|-------------|
| `setLastVisitedWorkspaceFn` | POST | Yes | `{ workspaceSlug: string }` | `{ success: boolean, error?: string }` | Updates session `lastVisitedWorkspaceSlug` |
| `getCurrentUserFn` | GET | No | None | `SessionUser \| null` | None (read-only) |
| `createSessionFn` | POST | Yes (token) | `{ idToken: string }` | `{ success: boolean }` | Creates/updates session, preserves `lastVisitedWorkspaceSlug` |

### Type Exports

**Client-accessible types** (exported from `@/domains/auth`):
```typescript
export type { SessionUser } from './types/session.types'
```

**Server-only types** (NOT exported from domain index):
```typescript
// SessionData - server-only (session implementation detail)
// Only exposed via getCurrentUserFn → SessionUser
```

### Import Paths

**Server functions** (exported for client use):
```typescript
// From client code
import {
  getCurrentUserFn,
  setLastVisitedWorkspaceFn
} from '@/domains/auth/server/functions'

// Or via domain index (if re-exported)
import { getCurrentUserFn } from '@/domains/auth'
```

**Note**: Server functions are typically NOT exported from domain index to prevent accidental client bundle inclusion. Import directly from `server/functions.ts` or use `useServerFn` hook.

---

## 6. Testing Contracts

### Unit Tests

**Test `setLastVisitedWorkspaceFn`**:
```typescript
describe('setLastVisitedWorkspaceFn', () => {
  it('should update session with workspace slug', async () => {
    // Setup: Mock session with userId
    // Execute: Call server function
    // Assert: Session updated with lastVisitedWorkspaceSlug
  })

  it('should preserve existing session fields', async () => {
    // Setup: Mock session with full data
    // Execute: Call server function
    // Assert: userId, email, isAdmin, isAnonymous unchanged
  })

  it('should reject unauthenticated requests', async () => {
    // Setup: Mock session without userId
    // Execute: Call server function
    // Assert: Returns { success: false, error: 'Unauthenticated' }
  })
})
```

**Test `createSessionFn` workspace preservation**:
```typescript
describe('createSessionFn', () => {
  it('should preserve lastVisitedWorkspaceSlug on token refresh', async () => {
    // Setup: Mock session with workspace slug
    // Execute: Call createSessionFn with new token
    // Assert: lastVisitedWorkspaceSlug preserved
  })
})
```

### Integration Tests

**Test redirect flow**:
```typescript
describe('/workspace redirect', () => {
  it('should redirect to last visited workspace', async () => {
    // Setup: User session with lastVisitedWorkspaceSlug
    // Execute: Navigate to /workspace
    // Assert: Redirected to /workspace/$lastVisitedWorkspaceSlug
  })

  it('should redirect to workspaces list if no history', async () => {
    // Setup: User session without workspace history
    // Execute: Navigate to /workspace
    // Assert: Redirected to /admin/workspaces
  })
})
```

**Test session persistence**:
```typescript
describe('Workspace session persistence', () => {
  it('should save workspace slug after visit', async () => {
    // Setup: Visit /workspace/acme-corp
    // Execute: Wait for workspace load + useEffect
    // Assert: Session contains lastVisitedWorkspaceSlug = "acme-corp"
  })

  it('should not save invalid workspace slug', async () => {
    // Setup: Visit /workspace/nonexistent
    // Execute: Workspace query fails (404)
    // Assert: Session unchanged (no lastVisitedWorkspaceSlug)
  })
})
```
