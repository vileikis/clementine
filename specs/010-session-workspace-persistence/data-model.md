# Data Model: Session Workspace Persistence

**Feature**: Server Session Workspace Persistence
**Date**: 2026-01-03
**Phase**: Phase 1 (Design)

This document defines the data structures for storing workspace session preferences in server-side session storage.

---

## 1. Session Data Structure

### SessionData (Server-side storage)

**Purpose**: Raw data stored in encrypted HTTP-only cookie (server session)

**Location**: `apps/clementine-app/src/domains/auth/types/session.types.ts`

**Schema**:
```typescript
/**
 * Server session data stored in encrypted HTTP-only cookie
 *
 * All fields are optional to support partial session states:
 * - Anonymous users: userId exists, email is undefined
 * - Pre-auth state: All fields undefined
 * - Workspace preference: lastVisitedWorkspaceSlug may be undefined initially
 */
export interface SessionData {
  /**
   * Firebase user ID
   * @example "abc123def456"
   */
  userId?: string

  /**
   * User email address
   * Undefined for anonymous users
   * @example "admin@example.com"
   */
  email?: string

  /**
   * Admin role from Firebase custom claims
   * @default false
   */
  isAdmin?: boolean

  /**
   * Anonymous authentication flag
   * @default false
   */
  isAnonymous?: boolean

  /**
   * Last visited workspace slug (session persistence)
   * Undefined until user visits first workspace
   * @example "acme-corp-events"
   */
  lastVisitedWorkspaceSlug?: string
}
```

**Validation Rules**:
- `userId`: String, Firebase UID format, required for authenticated state
- `email`: String, valid email format, optional (undefined for anonymous)
- `isAdmin`: Boolean, defaults to `false` if missing
- `isAnonymous`: Boolean, defaults to `false` if missing
- `lastVisitedWorkspaceSlug`: String, valid workspace slug format, optional

**Storage**:
- **Mechanism**: Vinxi session (encrypted HTTP-only cookie)
- **Cookie name**: `clementine-session`
- **Encryption**: AES-256 with SESSION_SECRET
- **Expiration**: 7 days (604800 seconds)
- **Size limit**: ~4KB (cookie size limit)
- **Security**: `httpOnly: true`, `sameSite: 'lax'`, `secure: true` (production)

**State Transitions**:
```
1. Pre-auth state:
   SessionData = {}

2. Login (admin user):
   SessionData = {
     userId: "abc123",
     email: "admin@example.com",
     isAdmin: true,
     isAnonymous: false
   }

3. Visit workspace (e.g., /workspace/acme-corp):
   SessionData = {
     userId: "abc123",
     email: "admin@example.com",
     isAdmin: true,
     isAnonymous: false,
     lastVisitedWorkspaceSlug: "acme-corp" // ADDED
   }

4. Token refresh (preserve workspace preference):
   SessionData = {
     userId: "abc123", // refreshed
     email: "admin@example.com", // refreshed
     isAdmin: true, // refreshed from custom claims
     isAnonymous: false,
     lastVisitedWorkspaceSlug: "acme-corp" // PRESERVED
   }

5. Logout:
   SessionData = {} // Cleared
```

---

## 2. Session User Structure

### SessionUser (Client-exposed data)

**Purpose**: Sanitized session data returned to client via `getCurrentUserFn`

**Location**: `apps/clementine-app/src/domains/auth/types/session.types.ts`

**Schema**:
```typescript
/**
 * Authenticated user data returned from getCurrentUserFn()
 *
 * Only returned when userId exists in session.
 * All fields are required except email and lastVisitedWorkspaceSlug.
 */
export interface SessionUser {
  /**
   * Firebase user ID
   * Always present for authenticated users
   * @example "abc123def456"
   */
  userId: string

  /**
   * User email address
   * Undefined for anonymous users
   * @example "admin@example.com"
   */
  email?: string

  /**
   * Admin role from Firebase custom claims
   * Never undefined (defaults to false)
   */
  isAdmin: boolean

  /**
   * Anonymous authentication flag
   * Never undefined (defaults to false)
   */
  isAnonymous: boolean

  /**
   * Last visited workspace slug (session persistence)
   * Undefined until user visits first workspace
   * Used for server-side redirects in /workspace route
   * @example "acme-corp-events"
   */
  lastVisitedWorkspaceSlug?: string
}
```

**Validation Rules**:
- `userId`: Required, non-empty string
- `email`: Optional string (undefined for anonymous)
- `isAdmin`: Required boolean (never undefined)
- `isAnonymous`: Required boolean (never undefined)
- `lastVisitedWorkspaceSlug`: Optional string (undefined until first workspace visit)

**Relationship to SessionData**:
```typescript
// SessionData → SessionUser transformation (in getCurrentUserFn)
const sessionData: SessionData = session.data
const sessionUser: SessionUser | null = sessionData.userId
  ? {
      userId: sessionData.userId,
      email: sessionData.email || undefined,
      isAdmin: sessionData.isAdmin || false,
      isAnonymous: sessionData.isAnonymous || false,
      lastVisitedWorkspaceSlug: sessionData.lastVisitedWorkspaceSlug,
    }
  : null
```

---

## 3. Server Function Input/Output

### setLastVisitedWorkspaceFn Input

**Purpose**: Input data for setting workspace preference in session

