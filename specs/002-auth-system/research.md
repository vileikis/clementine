# Research: Firebase Authentication & Authorization System

**Feature**: 002-auth-system | **Date**: 2025-12-26
**Purpose**: Research technical decisions and patterns for Firebase Authentication integration with TanStack Start

## Overview

This document captures research findings for implementing a secure authentication and authorization system using Firebase Authentication, custom claims, and TanStack Router. The system separates guest (anonymous) and admin (authenticated) experiences with proper security boundaries.

## Research Areas

### 1. Firebase Auth + TanStack Start Integration

**Decision**: Initialize Firebase Auth in the root component and pass auth state through TanStack Router context

**Rationale**:
- TanStack Router cannot use React hooks in `beforeLoad`, requiring auth state to be passed via router context
- Firebase Auth requires client-side initialization with proper SDK configuration
- TanStack Start's official documentation lists Firebase Auth as a supported authentication service
- Router context provides type-safe dependency injection throughout the route tree
- This pattern allows route guards to access auth state without prop drilling

**Implementation Pattern**:
```typescript
// src/routes/__root.tsx
import { createRootRouteWithContext } from '@tanstack/react-router'

interface RouterContext {
  auth: {
    user: User | null
    loading: boolean
    isAdmin: boolean
  }
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

// src/main.tsx
import { RouterProvider } from '@tanstack/react-router'
import { useAuth } from './lib/auth'

function InnerApp() {
  const auth = useAuth()

  return (
    <RouterProvider
      router={router}
      context={{ auth }}
    />
  )
}

function App() {
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  )
}
```

**Auth State Persistence**:
- Firebase introduced `FirebaseServerApp` for SSR environments to bridge auth sessions between CSR and SSR
- For TanStack Start, auth state can be transmitted via service worker intercepting fetch requests and appending tokens to headers
- Firebase Auth defaults to `LOCAL` persistence mode (localStorage/IndexedDB), which persists sessions across browser restarts
- Alternative persistence modes: `SESSION` (tab-scoped) and `NONE` (no persistence)

**Key Considerations**:
- Firebase Auth state is asynchronous - must handle loading state before rendering protected routes
- ID tokens automatically refresh after 1 hour
- Auth context must be initialized before router to prevent race conditions

**Alternatives Considered**:
- **Component-level hooks**: Rejected - Cannot be used in `beforeLoad` route guards
- **Global state management (Zustand)**: Rejected - Router context is more appropriate for routing concerns
- **Manual session cookies**: Rejected - Firebase SDK handles token management automatically

