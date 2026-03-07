# Implementation Plan: Fix Auth Infinite Hang

**Branch**: `091-fix-auth-infinite-hang` | **Date**: 2026-03-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/091-fix-auth-infinite-hang/spec.md`

## Summary

Fix the `auth.isLoading` infinite hang that permanently blocks the application on the "Initializing authentication..." screen. The root cause is unhandled promise rejections in `AuthProvider.tsx`'s `onIdTokenChanged` callback — if `getIdToken()`, `getIdTokenResult()`, or `createSession()` throws, `isLoading` never becomes `false`. Additionally, if the callback never fires at all, there is no timeout to recover. The fix adds try/catch error handling in the auth callback, a 10-second timeout mechanism, telemetry logging via Sentry breadcrumbs, and a user-facing timeout error state with retry capability in `__root.tsx`.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: React 19, TanStack Start 1.132.0, Firebase SDK 12.5.0 (Auth), Sentry
**Storage**: N/A (no data model changes)
**Testing**: Vitest
**Target Platform**: Web (all browsers)
**Project Type**: Web application (monorepo — `apps/clementine-app/`)
**Performance Goals**: Auth initialization resolves within 10 seconds under all failure conditions; no regression on happy path
**Constraints**: Must not alter existing successful auth flow behavior; changes scoped to auth domain and root layout
**Scale/Scope**: 2 files modified (`AuthProvider.tsx`, `__root.tsx`), 1 type file updated (`auth.types.ts`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --------- | ------ | ----- |
| I. Mobile-First Design | PASS | No UI changes beyond a simple error/retry message that inherits existing centered layout |
| II. Clean Code & Simplicity | PASS | Adds minimal try/catch + timeout — no new abstractions, no over-engineering |
| III. Type-Safe Development | PASS | All new state fields will be fully typed in `AuthState` interface |
| IV. Minimal Testing Strategy | PASS | Unit tests for timeout and error handling logic |
| V. Validation Gates | PASS | Will run `pnpm app:check` + `pnpm app:type-check` before completion |
| VI. Frontend Architecture | PASS | Client-first pattern maintained; changes are in client auth provider |
| VII. Backend & Firebase | PASS | No backend changes; Firebase client SDK usage unchanged |
| VIII. Project Structure | PASS | Changes within existing `domains/auth/` vertical slice |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/091-fix-auth-infinite-hang/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal — type changes only)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (empty — no API contracts)
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── app/
│   └── __root.tsx                          # MODIFY: Add timeout UI + retry action
└── domains/
    └── auth/
        ├── providers/
        │   └── AuthProvider.tsx             # MODIFY: Add try/catch, timeout, telemetry
        └── types/
            └── auth.types.ts               # MODIFY: Add hasTimedOut to AuthState
```

**Structure Decision**: All changes are within the existing `domains/auth/` vertical slice and root layout. No new files, directories, or abstractions needed.