**Schema**:
```typescript
interface SetLastVisitedWorkspaceInput {
  /**
   * Workspace slug to store in session
   * @example "acme-corp-events"
   */
  workspaceSlug: string
}
```

**Validation Rules**:
- `workspaceSlug`: Required, non-empty string, valid slug format (lowercase, hyphens)
- No workspace existence validation (trust client-side resolution)

**Validation Implementation**:
```typescript
// In createServerFn inputValidator
.inputValidator((data: { workspaceSlug: string }) => {
  // Basic validation (detailed validation in Zod if needed)
  if (!data.workspaceSlug || typeof data.workspaceSlug !== 'string') {
    throw new Error('Invalid workspace slug')
  }
  return data
})
```

### setLastVisitedWorkspaceFn Output

**Schema**:
```typescript
interface SetLastVisitedWorkspaceResult {
  /**
   * Whether session update succeeded
   */
  success: boolean

  /**
   * Error message if failed
   * Only present when success = false
   */
  error?: string
}
```

**Response Cases**:
```typescript
// Success
{ success: true }

// Failure - Unauthenticated
{ success: false, error: 'Unauthenticated' }
```

---

## 4. Type Extensions Summary

### Changes to Existing Types

**File**: `apps/clementine-app/src/domains/auth/types/session.types.ts`

**Before**:
```typescript
export interface SessionData {
  userId?: string
  email?: string
  isAdmin?: boolean
  isAnonymous?: boolean
}

export interface SessionUser {
  userId: string
  email?: string
  isAdmin: boolean
  isAnonymous: boolean
}
```

**After**:
```typescript
export interface SessionData {
  userId?: string
  email?: string
  isAdmin?: boolean
  isAnonymous?: boolean
  lastVisitedWorkspaceSlug?: string // NEW FIELD
}

export interface SessionUser {
  userId: string
  email?: string
  isAdmin: boolean
  isAnonymous: boolean
  lastVisitedWorkspaceSlug?: string // NEW FIELD
}
```

---

## 5. Workspace Data (No Changes)

**Important**: This feature does NOT modify the Firestore workspace data model.

**Workspace Entity** (unchanged):
- **Collection**: `workspaces`
- **Fields**: `slug`, `name`, `status`, `createdAt`, etc.
- **Queried by**: Client-side Firebase SDK in `useWorkspace` hook

**Relationship**:
```
SessionData.lastVisitedWorkspaceSlug -> references -> Workspace.slug
```

The session stores only the **slug string** (not full workspace data, not reference). Workspace data is fetched separately via `useWorkspace` query.

---

## 6. Security Considerations

### Session Data Protection

**Encryption**:
- All session data encrypted with SESSION_SECRET (AES-256)
- Cookie payload unreadable by client JavaScript (httpOnly)

**XSS Protection**:
- `httpOnly: true` prevents JavaScript access to cookie
- Session data never exposed to client-side code
- Only `SessionUser` subset exposed via `getCurrentUserFn`

**CSRF Protection**:
- `sameSite: 'lax'` prevents cross-origin cookie sends
- TanStack Start CSRF tokens for POST requests

**Data Minimization**:
- Only store workspace slug (not sensitive data)
- No PII beyond email (already in session)

### Authorization

**setLastVisitedWorkspaceFn Security**:
```typescript
// Require authentication
if (!session.data.userId) {
  return { success: false, error: 'Unauthenticated' }
}

// No admin check needed (only admins visit workspaces in UX)
// No workspace existence check (trust client-side resolution)
```

**Why no workspace validation?**
- Performance: Avoid Firestore query on every workspace visit
- Trust boundary: Client already verified workspace exists (via `useWorkspace`)
- Impact: Invalid slug in session just causes redirect to `/admin/workspaces` (safe fallback)

---

## 7. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User visits /workspace/$workspaceSlug                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ useWorkspace(slug) - Fetch workspace from Firestore         │
│ (Client-side Firebase SDK)                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
          ┌──────┴───────┐
          │  Valid?      │
          └──────┬───────┘
                 │
        ┌────────┴────────┐
        │                 │
      Yes                No
        │                 │
        ▼                 ▼
┌───────────────┐  ┌──────────────┐
│ useEffect:    │  │ Show 404     │
│ Call server   │  │ (Don't save) │
│ function      │  └──────────────┘
└───────┬───────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ setLastVisitedWorkspaceFn({ workspaceSlug })                │
│ (Server function call)                                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Update session:                                             │
│ SessionData.lastVisitedWorkspaceSlug = "acme-corp"          │
│ (Encrypted HTTP-only cookie)                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ User visits /workspace (later)                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ beforeLoad: getCurrentUserFn()                              │
│ Returns SessionUser with lastVisitedWorkspaceSlug           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ redirect({ to: '/workspace/$workspaceSlug' })               │
│ (Server-side redirect - no loading flash)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Migration Considerations

**Existing localStorage data**:
- Users may have `workspace-storage` in localStorage (Zustand persist)
- After migration, this data is **ignored** (not read or migrated)
- Users must visit a workspace once to establish new session preference

**Backwards compatibility**:
- Adding optional field to SessionData is backwards compatible
- Existing sessions without `lastVisitedWorkspaceSlug` work correctly
- No database migration needed (localStorage → session is one-way)

**Rollback strategy**:
- If rollback needed, old Zustand store can be restored
- Session data is additive (doesn't break if field exists but unused)
