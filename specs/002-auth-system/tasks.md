# Implementation Tasks: Firebase Authentication & Authorization System

**Feature**: 002-auth-system
**Branch**: `002-auth-system`
**Created**: 2025-12-26

## Overview

This document breaks down the Firebase Authentication & Authorization System implementation into actionable tasks organized by user story priority. Each user story phase is independently testable and can be deployed as an incremental improvement.

**User Stories** (from spec.md):
- **US1** (P1): Guest Event Participation - Anonymous auth for `/guest/[projectId]`
- **US2** (P1): Admin Access Control - Route protection for `/admin` and `/workspace`
- **US3** (P2): Admin Login & Access Request - Google OAuth login with waiting message
- **US4** (P3): Manual Admin Privilege Grant - Server-side script to grant admin claims

**Implementation Strategy**: Incremental delivery by user story. Each story is a complete, independently testable feature increment.

**MVP Scope**: User Story 1 (Guest Event Participation) - Enables core product value proposition.

---

## Phase 1: Setup & Infrastructure

**Goal**: Initialize project structure and install required dependencies.

**Tasks**:

- [X] T001 Install Firebase SDK dependencies (firebase@latest) in apps/clementine-app/package.json
- [X] T002 [P] Install Firebase Admin SDK (firebase-admin@latest) in apps/clementine-app/package.json for grant-admin script
- [X] T003 [P] Verify Firebase project configuration exists in apps/clementine-app/src/integrations/firebase/client.ts
- [X] T004 Create auth domain directory structure: apps/clementine-app/src/domains/auth/{components,providers,hooks,types,__tests__}/
- [X] T005 [P] Create scripts directory for admin management: apps/clementine-app/scripts/
- [ ] T006 Verify Google OAuth provider enabled in Firebase Console (manual verification task)
- [X] T007 [P] Create TypeScript types file: apps/clementine-app/src/domains/auth/types/auth.types.ts

**Validation**: All directories created, dependencies installed, `pnpm install` completes successfully.

---

## Phase 2: Foundational - Auth Provider & Router Context

**Goal**: Implement core auth state management that all user stories depend on.

**Why Foundational**: Auth provider and router context are required by all subsequent user stories. Must be completed before any story-specific work.

**Tasks**:

- [X] T008 Implement AuthProvider with onIdTokenChanged listener in apps/clementine-app/src/domains/auth/providers/AuthProvider.tsx
- [X] T009 Implement useAuth hook in apps/clementine-app/src/domains/auth/hooks/use-auth.ts
- [X] T010 Update root route to include AuthProvider and wait for auth initialization in apps/clementine-app/src/routes/__root.tsx
- [X] T011 Create RouterContext type with auth state in apps/clementine-app/src/routes/__root.tsx
- [X] T012 Create barrel export (index.ts) for auth domain public API in apps/clementine-app/src/domains/auth/index.ts
- [ ] T013 Write unit test for useAuth hook with different auth states in apps/clementine-app/src/domains/auth/__tests__/use-auth.test.ts

**Validation**:
- Root layout renders "Initializing authentication..." until auth.isLoading === false
- useAuth hook returns correct auth state (user, isAdmin, isAnonymous, isLoading)
- Unit tests pass for all auth state transitions

**Independent Test**: Start dev server, verify root layout waits for auth before rendering child routes, no race conditions in console.

---

## Phase 3: User Story 1 - Guest Event Participation (P1)

**Story Goal**: Enable automatic anonymous authentication for guests accessing `/guest/[projectId]` routes.

**Priority**: P1 (Core value proposition - guest experience)

**Independent Test Criteria**:
1. Visit `/guest/test-project` with no existing session → automatically signed in anonymously
2. Refresh page while on `/guest/test-project` → existing session persists
3. Admin user visits `/guest/test-project` → can access without being signed out

**Tasks**:

- [X] T014 [US1] Create guest route file: apps/clementine-app/src/routes/guest/$projectId/index.tsx
- [X] T015 [US1] Implement beforeLoad hook with automatic anonymous sign-in in apps/clementine-app/src/routes/guest/$projectId/index.tsx
- [X] T016 [US1] Create GuestPage component (placeholder) in apps/clementine-app/src/routes/guest/$projectId/index.tsx
- [ ] T017 [US1] Write unit test for anonymous sign-in logic in apps/clementine-app/src/domains/auth/__tests__/guest-auth.test.ts
- [ ] T018 [US1] Test manual: Visit /guest/test-project with no session, verify auto sign-in occurs in <2s
- [ ] T019 [US1] Test manual: Verify existing anonymous session persists across page refreshes
- [X] T020 [US1] Run validation loop: pnpm check && pnpm type-check in apps/clementine-app/

