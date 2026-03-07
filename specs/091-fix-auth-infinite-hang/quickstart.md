# Quickstart: Fix Auth Infinite Hang

**Feature**: 091-fix-auth-infinite-hang
**Date**: 2026-03-06

## Overview

This feature fixes a bug where the application permanently hangs on "Initializing authentication..." when Firebase auth encounters a silent failure. Three changes are needed:

1. **Add try/catch** to the `onIdTokenChanged` callback in `AuthProvider.tsx`
2. **Add 10-second timeout** in the same `useEffect` to handle cases where the callback never fires
3. **Add timeout UI** in `__root.tsx` with a retry button

## Files to Modify

| File | Change |
| ---- | ------ |
| `apps/clementine-app/src/domains/auth/types/auth.types.ts` | Add `hasTimedOut: boolean` to `AuthState` |
| `apps/clementine-app/src/domains/auth/providers/AuthProvider.tsx` | Add try/catch, timeout, Sentry telemetry |
| `apps/clementine-app/src/app/__root.tsx` | Add timeout error state with retry button |

## Implementation Order

1. **Types first** — Update `AuthState` interface with `hasTimedOut`
2. **Provider second** — Add error handling, timeout, and telemetry to `AuthProvider`
3. **UI third** — Add timeout state rendering in `__root.tsx`
4. **Tests** — Unit tests for timeout and error handling

## Key Patterns

### Error handling pattern (matches existing codebase)

```typescript
// See useAnonymousSignIn.ts for the established pattern:
try {
  // async operations
} catch (err) {
  Sentry.captureException(err, {
    tags: { component: 'AuthProvider', action: 'init' },
  })
  // fall back to safe state
}
```

### Timeout pattern

```typescript
const timeoutId = setTimeout(() => {
  // set timed out state
}, 10_000)

// Clear on success or unmount
return () => clearTimeout(timeoutId)
```

## Validation

```bash
pnpm app:check       # Format + lint
pnpm app:type-check  # TypeScript
pnpm app:test        # Unit tests
```
