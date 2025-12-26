# Implementation Plan: Firebase Authentication & Authorization System

**Branch**: `002-auth-system` | **Date**: 2025-12-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-auth-system/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a secure Firebase-based authentication and authorization system that automatically authenticates guest users anonymously for event participation while restricting admin features to users with `admin: true` custom claims. The system will use Google OAuth for admin login, Firebase custom claims for authorization, and enforce security through client routing (UX), server functions, and Firestore/Storage security rules.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**: TanStack Start 1.132, React 19.2, Firebase SDK (Auth, Firestore, Admin), TanStack Router 1.132, TanStack Query 5.66
**Storage**: Firebase Firestore (NoSQL database), Firebase Storage (media)
**Testing**: Vitest 3.0, @testing-library/react 16.2
**Target Platform**: Web (modern browsers - Chrome, Firefox, Safari, Edge), responsive 320px-768px (mobile-first)
**Project Type**: Web application (full-stack React with client-first architecture)
**Performance Goals**: <2s page load on 4G, guest auth <2s, admin access immediate after login, support 10k concurrent anonymous users
**Constraints**: Mobile-first design (primary viewport 320px-768px), Firebase auth token expiry (1hr default), automatic anonymous sign-in on guest routes
**Scale/Scope**: Multi-route application (/login, /admin, /workspace, /guest/[projectId]), 3 route protection levels (unauthenticated, anonymous, admin), Firebase custom claims for authorization

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Mobile-First Design ✅ PASS

- Login page will be mobile-optimized (320px-768px primary viewport)
- All interactive elements (Google OAuth button, form inputs) meet 44x44px touch target minimum
- Performance target: <2s guest auth on 4G networks (spec SC-001: <2s access to event experiences)
- Testing required on real mobile devices before completion

**Justification**: Authentication is critical for both mobile guest users and desktop admin users. Mobile-first ensures optimal guest experience.

### II. Clean Code & Simplicity ✅ PASS

- YAGNI: Only implementing required auth features (no MFA, email verification, or account linking - explicitly out of scope)
- Single responsibility: Auth provider separate from route guards separate from security rules
- Small functions: Auth hooks, route guards, login components will be focused and small (<30 lines)
- No dead code: No commented-out code will be committed
- DRY: Auth state management centralized, route guard logic reusable

**Justification**: Auth system is straightforward - anonymous sign-in, Google OAuth, custom claims. No premature abstraction needed.

### III. Type-Safe Development ✅ PASS

- TypeScript strict mode enabled (already configured in project)
- All Firebase Auth types explicitly defined (User, IdTokenResult, CustomClaims)
- Zod validation for server-side admin grant script input (email validation)
- Runtime validation for custom claims in ID token
- No `any` types - all auth state, user objects, and claims fully typed

**Justification**: Firebase Auth provides strong TypeScript types. Custom claims and auth state require explicit typing to ensure security.

### IV. Minimal Testing Strategy ✅ PASS

- Vitest unit tests for critical flows:
  - Auto anonymous sign-in on `/guest/[projectId]`
  - Admin access check with custom claims
  - Route guard behavior (unauthenticated, anonymous, non-admin, admin)
- Focus on acceptance scenarios from spec (user stories 1-4)
- Coverage goal: 90%+ for auth critical path (aligns with constitution for critical flows)
- E2E testing deferred (out of scope per constitution)

**Justification**: Authentication is a critical path feature. High test coverage required to prevent security vulnerabilities.

### V. Validation Gates ✅ PASS

- Will run `pnpm check` (format + lint) before all commits
- Type-check required: `pnpm type-check` must pass
- Breaking changes verified in local dev server (`pnpm dev`) before commit
- All validation must pass before marking feature complete

**Justification**: Standard validation workflow applies. No special gate requirements for auth.

### VI. Frontend Architecture ✅ PASS

- **Client-first pattern**: Firebase Auth client SDK for all auth operations (signInAnonymously, signInWithPopup, getIdTokenResult)
- **SSR strategy**: `/login` route uses SSR only for metadata (SEO), auth logic is client-side
- **Security enforcement**: Route guards client-side (UX), Firestore/Storage rules enforce security (mandatory per FR-009)
- **Real-time**: Auth state changes handled via `onAuthStateChanged` listener
- **TanStack Router integration**: Route guards integrated with TanStack Router beforeLoad hooks

**Justification**: Firebase Auth is inherently client-first. Security rules are the true enforcement layer, client guards are UX only.

### VII. Backend & Firebase ✅ PASS

- **Client SDK**: Used for `signInAnonymously`, `signInWithPopup`, `getIdTokenResult`, `onAuthStateChanged`
- **Admin SDK**: Used ONLY for server-side admin grant script (`setCustomUserClaims`)
- **Security rules**: Firestore/Storage rules will check `request.auth.token.admin == true` for admin operations (FR-027)
- **Public URLs**: Not applicable for auth (no media storage in auth flow)

**Justification**: Auth follows hybrid pattern - client SDK for user-facing operations, Admin SDK for privileged operations (admin grant).

