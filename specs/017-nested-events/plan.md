# Implementation Plan: Nested Events

**Branch**: `017-nested-events` | **Date**: 2025-12-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/017-nested-events/spec.md`

## Summary

Implement Events as nested time-bound instances under Projects, migrating theme configuration from Project to Event level. This establishes the Company → Project → Event hierarchy with the switchboard pattern where `Project.activeEventId` determines which Event is live for guests.

**Key deliverables:**
- New `features/events/` module with full CRUD operations
- Event detail page with Experiences (placeholder) and Theme tabs
- EventThemeEditor adapted from existing ThemeEditor
- Updated Project Events tab with event list and management

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 19, Next.js 16
**Primary Dependencies**: Firebase Firestore, Zod 4.x, Tailwind CSS v4, shadcn/ui, lucide-react
**Storage**: Firebase Firestore (subcollection: `/projects/{projectId}/events/{eventId}`)
**Testing**: Jest + React Testing Library (unit tests only)
**Target Platform**: Web (mobile-first 320px-768px, responsive to desktop)
**Project Type**: Web application (monorepo: `web/` workspace)
**Performance Goals**: Events list < 1s load, theme preview < 100ms update, save < 2s
**Constraints**: Mobile-first design, Admin SDK for writes, Client SDK for reads
**Scale/Scope**: ~50 events per project max, single active event per project

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Events list and detail pages designed mobile-first (320px-768px), theme editor stacked layout on mobile, touch targets ≥44x44px
- [x] **Clean Code & Simplicity**: Reusing existing patterns from Projects module, no premature abstractions, adapting ThemeEditor rather than rewriting
- [x] **Type-Safe Development**: TypeScript strict mode, Zod schemas for Event validation, no `any` escapes
- [x] **Minimal Testing Strategy**: Jest unit tests for critical paths (event CRUD, theme update), tests co-located with source
- [x] **Validation Loop Discipline**: Plan includes validation tasks (lint, type-check, test) in quickstart
- [x] **Firebase Architecture Standards**: Admin SDK for event writes via Server Actions, Client SDK for real-time event list, schemas in `features/events/schemas/`
- [x] **Feature Module Architecture**: New `features/events/` module follows vertical slice pattern from `features/projects/`
- [x] **Technical Standards**: Following patterns from existing Projects feature module

**Complexity Violations**: None - straightforward adaptation of existing patterns.

## Project Structure

### Documentation (this feature)

```text
specs/017-nested-events/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── events-api.md    # Server Actions contract
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
web/src/features/events/          # NEW feature module
├── actions/
│   ├── index.ts
│   └── events.actions.ts         # createEvent, updateEvent, updateEventTheme, deleteEvent, setActiveEvent
├── components/
│   ├── index.ts
│   ├── EventCard.tsx             # Card for events list
│   ├── EventList.tsx             # Events list with empty state
│   ├── EventExperiencesTab.tsx   # WIP placeholder tab
│   └── designer/
│       ├── index.ts
│       └── EventThemeEditor.tsx  # Adapted from projects/ThemeEditor
├── hooks/
│   ├── index.ts
│   ├── useEvent.ts               # Single event real-time hook
│   └── useEvents.ts              # Events list real-time hook
├── repositories/
│   ├── index.ts
│   └── events.repository.ts      # Firestore CRUD operations
├── schemas/
│   ├── index.ts
│   └── events.schemas.ts         # Zod schemas for Event, EventTheme
├── types/
│   ├── index.ts
│   └── event.types.ts            # Event, EventTheme, EventExperienceLink types
├── constants.ts                   # EVENT_DEFAULTS, NAME_LENGTH, etc.
└── index.ts                       # Public exports (components, hooks, types)

web/src/app/(workspace)/[companySlug]/[projectId]/
├── events/
│   └── page.tsx                   # EXISTING: Events list (uses ProjectEventsTab) - UPDATE
├── [eventId]/
│   ├── page.tsx                   # EXISTING: Redirects to experiences - NO CHANGE
│   ├── experiences/
│   │   └── page.tsx               # EXISTING: Placeholder - UPDATE with EventExperiencesTab
│   └── theme/
│       └── page.tsx               # EXISTING: Placeholder - UPDATE with EventThemeEditor
└── layout.tsx                     # EXISTING: Project layout with tabs - NO CHANGE

web/src/features/projects/components/
└── ProjectEventsTab.tsx           # EXISTING: Placeholder - UPDATE with EventList
```

**Structure Decision**: Following established feature module pattern from `features/projects/`. Events are a subcollection under Projects in Firestore, but a separate feature module in code for clean separation.
