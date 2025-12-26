# Quickstart Guide: Firebase Authentication & Authorization System

**Feature**: 002-auth-system
**For**: Developers implementing or maintaining the auth system
**Created**: 2025-12-26

## Overview

This guide provides a quick reference for implementing and using the Firebase Authentication & Authorization system. For detailed information, refer to:
- **Research**: `research.md` - Implementation patterns and best practices
- **Data Model**: `data-model.md` - Auth entities and state management
- **API Contracts**: `contracts/auth-api.md` - Complete API reference

## Prerequisites

- Firebase project configured with Authentication enabled
- Google OAuth sign-in provider enabled in Firebase Console
- Firebase Admin SDK service account key (for admin grant script)
- TanStack Start application with TanStack Router

## Quick Setup (5 Steps)

### 1. Install Dependencies

```bash
cd apps/clementine-app

# Firebase client SDK (if not already installed)
pnpm add firebase

# Firebase Admin SDK (for server-side script)
pnpm add firebase-admin

# Zod for validation (already installed)
# TypeScript types (already installed)
```

### 2. Initialize Firebase Auth

Create `src/integrations/firebase/auth/AuthProvider.tsx`:

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getAuth, onIdTokenChanged, type User } from 'firebase/auth'
import type { AuthState, TypedIdTokenResult } from './auth.types'

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    isAnonymous: false,
    isLoading: true,
    idTokenResult: null,
  })

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onIdTokenChanged(auth, async (user: User | null) => {
      if (user) {
        const idTokenResult = (await user.getIdTokenResult()) as TypedIdTokenResult
        setAuthState({
          user,
          isAdmin: idTokenResult.claims.admin === true,
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
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

### 3. Set Up Router Context

Update `src/routes/__root.tsx`:

```typescript
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { AuthProvider, useAuth } from '@/integrations/firebase/auth'
import type { AuthState } from '@/integrations/firebase/auth/auth.types'

export interface RouterContext {
  auth: AuthState
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <AuthProvider>
      <RootLayout />
    </AuthProvider>
  )
}

function RootLayout() {
  const auth = useAuth()

  return (
    <RouterOutlet auth={auth}>
      <Outlet />
    </RouterOutlet>
  )
}
```

### 4. Create Admin Route Guard

Create `src/routes/admin/index.tsx`:

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'
import type { RouterContext } from '@/routes/__root'

export const Route = createFileRoute('/admin')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    const { auth } = context

    // Wait for auth to resolve
    if (auth.isLoading) {
      throw new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Redirect if not admin
    if (!auth.user || auth.isAnonymous || !auth.isAdmin) {
      throw redirect({
        to: '/login',
        search: { redirect: '/admin' },
      })
    }
  },
  component: AdminPage,
})

function AdminPage() {
  return <div>Admin Dashboard</div>
}
```

### 5. Create Guest Auto Sign-In

Create `src/routes/guest/$projectId/index.tsx`:

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { getAuth, signInAnonymously } from 'firebase/auth'

export const Route = createFileRoute('/guest/$projectId')({
  beforeLoad: async ({ context }) => {
    const { auth: authState } = context

    // Wait for auth to resolve
    if (authState.isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // If unauthenticated, sign in anonymously
    if (!authState.user) {
      const auth = getAuth()
      await signInAnonymously(auth)
    }
  },
  component: GuestPage,
})

function GuestPage() {
  const { projectId } = Route.useParams()
  return <div>Guest Experience: {projectId}</div>
}
```

## Common Tasks

### Grant Admin Privileges

```bash
# Create script: scripts/grant-admin.ts
node scripts/grant-admin.ts user@example.com
```

**Script Implementation**:
```typescript
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { z } from 'zod'

const app = initializeApp({
  credential: cert('./service-account-key.json'),
})

const auth = getAuth(app)

const GrantAdminSchema = z.object({
  email: z.string().email(),
})

async function grantAdmin(email: string) {
  const { email: validatedEmail } = GrantAdminSchema.parse({ email })
  const user = await auth.getUserByEmail(validatedEmail)

  if (user.providerData.length === 0) {
    throw new Error('Cannot grant admin to anonymous users')
  }

  await auth.setCustomUserClaims(user.uid, { admin: true })
  console.log(`✅ Admin privileges granted to ${email}`)
}

const email = process.argv[2]
if (!email) {
  console.error('Usage: node scripts/grant-admin.ts <email>')
  process.exit(1)
}

grantAdmin(email).catch(console.error)
```

### Check Admin Status

```typescript
import { useAuth } from '@/integrations/firebase/auth'

function MyComponent() {
  const { isAdmin, isLoading } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (!isAdmin) return <div>Access Denied</div>

  return <div>Admin Content</div>
}
```

### Force Token Refresh (After Admin Grant)

```typescript
import { getAuth } from 'firebase/auth'

async function refreshToken() {
  const auth = getAuth()
  const user = auth.currentUser

  if (user) {
    // Force refresh to get new custom claims
    const idTokenResult = await user.getIdTokenResult(true)
    console.log('Admin:', idTokenResult.claims.admin)
  }
}
```

### Sign Out

```typescript
import { getAuth, signOut } from 'firebase/auth'

async function handleSignOut() {
  const auth = getAuth()
  await signOut(auth)
  // Redirect to login (app logic)
}
```

## Firestore Security Rules

Add to `firestore.rules`:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: Check admin claim
    function isAdmin() {
      return request.auth != null
        && request.auth.token.admin == true;
    }

    // Helper: Check authenticated (not anonymous)
    function isAuthenticated() {
      return request.auth != null
        && request.auth.token.firebase.sign_in_provider != 'anonymous';
    }

    // Admin-only collection
    match /workspaces/{workspaceId} {
      allow read, write: if isAdmin();
    }

    // Guest-accessible collection
    match /events/{eventId} {
      allow read: if request.auth != null; // Anonymous OK
      allow write: if isAdmin();
    }
  }
}
```

Deploy rules:

```bash
firebase deploy --only firestore:rules
```

## Testing

### Unit Test Auth Hooks

```typescript
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '@/integrations/firebase/auth'

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onIdTokenChanged: vi.fn((auth, callback) => {
    // Simulate admin user
    callback({
      uid: 'user-123',
      isAnonymous: false,
      getIdTokenResult: async () => ({
        claims: { admin: true },
      }),
    })
    return () => {} // Unsubscribe
  }),
}))

