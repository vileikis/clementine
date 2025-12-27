# Authentication & Authorization Standard

**Status**: Active | **Last Updated**: 2025-12-27 | **Applies To**: All applications

## Overview

This standard defines how authentication and authorization are implemented across the Clementine platform using Firebase Authentication with a hybrid client-server approach.

## Authentication System

### Architecture

**Firebase Authentication** with hybrid client-server pattern:

- **Client-side auth**: Firebase Auth client SDK for authentication operations
- **Server-side session**: Server functions validate ID tokens and manage sessions
- **Custom claims**: Firebase Admin SDK sets `admin: true` custom claim for authorization
- **Route protection**: Server-side guards in `beforeLoad` hooks (no client-side auth checks)

### Authentication Methods

1. **Email/Password** (Admin users)
   - Login only - no self-service registration
   - Users created manually in Firebase Console
   - Non-admin users see waiting message after login
   - Admin users redirected to `/admin` dashboard

2. **Anonymous** (Guest users)
   - Automatic sign-in on `/guest/[projectId]` routes
   - Session persists across page refreshes
   - No explicit sign-out (session managed automatically)

### Authorization Levels

- **Unauthenticated**: Redirected to `/login` for protected routes
- **Anonymous**: Can access `/guest/[projectId]`, redirected to `/login` for admin routes
- **Authenticated (non-admin)**: Can access guest routes, waiting message for admin routes
- **Admin** (`admin: true` claim): Full access to `/admin` and `/workspace` routes

## File Structure

### TanStack Start Application

```text
src/domains/auth/
├── providers/
│   └── AuthProvider.tsx          # Auth context (client-side state)
├── server/
│   ├── functions.ts               # Server functions (getCurrentUserFn, createSessionFn, logoutFn, grantAdminFn)
│   └── session.ts                 # Session management (cookie-based)
├── components/
│   ├── LoginPage.tsx              # Email/password login
│   └── WaitingMessage.tsx         # Non-admin user feedback
├── hooks/
│   ├── useAuth.ts                 # Auth state hook (client-side)
│   └── useEmailPasswordSignIn.ts  # Login form logic
├── lib/
│   └── guards.ts                  # Route guard functions (requireAuth, requireAdmin)
└── utils/
    └── mapFirebaseAuthError.ts    # Error message mapping

scripts/
└── grant-admin.ts                 # Admin privilege grant script (Firebase Admin SDK)

routes/
├── __root.tsx                     # Auth initialization (waits for auth before rendering)
├── login/index.tsx                # Login route (redirects admin users)
├── admin/index.tsx                # Admin dashboard (protected)
└── guest/$projectId.tsx           # Guest experience (auto anonymous sign-in)
```

## Implementation Patterns

### Server-Side Route Protection

**CRITICAL**: All auth checks MUST happen server-side in `beforeLoad` hooks:

```tsx
// ✅ CORRECT: Server-side auth check
export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ context }) => {
    // Uses server function to verify session
    await requireAdmin({ context })
  },
  component: AdminPage,
})

// ❌ WRONG: Client-side auth check
function AdminPage() {
  const { isAdmin } = useAuth() // Client state only
  if (!isAdmin) return <Navigate to="/login" /> // Too late, security bypass
  return <div>Admin content</div>
}
```

### Client-Side UI Checks (UX Only)

Client-side auth checks are for **UX only**, never for security:

```tsx
function MyComponent() {
  const { isAdmin, isLoading } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (!isAdmin) return <div>Access denied</div> // UX only, not security

  return <div>Admin content</div>
}
```

### Protecting Routes

```tsx
export const Route = createFileRoute('/protected')({
  beforeLoad: async ({ context }) => {
    await requireAdmin({ context }) // Server-side check (security boundary)
  },
  component: ProtectedPage,
})
```

### Logout

```tsx
import { logoutFn } from '@/domains/auth/server'
import { useServerFn } from '@tanstack/react-start'

function MyComponent() {
  const logout = useServerFn(logoutFn)

  const handleLogout = async () => {
    await logout() // Clears session and redirects
  }

  return <button onClick={handleLogout}>Sign Out</button>
}
```

## Session Management

- **Session storage**: HTTP-only cookies (`auth_session`)
- **Session duration**: 5 days (configurable in `session.ts`)
- **Session creation**: Automatic on `onIdTokenChanged` (client) → `createSessionFn` (server)
- **Token validation**: Server verifies Firebase ID token on every request
- **Logout**: Clears client auth + server session (`logoutFn`)

## Admin Access Management

### Granting Admin Access

Admin privileges are granted via command-line script (requires Firebase Admin SDK service account):

```bash
# From apps/clementine-app directory
pnpm grant-admin user@example.com

# User must sign out and back in to receive updated token
```

### Security Rules

**Firestore Rules:**
```javascript
function isAdmin() {
  return request.auth != null
    && request.auth.token.admin == true;
}

match /{document=**} {
  allow read: if true; // Allow reads for now
  allow write: if isAdmin(); // Only admins can write
}
```

**Storage Rules:**
```javascript
function isAdmin() {
  return request.auth != null
    && request.auth.token.admin == true;
}

function isAnyUser() {
  return request.auth != null;
}

match /workspaces/{workspaceId}/{allPaths=**} {
  allow read: if isAnyUser(); // Any authenticated user (including anonymous)
  allow write: if isAdmin();
}

match /{allPaths=**} {
  allow read, write: if isAdmin(); // All other paths: admins only
}
```

## Security Principles

1. **Client checks are UX only** - Never trust client-side auth state for security
2. **Server validates everything** - All auth checks in server functions or `beforeLoad`
3. **Rules enforce security** - Firestore/Storage rules check `admin` claim
4. **Sessions are stateless** - ID token verified on every request (no session DB)
5. **Admin claims are server-only** - Only Admin SDK can set custom claims
6. **No client-side guards** - Route protection happens on the server

## Testing

- **Unit tests**: Mock `useAuth` hook and server functions
- **Integration tests**: Test full flows (login → admin access → persistence)
- **Manual testing**: Verify all user stories in feature spec

## Common Mistakes to Avoid

❌ **DON'T**: Use client-side auth state for route protection
❌ **DON'T**: Trust `useAuth()` values for security decisions
❌ **DON'T**: Implement auth guards in component render logic
❌ **DON'T**: Set custom claims from client-side code
❌ **DON'T**: Skip server-side validation

✅ **DO**: Use server functions for all auth checks
✅ **DO**: Protect routes with `beforeLoad` hooks
✅ **DO**: Validate sessions on every server request
✅ **DO**: Use security rules as the enforcement layer
✅ **DO**: Keep auth logic in the `auth` domain

## Related Documentation

- **Feature Specification**: `specs/002-auth-system/spec.md`
- **Implementation Plan**: `specs/002-auth-system/plan.md`
- **API Reference**: `specs/002-auth-system/contracts/auth-api.md`
- **Research**: `specs/002-auth-system/research.md`

## Version History

- **2025-12-27**: Initial version - Firebase Auth with server-side session validation
