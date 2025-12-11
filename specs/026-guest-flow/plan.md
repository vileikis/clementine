# Implementation Plan: Guest Flow

**Branch**: `026-guest-flow` | **Date**: 2024-12-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/026-guest-flow/spec.md`

## Summary

Implement guest-facing flow enabling visitors to access branded event experiences via shareable project links (`/join/[projectId]`). The feature covers:
- Welcome screen displaying event branding, hero media, and available experiences
- Anonymous Firebase authentication for guest tracking
- Guest and session record management in Firestore
- URL-based state management with query parameters (`?exp={id}&s={sessionId}`)
- Theme integration from existing theming module

Technical approach: Extend the existing `features/guest/` module, reuse welcome screen components from `features/events/`, implement anonymous auth via Firebase Client SDK, and store guest/session records in project subcollections using Admin SDK via Server Actions.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 19, Next.js 16
**Primary Dependencies**: Firebase (Auth, Firestore), Zod 4.x, Tailwind CSS v4, shadcn/ui
**Storage**: Firebase Firestore (collections: `/projects/{projectId}/guests`, `/projects/{projectId}/sessions`)
**Testing**: Jest + React Testing Library (co-located tests, 70%+ coverage for critical paths)
**Target Platform**: Web (mobile-first: 320px-768px primary, tablet/desktop secondary)
**Project Type**: Web application (Next.js monorepo)
**Performance Goals**: Page load <3 seconds including authentication, theme applied instantly
**Constraints**: Mobile-first design, touch targets ≥44x44px, offline-tolerant (graceful error handling)
**Scale/Scope**: Single page route with query param state management, ~5-7 new components

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Guest flow designed mobile-first (320px-768px), reuses existing mobile-optimized components from welcome preview, touch targets ≥44x44px
- [x] **Clean Code & Simplicity**: Reuses existing components (WelcomePreview, ExperienceCards), minimal new abstractions, follows existing patterns
- [x] **Type-Safe Development**: TypeScript strict mode, Zod schemas for Guest/Session records, validated URL params
- [x] **Minimal Testing Strategy**: Jest unit tests for auth hook and session management, tests co-located with source
- [x] **Validation Loop Discipline**: Plan includes lint, type-check, test validation before completion
- [x] **Firebase Architecture Standards**: Admin SDK for guest/session writes via Server Actions, Client SDK for anonymous auth and real-time reads, schemas in `features/guest/schemas/`
- [x] **Feature Module Architecture**: All new code in `features/guest/` following vertical slice pattern, barrel exports, feature-local schemas

**Complexity Violations**: None - feature uses existing patterns and reuses components.

## Project Structure

### Documentation (this feature)

```text
specs/026-guest-flow/
├── plan.md              # This file
├── research.md          # Phase 0 output - codebase research findings
├── data-model.md        # Phase 1 output - Guest/Session entities
├── quickstart.md        # Phase 1 output - implementation guide
├── contracts/           # Phase 1 output - Server Action contracts
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
web/src/
├── app/(public)/join/[projectId]/
│   ├── layout.tsx           # Existing - validates project, provides context
│   └── page.tsx             # UPDATE - Welcome/Experience screen routing
│
├── features/guest/
│   ├── index.ts             # Public exports (components, hooks, types)
│   ├── types/
│   │   ├── index.ts
│   │   └── guest.types.ts   # NEW - Guest, Session, GuestAuthState types
│   ├── schemas/
│   │   ├── index.ts
│   │   └── guest.schemas.ts # NEW - Zod schemas for Guest, Session
│   ├── repositories/
│   │   ├── index.ts
│   │   └── guests.repository.ts    # NEW - Firestore CRUD (server-only)
│   ├── actions/
│   │   ├── index.ts
│   │   └── guests.actions.ts       # NEW - Server Actions
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── use-guest-auth.ts       # NEW - Anonymous auth hook
│   │   └── use-session.ts          # NEW - Session state hook
│   └── components/
│       ├── index.ts
│       ├── guest-provider.tsx      # NEW - Auth + context provider
│       ├── welcome-screen.tsx      # NEW - Wraps WelcomePreview for guest flow
│       ├── experience-screen.tsx   # NEW - Placeholder experience view
│       └── loading-screen.tsx      # NEW - Auth/data loading state
│
├── features/events/components/welcome/
│   ├── WelcomePreview.tsx   # REUSE - Main welcome layout
│   ├── ExperienceCards.tsx  # REUSE - Experience list/grid
│   └── ExperienceCard.tsx   # REUSE - Individual experience card
│
└── features/theming/
    ├── ThemeProvider.tsx    # REUSE - Theme context
    ├── ThemedBackground.tsx # REUSE - Background styling
    └── hooks/use-event-theme.ts # REUSE - Theme values hook
```

**Structure Decision**: Extends existing `features/guest/` module following the established vertical slice architecture. Reuses welcome screen components from `features/events/` and theming from `features/theming/`. New Server Actions follow existing patterns from projects/events modules.

## Complexity Tracking

> No complexity violations - feature uses established patterns and reuses existing infrastructure.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       | N/A        | N/A                                  |
