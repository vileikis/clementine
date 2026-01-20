# Implementation Plan: Guest Access & Welcome

**Branch**: `037-guest-welcome` | **Date**: 2026-01-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/037-guest-welcome/spec.md`

## Summary

Enable guests to access events via shareable links (`/join/:projectId`) and display the welcome screen with available experiences. This feature implements anonymous authentication, guest record creation, access validation, themed welcome screen rendering, experience selection, and session creation. The existing `/guest/$projectId` route will be migrated to `/join/$projectId` to match the epic specification.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: TanStack Start 1.132.0, TanStack Router 1.132.0, TanStack Query 5.66.5, React 19.2.0, Zod 4.1.12, Firebase SDK 12.5.0 (Auth, Firestore)
**Storage**: Firebase Firestore (client SDK)
**Testing**: Vitest (unit tests only, following Minimal Testing Strategy)
**Target Platform**: Web (mobile-first, 320px-768px primary viewport)
**Project Type**: TanStack Start web application (monorepo: `apps/clementine-app/`)
**Performance Goals**: Page load < 2 seconds on 4G, welcome screen render < 3 seconds
**Constraints**: Mobile-first design, 44x44px minimum touch targets
**Scale/Scope**: Guest-facing public pages, anonymous users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check (Phase 0)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | Guest welcome is mobile-first by design |
| II. Clean Code & Simplicity | ✅ PASS | Reusing existing patterns and components |
| III. Type-Safe Development | ✅ PASS | TypeScript strict mode, Zod validation for all external data |
| IV. Minimal Testing Strategy | ✅ PASS | Focus on critical guest flow tests only |
| V. Validation Gates | ✅ PASS | Will run `pnpm app:check` before commits |
| VI. Frontend Architecture | ✅ PASS | Client-first with Firebase client SDK |
| VII. Backend & Firebase | ✅ PASS | Client SDK for reads, security via Firestore rules |
| VIII. Project Structure | ✅ PASS | Following vertical slice architecture in guest domain |

### Post-Design Re-evaluation (Phase 1)

| Principle | Status | Verification |
|-----------|--------|--------------|
| I. Mobile-First Design | ✅ PASS | ExperienceCard with 44x44px min touch targets; list/grid layouts for mobile |
| II. Clean Code & Simplicity | ✅ PASS | Reusing useProject, useProjectEvent, useCreateSession, ThemeProvider; no new abstractions |
| III. Type-Safe Development | ✅ PASS | guestSchema with Zod; discriminated unions for GuestAccessState; typed hook contracts |
| IV. Minimal Testing Strategy | ✅ PASS | No test overhead in design; tests for critical guest flow only |
| V. Validation Gates | ✅ PASS | Quickstart includes `pnpm app:check` verification step |
| VI. Frontend Architecture | ✅ PASS | All data via Firebase client SDK; onSnapshot for real-time; no server functions |
| VII. Backend & Firebase | ✅ PASS | Guest record at /projects/{pid}/guests/{gid}; security rules documented in data-model.md |
| VIII. Project Structure | ✅ PASS | Vertical slice in guest domain with components/, hooks/, schemas/; barrel exports |

**All gates passed. Ready for Phase 2 task generation.**

**Standards to Apply:**
- **`frontend/data-fetching.md`** - TanStack Query + Firestore patterns (CRITICAL)
- `frontend/design-system.md` - Theme tokens, theming components
- `frontend/component-libraries.md` - shadcn/ui patterns
- `frontend/responsive.md` - Mobile-first breakpoints
- `frontend/routing.md` - TanStack Router patterns
- `backend/firestore.md` - Firestore client patterns
- `global/project-structure.md` - Vertical slice architecture

**Canonical Implementation Reference:**
- `domains/session/shared/hooks/` - Best example of query + mutation hooks
- `domains/session/shared/queries/session.query.ts` - Query key factory pattern

## Project Structure

### Documentation (this feature)

```text
specs/037-guest-welcome/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (internal APIs)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── app/
│   └── join/                           # NEW: Guest join routes
│       ├── route.tsx                   # Guest layout (Outlet, no sidebar)
│       ├── $projectId.tsx              # Welcome screen route
│       └── $projectId.experience/
│           └── $experienceId.tsx       # Experience placeholder route
├── domains/
│   └── guest/                          # Guest domain (vertical slice)
│       ├── containers/
│       │   ├── WelcomeScreenPage.tsx   # NEW: Welcome screen container
│       │   ├── ExperiencePlaceholder.tsx # NEW: Placeholder for E7
│       │   └── index.ts
│       ├── components/
│       │   ├── ErrorPage.tsx           # NEW: 404 error page
│       │   ├── ComingSoonPage.tsx      # NEW: Coming soon page
│       │   ├── ExperienceCard.tsx      # NEW: Clickable experience card
│       │   └── index.ts
│       ├── hooks/
│       │   ├── useGuestAccess.ts       # NEW: Access validation
│       │   ├── useGuestRecord.ts       # NEW: Guest record management
│       │   ├── usePublishedEvent.ts    # NEW: Published event data
│       │   └── index.ts
│       ├── schemas/
│       │   └── guest.schema.ts         # NEW: Guest record schema
│       └── index.ts

# Files to migrate/remove:
# - DELETE: app/guest/$projectId.tsx (replaced by app/join/$projectId.tsx)
# - DELETE: app/guest/route.tsx (replaced by app/join/route.tsx)
# - DELETE: app/guest/index.tsx (replaced by proper 404 handling)
# - MIGRATE: domains/guest/containers/GuestExperiencePage.tsx → WelcomeScreenPage.tsx
```

**Structure Decision**: Following existing vertical slice architecture. Guest domain already exists with containers - we'll add components, hooks, and schemas subdirectories. Routes move from `/guest/` to `/join/` to match epic specification.

## Complexity Tracking

> No violations - this implementation follows existing patterns and principles.

| Item | Notes |
|------|-------|
| Existing patterns | Reusing: useProject, useProjectEvent, useCreateSession, ThemeProvider |
| New components | ErrorPage, ComingSoonPage, ExperienceCard - all simple presentational |
| Route change | `/guest/` → `/join/` as specified in epic (breaking change but pre-production) |
