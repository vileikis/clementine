# Server-Side Authentication Migration Plan

**Feature**: 002-auth-system
**Created**: 2025-12-26
**Status**: Planning Phase
**Priority**: High (Blocking for Phase 4-7 completion)

## Overview

This document outlines the architectural change from **client-side Firebase Auth** to **server-side authentication** while maintaining **client-side Firestore/Storage access** (hybrid approach).

## Context & Rationale

### Current Implementation (Phases 1-5 Completed)

**Architecture**: Client-side Firebase Auth
- Firebase Client SDK for all auth operations
- `onAuthStateChanged` listener in React context
- Auth state managed via `AuthProvider`
- Route guards in `beforeLoad` hooks

**Problem Identified**:
```
Error: Auth not available in context
```

**Root Cause**:
- TanStack Start's `beforeLoad` runs on **both server and client**
- Firebase Client SDK only works in browser (client-side)
- On SSR (initial page load), server tries to run beforeLoad but auth is unavailable
- This causes errors and prevents proper SSR of protected routes

### Proposed Solution: Hybrid Approach

**Server-Side Authentication**:
- Server functions handle auth validation
- Session management with HTTP-only cookies
- Route guards work on both server and client (proper SSR)

**Client-Side Data Access** (unchanged):
- Firestore queries/mutations via Firebase Client SDK
- Storage uploads/downloads via Firebase Client SDK
- Real-time listeners and subscriptions
- Direct database access with security rules enforcement

**Benefits**:
- ✅ Proper SSR for protected routes (no flash before redirect)
- ✅ More secure (server validates auth, HTTP-only cookies)
- ✅ Works in `beforeLoad` on both server and client
- ✅ Maintains client-first architecture for data access
- ✅ Follows TanStack Start best practices

**Trade-offs**:
- ⚠️ More complex setup (server functions + client auth)
- ⚠️ Need Firebase Admin SDK on server
- ⚠️ Session management required

---

## Current State Analysis

### Completed Implementation (Phases 1-5)

**Phase 1: Setup & Infrastructure** ✅
- Firebase Client SDK installed
- Auth domain structure created
- TypeScript types defined

**Phase 2: Auth Provider & Router Context** ✅
- `AuthProvider` with `onAuthStateChanged`
- `useAuth` hook
- Root route waits for auth initialization
- RouterContext type defined

**Phase 3: Guest Event Participation** ✅
- Guest route with automatic anonymous sign-in
- `/guest/[projectId]` route created
- Anonymous auth flow working

**Phase 4: Admin Access Control** ✅
- Admin and workspace route guards
- `requireAdmin()` helper function
- Firestore security rules with admin checks
- **Issue**: Guards fail on SSR

**Phase 5: Admin Login & Access Request** ✅
- Login page with Google OAuth
- WaitingMessage component
- Mobile-first design
- **Issue**: Login flow works client-side only

**Phase 6: Manual Admin Privilege Grant** ⏸️ (Not started)
- Blocked by server-side auth requirement

**Phase 7: Polish & Testing** ⏸️ (Not started)
- Blocked by previous phases

### Files Created/Modified

**New Files**:
- `src/domains/auth/providers/AuthProvider.tsx`
- `src/domains/auth/hooks/use-auth.ts`
- `src/domains/auth/components/AuthGuard.tsx`
- `src/domains/auth/components/LoginPage.tsx`
- `src/domains/auth/components/WaitingMessage.tsx`
- `src/domains/auth/types/auth.types.ts`
- `src/domains/auth/index.ts`
- `src/routes/login/index.tsx`
- `src/routes/guest/$projectId.tsx`

**Modified Files**:
- `src/routes/__root.tsx` - Added AuthProvider, RouterContext type
- `src/routes/admin/route.tsx` - Added beforeLoad guard
- `src/routes/workspace/route.tsx` - Added beforeLoad guard
- `firebase/firestore.rules` - Added admin helper functions

---

## Required Changes for Server-Side Auth

### 1. Server Function Setup

**New Files to Create**:

```
apps/clementine-app/src/
├── server/
│   ├── auth/
│   │   ├── session.ts          # Session management
│   │   ├── auth.functions.ts   # Server functions for auth
│   │   └── firebase-admin.ts   # Firebase Admin SDK setup
│   └── index.ts                # Server exports
```

**Dependencies to Install**:
```bash
pnpm add firebase-admin vinxi
```

**Environment Variables**:
```env
# Server-side (add to apps/clementine-app/.env)
SESSION_SECRET=<generate-32-char-secret>
FIREBASE_ADMIN_PROJECT_ID=<your-project-id>
FIREBASE_ADMIN_CLIENT_EMAIL=<service-account-email>
FIREBASE_ADMIN_PRIVATE_KEY=<service-account-private-key>
```