**References**:
- [TanStack Router Context Documentation](https://tanstack.com/router/v1/docs/framework/react/guide/router-context)
- [TanStack Start Authentication Overview](https://tanstack.com/start/latest/docs/framework/react/guide/authentication)
- [Firebase SSR with FirebaseServerApp](https://firebase.blog/posts/2024/05/firebase-serverapp-ssr/)
- [Use Firebase in SSR Apps](https://firebase.google.com/docs/web/ssr-apps)

---

### 2. Anonymous Authentication Best Practices

**Decision**: Implement automatic anonymous sign-in on guest route access with Firebase automatic cleanup enabled

**Rationale**:
- Firebase anonymous auth provides unique identifiers for guest users without requiring credentials
- Automatic cleanup (deletes anonymous accounts older than 30 days) prevents database bloat and reduces costs
- With automatic cleanup enabled, anonymous authentication does not count toward usage limits or billing quotas
- Firebase automatically limits anonymous sign-ups from the same IP to prevent abuse
- App Check can be added to ensure only genuine app requests create anonymous sessions

**Implementation Pattern**:
```typescript
// lib/auth/useAuthProvider.ts
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'

async function ensureGuestAuth() {
  const auth = getAuth()

  if (!auth.currentUser) {
    // Automatically sign in anonymously
    await signInAnonymously(auth)
  }
}

// Route guard for guest routes
export const Route = createFileRoute('/guest/$projectId')({
  beforeLoad: async ({ context }) => {
    if (!context.auth.user) {
      // Trigger anonymous sign-in
      await ensureGuestAuth()
    }
  },
})
```

**Preventing Multiple Anonymous Users**:
- Firebase Auth automatically reuses anonymous sessions stored in localStorage/IndexedDB
- Device fingerprinting is NOT recommended (privacy concerns and unreliable)
- IP-based rate limiting is built-in to Firebase Auth
- For additional protection, implement App Check (attestation for iOS, Android, web)

**Anonymous to Authenticated Upgrade**:
- Anonymous users can be upgraded to permanent accounts using `linkWithCredential()`
- The UID remains the same after linking, preserving all user data
- This pattern is out of scope for this feature but documented for future reference

```typescript
import { linkWithCredential, GoogleAuthProvider } from 'firebase/auth'

// Link Google credentials to anonymous account
const credential = GoogleAuthProvider.credential(idToken)
await linkWithCredential(auth.currentUser, credential)
// User keeps same UID, all data preserved
```

**Performance & Scalability**:
- Firebase Authentication supports approximately 1 million concurrent connections
- Anonymous auth scales to millions of users with proper configuration
- With automatic cleanup enabled, performance impact is minimal
- Anonymous users older than 30 days are automatically deleted (requires Identity Platform upgrade)

**Security Measures**:
- Use Firestore security rules to restrict anonymous user capabilities (prevent upvoting, publishing to public feeds, etc.)
- Encourage anonymous users to upgrade for full features
- Implement App Check to prevent malicious token generation via REST API

**Alternatives Considered**:
- **Manual guest sessions via custom tokens**: Rejected - Firebase anonymous auth is purpose-built for this use case
- **Require email for all users**: Rejected - Creates friction for guest experience
- **Session cookies without Firebase Auth**: Rejected - Loses Firebase ecosystem benefits

**References**:
- [Best Practices for Anonymous Authentication](https://firebase.blog/posts/2023/07/best-practices-for-anonymous-authentication)
- [Firebase Anonymous Auth Documentation](https://firebase.google.com/docs/auth/web/anonymous-auth)
- [Firebase Scalability: Millions of Users](https://medium.com/@sehban.alam/can-firebase-really-handle-millions-of-users-heres-the-truth-and-how-to-maximize-its-potential-6876c78cd4b6)

---

### 3. Custom Claims Implementation

**Decision**: Use Firebase Admin SDK to set custom claims server-side, validate via ID token on client and in security rules

**Rationale**:
- Custom claims are the recommended Firebase pattern for role-based access control (RBAC)
- Claims are stored in the ID token (JWT), making them available to client, server, and security rules
- Claims are cryptographically signed and cannot be tampered with by clients
- Setting claims requires privileged Admin SDK access, preventing client-side privilege escalation
- Claims propagate to all Firebase services (Firestore, Storage, Cloud Functions) automatically

**Setting Custom Claims (Server-Side)**:
```typescript
// functions/src/admin/grantAdmin.ts
import { getAuth } from 'firebase-admin/auth'

export async function grantAdminAccess(email: string) {
  try {
    const user = await getAuth().getUserByEmail(email)

    // Set custom claim
    await getAuth().setCustomUserClaims(user.uid, {
      admin: true
    })

    console.log(`Admin access granted to ${email}`)
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      throw new Error(`User with email ${email} does not exist`)
    }
    throw error
  }
}
```

**Retrieving Custom Claims (Client-Side)**:
```typescript
// lib/auth/useAuthProvider.ts
import { getAuth, onIdTokenChanged } from 'firebase/auth'

onIdTokenChanged(auth, async (user) => {
  if (user) {
    const idTokenResult = await user.getIdTokenResult()
    const isAdmin = idTokenResult.claims.admin === true

    setAuthState({
      user,
      loading: false,
      isAdmin
    })
  }
})
```

**Force Token Refresh After Claims Change**:
```typescript
// Force refresh to get updated claims
const user = auth.currentUser
if (user) {
  await user.getIdToken(true) // true = force refresh

  // Now get updated claims
  const idTokenResult = await user.getIdTokenResult()
  const isAdmin = idTokenResult.claims.admin === true
}
```

**Pattern for Immediate Claims Propagation**:
```typescript
// Cloud Function after setting custom claim
await admin.firestore().collection('userMetadata').doc(uid).set({
  refreshTime: new Date().toISOString()
})

// Client listens to metadata changes
onSnapshot(doc(db, 'userMetadata', uid), async (snapshot) => {
  if (snapshot.exists()) {
    // Force token refresh when metadata changes
    await auth.currentUser.getIdToken(true)
  }
})
```

**Key Constraints**:
- Maximum claim payload size: 1000 bytes
- Supported types: strings, numbers, booleans, arrays, objects, null
- Claims must be JSON-serializable
- Claims only update on token refresh (automatic after 1 hour or manual force refresh)

**Security Invariants**:
- NEVER set custom claims from client-side code
- ALWAYS validate claims server-side and in security rules
- Client checks are UX only, not security enforcement
- Anonymous users MUST NEVER receive admin claims

**Alternatives Considered**:
- **Firestore user roles collection**: Rejected - Requires additional database query, no security rule integration
- **Custom JWT implementation**: Rejected - Reinventing Firebase's proven solution
- **Role checking in every function**: Rejected - Custom claims integrate with security rules automatically

**References**:
- [Control Access with Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Configure Custom Claims](https://cloud.google.com/identity-platform/docs/how-to-configure-custom-claims)
- [Tutorial: Advanced Firebase Auth with Custom Claims](https://fireship.io/lessons/firebase-custom-claims-role-based-auth/)
- [Supercharged Custom Claims with Firestore and Cloud Functions](https://medium.com/firebase-developers/patterns-for-security-with-firebase-supercharged-custom-claims-with-firestore-and-cloud-functions-bb8f46b24e11)

---

### 4. TanStack Router Route Guards

**Decision**: Use TanStack Router's `beforeLoad` hook with router context for authentication guards

**Rationale**:
- `beforeLoad` runs before components render, preventing flash of protected content
- Can throw `redirect()` to redirect users before route loads
- Has access to router context (where we pass auth state)
- Supports async operations (checking auth state, fetching data)
- Hierarchical guards via layout routes (protect multiple routes with one guard)

**Basic Route Guard Pattern**:
```typescript
// src/routes/_authenticated.tsx (layout route)
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    const { auth } = context

    // Wait for auth to initialize
    if (auth.loading) {
      // This should be prevented by global loading state
      // but added as defensive check
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }

    // Check if user is authenticated
    if (!auth.user) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }

    // Check if user has admin claim
    if (!auth.isAdmin) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
  },
})
```

**Protecting Multiple Routes**:
```typescript
// File structure creates protected route tree
// src/routes/
//   _authenticated.tsx          <- Guard here
//     admin/
//       index.tsx               <- Protected
//       workspaces.tsx          <- Protected
//     workspace/
//       $workspaceId/
//         projects.tsx          <- Protected
```

**Handling Auth Loading State**:
```typescript
// src/routes/__root.tsx
export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => {
    const { auth } = Route.useRouteContext()

    // Show loading spinner while auth initializes
    if (auth.loading) {
      return <div>Loading...</div>
    }

    return <Outlet />
  },
})
```

**Preserving Destination URL After Login**:
```typescript
// Guard saves current location
throw redirect({
  to: '/login',
  search: {
    redirect: location.href, // Full path including search params
  },
})

// Login page validates redirect param
export const Route = createFileRoute('/login')({
  validateSearch: z.object({
    redirect: z.string().optional().catch('/admin'),
  }),
})

// After successful login, redirect to original destination
const navigate = useNavigate()
const search = Route.useSearch()

navigate({ to: search.redirect })
```

**Anonymous User Handling**:
```typescript
// Guest routes allow anonymous users
export const Route = createFileRoute('/guest/$projectId')({
  beforeLoad: async ({ context }) => {
    // Allow unauthenticated or anonymous users
    // Admin users can also access (no downgrade)
    if (!context.auth.user) {
      // Trigger anonymous sign-in
      await ensureGuestAuth()
    }
  },
})
```

**Benefits Over Component-Level Guards**:
- No flash of protected content before redirect
- Type-safe access to router context
- Guards run in hierarchical order (parent before child)
- Cleaner separation of concerns (routing vs rendering)

**Alternatives Considered**:
- **useEffect guards in components**: Rejected - Causes flash of content, not type-safe
- **Higher-order components (HOCs)**: Rejected - Less composable than `beforeLoad`
- **Middleware pattern**: Rejected - `beforeLoad` is TanStack Router's idiomatic approach

**References**:
- [TanStack Router Authenticated Routes](https://tanstack.com/router/v1/docs/framework/react/guide/authenticated-routes)
- [How to Set Up Basic Authentication](https://tanstack.com/router/v1/docs/framework/react/how-to/setup-authentication)
- [TanStack Router: Authentication Guards Tutorial](https://leonardomontini.dev/tanstack-router-guard/)
- [Preserving Location After Login](https://leonardomontini.dev/tanstack-router-login-redirect/)

---

### 5. Firestore Security Rules for Custom Claims

**Decision**: Check `request.auth.token.admin == true` in Firestore security rules for admin-only operations

**Rationale**:
- Custom claims are accessible via `request.auth.token` in security rules
- Security rules are the mandatory enforcement layer (client checks are UX only)
- Claims are cryptographically verified by Firebase, preventing tampering
- Rules run server-side for all Firestore and Storage operations
- No additional database queries needed to verify admin status

**Admin-Only Operations Pattern**:
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Admin-only collections
    match /workspaces/{workspaceId} {
      // Only admins can create workspaces
      allow create: if request.auth.token.admin == true;

      // Only admins can read/update/delete workspaces
      allow read, update, delete: if request.auth.token.admin == true;
    }

    // Guest-accessible collections
    match /projects/{projectId}/submissions/{submissionId} {
      // Guests can create submissions
      allow create: if request.auth != null;

      // Admins can read all submissions
      allow read: if request.auth.token.admin == true;

      // Users can read their own submissions
      allow read: if request.auth.uid == resource.data.userId;
    }

    // Block anonymous users from admin operations
    match /adminSettings/{document=**} {
      allow read, write: if request.auth.token.admin == true
                           && request.auth.token.firebase.sign_in_provider != 'anonymous';
    }
  }
}
```

**Storage Rules Pattern**:
```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Guest uploads (anonymous allowed)
    match /submissions/{projectId}/{fileName} {
      allow write: if request.auth != null;
      allow read: if request.auth != null;
    }

    // Admin-only files
    match /admin/{fileName} {
      allow read, write: if request.auth.token.admin == true;
    }
  }
}
```

**Checking for Anonymous Users**:
```javascript
// Explicitly block anonymous users
allow write: if request.auth.token.admin == true
             && request.auth.token.firebase.sign_in_provider != 'anonymous';

// Or check for email verification (anonymous users don't have email)
allow write: if request.auth.token.admin == true
             && request.auth.token.email != null;
```

**Testing Security Rules with Custom Claims**:
```typescript
// Using @firebase/rules-unit-testing
import {
  initializeTestEnvironment,
  RulesTestEnvironment
} from '@firebase/rules-unit-testing'

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'test-project',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
    },
  })
})

it('allows admin users to create workspaces', async () => {
  const adminContext = testEnv.authenticatedContext('admin-user-id', {
    admin: true, // Custom claim
  })

  const db = adminContext.firestore()
  await assertSucceeds(
    db.collection('workspaces').add({ name: 'Test Workspace' })
  )
})

it('denies non-admin users from creating workspaces', async () => {
  const userContext = testEnv.authenticatedContext('user-id', {
    admin: false, // Not admin
  })

  const db = userContext.firestore()
  await assertFails(
    db.collection('workspaces').add({ name: 'Test Workspace' })
  )
})
```

**Key Security Principles**:
- **Defense in Depth**: Client checks + server checks + security rules
- **Zero Trust**: Client-side checks are UX only, never security enforcement
- **Least Privilege**: Grant minimum permissions necessary
- **Explicit Deny**: Default deny, explicitly allow specific operations

**Testing Limitations**:
- Firebase Console simulator does not support custom claims testing
- Use local emulator with `@firebase/rules-unit-testing` for custom claims tests
- Production Firebase Auth tokens work with emulator for integration testing

**Alternatives Considered**:
- **Firestore document-based roles**: Rejected - Requires additional query, not integrated with security rules
- **Cloud Functions for all admin operations**: Rejected - Security rules provide automatic enforcement
- **Admin SDK bypass**: Rejected - Only for trusted server environments, not client-facing

**References**:
- [Control Access with Custom Claims and Security Rules](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Security Rules and Firebase Authentication](https://firebase.google.com/docs/rules/rules-and-auth)
- [Firebase Firestore Rules with Custom Claims](https://dev.to/alvardev/firebase-firestore-rules-with-custom-claims-an-easy-way-523d)
- [Role-Based Access Control with Custom Claims](https://www.freecodecamp.org/news/firebase-rbac-custom-claims-rules/)
- [Test Security Rules with Emulator](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Tutorial: Testing Firestore Security Rules](https://fireship.io/lessons/testing-firestore-security-rules-with-the-emulator/)

---

### 6. Firebase Auth Persistence Modes

**Decision**: Use default `LOCAL` persistence mode for both anonymous and authenticated users

**Rationale**:
- `LOCAL` persistence keeps users signed in across browser restarts (best UX)
- Firebase defaults to `LOCAL` persistence (no configuration needed)
- Modern browsers use IndexedDB for auth storage (more secure than localStorage)
- Anonymous sessions persist, preventing multiple anonymous user creation
- Authenticated admin sessions persist, eliminating re-login friction

**Persistence Mode Options**:
```typescript
import { getAuth, setPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence } from 'firebase/auth'

const auth = getAuth()

// LOCAL (default) - persists across browser restarts
await setPersistence(auth, browserLocalPersistence)

// SESSION - persists only for current tab/window
await setPersistence(auth, browserSessionPersistence)

// NONE - no persistence (memory only)
await setPersistence(auth, inMemoryPersistence)
```

**Default Behavior**:
- Web browsers: `LOCAL` persistence (provided browser supports it)
- Firebase automatically uses IndexedDB if available, falls back to localStorage
- No need to call `setPersistence()` unless changing from default

**Security Considerations**:
- `LOCAL` persistence is secure for most use cases
- Tokens are stored encrypted in IndexedDB
- Tokens automatically refresh (expire after 1 hour)
- Users on shared computers should manually sign out

**Session Management**:
- Firebase handles token refresh automatically
- ID tokens expire after 1 hour
- Refresh tokens used to obtain new ID tokens
- `onIdTokenChanged()` fires when tokens refresh

**Alternatives Considered**:
- **SESSION persistence for all users**: Rejected - Poor UX, users must re-login on every tab close
- **NONE persistence**: Rejected - Users must re-login on every page refresh
- **Custom persistence layer**: Rejected - Firebase SDK handles this well

**References**:
- [Authentication State Persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence)
- [React Firebase Auth Persistence](https://www.robinwieruch.de/react-firebase-auth-persistence/)
- [How to Handle Firebase Auth Session Persistence](https://bootstrapped.app/guide/how-to-handle-firebase-authentication-session-persistence-in-a-web-app)

---

### 7. Admin Grant Script Implementation

**Decision**: Create a Node.js script using Firebase Admin SDK for manual admin privilege grants

**Rationale**:
- Admin grants are infrequent operations (< 10/week initially)
- Server-side script ensures security (no client exposure)
- Firebase Admin SDK provides `setCustomUserClaims()` method
- Script can be run locally or deployed as Cloud Function
- Simple CLI interface is sufficient for early-stage deployment

**Script Implementation**:
```typescript
// scripts/grantAdmin.ts
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import * as serviceAccount from './serviceAccountKey.json'

initializeApp({
  credential: cert(serviceAccount as any),
})

async function grantAdminAccess(email: string) {
  try {
    // Look up user by email
    const user = await getAuth().getUserByEmail(email)

    // Verify user is not anonymous
    if (user.providerData.length === 0) {
      throw new Error('Cannot grant admin access to anonymous users')
    }

    // Set custom claim
    await getAuth().setCustomUserClaims(user.uid, {
      admin: true,
    })

    console.log(`✓ Admin access granted to ${email}`)
    console.log(`  User ID: ${user.uid}`)
    console.log(`  User must sign out and back in to receive updated token`)

  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.error(`✗ User with email ${email} does not exist`)
      console.error(`  User must sign in with Google OAuth first`)
    } else {
      console.error(`✗ Error granting admin access:`, error.message)
    }
    process.exit(1)
  }
}

// CLI usage
const email = process.argv[2]

if (!email) {
  console.error('Usage: pnpm admin:grant <email>')
  process.exit(1)
}

grantAdminAccess(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
```

**Package.json Script**:
```json
{
  "scripts": {
    "admin:grant": "tsx scripts/grantAdmin.ts"
  }
}
```

**Usage**:
```bash
# Grant admin access to a user
pnpm admin:grant user@example.com

# Output:
# ✓ Admin access granted to user@example.com
#   User ID: abc123xyz
#   User must sign out and back in to receive updated token
```

**Cloud Function Alternative** (for future):
```typescript
// functions/src/admin/grantAdmin.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getAuth } from 'firebase-admin/auth'

export const grantAdminAccess = onCall(async (request) => {
  // Verify caller is an existing admin
  if (request.auth?.token?.admin !== true) {
    throw new HttpsError('permission-denied', 'Only admins can grant admin access')
  }

  const { email } = request.data

  try {
    const user = await getAuth().getUserByEmail(email)
    await getAuth().setCustomUserClaims(user.uid, { admin: true })

    return { success: true, userId: user.uid }
  } catch (error: any) {
    throw new HttpsError('not-found', `User ${email} not found`)
  }
})
```

**Security Checklist**:
- ✓ Script requires Firebase Admin SDK service account key (not in git)
- ✓ Script validates user exists before setting claims
- ✓ Script prevents granting admin to anonymous users
- ✓ Clear error messages for common failure cases
- ✓ Instructions remind user to re-authenticate after grant

**Alternatives Considered**:
- **Cloud Function callable by super admin**: Rejected - Unnecessary complexity for initial deployment
- **Firebase Console UI**: Rejected - Firebase Console doesn't support custom claims
- **Firestore-triggered Cloud Function**: Rejected - Adds unnecessary Firestore dependency

**References**:
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/auth/admin)
- [setCustomUserClaims Method](https://firebase.google.com/docs/auth/admin/custom-claims)

---

## Technology Stack Summary

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Authentication** | Firebase Authentication | User authentication (anonymous + Google OAuth) |
| **Authorization** | Firebase Custom Claims | Role-based access control (admin flag) |
| **Admin SDK** | Firebase Admin SDK | Server-side custom claims management |
| **Routing** | TanStack Router | File-based routing with `beforeLoad` guards |
| **Auth Context** | TanStack Router Context | Type-safe auth state injection |
| **State Management** | React `onAuthStateChanged` | Real-time auth state synchronization |
| **Security Rules** | Firestore/Storage Rules | Server-side authorization enforcement |
| **Persistence** | Firebase `LOCAL` Mode | Cross-session auth persistence (IndexedDB) |
| **Testing** | @firebase/rules-unit-testing | Security rules testing with custom claims |
| **Admin Tooling** | Node.js Script + Admin SDK | Manual admin privilege grants |

---

## Security Architecture

### Three-Layer Defense

1. **Client Routing (UX Layer)**
   - TanStack Router `beforeLoad` guards
   - Prevents flash of protected content
   - Provides immediate user feedback
   - NOT a security enforcement layer

2. **Server Functions (API Layer)**
   - Cloud Functions check `context.auth.token.admin`
   - Reject unauthorized requests
   - Log security events
   - Defense against API tampering

3. **Security Rules (Data Layer)**
   - Firestore rules check `request.auth.token.admin`
   - Storage rules check `request.auth.token.admin`
   - Mandatory enforcement for all database operations
   - Cannot be bypassed by client

### Security Invariants

- ✓ Anonymous users can NEVER receive admin claims
- ✓ Custom claims can ONLY be set server-side (Admin SDK)
- ✓ Client-side auth checks are UX only, not security
- ✓ All admin operations MUST be protected by security rules
- ✓ Token refresh required after claims change
- ✓ Claims are cryptographically signed (JWT)

---

## Performance Considerations

### Anonymous Authentication at Scale

- **10,000 concurrent users target**: Firebase supports ~1 million concurrent connections
- **Anonymous auth performance**: Minimal impact with automatic cleanup enabled
- **Rate limiting**: Firebase automatically limits sign-ups per IP
- **Cleanup strategy**: Anonymous accounts > 30 days auto-deleted (Identity Platform feature)
- **Cost optimization**: Automatic cleanup exempts anonymous users from billing quotas

### Token Refresh Strategy

- **Automatic refresh**: ID tokens expire after 1 hour, refresh automatically
- **Force refresh**: `getIdToken(true)` for immediate claims propagation
- **Real-time sync**: Use Firestore metadata doc to trigger client refresh
- **Caching**: ID token claims cached in memory, no repeated decoding needed

### Auth Initialization

- **Initial load**: Wait for `onAuthStateChanged` before rendering routes
- **Loading state**: Show spinner during auth initialization
- **Route guards**: Only run after auth resolves (prevent race conditions)
- **Perceived performance**: Auth check happens in `beforeLoad` (before component render)

---

## Migration Path

### Phase 1: Foundation (This Feature)
- Firebase Auth initialization
- Anonymous auth for guest routes
- Google OAuth for admin login
- Custom claims for admin authorization
- Route guards with `beforeLoad`
- Manual admin grant script

### Phase 2: Enhanced UX (Future)
- Account linking (anonymous → authenticated)
- Multi-factor authentication (MFA)
- Session management UI
- Admin impersonation for testing

### Phase 3: Self-Service (Future)
- Admin access request workflow
- Automated admin approval
- Role management UI
- Audit logging for admin operations

---

## Open Questions

✅ All questions resolved. No [NEEDS CLARIFICATION] items remain.

**Resolved Questions**:
- Q: Can admin users access guest routes without being downgraded?
  - A: Yes, admin users retain their authenticated status when accessing guest routes

- Q: How do we handle auth loading state before route guards run?
  - A: Global auth loading state in root component prevents routing until auth resolves

- Q: Should anonymous sessions persist across browser restarts?
  - A: Yes, using Firebase's default `LOCAL` persistence mode

- Q: How do we test security rules with custom claims?
  - A: Use `@firebase/rules-unit-testing` library with emulator (console simulator doesn't support claims)

---

## Next Steps

Proceed to **Phase 2: Implementation**:
1. Initialize Firebase Auth in root component
2. Create `AuthProvider` with `onIdTokenChanged` listener
3. Set up router context with auth state
4. Implement `beforeLoad` guards for admin routes
5. Create `/login` page with Google OAuth
6. Update Firestore security rules with admin checks
7. Create admin grant script
8. Write security rules tests
9. Add auth loading state UI

---

## References

### Official Documentation
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)
- [TanStack Router Authentication](https://tanstack.com/router/v1/docs/framework/react/guide/authenticated-routes)
- [TanStack Start Authentication](https://tanstack.com/start/latest/docs/framework/react/guide/authentication)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase SSR Apps](https://firebase.google.com/docs/web/ssr-apps)

### Best Practices & Tutorials
- [Best Practices for Anonymous Authentication](https://firebase.blog/posts/2023/07/best-practices-for-anonymous-authentication)
- [Tutorial: Advanced Firebase Auth with Custom Claims](https://fireship.io/lessons/firebase-custom-claims-role-based-auth/)
- [TanStack Router: Authentication Guards](https://leonardomontini.dev/tanstack-router-guard/)
- [Preserving Location After Login](https://leonardomontini.dev/tanstack-router-login-redirect/)
- [Supercharged Custom Claims with Firestore](https://medium.com/firebase-developers/patterns-for-security-with-firebase-supercharged-custom-claims-with-firestore-and-cloud-functions-bb8f46b24e11)

### Testing & Security
- [Test Security Rules with Emulator](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Tutorial: Testing Firestore Security Rules](https://fireship.io/lessons/testing-firestore-security-rules-with-the-emulator/)
- [Role-Based Access Control with Firebase](https://www.freecodecamp.org/news/firebase-rbac-custom-claims-rules/)
- [Firebase Firestore Rules with Custom Claims](https://dev.to/alvardev/firebase-firestore-rules-with-custom-claims-an-easy-way-523d)

### Community Resources
- [Firebase & TanStack Integration Template](https://github.com/connorp987/vite-firebase-tanstack-router-template)
- [Authenticated SSR with Next.js and Firebase](https://colinhacks.com/essays/nextjs-firebase-authentication)
- [Firebase Scalability: Millions of Users](https://medium.com/@sehban.alam/can-firebase-really-handle-millions-of-users-heres-the-truth-and-how-to-maximize-its-potential-6876c78cd4b6)
