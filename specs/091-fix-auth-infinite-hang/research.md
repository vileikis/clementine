# Research: Fix Auth Infinite Hang

**Feature**: 091-fix-auth-infinite-hang
**Date**: 2026-03-06

## Root Cause Analysis

### Decision: Unhandled promise rejections in `onIdTokenChanged` callback

**Rationale**: The `AuthProvider.tsx` `useEffect` (line 63-95) registers an `async` callback with `onIdTokenChanged`. Inside this callback, three async operations execute sequentially without try/catch:

1. `user.getIdToken()` — network call to Firebase
2. `user.getIdTokenResult()` — network call to Firebase
3. `createSession({ data: { idToken } })` — server function call

If any of these throws (network failure, Firebase SDK error, server unreachable), the `setAuthState` call on line 75-81 is never reached, leaving `isLoading: true` permanently.

Additionally, if `onIdTokenChanged` never fires its callback (e.g., Firebase SDK fails to connect), there is no fallback — `isLoading` starts as `true` and nothing ever changes it.

**Alternatives considered**:
- Firebase SDK bug: Unlikely — the SDK's `onIdTokenChanged` correctly fires for null users. The issue is in our async callback handling.
- React re-render issue: Ruled out — `useState` updates are reliable; the problem is the update never being called.

## Error Handling Strategy

### Decision: Wrap async callback body in try/catch, fall back to unauthenticated state

**Rationale**: The `useAnonymousSignIn.ts` hook already demonstrates the correct pattern — it wraps all async operations in try/catch with Sentry error capture. The `AuthProvider` should follow the same established pattern.

On error, set `isLoading: false` with `user: null` (unauthenticated). This allows route guards to redirect to login, which is the expected behavior for unauthenticated users.

**Alternatives considered**:
- Retry on error: Rejected — adds complexity and could create infinite retry loops. The user can retry via the timeout UI.
- Show error inline in AuthProvider: Rejected — the provider should manage state, not UI. Error UI belongs in `__root.tsx`.

## Timeout Mechanism

### Decision: Independent `setTimeout` in `useEffect` with cleanup

**Rationale**: A simple `setTimeout` of 10 seconds in the same `useEffect` that registers the auth listener. If `isLoading` is still `true` when it fires, set auth state to unauthenticated with a `hasTimedOut: true` flag. Clear the timeout on successful auth resolution or unmount.

This approach:
- Is simple (no new dependencies, no complex state machines)
- Is React-idiomatic (cleanup on unmount)
- Handles both "callback never fires" and "callback fires but hangs" scenarios

**Alternatives considered**:
- `AbortController` / `Promise.race`: Rejected — `onIdTokenChanged` is a subscription, not a single promise. Cannot be aborted.
- Separate `useEffect` for timeout: Rejected — introduces coordination complexity between two effects. Single effect is simpler.
- Wrapper component with timeout: Rejected — unnecessary abstraction per Constitution Principle II.

## Telemetry Approach

### Decision: Sentry breadcrumbs + `captureException` for errors

**Rationale**: The codebase already uses Sentry extensively (`@sentry/tanstackstart-react`). Auth lifecycle events should use:
- `Sentry.addBreadcrumb()` for lifecycle tracking (start, success, timeout)
- `Sentry.captureException()` for actual errors (matching existing pattern in `AuthProvider` logout and `useAnonymousSignIn`)

Console logging is also added for development visibility.

**Alternatives considered**:
- Custom analytics events: Rejected — Sentry already provides the needed observability.
- Structured logging service: Rejected — over-engineering for this scope. Sentry breadcrumbs are sufficient.

## Timeout UI

### Decision: Simple error state in `__root.tsx` with retry button

**Rationale**: When `auth.hasTimedOut` is true, `RootLayout` renders an error message with a "Try Again" button that triggers a full page reload (`window.location.reload()`). This is the simplest approach because:
- Auth state is initialized in a `useEffect` — re-running it requires remounting `AuthProvider`
- A page reload cleanly resets all state including Firebase SDK connection
- No complex state reset logic needed

**Alternatives considered**:
- In-place retry via state reset: Rejected — would need to re-trigger `onIdTokenChanged` subscription, which requires unmounting and remounting the provider. A page reload achieves this more reliably.
- Navigate to a dedicated error page: Rejected — the timeout is transient and a simple retry usually resolves it.
