# Data Model: Fix Auth Infinite Hang

**Feature**: 091-fix-auth-infinite-hang
**Date**: 2026-03-06

## Entity Changes

### AuthState (modified)

Existing interface in `domains/auth/types/auth.types.ts`. One new field added:

| Field | Type | Description | Change |
| ----- | ---- | ----------- | ------ |
| user | `User \| null` | Firebase Auth user | Existing |
| isAdmin | `boolean` | Admin custom claim | Existing |
| isAnonymous | `boolean` | Anonymous user flag | Existing |
| isLoading | `boolean` | Auth initialization in progress | Existing |
| idTokenResult | `TypedIdTokenResult \| null` | ID token with claims | Existing |
| **hasTimedOut** | **`boolean`** | **Whether auth initialization exceeded the 10s timeout** | **New** |

### State Transitions

```
Initial State:     { isLoading: true,  hasTimedOut: false }
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    Auth Success    Auth Error      Timeout (10s)
          │               │               │
          ▼               ▼               ▼
  { isLoading: false, { isLoading: false, { isLoading: false,
    hasTimedOut: false,  hasTimedOut: false,  hasTimedOut: true,
    user: User }         user: null }         user: null }
```

No database changes. No new collections or documents. No Firestore schema changes.