**Story Complete When**:
- ✅ Unauthenticated users are auto-signed in anonymously on `/guest/[projectId]`
- ✅ Anonymous session persists across refreshes
- ✅ Performance: Authentication completes in <2s (SC-001)
- ✅ All tests pass, validation loop clean

---

## Phase 3.5: Server-Side Auth Migration ⚠️ BLOCKING

**Goal**: Migrate from client-side auth to server-side validation (hybrid approach) to fix SSR issues and enable proper route protection.

**Status**: Planning - Requires approval before implementation

**Background**: Current client-side auth implementation fails on SSR because `beforeLoad` hooks run on both server and client. Firebase Client SDK only works in browser, causing "Auth not available in context" errors on initial page load.

**Solution**: Implement server-side auth validation using TanStack Start server functions while maintaining client-side Firestore/Storage access (hybrid approach).

**Documentation**: See [server-auth-migration.md](./server-auth-migration.md) for complete migration plan, architectural decisions, and detailed implementation guide.

**Impact**: Blocks completion of Phase 4-7 until resolved. All route guards must be updated to work on both server and client.

**Priority**: High (must complete before Phase 4-7 can be finalized)

**Tasks**:

### Step 1: Environment Setup (T101-T105)

- [ ] T101 Generate SESSION_SECRET with `openssl rand -base64 32`
- [ ] T102 Download Firebase Admin service account JSON from Console
- [ ] T103 Extract credentials and add to .env.local (SESSION_SECRET, FIREBASE_ADMIN_*)
- [ ] T104 Verify .env.local is gitignored
- [ ] T105 Test environment variables are loaded correctly

### Step 2: Server Infrastructure (T106-T110)

- [X] T106 Install firebase-admin dependency: `pnpm add firebase-admin`
- [X] T107 Create src/integrations/firebase/server.ts (Firebase Admin SDK setup)
- [X] T108 Create src/domains/auth/server/session.ts (session management)
- [X] T109 Create src/domains/auth/server/functions.ts (server functions)
- [X] T110 Create src/domains/auth/server/index.ts (server exports)

### Step 3: Server Functions Implementation (T111-T115)

- [X] T111 Implement getCurrentUserFn server function
- [X] T112 Implement createSessionFn server function
- [X] T113 Implement signOutFn server function
- [X] T114 Implement grantAdminFn server function (for Phase 6)
- [X] T115 Export all server functions from server/index.ts

### Step 4: Bridge Client & Server Auth (T116-T119)

- [X] T116 Update AuthProvider to call createSessionFn on auth state change
- [X] T117 Update LoginPage to create session after Google sign-in
- [X] T118 Update WaitingMessage to use signOutFn
- [ ] T119 Test client-server auth sync (verify session created on login)

### Step 5: Refactor & Update Route Guards (T120-T124)

- [X] T120 Move components/AuthGuard.tsx → lib/guards.ts
- [X] T121 Rewrite guard functions to use server functions (async)
- [X] T122 Update admin/route.tsx beforeLoad to use requireAdmin()
- [X] T123 Update workspace/route.tsx beforeLoad to use requireAdmin()
- [X] T124 Update login/index.tsx beforeLoad to use server function

### Step 6: Clean Up Router Context (T125-T127)

- [X] T125 Remove auth from MyRouterContext in __root.tsx
- [X] T126 Update RootLayout to only use useAuth for UI rendering
- [X] T127 Verify router.tsx context doesn't reference auth

### Step 7: File Structure Refactoring (T128-T129)

- [X] T128 Move components/LoginPage.tsx → containers/LoginPage.tsx
- [X] T129 Update imports and exports in auth/index.ts

### Step 8: Validation & Testing (T130-T136)

