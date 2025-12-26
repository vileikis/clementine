## Goal

Introduce a secure authentication and authorization system that clearly separates **guest** and **admin** experiences, using Firebase Authentication and **custom auth claims**.

---

## Core Concepts (make these explicit)

- Authentication is handled by **Firebase Auth**
- Authorization is handled by **Firebase custom claims**
- `admin: true` is the **only source of truth** for admin privileges
- Anonymous users are authenticated but **never authorized** for admin access
- Firestore is **not** used as an authority for roles

---

## Auth States

The application recognizes **three effective auth states**:

1. **Unauthenticated**
   - No Firebase user session exists
2. **Authenticated – Guest**
   - Firebase anonymous user
   - OR authenticated user without `admin: true` claim
3. **Authenticated – Admin**
   - Firebase authenticated user with custom claim:
     ```
     admin: true

     ```

> Note: “Guest” is a capability level, not a user type.
>
> Admins may access guest experiences without switching accounts.

---

## Route Behavior

### `/guest/[projectId]`

Purpose: Public / event participation experience

Behavior:

- If **no authenticated user**:
  - Automatically sign in using Firebase anonymous auth
- If **authenticated (guest or admin)**:
  - Do nothing
- Admin users **must NOT** be forced to sign out or downgraded
- Guest flows rely on **session/event context**, not user role

---

### `/admin` and `/workspace`

Purpose: Admin-only application areas

Behavior:

- If **not authenticated**:
  - Redirect to `/login`
- If **authenticated but anonymous**:
  - Redirect to `/login`
- If **authenticated without `admin: true` claim**:
  - Redirect to `/login`
- If **authenticated with `admin: true` claim**:
  - Allow access

> Enforcement must exist:
>
> - in client routing (UX)
> - in server routes / functions (security)
> - in Firestore / Storage rules (non-negotiable)

---

### `/login`

Purpose: Admin authentication and access request

Behavior:

- If **not authenticated**:
  - Allow access
- If **authenticated as anonymous**:
  - Allow access
- If **authenticated as admin**:
  - Redirect to `/admin`
- Login method:
  - Google OAuth **only**
- After successful Google login:
  - If user does **not** have `admin: true`:
    - Show message:
      > “You are logged in. Waiting for an administrator to grant access.”
  - User may still freely access `/guest/*` routes

---

## Admin Entitlement Model

- Admin access is controlled **exclusively** via Firebase Auth custom claims:
  ```
  admin: true

  ```
- Claims are:
  - Set via Firebase Admin SDK
  - Read-only from the client
  - Included in the user’s ID token
- Claims changes require token refresh (sign-out / sign-in or forced refresh)

---

## Loading & Resolution States

- The app must expose a global **auth resolving/loading state**
- No route guards should run until:
  - Firebase auth state is resolved
  - ID token + claims are available
- Prevents:
  - flicker
  - incorrect redirects
  - accidental anon login before admin state is known

---

## Admin Management (Initial Phase)

### Manual Admin Grant (Bootstrap Phase)

Admin role is granted via **manual, server-side process**.

Process:

1. Run a local script or Firebase Admin SDK command
2. Input: user email
3. Steps:
   - Look up user in Firebase Auth by email
   - If user does **not exist** → reject
   - If user exists:
     - Set custom claim `{ admin: true }`
4. User must re-authenticate to receive updated claim

Constraints:

- Client cannot trigger this
- Firestore is not used to assign admin privileges
- This is acceptable for early-stage / internal tooling

---

## Non-Goals (explicitly out of scope)

- Self-service admin signup
- Role management via Firestore fields
- Multiple admin roles (e.g. editor/viewer)
- Admin impersonation of users
- Anonymous-to-admin account linking

---

## Security Invariants (these should never be violated)

- Anonymous users can **never** access admin routes
- Firestore rules must check:
  ```
  request.auth.token.admin == true

  ```
- Client-side checks are **UX only**, not security
- Admin access must survive page refreshes and deep links

---

## One small but important naming fix

Use **“anonymous”** consistently instead of:

- anonomous
- anonmoys

This matters in code, docs, and sanity.
