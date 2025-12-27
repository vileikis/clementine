# Feature Specification: Firebase Authentication & Authorization System

**Feature Branch**: `002-auth-system`
**Created**: 2025-12-26
**Status**: Draft
**Input**: User description: "Introduce a secure authentication and authorization system that clearly separates guest and admin experiences, using Firebase Authentication and custom auth claims."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Event Participation (Priority: P1)

An event attendee visits a shareable event link to participate in an AI photobooth experience. The system must automatically authenticate them without requiring manual login, allowing immediate access to the experience.

**Why this priority**: This is the primary user flow for the product's core value proposition. Event guests represent the majority of traffic and must have a frictionless experience.

**Independent Test**: Can be fully tested by visiting `/guest/[projectId]` with no existing session and verifying automatic authentication occurs, then uploading a photo to verify the complete guest flow works.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user, **When** they visit `/guest/[projectId]`, **Then** they are automatically signed in anonymously and can access the event experience
2. **Given** an already authenticated guest user, **When** they visit `/guest/[projectId]`, **Then** they continue using their existing session without disruption
3. **Given** an authenticated admin user, **When** they visit `/guest/[projectId]`, **Then** they can participate as a guest without being downgraded or signed out

---

### User Story 2 - Admin Access Control (Priority: P1)

A platform administrator needs to access workspace management and admin features. The system must verify their admin privileges and restrict access to authorized users only.

**Why this priority**: Admin access control is critical for security and must be in place before any admin features are built. Without this, the platform has no security boundary.

**Independent Test**: Can be fully tested by attempting to access `/admin` or `/workspace` routes with different auth states (unauthenticated, anonymous, authenticated non-admin, authenticated admin) and verifying correct access/denial behavior.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user, **When** they attempt to access `/admin` or `/workspace`, **Then** they are redirected to `/login`
2. **Given** an anonymous user, **When** they attempt to access `/admin` or `/workspace`, **Then** they are redirected to `/login`
3. **Given** an authenticated user without admin claim, **When** they attempt to access `/admin` or `/workspace`, **Then** they are redirected to `/login`
4. **Given** an authenticated user with `admin: true` claim, **When** they access `/admin` or `/workspace`, **Then** they are granted access to admin features
5. **Given** a user with admin access, **When** they refresh the page or use a deep link to an admin route, **Then** their admin access persists without re-authentication

---

### User Story 3 - Admin Login & Access Request (Priority: P2)

A user needs to authenticate with email and password to request admin access. If they don't have admin privileges yet, they are informed to wait for approval while still being able to access guest experiences.

**Why this priority**: This enables the onboarding flow for new admins and provides clear feedback about access status. It's lower priority than core access control because manual admin granting is acceptable initially.

**Independent Test**: Can be fully tested by logging in with email/password as a non-admin user and verifying the waiting message appears, then accessing a guest route to confirm guest functionality remains available.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user, **When** they visit `/login`, **Then** they see an email/password login form (no sign-up option)
2. **Given** an anonymous user, **When** they visit `/login`, **Then** they see an email/password login form (no sign-up option)
3. **Given** an authenticated admin user, **When** they visit `/login`, **Then** they are redirected to `/admin`
4. **Given** a user with credentials created in Firebase Console, **When** they log in with valid email/password, **Then** they are authenticated successfully
5. **Given** a user logs in with valid credentials, **When** they do not have the `admin: true` claim, **Then** they see a message: "You are logged in. Waiting for an administrator to grant access."
6. **Given** a logged-in user without admin access, **When** they visit `/guest/[projectId]`, **Then** they can access guest experiences normally
7. **Given** a user enters invalid credentials, **When** they submit the login form, **Then** they see a clear error message (e.g., "Invalid email or password")

---

### User Story 4 - Manual Admin Privilege Grant (Priority: P3)

A super administrator needs to grant admin privileges to a new team member. They run a server-side command with the user's email to set the admin claim.

**Why this priority**: This is necessary for team growth but manual operation is acceptable for early-stage deployment. Self-service admin management is explicitly out of scope.

**Independent Test**: Can be fully tested by running the admin grant script with a test user's email, then having that user sign out and back in to verify they receive admin access.

**Acceptance Scenarios**:

1. **Given** a user has logged in with Google OAuth, **When** an administrator runs the admin grant command with their email, **Then** the custom claim `admin: true` is set on their account
2. **Given** a user's email that doesn't exist in Firebase Auth, **When** the admin grant command is run, **Then** the operation is rejected with an error message
3. **Given** a user has been granted admin access, **When** they re-authenticate (sign out and back in), **Then** they receive the updated claims and can access admin routes

---

### Edge Cases

- What happens when a user's admin claim is revoked while they have an active session? (They must re-authenticate to receive the updated claim; existing tokens remain valid until expiry)
- How does the system handle race conditions where auth state is checked before Firebase auth has fully initialized? (Global auth loading state prevents route guards from running until auth is resolved)
- What happens when an admin user clears their browser data while on an admin page? (They become unauthenticated and are redirected to `/login`)
- How does the system handle a user who is signed in on multiple devices when their admin claim changes? (Each device must re-authenticate independently to receive updated claims)
- What happens when token refresh fails during an active session? (User is treated as unauthenticated and redirected appropriately)

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication

- **FR-001**: System MUST support Firebase Authentication as the authentication provider
- **FR-002**: System MUST automatically sign in unauthenticated users as anonymous when they access `/guest/[projectId]` routes
- **FR-003**: System MUST support email/password authentication as the authentication method for admin login and user registration
- **FR-004**: System MUST expose a global auth loading state that indicates when Firebase auth is being initialized or resolved
- **FR-005**: System MUST prevent route guards from executing until Firebase auth state is fully resolved and ID token with claims is available