- [ ] T130 Test SSR: Hard refresh on /admin (should redirect on server, no error)
- [ ] T131 Test client navigation: Click to /admin (should redirect on client)
- [ ] T132 Test session persistence: Refresh page, verify session maintained
- [ ] T133 Test sign-out: Verify session cleared and redirected
- [ ] T134 Test anonymous user: Can access /guest/[projectId] but not /admin
- [ ] T135 Test Google OAuth: Sign in creates session, admin redirected to /admin
- [X] T136 Run validation loop: `pnpm check && pnpm type-check`

**Phase Complete When**:
- ✅ All existing functionality works (Phases 1-5)
- ✅ Server-side auth validation working in beforeLoad
- ✅ No "Auth not available in context" errors
- ✅ Proper SSR for protected routes (no flash before redirect)
- ✅ Session management working (persist across refreshes)
- ✅ Client-side Firestore/Storage access unchanged
- ✅ All validation tests pass (T130-T136)
- ✅ Code quality checks pass (pnpm check && pnpm type-check)

**Estimated Time**: 4-6 hours

---

## Phase 4: User Story 2 - Admin Access Control (P1)

**Story Goal**: Protect `/admin` and `/workspace` routes, allowing access only to users with `admin: true` custom claim.

**Priority**: P1 (Security boundary - critical before admin features)

**Independent Test Criteria**:
1. Unauthenticated user visits `/admin` → redirected to `/login`
2. Anonymous user visits `/admin` → redirected to `/login`
3. Authenticated non-admin user visits `/admin` → redirected to `/login`
4. Authenticated admin user visits `/admin` → access granted
5. Admin user refreshes `/admin` → access persists

**Tasks**:

- [X] T021 [US2] Create admin route file: apps/clementine-app/src/routes/admin/index.tsx
- [X] T022 [US2] Implement admin route guard (beforeLoad) checking isAdmin in apps/clementine-app/src/routes/admin/index.tsx
- [X] T023 [US2] Create AdminPage component (placeholder) in apps/clementine-app/src/routes/admin/index.tsx
- [X] T024 [P] [US2] Create workspace route file: apps/clementine-app/src/routes/workspace/index.tsx
- [X] T025 [P] [US2] Implement workspace route guard (beforeLoad) checking isAdmin in apps/clementine-app/src/routes/workspace/index.tsx
- [X] T026 [P] [US2] Create WorkspacePage component (placeholder) in apps/clementine-app/src/routes/workspace/index.tsx
- [X] T027 [US2] Create AuthGuard component (optional reusable guard) in apps/clementine-app/src/domains/auth/components/AuthGuard.tsx
- [ ] T028 [US2] Write unit test for admin route guard logic in apps/clementine-app/src/domains/auth/__tests__/AuthGuard.test.tsx
- [X] T029 [US2] Update Firestore security rules with admin claim check (request.auth.token.admin == true) in firestore.rules
- [ ] T030 [US2] Test manual: Attempt /admin access with unauthenticated state, verify redirect to /login
- [ ] T031 [US2] Test manual: Attempt /admin access with anonymous user, verify redirect to /login
- [ ] T032 [US2] Test manual: Attempt /admin access with non-admin authenticated user, verify redirect to /login
- [ ] T033 [US2] Test manual: Access /admin with admin user (mock custom claim), verify access granted
- [X] T034 [US2] Run validation loop: pnpm check && pnpm type-check in apps/clementine-app/

**Story Complete When**:
- ✅ All unauthorized access attempts to `/admin` and `/workspace` are redirected to `/login` (SC-002)
- ✅ Admin users can access `/admin` and `/workspace` routes
- ✅ Admin access persists across refreshes (SC-004)
- ✅ Firestore security rules enforce admin checks (FR-027)
- ✅ All tests pass, validation loop clean

---

## Phase 5: User Story 3 - Admin Login & Access Request (P2)

**Story Goal**: Provide Google OAuth login with clear feedback for users awaiting admin access.

**Priority**: P2 (Admin onboarding - manual admin granting is acceptable initially)

**Independent Test Criteria**:
1. Unauthenticated user visits `/login` → sees Google OAuth button
2. Non-admin user logs in with Google OAuth → sees waiting message
3. Non-admin user can still access `/guest/[projectId]` routes
4. Admin user visits `/login` → redirected to `/admin`

**Tasks**:

- [X] T035 [US3] Create login route file: apps/clementine-app/src/routes/login/index.tsx
- [X] T036 [US3] Implement Google OAuth sign-in flow with signInWithPopup in apps/clementine-app/src/routes/login/index.tsx
- [X] T037 [US3] Create LoginPage component with Google OAuth button in apps/clementine-app/src/domains/auth/components/LoginPage.tsx
- [X] T038 [US3] Implement redirect logic: admin users to /admin, non-admin users stay on /login in apps/clementine-app/src/routes/login/index.tsx
- [X] T039 [US3] Create WaitingMessage component for non-admin authenticated users in apps/clementine-app/src/domains/auth/components/WaitingMessage.tsx
- [X] T040 [US3] Add mobile-first styles (320px-768px viewport, 44x44px touch targets) to LoginPage component
- [ ] T041 [US3] Write unit test for login redirect logic in apps/clementine-app/src/domains/auth/__tests__/LoginPage.test.tsx
- [ ] T042 [US3] Test manual: Visit /login unauthenticated, verify Google OAuth button appears
- [ ] T043 [US3] Test manual: Sign in with Google as non-admin user, verify waiting message appears
- [ ] T044 [US3] Test manual: Verify non-admin user can access /guest/test-project after login
- [ ] T045 [US3] Test manual: Sign in as admin user, verify redirect to /admin
- [X] T046 [US3] Run validation loop: pnpm check && pnpm type-check in apps/clementine-app/

**Story Complete When**:
- ✅ Google OAuth login works for all user types
- ✅ Non-admin users see waiting message (FR-018)
- ✅ Admin users are redirected to `/admin` (FR-017)
- ✅ Non-admin users can access guest routes (FR-019)
- ✅ Mobile-first design (320px-768px, 44x44px touch targets)
- ✅ All tests pass, validation loop clean

---

## Phase 5.5: Email/Password Authentication Migration

**Goal**: Replace Google OAuth authentication with email/password authentication for admin login.

**Priority**: P2 (Admin onboarding - replaces Google OAuth implementation)

**Background**: Phase 5 implemented Google OAuth for admin authentication. Business requirements have changed to use email/password authentication instead for simpler onboarding and reduced third-party dependencies.

**Impact**: Affects User Story 3 (Admin Login & Access Request). Changes authentication method but maintains the same server-side session validation and custom claims architecture.

**Independent Test Criteria**:
1. Unauthenticated user visits `/login` → sees email/password login form (no sign-up option)
2. User enters valid credentials (created via Firebase Console) → successfully authenticated and sees appropriate UI (admin dashboard or waiting message)
3. User enters invalid credentials → sees clear error message
4. Non-admin user logs in → sees waiting message
5. Admin user logs in → redirected to `/admin`
6. User attempts to create account → no registration UI available (users must be created in Firebase Console)

**Tasks**:

### Step 1: Update Specification Documents (T137-T139)

- [X] T137 Update spec.md User Story 3 to replace Google OAuth with email/password authentication
- [X] T138 Update spec.md acceptance scenarios to reflect email/password login flow
- [X] T139 Update spec.md FR-003 to specify email/password as authentication method

### Step 2: Update LoginPage Component (T140-T144)

- [X] T140 Replace Google OAuth button with email/password login form in LoginPage.tsx
- [X] T141 Implement email input field with validation (email format)
- [X] T142 Implement password input field with show/hide toggle
- [X] T143 Implement form submission with signInWithEmailAndPassword()
- [X] T144 Add error handling for email/password errors (invalid-email, wrong-password, user-not-found, too-many-requests)

### Step 3: Update Server Function Naming (T145-T148)

- [X] T145 Rename signOutFn to logoutFn in src/domains/auth/server/functions.ts
- [X] T146 Update function exports in src/domains/auth/server/index.ts
- [X] T147 Update function imports in WaitingMessage.tsx
- [X] T148 Update function references in barrel export src/domains/auth/index.ts

### Step 4: Remove Google OAuth Dependencies (T149-T150)

- [X] T149 Remove GoogleAuthProvider import from LoginPage.tsx
- [X] T150 Remove Google OAuth specific error handling from LoginPage.tsx

### Step 5: Update Mobile-First Styles (T151-T152)

- [X] T151 Apply mobile-first styles to email/password form (320px-768px viewport)
- [X] T152 Ensure form inputs meet 44x44px minimum touch target

### Step 6: Testing & Validation (T153-T157)