### 2. Session Management

**Create**: `src/server/auth/session.ts`

```typescript
import { useSession } from '@tanstack/react-start/server'

export type SessionData = {
  userId?: string
  email?: string
  isAdmin?: boolean
  isAnonymous?: boolean
}

export function useAppSession() {
  return useSession<SessionData>({
    name: 'clementine-session',
    password: process.env.SESSION_SECRET!,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  })
}
```

### 3. Firebase Admin SDK Setup

**Create**: `src/server/auth/firebase-admin.ts`

```typescript
import * as admin from 'firebase-admin'

let adminApp: admin.app.App

export function getFirebaseAdmin() {
  if (!adminApp) {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
          /\\n/g,
          '\n',
        ),
      }),
    })
  }
  return adminApp
}

export const auth = () => getFirebaseAdmin().auth()
```

### 4. Server Functions for Auth

**Create**: `src/server/auth/auth.functions.ts`

```typescript
import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import { useAppSession } from './session'
import { auth } from './firebase-admin'

// Get current user from session
export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await useAppSession()
    const { userId, email, isAdmin, isAnonymous } = session.data

    if (!userId) {
      return null
    }

    return {
      userId,
      email,
      isAdmin: isAdmin || false,
      isAnonymous: isAnonymous || false,
    }
  },
)

// Verify Firebase ID token and create session
export const createSessionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { idToken: string }) => data)
  .handler(async ({ data }) => {
    try {
      // Verify ID token with Firebase Admin SDK
      const decodedToken = await auth().verifyIdToken(data.idToken)

      // Get custom claims
      const isAdmin = decodedToken.admin === true
      const isAnonymous = decodedToken.firebase.sign_in_provider === 'anonymous'

      // Create session
      const session = await useAppSession()
      await session.update({
        userId: decodedToken.uid,
        email: decodedToken.email,
        isAdmin,
        isAnonymous,
      })

      return { success: true }
    } catch (error) {
      console.error('Session creation failed:', error)
      return { success: false, error: 'Invalid token' }
    }
  })

// Sign out (clear session)
export const signOutFn = createServerFn({ method: 'POST' }).handler(
  async () => {
    const session = await useAppSession()
    await session.clear()
    throw redirect({ to: '/' })
  },
)

// Grant admin privileges (for grant-admin script)
export const grantAdminFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    try {
      const user = await auth().getUserByEmail(data.email)

      // Check if user is anonymous
      if (user.providerData.length === 0) {
        return { success: false, error: 'Cannot grant admin to anonymous users' }
      }

      // Set custom claims
      await auth().setCustomUserClaims(user.uid, { admin: true })

      return { success: true, uid: user.uid, email: user.email }
    } catch (error) {
      console.error('Grant admin failed:', error)
      return { success: false, error: 'User not found' }
    }
  })
```

### 5. Update Auth Provider (Bridge Client + Server)

**Modify**: `src/domains/auth/providers/AuthProvider.tsx`

```typescript
import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/integrations/firebase/client'
import { useServerFn } from '@tanstack/react-start'
import { createSessionFn } from '@/server/auth/auth.functions'
import type { AuthState } from '../types/auth.types'

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    isAnonymous: false,
    isLoading: true,
    idTokenResult: null,
  })

  const createSession = useServerFn(createSessionFn)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get ID token and create server session
        const idToken = await user.getIdToken()
        await createSession({ data: { idToken } })

        // Get token result for client-side state
        const idTokenResult = await user.getIdTokenResult()
        const isAdmin = idTokenResult.claims.admin === true

        setAuthState({
          user,
          isAdmin,
          isAnonymous: user.isAnonymous,
          isLoading: false,
          idTokenResult,
        })
      } else {
        setAuthState({
          user: null,
          isAdmin: false,
          isAnonymous: false,
          isLoading: false,
          idTokenResult: null,
        })
      }
    })

    return () => unsubscribe()
  }, [])

  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

### 6. Update Route Guards

**Modify**: `src/domains/auth/lib/guards.ts` (move from components/)

```typescript
import { redirect } from '@tanstack/react-router'
import { getCurrentUserFn } from '@/server/auth/auth.functions'

/**
 * Require admin user (works on both server and client)
 */
export async function requireAdmin() {
  const user = await getCurrentUserFn()

  if (!user || user.isAnonymous || !user.isAdmin) {
    throw redirect({ to: '/' })
  }

  return user
}

/**
 * Require authenticated non-anonymous user
 */
export async function requireAuth() {
  const user = await getCurrentUserFn()

  if (!user || user.isAnonymous) {
    throw redirect({ to: '/' })
  }

  return user
}

/**
 * Require any authenticated user (including anonymous)
 */
