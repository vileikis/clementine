# Authentication & Authorization API Contracts

**Feature**: 002-auth-system
**Created**: 2025-12-26
**Status**: Design Phase

## Overview

This document defines the API contracts for the Firebase Authentication & Authorization system. Since this feature uses Firebase client SDK for most operations, the "API" is primarily client-side function calls rather than HTTP endpoints. The only server-side API is the admin grant script.

## Client-Side API Contracts (Firebase Auth SDK)

### 1. Sign In Anonymously

**Function**: `signInAnonymously(auth)`

**Description**: Automatically signs in a user anonymously for guest experiences.

**When to Call**: On `/guest/[projectId]` route when user is unauthenticated

**Request**:
```typescript
import { getAuth, signInAnonymously } from 'firebase/auth'

const auth = getAuth()
const userCredential = await signInAnonymously(auth)
```

**Response**:
```typescript
{
  user: {
    uid: string              // Auto-generated unique ID
    isAnonymous: boolean     // Always true
    email: null             // Always null for anonymous
    displayName: null       // Always null for anonymous
    photoURL: null          // Always null for anonymous
    providerId: "firebase"  // Always "firebase"
  },
  providerId: "anonymous",
  operationType: "signIn"
}
```

**Error Responses**:
- `auth/operation-not-allowed`: Anonymous auth not enabled in Firebase Console
- `auth/network-request-failed`: Network connectivity issue
- `auth/too-many-requests`: Rate limit exceeded (App Check recommended)

**Performance**: <500ms typical, <2s maximum (per spec SC-001)

---

### 2. Sign In with Google OAuth

**Function**: `signInWithPopup(auth, GoogleAuthProvider)`

**Description**: Signs in a user with Google OAuth for admin access.

**When to Call**: On `/login` page when user clicks "Sign in with Google"

**Request**:
```typescript
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'

const auth = getAuth()
const provider = new GoogleAuthProvider()
const userCredential = await signInWithPopup(auth, provider)
```

**Response**:
```typescript
{
  user: {
    uid: string                    // Unique user ID (persistent)
    isAnonymous: false            // Always false for OAuth
    email: string                 // Google account email
    displayName: string | null    // Google account name
    photoURL: string | null       // Google profile photo
    providerId: "google.com"      // Always "google.com"
  },
  providerId: "google.com",
  operationType: "signIn",
  _tokenResponse: {
    idToken: string,              // JWT token with claims
    refreshToken: string,         // For token refresh
    expiresIn: string            // Token expiry (default: "3600")
  }
}
```

**Error Responses**:
- `auth/popup-closed-by-user`: User closed OAuth popup
- `auth/popup-blocked`: Browser blocked popup
- `auth/cancelled-popup-request`: Multiple popups opened
- `auth/network-request-failed`: Network connectivity issue
- `auth/account-exists-with-different-credential`: Email already used with different provider

**Performance**: Variable (depends on user interaction), typically 2-10s

---

### 3. Get ID Token Result (with Custom Claims)

**Function**: `getIdTokenResult(user, forceRefresh?)`

**Description**: Retrieves the ID token with custom claims for authorization checks.

**When to Call**:
- On auth state change to check admin status
- After admin grant to force token refresh
- Before accessing admin routes

**Request**:
```typescript
import { getAuth } from 'firebase/auth'

const auth = getAuth()
const user = auth.currentUser

if (user) {
  const idTokenResult = await user.getIdTokenResult(false) // forceRefresh = false
}
```

**Response**:
```typescript
{
  token: string,                    // JWT token
  expirationTime: string,          // ISO 8601 timestamp
  authTime: string,                // ISO 8601 timestamp
  issuedAtTime: string,            // ISO 8601 timestamp
  signInProvider: string,          // "google.com" | "anonymous"
  signInSecondFactor: string | null,
  claims: {
    // Standard claims
    iss: string,                   // Issuer
    aud: string,                   // Audience (Firebase project ID)
    auth_time: number,             // Unix timestamp
    user_id: string,               // Same as uid
    sub: string,                   // Same as uid
    iat: number,                   // Issued at (Unix timestamp)
    exp: number,                   // Expiry (Unix timestamp)
    email?: string,                // Email (if OAuth)
    email_verified?: boolean,      // Email verification status
    firebase: {
      identities: object,
      sign_in_provider: string,
    },

    // Custom claims
    admin?: boolean                // Admin status (only if granted)
  }
}
```