- [ ] T153 Test manual: Login with valid email/password credentials (user created in Firebase Console)
- [ ] T154 Test manual: Login with invalid credentials (wrong password)
- [ ] T155 Test manual: Login with non-existent user (user not created in Firebase Console)
- [ ] T156 Test manual: Verify admin user redirected to /admin after login
- [X] T157 Run validation loop: `pnpm check && pnpm type-check`

**Phase Complete When**:
- ✅ Email/password login works for all user types (users created manually in Firebase Console)
- ✅ Non-admin users see waiting message (FR-018)
- ✅ Admin users are redirected to `/admin` (FR-017)
- ✅ Error messages are clear and actionable for login failures
- ✅ Mobile-first design maintained (320px-768px, 44x44px touch targets)
- ✅ Server session creation unchanged (still validates ID token)
- ✅ All tests pass, validation loop clean

**Estimated Time**: 1.5-2 hours

**Key Architectural Notes**:
- Authentication remains **client-side** (Firebase client SDK)
- **User creation is manual** - admins create users in Firebase Console, not in the app
- **Login only** - no sign-up/registration flow in the application
- Server-side session validation **unchanged** (still uses ID token verification)
- No `loginFn` server function needed - authentication is handled by Firebase client SDK
- `logoutFn` replaces `signOutFn` for naming consistency
- Custom claims and authorization logic **unchanged**

---

## Phase 6: User Story 4 - Manual Admin Privilege Grant (P3)

**Story Goal**: Provide server-side script for super admins to grant admin privileges via email.

**Priority**: P3 (Team growth - manual operation acceptable)

**Independent Test Criteria**:
1. Run script with valid email → admin claim granted successfully
2. Run script with non-existent email → error message displayed
3. Run script with anonymous user email → error message displayed
4. User re-authenticates after admin grant → receives admin access

**Tasks**:

- [X] T047 [US4] Create grant-admin script file: apps/clementine-app/scripts/grant-admin.ts
- [X] T048 [US4] Implement Firebase Admin SDK initialization in apps/clementine-app/scripts/grant-admin.ts
- [X] T049 [US4] Implement email validation with Zod schema in apps/clementine-app/scripts/grant-admin.ts
- [X] T050 [US4] Implement getUserByEmail lookup in apps/clementine-app/scripts/grant-admin.ts
- [X] T051 [US4] Implement anonymous user validation (reject if providerData.length === 0) in apps/clementine-app/scripts/grant-admin.ts
- [X] T052 [US4] Implement setCustomUserClaims with admin: true in apps/clementine-app/scripts/grant-admin.ts
- [X] T053 [US4] Add CLI argument parsing for email input in apps/clementine-app/scripts/grant-admin.ts
- [X] T054 [US4] Add error handling for user-not-found case in apps/clementine-app/scripts/grant-admin.ts
- [ ] T055 [US4] Write unit test for admin grant logic (mock Firebase Admin SDK) in apps/clementine-app/scripts/__tests__/grant-admin.test.ts
- [ ] T056 [US4] Test manual: Run script with valid non-admin user email, verify admin claim set
- [X] T057 [US4] Test manual: Run script with non-existent email, verify error message
- [ ] T058 [US4] Test manual: User signs out and back in after admin grant, verify admin access
- [X] T059 [US4] Update package.json with script alias: "grant-admin": "node scripts/grant-admin.ts" in apps/clementine-app/package.json
- [X] T060 [US4] Run validation loop: pnpm check && pnpm type-check in apps/clementine-app/

**Story Complete When**:
- ✅ Script accepts email and grants admin claim (FR-021, FR-024)
- ✅ Script rejects non-existent users (FR-023)
- ✅ Script rejects anonymous users (FR-026)
- ✅ Users receive updated claims after re-authentication (FR-025)
- ✅ All tests pass, validation loop clean

---

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Complete security rules, comprehensive testing, documentation, and final validation.

**Tasks**:

- [ ] T061 [P] Update Storage security rules with admin claim check (request.auth.token.admin == true) in storage.rules
- [ ] T062 Add comprehensive error handling for auth errors (popup-closed-by-user, network-request-failed) in auth components
- [ ] T063 [P] Add loading states for auth operations (sign-in, redirect) in auth components
- [ ] T064 Write integration test for full guest flow (visit guest route → auto sign-in → access granted) in apps/clementine-app/src/domains/auth/__tests__/guest-flow.test.ts
- [ ] T065 [P] Write integration test for full admin flow (login → admin access → refresh persistence) in apps/clementine-app/src/domains/auth/__tests__/admin-flow.test.ts
- [ ] T066 Add performance monitoring for guest auth (verify <2s sign-in time) in auth provider
- [ ] T067 Test on real mobile devices (iOS Safari, Android Chrome) for mobile-first validation
- [ ] T068 [P] Update CLAUDE.md with auth feature context (if applicable) in CLAUDE.md
- [ ] T069 Run final validation loop: pnpm check && pnpm type-check && pnpm test in apps/clementine-app/
- [ ] T070 Deploy Firestore and Storage security rules: firebase deploy --only firestore:rules,storage:rules
- [ ] T071 Manual verification: Test all acceptance scenarios from spec.md across all user stories
- [ ] T072 Performance verification: Verify SC-001 (guest auth <2s), SC-002 (100% unauthorized blocked), SC-003 (admin immediate access), SC-004 (admin persistence)

**Phase Complete When**:
- ✅ All security rules deployed and enforced (FR-027, SC-006)
- ✅ All success criteria validated (SC-001 through SC-008)
- ✅ Mobile-first design verified on real devices
- ✅ All tests pass (90%+ coverage for critical paths)
- ✅ Validation loop clean, ready for production

---

## Dependency Graph

**User Story Completion Order** (based on priorities and dependencies):

```
Phase 1 (Setup) → Phase 2 (Foundational: Auth Provider)
                       ↓
        ┌──────────────┼──────────────┬──────────────┐
        ↓              ↓              ↓              ↓
    Phase 3 (US1)  Phase 4 (US2)  Phase 5 (US3)  Phase 6 (US4)
    Guest Auth     Admin Access   Admin Login    Admin Grant
    (P1)           (P1)           (P2)           (P3)
        ↓              ↓              ↓              ↓
        └──────────────┴──────────────┴──────────────┘
                       ↓
              Phase 7 (Polish)
```

**Dependencies**:
- **Phase 2 (Foundational)** MUST complete before any user story phase
- **US1, US2, US3, US4** are independent after Phase 2 (can be implemented in parallel)
- **Phase 7 (Polish)** requires all user stories complete

**Suggested Implementation Order**:
1. Phase 1 (Setup) + Phase 2 (Foundational)
2. Phase 3 (US1 - Guest Auth) → **MVP**
3. Phase 4 (US2 - Admin Access)
4. Phase 5 (US3 - Admin Login)
5. Phase 6 (US4 - Admin Grant)
6. Phase 7 (Polish)

---

## Parallel Execution Opportunities

### Phase 1 (Setup)
Tasks that can run in parallel:
- T001, T002 (dependency installation)
- T003, T005, T007 (file/directory creation)

### Phase 2 (Foundational)
Tasks that can run in parallel:
- None (foundational tasks are sequential)

### Phase 3 (User Story 1)
Tasks that can run in parallel:
- T017 (unit tests) can be written while implementing T014-T016

### Phase 4 (User Story 2)
Tasks that can run in parallel:
- T024, T025, T026 (workspace route) independent of T021, T022, T023 (admin route)
- T028 (unit tests) can be written while implementing route guards

### Phase 5 (User Story 3)
Tasks that can run in parallel:
- T037, T039 (components) can be developed independently
- T041 (unit tests) can be written while implementing login flow

### Phase 6 (User Story 4)
Tasks that can run in parallel:
- T048-T054 (script implementation) can be developed incrementally
- T055 (unit tests) can be written while implementing script

### Phase 7 (Polish)
Tasks that can run in parallel:
- T061 (storage rules) independent of T062-T063 (error handling)
- T064, T065 (integration tests) can be written independently
- T068 (documentation) independent of testing tasks

---

## Testing Strategy

### Unit Tests (90%+ coverage goal for critical paths)

**Auth Provider**:
- `use-auth.test.ts`: Test auth state transitions (loading → unauthenticated → anonymous → admin)
- `use-auth.test.ts`: Test isAdmin derived correctly from idTokenResult.claims.admin

**Route Guards**:
- `AuthGuard.test.tsx`: Test redirects for unauthenticated, anonymous, non-admin users
- `AuthGuard.test.tsx`: Test admin users can access protected routes