#### Authorization

- **FR-006**: System MUST use Firebase custom claims exclusively for admin authorization
- **FR-007**: System MUST check for the presence of `admin: true` in the user's ID token custom claims to determine admin status
- **FR-008**: System MUST NOT use Firestore data as a source of truth for user roles or admin privileges
- **FR-009**: System MUST enforce admin access checks at three layers: client routing (UX), server routes/functions (security), and Firestore/Storage security rules (mandatory)

#### Route Protection

- **FR-010**: System MUST redirect unauthenticated users who attempt to access `/admin` or `/workspace` routes to `/login`
- **FR-011**: System MUST redirect anonymous users who attempt to access `/admin` or `/workspace` routes to `/login`
- **FR-012**: System MUST redirect authenticated users without `admin: true` claim who attempt to access `/admin` or `/workspace` routes to `/login`
- **FR-013**: System MUST allow access to `/admin` and `/workspace` routes for authenticated users with `admin: true` claim
- **FR-014**: System MUST preserve admin authentication state across page refreshes and deep links
- **FR-015**: System MUST NOT force admin users to sign out or downgrade when they access `/guest/[projectId]` routes

#### Login Flow

- **FR-016**: System MUST display email/password login form on the `/login` page for unauthenticated and anonymous users
- **FR-016a**: System MUST NOT provide sign-up or account creation functionality (users are created manually in Firebase Console)
- **FR-016b**: System MUST validate email format and provide clear error messages for invalid credentials
- **FR-017**: System MUST redirect authenticated admin users from `/login` to `/admin`
- **FR-018**: System MUST display a waiting message ("You are logged in. Waiting for an administrator to grant access.") for users who successfully authenticate but lack the `admin: true` claim
- **FR-019**: System MUST allow authenticated non-admin users to access `/guest/[projectId]` routes while waiting for admin access

#### Admin Management

- **FR-020**: System MUST provide a server-side script or command for granting admin privileges
- **FR-021**: Admin grant operation MUST accept a user email as input
- **FR-022**: Admin grant operation MUST look up the user in Firebase Auth by email
- **FR-023**: Admin grant operation MUST reject the request if the user does not exist in Firebase Auth
- **FR-024**: Admin grant operation MUST set the custom claim `{ admin: true }` on the user account if the user exists
- **FR-025**: System MUST require users to re-authenticate after their admin claim is modified to receive the updated token

#### Security Invariants

- **FR-026**: Anonymous users MUST NEVER be granted admin access
- **FR-027**: Firestore security rules MUST check `request.auth.token.admin == true` for admin-only operations
- **FR-028**: Client-side authorization checks MUST be treated as UX enhancements only, not security enforcement
- **FR-029**: System MUST NOT expose any API or interface that allows client-initiated admin privilege grants

### Key Entities

- **User**: Represents any person interacting with the platform. Users may be unauthenticated, authenticated anonymously (guest), or authenticated with credentials (potentially admin).
- **Auth Claim**: A key-value pair stored in the Firebase ID token. The `admin: true` claim is the single source of truth for admin authorization.
- **Anonymous Session**: A Firebase authentication session created automatically for guest users, providing them with a unique identifier without requiring credential input.
- **Admin Session**: An authenticated Firebase session for a user with the `admin: true` custom claim, granting access to workspace and admin features.
- **Project/Event**: A guest experience identified by `[projectId]` that users access via `/guest/[projectId]` routes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Guest users can access event experiences within 2 seconds of visiting a `/guest/[projectId]` link, without manual authentication steps
- **SC-002**: 100% of unauthorized access attempts to `/admin` and `/workspace` routes are blocked and redirected to `/login`
- **SC-003**: Admin users can access admin features immediately after authentication without additional steps or delays
- **SC-004**: Admin access persists correctly across browser refreshes, deep links, and multiple tabs without requiring re-authentication
- **SC-005**: Users receive clear feedback about their access status (guest, waiting for admin approval, or admin) within 1 second of authentication
- **SC-006**: Zero security bypasses exist where client-side checks are the only enforcement layer for admin access
- **SC-007**: 100% of admin privilege changes require re-authentication to take effect, preventing stale or inconsistent auth states
- **SC-008**: The system supports at least 10,000 concurrent anonymous guest users without authentication failures

## Assumptions *(mandatory)*

- Firebase Authentication is already configured in the project
- Firebase Admin SDK is available for server-side operations
- Firestore security rules can be deployed and updated as part of this feature
- Email/password authentication is enabled as a sign-in provider in Firebase Authentication
- The platform uses a standard web session model where tokens expire and refresh according to Firebase defaults (1 hour access tokens)
- Admin privilege grants are infrequent enough that manual operation is acceptable (fewer than 10 grants per week initially)
- Token refresh happens automatically via Firebase SDK without requiring application-level intervention
- The `/login` route will be a new page created as part of this feature
- User accounts are created manually by administrators in Firebase Console (no self-service registration)
- User creation frequency is low enough that manual operation via Firebase Console is acceptable

## Out of Scope *(mandatory)*

- Self-service user registration or sign-up (users created manually in Firebase Console)
- Self-service admin signup or role request workflows
- Role management via Firestore fields or custom database schemas
- Multiple admin role levels (e.g., editor, viewer, super-admin)
- Admin impersonation of guest users
- Account linking between anonymous sessions and authenticated accounts
- OAuth providers (Google, GitHub, etc.) - only email/password for admin login
- Email verification workflows
- Multi-factor authentication (MFA)
- Password reset/forgot password functionality (may be added in future)
- Password strength requirements beyond Firebase defaults
- User profile management in the application
- Session management UI (e.g., viewing active sessions, remote logout)
- Automated admin access approval workflows