**Force Refresh** (after admin grant):
```typescript
const idTokenResult = await user.getIdTokenResult(true) // forceRefresh = true
```

**Error Responses**:
- `auth/user-token-expired`: Token expired (automatically refreshed)
- `auth/network-request-failed`: Network connectivity issue

**Performance**:
- Cached: <10ms
- Force refresh: <500ms

**Validation**:
```typescript
const isAdmin = idTokenResult.claims.admin === true
// Do NOT check for undefined - only check for true
```

---

### 4. Sign Out

**Function**: `signOut(auth)`

**Description**: Signs out the current user (anonymous or authenticated).

**When to Call**:
- User clicks logout button (admin users)
- Force re-authentication after admin grant

**Request**:
```typescript
import { getAuth, signOut } from 'firebase/auth'

const auth = getAuth()
await signOut(auth)
```

**Response**:
```typescript
// Returns void (Promise<void>)
```

**Side Effects**:
- Clears auth state from IndexedDB/localStorage
- Triggers `onAuthStateChanged` listeners with `user = null`
- Redirects to login page (application logic, not Firebase)

**Error Responses**:
- `auth/network-request-failed`: Network connectivity issue (rare)

**Performance**: <100ms

---

### 5. Auth State Observer

**Function**: `onAuthStateChanged(auth, callback)`

**Description**: Listens for auth state changes (sign in, sign out, token refresh).

**When to Call**: On application initialization (in AuthProvider)

**Request**:
```typescript
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const auth = getAuth()

const unsubscribe = onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is signed in (anonymous or authenticated)
    const idTokenResult = await user.getIdTokenResult()
    const isAdmin = idTokenResult.claims.admin === true

    // Update auth state
    setAuthState({
      user,
      isAdmin,
      isAnonymous: user.isAnonymous,
      isLoading: false,
      idTokenResult,
    })
  } else {
    // User is signed out
    setAuthState({
      user: null,
      isAdmin: false,
      isAnonymous: false,
      isLoading: false,
      idTokenResult: null,
    })
  }
})

// Cleanup on unmount
return () => unsubscribe()
```

**Callback Events**:
- Initial load: Fires once with current auth state
- Sign in: Fires when user signs in (anonymous or OAuth)
- Sign out: Fires when user signs out
- Token refresh: Fires when token refreshes (every ~1 hour)

**Performance**:
- Initial load: <500ms (reads from IndexedDB)
- Subsequent events: <10ms

**Best Practice**: Use `onIdTokenChanged` instead of `onAuthStateChanged` if you need to react to custom claims changes.

---

## Server-Side API Contracts (Admin Grant Script)

### 6. Grant Admin Privileges

**Script**: `node scripts/grant-admin.ts <email>`

**Description**: Server-side script to grant admin privileges to a user by email.

**When to Call**: Manually by super-admin when a new admin needs access

**Request** (Command Line):
```bash
node scripts/grant-admin.ts user@example.com
```

**Request** (Programmatic):
```typescript
import { grantAdminPrivileges } from './scripts/grant-admin'

const result = await grantAdminPrivileges('user@example.com')
```

**Input Validation** (Zod Schema):
```typescript
const GrantAdminSchema = z.object({
  email: z.string().email('Invalid email format'),
})
```

**Response** (Success):
```typescript
{
  success: true,
  uid: "abc123xyz",
  email: "user@example.com",
  message: "Admin privileges granted successfully. User must re-authenticate to receive updated claims."
}
```

**Response** (Error - User Not Found):
```typescript
{
  success: false,
  email: "user@example.com",
  message: "User not found. Please ensure the user has signed in at least once."
}
```

**Response** (Error - Anonymous User):
```typescript
{
  success: false,
  uid: "abc123xyz",
  email: "user@example.com",
  message: "Cannot grant admin privileges to anonymous users. Please ensure the user has signed in with Google OAuth."
}
```

**Response** (Error - Invalid Email):
```typescript
{
  success: false,
  email: "invalid-email",
  message: "Invalid email format."
}
```