### VIII. Project Structure ✅ PASS

- **Vertical slice architecture**: Auth feature will be a single domain (`src/domains/auth/` or `src/integrations/firebase/auth/`)
- **Organized by technical concern**: Components (`LoginPage`, `AuthGuard`), hooks (`useAuth`, `useAdminCheck`), services (`authService`)
- **Explicit file naming**: `auth.service.ts`, `auth.hooks.ts`, `auth.types.ts`, `LoginPage.tsx`
- **Barrel exports**: `index.ts` re-exports public API (components, hooks, types)
- **Restricted public API**: Export hooks and components only, NOT internal auth services or claim validation logic

**Justification**: Auth is a bounded context - authentication and authorization concerns are isolated from other features.

### Gate Evaluation: ✅ ALL GATES PASS

**No violations detected.** Feature adheres to all constitution principles. Proceed to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/002-auth-system/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/clementine-app/
├── src/
│   ├── integrations/
│   │   └── firebase/
│   │       └── client.ts              # Firebase client SDK initialization (existing)
│   │
│   ├── domains/
│   │   └── auth/                      # NEW: Auth domain (all auth logic)
│   │       ├── index.ts               # Barrel export (public API)
│   │       ├── components/
│   │       │   ├── LoginPage.tsx      # Login page component
│   │       │   ├── AuthGuard.tsx      # Route guard component
│   │       │   └── WaitingMessage.tsx # Non-admin waiting message
│   │       ├── providers/
│   │       │   └── AuthProvider.tsx   # Auth context provider
│   │       ├── hooks/
│   │       │   └── use-auth.ts        # useAuth, useRequireAdmin hooks
│   │       ├── types/
│   │       │   └── auth.types.ts      # Auth TypeScript types
│   │       └── __tests__/
│   │           ├── use-auth.test.ts
│   │           └── AuthGuard.test.tsx
│   │
│   └── routes/
│       ├── __root.tsx                 # UPDATED: Root route with auth initialization
│       ├── login/                     # NEW: Login route
│       │   └── index.tsx
│       ├── admin/                     # NEW: Admin route (protected)
│       │   └── index.tsx
│       ├── workspace/                 # NEW: Workspace route (protected)
│       │   └── index.tsx
│       └── guest/
│           └── $projectId/            # NEW: Guest route (auto anonymous auth)
│               └── index.tsx
│
├── scripts/                           # NEW: Server-side admin management
│   └── grant-admin.ts                 # Admin privilege grant script (standalone)
│
└── firestore.rules                    # UPDATED: Add admin claim checks
```

**Structure Decision**: Web application structure following TanStack Start conventions with domain-driven design. Auth feature is organized as a single domain module:

1. **`src/domains/auth/`** - Complete auth domain (vertical slice)
   - Uses Firebase client SDK directly (imported from `@/integrations/firebase/client`)
   - Organized by technical concern (components, providers, hooks, types)
   - Encapsulates all authentication and authorization logic
   - Public API exported via barrel export (`index.ts`)

2. **`src/routes/`** - Route-level integration with auth guards
   - Root route handles global auth initialization (wait for auth ready)
   - Individual routes use auth context from providers

3. **`scripts/grant-admin.ts`** - Standalone server-side script
   - Uses Firebase Admin SDK (NOT included in app bundle)
   - Runs via `node scripts/grant-admin.ts <email>`
   - Completely separate from client application

**Key Architectural Decisions**:
- **No abstraction layer**: Firebase Auth SDK used directly (per architecture.md: "use them directly")
- **No admin SDK in app**: Admin SDK only in standalone script, never in app `src/`
- **Client-first**: 100% of in-app auth logic uses Firebase client SDK
- **Security via rules**: Firestore/Storage rules are the security boundary, not server code

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. This section is intentionally left empty.

---

## Post-Design Constitution Re-Evaluation

*Re-evaluated after Phase 1 design (research.md, data-model.md, contracts/, quickstart.md completed)*

### Re-Evaluation Results: ✅ ALL GATES STILL PASS

**Design Validation**:

1. **Mobile-First Design**: Confirmed in quickstart.md - login page and route guards designed for mobile-first (320px-768px)
2. **Clean Code & Simplicity**: Design artifacts show simple, focused implementation - no over-engineering detected
3. **Type-Safe Development**: TypeScript types defined in data-model.md and contracts/auth-api.md - all entities fully typed
4. **Minimal Testing Strategy**: Testing approach documented in quickstart.md - unit tests for critical flows, 90%+ coverage goal
5. **Validation Gates**: Standard validation workflow maintained - no special requirements
6. **Frontend Architecture**: Client-first pattern confirmed in research.md - Firebase client SDK for auth, security via rules
7. **Backend & Firebase**: Hybrid pattern validated - client SDK for user operations, Admin SDK only for admin grant
8. **Project Structure**: Vertical slice architecture confirmed in plan.md Project Structure section

**No new violations introduced during design phase.** Implementation can proceed with confidence that all constitution principles are satisfied.

---
