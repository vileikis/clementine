# Implementation Plan: Journey Init

**Branch**: `005-journey-init` | **Date**: 2024-11-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-journey-init/spec.md`

## Summary

Create the Journey feature module with CRUD operations (create, read, soft-delete), list view with empty state, active journey toggle (switchboard pattern), and placeholder detail view. This establishes the foundation for guest experience flow management without implementing the journey editor or steps collection.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16, React 19, Zod 4.x, Firebase Admin SDK, shadcn/ui
**Storage**: Firebase Firestore (`/journeys/{journeyId}` collection)
**Testing**: Jest with React Testing Library
**Target Platform**: Web (mobile-first responsive, 320px-768px primary)
**Project Type**: Web (Next.js App Router monorepo)
**Performance Goals**: Journey list loads in <2 seconds for up to 50 journeys
**Constraints**: Mobile-first design, touch targets ≥44x44px, Admin SDK for all writes
**Scale/Scope**: Up to 50 journeys per event, single tenant per event

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Journey list, cards, dialogs designed mobile-first (320px-768px), toggle switches ≥44x44px, readable typography (≥14px)
- [x] **Clean Code & Simplicity**: Following existing feature module patterns (companies, events), no new abstractions needed, YAGNI applied
- [x] **Type-Safe Development**: TypeScript strict mode, Zod validation for journey name input and IDs, typed ActionResponse pattern
- [x] **Minimal Testing Strategy**: Jest unit tests for server actions and repository (critical paths), tests co-located with source
- [x] **Validation Loop Discipline**: Plan includes validation tasks (lint, type-check, test) before completion
- [x] **Firebase Architecture Standards**: Admin SDK for all writes (create, delete, set active), schemas in feature module, soft delete pattern
- [x] **Technical Standards**: Applicable standards from `standards/` reviewed - follows existing feature module conventions

**Complexity Violations**: None. This feature follows established patterns from companies and events features.

## Project Structure

### Documentation (this feature)

```text
specs/005-journey-init/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (server action signatures)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
web/src/features/journeys/
├── actions/
│   ├── index.ts              # Type exports only (no Server Actions)
│   ├── journeys.ts           # Server Actions (create, list, get, delete)
│   └── types.ts              # ActionResponse types, ErrorCodes
├── components/
│   ├── index.ts              # Component barrel export
│   ├── JourneyCard.tsx       # Individual journey display with toggle
│   ├── JourneyList.tsx       # List with empty state handling
│   ├── CreateJourneyDialog.tsx
│   └── DeleteJourneyDialog.tsx
├── repositories/
│   ├── index.ts
│   └── journeys.repository.ts  # Firestore operations
├── schemas/
│   ├── index.ts
│   └── journeys.schemas.ts   # Zod schemas
├── types/
│   ├── index.ts
│   └── journeys.types.ts     # TypeScript interfaces
├── constants.ts              # Validation constraints
└── index.ts                  # Main barrel export

web/src/app/events/[eventId]/journeys/
├── page.tsx                  # Journey list page
└── [journeyId]/
    └── page.tsx              # Journey detail WIP page
```

**Structure Decision**: Following established feature module pattern from `web/src/features/companies/` and `web/src/features/events/`. Routes follow existing App Router conventions.

## Complexity Tracking

No complexity violations. This feature:
- Follows established feature module patterns
- Reuses existing `updateEventSwitchboardAction` for active journey toggle
- Uses standard shadcn/ui components (Dialog, Button, Input, Switch, Card)
- Implements soft delete pattern identical to companies feature