export async function requireUser() {
  const user = await getCurrentUserFn()

  if (!user) {
    throw redirect({ to: '/' })
  }

  return user
}
```

### 7. Update Route beforeLoad Hooks

**Modify**: `src/routes/admin/route.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '@/domains/auth/lib/guards'
import { Sidebar } from '@/domains/navigation'

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const user = await requireAdmin() // Works on server AND client!
    return { user }
  },
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar area="admin" />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
```

**Modify**: `src/routes/workspace/route.tsx` (similar pattern)

### 8. Update Login Flow

**Modify**: `src/domains/auth/components/LoginPage.tsx`

```typescript
// After successful Google sign-in
const handleGoogleSignIn = async () => {
  setIsSigningIn(true)
  try {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)

    // Get ID token and create server session
    const idToken = await result.user.getIdToken()
    await createSession({ data: { idToken } })

    // Router will handle redirect based on admin status
  } catch (err) {
    // Error handling
  } finally {
    setIsSigningIn(false)
  }
}
```

### 9. Update Router Context

**Modify**: `src/router.tsx`

```typescript
// No changes needed! Server functions handle auth validation
// Router context can remain focused on queryClient
```

**Modify**: `src/routes/__root.tsx`

```typescript
// Remove auth from RouterContext (no longer needed)
export interface MyRouterContext {
  queryClient: QueryClient
  // auth removed - server functions handle it
}