**Implementation**:
```typescript
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { z } from 'zod'

// Initialize Firebase Admin SDK
const app = initializeApp({
  credential: cert('./service-account-key.json'),
})

const auth = getAuth(app)

// Input validation
const GrantAdminSchema = z.object({
  email: z.string().email('Invalid email format'),
})

export async function grantAdminPrivileges(email: string) {
  try {
    // Validate input
    const { email: validatedEmail } = GrantAdminSchema.parse({ email })

    // Look up user by email
    const user = await auth.getUserByEmail(validatedEmail)

    // Prevent granting admin to anonymous users
    if (user.providerData.length === 0) {
      return {
        success: false,
        uid: user.uid,
        email: validatedEmail,
        message: 'Cannot grant admin privileges to anonymous users.',
      }
    }

    // Set custom claim
    await auth.setCustomUserClaims(user.uid, { admin: true })

    return {
      success: true,
      uid: user.uid,
      email: validatedEmail,
      message: 'Admin privileges granted successfully. User must re-authenticate to receive updated claims.',
    }
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return {
        success: false,
        email,
        message: 'User not found. Please ensure the user has signed in at least once.',
      }
    }

    throw error
  }
}
```

**Performance**: <500ms (Firebase Admin SDK API call)

**Security**:
- MUST run server-side only (never expose Admin SDK to client)
- MUST validate email format
- MUST check for anonymous users
- MUST check if user exists

**Rate Limits**:
- Firebase Admin SDK: 100,000 requests/day (free tier)
- Custom claims updates: No specific limit, but recommend <100/day

---

## Route Guard API Contracts (TanStack Router)

### 7. Admin Route Guard

**Function**: `beforeLoad` hook in TanStack Router

**Description**: Validates admin access before allowing route navigation.

**When to Call**: Automatically by TanStack Router on route navigation

**Request** (Route Definition):
```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'
import type { RouterContext } from '@/routes/__root'

export const Route = createFileRoute('/admin')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    const { auth } = context

    // Auth is guaranteed to be ready (root layout waits for isLoading === false)
    // No need to check isLoading or use timeouts

    // Check authentication
    if (!auth.user) {
      throw redirect({
        to: '/login',
        search: { redirect: '/admin' },
      })
    }

    // Check anonymous
    if (auth.isAnonymous) {
      throw redirect({
        to: '/login',
        search: { redirect: '/admin' },
      })
    }

    // Check admin claim
    if (!auth.isAdmin) {
      throw redirect({
        to: '/login',
        search: { redirect: '/admin' },
      })
    }

    // Allow access
    return
  },
})
```

**Response** (Allowed):
- Route renders normally
- No redirect occurs

**Response** (Denied - Unauthenticated):
```typescript
redirect({
  to: '/login',
  search: { redirect: '/admin' },
})
```

**Response** (Denied - Anonymous):
```typescript
redirect({
  to: '/login',
  search: { redirect: '/admin' },
})
```

**Response** (Denied - Non-Admin):
```typescript
redirect({
  to: '/login',
  search: { redirect: '/admin' },
})
```

**Performance**: <10ms (synchronous checks, auth state already loaded)

**Best Practice**: Use layout routes to protect multiple routes with single guard.

---

### 8. Guest Route Auto Sign-In

**Function**: `beforeLoad` hook in TanStack Router

**Description**: Automatically signs in anonymous users on guest routes.

**When to Call**: Automatically by TanStack Router on `/guest/[projectId]` navigation

**Request** (Route Definition):
```typescript
import { createFileRoute } from '@tanstack/react-router'
import { getAuth, signInAnonymously } from 'firebase/auth'
import type { RouterContext } from '@/routes/__root'

export const Route = createFileRoute('/guest/$projectId')({
  beforeLoad: async ({ context }: { context: RouterContext }) => {
    const { auth: authState } = context

    // Auth is guaranteed to be ready (root layout waits for isLoading === false)
    // No need to check isLoading or use timeouts

    // If already authenticated (anonymous or OAuth), continue
    if (authState.user) {
      return
    }

    // If unauthenticated, sign in anonymously
    const auth = getAuth()
    await signInAnonymously(auth)

    // Auth state will be updated by onAuthStateChanged listener
    return
  },
})
```