**Components**:
- `LoginPage.test.tsx`: Test Google OAuth button click triggers signInWithPopup
- `LoginPage.test.tsx`: Test redirect logic based on admin status

**Scripts**:
- `grant-admin.test.ts`: Test email validation (valid, invalid, missing)
- `grant-admin.test.ts`: Test user lookup (exists, not exists)
- `grant-admin.test.ts`: Test anonymous user rejection
- `grant-admin.test.ts`: Test custom claims set correctly

### Integration Tests

**Guest Flow** (`guest-flow.test.ts`):
1. Navigate to `/guest/test-project` unauthenticated
2. Verify automatic anonymous sign-in
3. Verify guest page renders
4. Verify session persists on refresh

**Admin Flow** (`admin-flow.test.ts`):
1. Navigate to `/login` unauthenticated
2. Sign in with Google OAuth (mocked)
3. Verify redirect to `/admin` for admin user
4. Refresh page, verify admin access persists

### Manual Testing Checklist

**User Story 1** (Guest Auth):
- [ ] Visit `/guest/test-project` with no session → auto sign-in <2s
- [ ] Refresh page → session persists
- [ ] Admin user visits guest route → no sign-out

**User Story 2** (Admin Access):
- [ ] Unauthenticated user → `/admin` → redirect to `/login`
- [ ] Anonymous user → `/admin` → redirect to `/login`
- [ ] Non-admin authenticated → `/admin` → redirect to `/login`
- [ ] Admin user → `/admin` → access granted
- [ ] Refresh `/admin` → access persists

**User Story 3** (Admin Login):
- [ ] Visit `/login` → Google OAuth button visible
- [ ] Sign in as non-admin → waiting message appears
- [ ] Non-admin can access `/guest/test-project`
- [ ] Sign in as admin → redirect to `/admin`

**User Story 4** (Admin Grant):
- [ ] Run script with valid email → admin claim granted
- [ ] Run script with invalid email → error message
- [ ] User signs out and back in → receives admin access

---

## Task Summary

**Total Tasks**: 72

**Tasks by Phase**:
- Phase 1 (Setup): 7 tasks
- Phase 2 (Foundational): 6 tasks
- Phase 3 (US1 - Guest Auth): 7 tasks
- Phase 4 (US2 - Admin Access): 14 tasks
- Phase 5 (US3 - Admin Login): 12 tasks
- Phase 6 (US4 - Admin Grant): 14 tasks
- Phase 7 (Polish): 12 tasks

**Tasks by User Story**:
- US1 (P1 - Guest Auth): 7 tasks
- US2 (P1 - Admin Access): 14 tasks
- US3 (P2 - Admin Login): 12 tasks
- US4 (P3 - Admin Grant): 14 tasks
- Setup + Foundational: 13 tasks
- Polish: 12 tasks

**Parallelizable Tasks**: 14 tasks marked with [P]

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 (US1) = 20 tasks

**Success Criteria Coverage**:
- SC-001: T018 (guest auth <2s)
- SC-002: T030-T033 (unauthorized access blocked)
- SC-003: T045 (admin immediate access)
- SC-004: T033, T045 (admin persistence)
- SC-005: T043, T045 (clear feedback)
- SC-006: T029, T061 (security rules enforced)
- SC-007: T058 (re-auth required for claims)
- SC-008: Covered by Firebase SDK scalability (10k concurrent users)

---

## Format Validation

✅ All tasks follow checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
✅ All user story tasks include [US1], [US2], [US3], or [US4] label
✅ All parallelizable tasks include [P] marker
✅ All tasks include specific file paths
✅ Task IDs are sequential (T001-T072)
✅ Each phase has clear goals and validation criteria
✅ Each user story phase is independently testable

---

## Next Steps

1. **Start with MVP**: Implement Phase 1 + Phase 2 + Phase 3 (US1) for guest authentication
2. **Incremental Delivery**: Deploy US1, then US2, then US3, then US4
3. **Parallel Opportunities**: Use [P] markers to identify tasks that can run concurrently
4. **Validation**: Run `pnpm check && pnpm type-check` after each phase
5. **Testing**: Achieve 90%+ coverage for critical auth paths before deployment

Ready to begin implementation with `/speckit.implement` or manual task execution.