describe('useAuth', () => {
  it('should detect admin user', async () => {
    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })
  })
})
```

### Test Route Guards

```typescript
import { describe, it, expect } from 'vitest'
import { redirect } from '@tanstack/react-router'

describe('Admin Route Guard', () => {
  it('should redirect non-admin users', () => {
    const context = {
      auth: {
        user: { uid: 'user-123' },
        isAdmin: false,
        isAnonymous: false,
        isLoading: false,
      },
    }

    expect(() => Route.beforeLoad({ context })).toThrow(redirect)
  })

  it('should allow admin users', () => {
    const context = {
      auth: {
        user: { uid: 'admin-123' },
        isAdmin: true,
        isAnonymous: false,
        isLoading: false,
      },
    }

    expect(() => Route.beforeLoad({ context })).not.toThrow()
  })
})
```

## Performance Checklist

- [ ] Auth state persisted in IndexedDB (default Firebase behavior)
- [ ] `onIdTokenChanged` used instead of `onAuthStateChanged` (detects custom claims changes)
- [ ] Route guards wait for `isLoading === false` before running
- [ ] Anonymous sign-in completes in <2s (spec SC-001)
- [ ] Token refresh happens automatically (1 hour expiry)
- [ ] Automatic anonymous user cleanup enabled in Firebase Console

## Security Checklist

- [ ] Admin grant script runs server-side only (never exposed to client)
- [ ] Firestore rules check `request.auth.token.admin == true` for admin operations
- [ ] Storage rules check `request.auth.token.admin == true` for admin uploads
- [ ] Client-side auth checks are UX only (route guards prevent content flash)
- [ ] Anonymous users cannot receive admin claims (validated in admin grant script)
- [ ] Custom claims validated on both client (UX) and server (security)

## Troubleshooting

### Issue: Route guards run before auth resolves

**Solution**: Check that `beforeLoad` waits for `auth.isLoading === false`:

```typescript
if (auth.isLoading) {
  throw new Promise((resolve) => setTimeout(resolve, 100))
}
```

### Issue: Admin user redirected to /login after admin grant

**Solution**: User must re-authenticate to receive new token:

```typescript
// Option 1: Sign out and back in
await signOut(auth)
// User manually signs in again

// Option 2: Force token refresh
const idTokenResult = await user.getIdTokenResult(true)
```

### Issue: Anonymous users keep getting created

**Solution**: Enable Firebase Auth persistence (default behavior):

```typescript
// This is the default - no code needed
// Tokens stored in IndexedDB/localStorage
```

### Issue: Security rules not blocking non-admin users

**Solution**: Verify custom claims check in rules:

```javascript
function isAdmin() {
  return request.auth != null
    && request.auth.token.admin == true; // Must check === true
}
```

### Issue: Performance is slow on guest routes

**Solution**: Check anonymous sign-in performance:

```typescript
const start = Date.now()
await signInAnonymously(auth)
const duration = Date.now() - start
console.log('Anonymous sign-in duration:', duration, 'ms') // Should be <2s
```

## Next Steps

1. **Implement Login Page**: Create `/login` route with Google OAuth button
2. **Add Waiting Message**: Show message for non-admin authenticated users
3. **Deploy Security Rules**: Update Firestore/Storage rules with admin checks
4. **Test on Mobile**: Verify mobile-first design (320px-768px viewports)
5. **Run Validation Loop**: `pnpm check` → `pnpm type-check` → `pnpm test`

## Resources

- **Research**: `research.md` - Detailed implementation patterns
- **Data Model**: `data-model.md` - Auth entities and state
- **API Contracts**: `contracts/auth-api.md` - Complete API reference
- **Firebase Auth Docs**: https://firebase.google.com/docs/auth
- **TanStack Router Docs**: https://tanstack.com/router
- **Custom Claims Docs**: https://firebase.google.com/docs/auth/admin/custom-claims

---

**Questions?** Review the detailed documentation files or check existing code patterns in the codebase.
