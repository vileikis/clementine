# Implementation Plan: Server Session Workspace Persistence

**Branch**: `010-session-workspace-persistence` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-session-workspace-persistence/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Migrate "last visited workspace" persistence from client-side localStorage (Zustand) to server-side session storage, enabling server-side redirects via `beforeLoad` and eliminating flash of loading state. This aligns workspace persistence with the existing auth session architecture, providing cross-device consistency and instant redirects without client-side hydration dependencies.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**: TanStack Start 1.132, React 19.2, Firebase SDK (Firestore client, Admin), TanStack Router 1.132, TanStack Query 5.66, Zustand 5.x (to be removed)
**Storage**: Server session storage (encrypted HTTP-only cookie via TanStack Start), Firebase Firestore (read-only workspace data)
**Testing**: Vitest (unit tests), manual verification in browser
**Target Platform**: Web (SSR + CSR via TanStack Start)
**Project Type**: Web application (monorepo: `apps/clementine-app/`)
**Performance Goals**: Instant server-side redirect (<50ms), no visible loading state on `/workspace` route
**Constraints**: Must preserve existing session data (userId, email, isAdmin, isAnonymous) when updating workspace preference, session cookie max size ~4KB
**Scale/Scope**: Single workspace preference per user session, affects 3 routes, removes 1 Zustand store, adds 1 server function

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Design ✅
- **Status**: PASS
- **Rationale**: This is a backend/session architecture change with no UI modifications. Existing mobile-optimized UI (tested on real devices) remains unchanged. Redirect performance improvement benefits mobile users (faster navigation, no loading flash).

### Principle II: Clean Code & Simplicity ✅
- **Status**: PASS
- **Rationale**: Feature REDUCES complexity by removing Zustand store and localStorage dependency. Aligns workspace session with existing auth session pattern (DRY). Server-side redirect in `beforeLoad` is simpler than client-side `useEffect` logic.

### Principle III: Type-Safe Development ✅
- **Status**: PASS
- **Rationale**: All new code uses TypeScript strict mode. Session data interfaces will be extended with proper types. Server function will validate input with `.inputValidator()`. No `any` types introduced.

### Principle IV: Minimal Testing Strategy ✅
- **Status**: PASS
- **Rationale**: Testing approach is pragmatic - manual verification in browser for redirect flows, unit tests for session update logic if time permits. Not a critical path (no payment/AI generation), so 70% coverage goal appropriate.

### Principle V: Validation Gates ✅
- **Status**: PASS
- **Rationale**: Will run `pnpm app:check` (lint, format, type-check) before commit. Will verify redirects work in local dev server. Standards compliance review will cover:
  - `frontend/architecture.md` - Server function patterns
  - `global/code-quality.md` - Clean code, validation workflow
  - `global/project-structure.md` - Auth domain file organization

### Principle VI: Frontend Architecture ✅
- **Status**: PASS
- **Rationale**: Feature uses **client-first pattern** for workspace data (Firebase client SDK via TanStack Query). Server function (`setLastVisitedWorkspaceFn`) used ONLY for session mutation (server-side state). SSR used strategically in `beforeLoad` for instant redirects.

### Principle VII: Backend & Firebase ✅
- **Status**: PASS
- **Rationale**: No changes to Firestore rules or workspace data model. Workspace reads continue using Firebase client SDK. Session storage is server-only (encrypted cookie). No Admin SDK changes needed (session management is framework-level).

### Principle VIII: Project Structure ✅
- **Status**: PASS
- **Rationale**: Changes follow vertical slice architecture. New server function in `auth/server/functions.ts` (auth domain owns session). Session type extensions in `auth/types/session.types.ts`. Removal of `workspace/store/` aligns with domain boundaries (workspace domain should not manage session state).

### Standards Compliance References
- **Global Standards**: `code-quality.md`, `project-structure.md`, `security.md`
- **Frontend Standards**: `architecture.md` (client-first, SSR strategy)
- **Backend Standards**: `firestore.md` (client SDK for reads)

**GATE STATUS: ✅ PASS** - All principles satisfied. No complexity violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (apps/clementine-app/)

```text
apps/clementine-app/src/
├── domains/
│   ├── auth/
│   │   ├── types/
│   │   │   └── session.types.ts          # MODIFY: Extend SessionData, SessionUser
│   │   ├── server/
│   │   │   ├── session.server.ts         # READ: useAppSession configuration
│   │   │   ├── functions.ts              # MODIFY: Add setLastVisitedWorkspaceFn,
│   │   │   │                             #         Update createSessionFn
│   │   │   └── index.ts                  # MODIFY: Export new server function
│   │   ├── guards/
│   │   │   └── guards.ts                 # READ: Pattern reference
│   │   └── index.ts                      # No changes (server functions not exported)
│   │
│   └── workspace/
│       ├── store/
│       │   └── useWorkspaceStore.ts      # DELETE: Remove Zustand store
│       ├── hooks/
│       │   └── useWorkspace.ts           # READ: Workspace query pattern
│       └── index.ts                      # MODIFY: Remove store export
│
└── app/
    └── workspace/
        ├── route.tsx                     # READ: Parent layout (no changes)
        ├── index.tsx                     # MODIFY: Replace client redirect with beforeLoad
        └── $workspaceSlug.tsx            # MODIFY: Replace Zustand with server function call

tests/                                     # ADD: Unit tests for session logic
└── domains/
    └── auth/
        └── server/
            └── functions.test.ts         # ADD: Test setLastVisitedWorkspaceFn
```

**Structure Decision**: Web application using vertical slice architecture in TanStack Start app. Changes are isolated to:
1. **Auth domain** - Session type extensions and new server function (auth domain owns session)
2. **Workspace domain** - Remove store (domain boundary violation - session is auth concern)
3. **Routes** - Update redirect logic to use server-side session instead of client localStorage

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations** - Feature simplifies architecture by removing Zustand dependency and aligning with existing session pattern.