**Response** (Already Authenticated):
- No action taken
- Route renders normally

**Response** (Unauthenticated):
- `signInAnonymously()` called
- User created with anonymous credentials
- Route renders after auth completes

**Performance**: <2s (per spec SC-001)

**Error Handling**:
- If `signInAnonymously()` fails, show error message
- Do not block user from viewing route (graceful degradation)

---

## TypeScript Type Definitions

### Auth API Types

Location: `src/domains/auth/types/auth.types.ts`

```typescript
import type { User, IdTokenResult, UserCredential } from 'firebase/auth'

/**
 * Custom claims in ID token
 */
export interface CustomClaims {
  admin?: boolean
}

/**
 * Typed ID token result
 */
export interface TypedIdTokenResult extends IdTokenResult {
  claims: IdTokenResult['claims'] & CustomClaims
}

/**
 * Auth state provided via router context
 */
export interface AuthState {
  user: User | null
  isAdmin: boolean
  isAnonymous: boolean
  isLoading: boolean
  idTokenResult: TypedIdTokenResult | null
}

/**
 * Router context with auth
 */
export interface RouterContext {
  auth: AuthState
}

/**
 * Admin grant script input
 */
export interface GrantAdminInput {
  email: string
}

/**
 * Admin grant script result
 */
export interface GrantAdminResult {
  success: boolean
  uid?: string
  email: string
  message: string
}
```

**Import paths:**
```typescript
// In application code
import type { AuthState, CustomClaims } from '@/domains/auth'

// In routes
import type { RouterContext } from '@/routes/__root'

// In grant-admin script
import type { GrantAdminInput, GrantAdminResult } from './grant-admin'
```

---

## Security Considerations

### 1. Client-Side Security (UX Only)

- Route guards are **UX only** - they prevent content flash, NOT unauthorized access
- All security MUST be enforced via Firestore/Storage security rules
- Never trust client-side auth checks for security decisions

### 2. Server-Side Security (Mandatory)

- Firestore/Storage rules MUST check `request.auth.token.admin == true`
- Cloud Functions MUST validate ID token and check custom claims
- Admin SDK operations MUST run server-side only

### 3. Custom Claims Security

- Custom claims can ONLY be set server-side via Admin SDK
- Client cannot modify custom claims
- Token refresh required for immediate claims propagation

### 4. Anonymous User Security

- Anonymous users MUST NEVER receive admin claims
- Admin grant script MUST validate user is not anonymous
- Firestore rules MUST distinguish between anonymous and authenticated users

---

## Testing Contracts

### Unit Testing

```typescript
import { describe, it, expect, vi } from 'vitest'
import { signInAnonymously, signInWithPopup } from 'firebase/auth'

vi.mock('firebase/auth', () => ({
  signInAnonymously: vi.fn(),
  signInWithPopup: vi.fn(),
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(),
}))

describe('Auth API', () => {
  it('should sign in anonymously', async () => {
    const mockUserCredential = {
      user: {
        uid: 'anonymous-123',
        isAnonymous: true,
        email: null,
      },
    }

    vi.mocked(signInAnonymously).mockResolvedValue(mockUserCredential)

    const result = await signInAnonymously(mockAuth)
    expect(result.user.isAnonymous).toBe(true)
  })

  it('should sign in with Google OAuth', async () => {
    const mockUserCredential = {
      user: {
        uid: 'user-123',
        isAnonymous: false,
        email: 'user@example.com',
      },
    }

    vi.mocked(signInWithPopup).mockResolvedValue(mockUserCredential)

    const result = await signInWithPopup(mockAuth, mockProvider)
    expect(result.user.email).toBe('user@example.com')
  })
})
```

---

## References

- Firebase Auth API Reference: https://firebase.google.com/docs/reference/js/auth
- TanStack Router beforeLoad: https://tanstack.com/router/latest/docs/framework/react/guide/route-trees#the-beforeload-option
- Custom Claims API: https://firebase.google.com/docs/auth/admin/custom-claims
- Admin SDK API: https://firebase.google.com/docs/reference/admin/node/firebase-admin.auth