// RootLayout can still use useAuth for UI
function RootLayout() {
  const auth = useAuth()

  if (auth.isLoading) {
    return <div>Initializing authentication...</div>
  }

  return <Outlet />
}
```

---

## Impact on Existing Phases

### Phase 1-3: No Changes Required ✅
- Guest routes work as-is (anonymous auth flow unchanged)
- Client-side Firebase SDK continues to work
- No breaking changes

### Phase 4: Admin Access Control ⚠️ Major Changes
**Files to Modify**:
- `src/routes/admin/route.tsx` - Update beforeLoad to use server function
- `src/routes/workspace/route.tsx` - Update beforeLoad to use server function
- `src/domains/auth/components/AuthGuard.tsx` → Move to `src/domains/auth/lib/guards.ts`

**Changes**:
- Replace inline guard logic with server function calls
- Remove `MyRouterContext` dependency from guards
- Guards now work on both server and client

### Phase 5: Admin Login & Access Request ⚠️ Moderate Changes
**Files to Modify**:
- `src/domains/auth/providers/AuthProvider.tsx` - Add session creation
- `src/domains/auth/components/LoginPage.tsx` - Create session after sign-in
- `src/routes/login/index.tsx` - Update beforeLoad to use server function

**Changes**:
- After Google OAuth, create server session
- beforeLoad checks server session instead of client auth state

### Phase 6: Manual Admin Privilege Grant ⚠️ Major Changes
**Files to Create**:
- Server function for granting admin (already covered in auth.functions.ts)
- CLI script that calls server function

**Changes**:
- Instead of standalone script with Admin SDK, use server function
- Can be called from CLI or admin UI

### Phase 7: Polish & Testing ⚠️ Moderate Changes
**New Tests Required**:
- Server function tests (session management, auth validation)
- SSR route protection tests
- Session persistence tests

**Security Rules**:
- No changes (still enforce via request.auth.token.admin)

---

## Migration Implementation Plan

### Phase 3.5: Server-Side Auth Migration (New Phase)

**Goal**: Convert from client-side auth to server-side auth validation while maintaining all existing functionality.

#### Step 1: Setup Server Infrastructure (T101-T105)

- [ ] T101: Install dependencies (firebase-admin, vinxi session middleware)
- [ ] T102: Create server directory structure (`src/server/auth/`)
- [ ] T103: Set up Firebase Admin SDK initialization
- [ ] T104: Configure environment variables (SESSION_SECRET, Admin SDK credentials)
- [ ] T105: Create session management utilities

#### Step 2: Implement Server Functions (T106-T110)

- [ ] T106: Create `getCurrentUserFn` server function
- [ ] T107: Create `createSessionFn` server function (sync client auth to server session)
- [ ] T108: Create `signOutFn` server function
- [ ] T109: Create `grantAdminFn` server function (for Phase 6)
- [ ] T110: Export server functions from `src/server/index.ts`

#### Step 3: Bridge Client & Server Auth (T111-T114)

- [ ] T111: Update AuthProvider to create session on auth state change
- [ ] T112: Update LoginPage to create session after Google sign-in
- [ ] T113: Update WaitingMessage to use signOutFn
- [ ] T114: Test client-server auth sync (verify session created on login)

#### Step 4: Update Route Guards (T115-T119)

- [ ] T115: Move `AuthGuard.tsx` to `src/domains/auth/lib/guards.ts`
- [ ] T116: Rewrite guard functions to use server functions (async)
- [ ] T117: Update `admin/route.tsx` beforeLoad to use new guards
- [ ] T118: Update `workspace/route.tsx` beforeLoad to use new guards
- [ ] T119: Update `login/index.tsx` beforeLoad to use server function

#### Step 5: Clean Up Router Context (T120-T122)

- [ ] T120: Remove `auth` from MyRouterContext in `__root.tsx`
- [ ] T121: Update RootLayout to only use useAuth for UI (not context)
- [ ] T122: Remove auth context initialization from `router.tsx`

#### Step 6: Validation & Testing (T123-T128)

- [ ] T123: Test SSR: Hard refresh on `/admin` (should redirect on server)
- [ ] T124: Test client navigation: Click to `/admin` (should redirect on client)
- [ ] T125: Test session persistence: Refresh page, verify session maintained
- [ ] T126: Test sign-out: Verify session cleared and redirected
- [ ] T127: Test anonymous user: Verify can access `/guest/[projectId]` but not `/admin`
- [ ] T128: Run validation loop: `pnpm check && pnpm type-check`

#### Validation Criteria

**Server-Side Validation**:
- ✅ Protected routes block access on initial SSR (no flash)
- ✅ Session persists across page refreshes
- ✅ Server functions return correct user data
- ✅ HTTP-only session cookie set and validated

**Client-Side Validation**:
- ✅ Google OAuth sign-in creates server session
- ✅ `useAuth()` hook still works in components
- ✅ Client can still access Firestore/Storage (unchanged)
- ✅ Anonymous users can access guest routes

**Security Validation**:
- ✅ Session cookie is HTTP-only and secure (in production)
- ✅ Firebase Admin SDK validates tokens server-side
- ✅ Firestore/Storage rules still enforce permissions
- ✅ Admin custom claims validated on server

---

## Rollback Plan

If migration fails or causes issues:

1. **Revert Code Changes**:
   ```bash
   git checkout 002-auth-system  # Revert to pre-migration state
   ```

2. **Remove Server Dependencies**:
   ```bash
   pnpm remove firebase-admin
   ```

3. **Clear Sessions**:
   - Clear browser cookies
   - Clear session storage

4. **Fall Back to Client-Side Guards**:
   - Use component-level guards instead of beforeLoad
   - Accept SSR limitations for protected routes

---

## Success Criteria

**Phase 3.5 Complete When**:
- ✅ All existing functionality works (Phases 1-5)
- ✅ Server-side auth validation working in beforeLoad
- ✅ No "Auth not available in context" errors
- ✅ Proper SSR for protected routes (no flash before redirect)
- ✅ Session management working (persist across refreshes)
- ✅ Client-side Firestore/Storage access unchanged
- ✅ All validation tests pass
- ✅ Code quality checks pass (pnpm check && pnpm type-check)

**Ready to Proceed to Phase 6 When**:
- Server-side auth fully validated
- No regressions in existing features
- Documentation updated
- Team agrees implementation is stable

---

## Timeline Estimate

**Phase 3.5 Implementation**: 4-6 hours
- Setup: 1-2 hours
- Server functions: 2 hours
- Integration: 1-2 hours
- Testing: 1 hour

**Priority**: Complete before Phase 6 (Manual Admin Grant)

---

## Questions & Decisions

### Open Questions:
1. ✅ **Resolved**: Use server-side auth (hybrid approach)
2. ⏳ **Pending**: Where to store Firebase Admin SDK credentials? (Environment variables vs Secret manager)
3. ⏳ **Pending**: Session duration (currently 7 days - adjust?)
4. ⏳ **Pending**: Token refresh strategy (auto-refresh sessions?)

### Decisions Made:
- ✅ Use HTTP-only cookies for session management
- ✅ Keep Firestore/Storage client-side (no changes)
- ✅ Use TanStack Start server functions (not custom backend)
- ✅ Maintain Firebase Auth for user authentication (Google OAuth)

---

## References

- TanStack Start Auth Docs: https://tanstack.com/start/latest/docs/framework/react/guide/authentication
- TanStack Router Auth Guide: https://tanstack.com/router/v1/docs/framework/react/guide/authenticated-routes
- Firebase Admin SDK: https://firebase.google.com/docs/auth/admin
- Firebase Session Cookies: https://firebase.google.com/docs/auth/admin/manage-cookies

---

**Next Steps**:
1. Review this migration plan with team
2. Get approval to proceed with Phase 3.5
3. Implement changes following task breakdown
4. Validate thoroughly before proceeding to Phase 6
5. Update tasks.md with Phase 3.5 tasks once approved
