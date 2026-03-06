# Tasks: Fix Auth Infinite Hang

**Input**: Design documents from `/specs/091-fix-auth-infinite-hang/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Type system updates that all user stories depend on

- [x] T001 Add `hasTimedOut: boolean` field to `AuthState` interface in `apps/clementine-app/src/domains/auth/types/auth.types.ts`
- [x] T002 Add `hasTimedOut: false` to initial `authState` in `AuthProvider` useState call in `apps/clementine-app/src/domains/auth/providers/AuthProvider.tsx`

**Checkpoint**: Type system updated — `AuthState` now includes `hasTimedOut` flag, TypeScript compiles cleanly

---

## Phase 2: User Story 1 — Auth Initialization Timeout Recovery (Priority: P1) MVP

**Goal**: Prevent the app from permanently hanging on "Initializing authentication..." by adding a 10-second timeout that resolves the loading state

**Independent Test**: Open the app with network blocked to Firebase Auth endpoints. Verify the loading screen disappears within 10 seconds and shows a retry option.

### Implementation for User Story 1

- [x] T003 [US1] Add 10-second `setTimeout` in the `useEffect` of `AuthProvider` that sets `isLoading: false` and `hasTimedOut: true` when auth has not resolved — clear timeout on successful auth resolution or unmount in `apps/clementine-app/src/domains/auth/providers/AuthProvider.tsx`
- [x] T004 [US1] Add timeout error state in `RootLayout` — when `auth.hasTimedOut` is true, render a user-friendly message ("Authentication took too long") with a "Try Again" button that calls `window.location.reload()` in `apps/clementine-app/src/app/__root.tsx`

**Checkpoint**: App no longer hangs permanently — times out after 10s and shows retry UI

---

## Phase 3: User Story 2 — Auth Error Handling During Token Operations (Priority: P1)

**Goal**: Catch all unhandled promise rejections in the `onIdTokenChanged` callback so `isLoading` always resolves to `false`

**Independent Test**: Mock `user.getIdToken()` or `createSession()` to throw. Verify `isLoading` becomes `false` and the error is captured in Sentry.

### Implementation for User Story 2

- [x] T005 [US2] Wrap the async body of the `onIdTokenChanged` callback in a try/catch block — on error, call `Sentry.captureException` with `{ tags: { component: 'AuthProvider', action: 'onIdTokenChanged' } }` and set auth state to `{ user: null, isAdmin: false, isAnonymous: false, isLoading: false, hasTimedOut: false, idTokenResult: null }` in `apps/clementine-app/src/domains/auth/providers/AuthProvider.tsx`

**Checkpoint**: Auth errors no longer cause infinite hang — errors are caught, state resolves, and Sentry captures the exception

---

## Phase 4: User Story 3 — Auth Initialization Telemetry (Priority: P2)

**Goal**: Add Sentry breadcrumbs and console logs at key auth lifecycle points for production debugging

**Independent Test**: Open the app (success and failure paths). Check Sentry breadcrumbs / browser console for auth lifecycle entries with timestamps and durations.

### Implementation for User Story 3

- [x] T006 [US3] Add `Sentry.addBreadcrumb` and `console.info` log at auth initialization start (when `useEffect` runs), capturing timestamp in `apps/clementine-app/src/domains/auth/providers/AuthProvider.tsx`
- [x] T007 [US3] Add `Sentry.addBreadcrumb` and `console.info` log on successful auth resolution, including duration (elapsed time since start) in `apps/clementine-app/src/domains/auth/providers/AuthProvider.tsx`
- [x] T008 [US3] Add `Sentry.addBreadcrumb` and `console.warn` log on timeout, including elapsed duration in `apps/clementine-app/src/domains/auth/providers/AuthProvider.tsx`
- [x] T009 [US3] Add `console.error` log in the catch block (alongside existing `Sentry.captureException` from T005), including error type and message in `apps/clementine-app/src/domains/auth/providers/AuthProvider.tsx`

**Checkpoint**: All auth lifecycle events (start, success, error, timeout) are observable via Sentry breadcrumbs and console

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validation and final verification

- [x] T010 Run `pnpm app:check` (format + lint) from `apps/clementine-app/`
- [x] T011 Run `pnpm app:type-check` from `apps/clementine-app/`
- [ ] T012 Verify in local dev server (`pnpm app:dev`) — confirm happy path auth still works, then simulate failure and verify timeout + retry

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **US1 (Phase 2)**: Depends on Phase 1 (needs `hasTimedOut` type)
- **US2 (Phase 3)**: Depends on Phase 1 (needs `hasTimedOut` type) — can run in parallel with US1
- **US3 (Phase 4)**: Depends on Phase 2 and Phase 3 (adds telemetry to timeout and error handling code)
- **Polish (Phase 5)**: Depends on all previous phases

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Setup only — independent of other stories
- **User Story 2 (P1)**: Depends on Setup only — can run in parallel with US1 (modifies same file but different code section)
- **User Story 3 (P2)**: Depends on US1 + US2 (adds logging to the timeout and error handling code from those stories)

### Parallel Opportunities

- T001 and T002 are sequential (same file, T002 depends on T001's type)
- T003 and T005 can be done in parallel (timeout logic vs error handling — different sections of same file, but recommend sequential to avoid merge conflicts)
- T006, T007, T008, T009 are sequential (all modify the same useEffect in the same file)
- T010, T011 are sequential (lint before type-check)

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: US1 — Timeout (T003-T004)
3. Complete Phase 3: US2 — Error handling (T005)
4. **STOP and VALIDATE**: Auth never hangs permanently
5. Deploy if ready — telemetry can follow

### Full Delivery

1. Setup → US1 → US2 → US3 → Polish
2. Each phase builds on the previous
3. After US2, the core bug is fixed
4. US3 adds observability for ongoing monitoring

---

## Notes

- All implementation changes are in 3 files: `auth.types.ts`, `AuthProvider.tsx`, `__root.tsx`
- The `AuthProvider.tsx` file is modified by most tasks — recommend sequential execution to avoid conflicts
- Follow the existing error handling pattern from `useAnonymousSignIn.ts` (try/catch + Sentry)
- The retry mechanism is a simple `window.location.reload()` per research.md decision
