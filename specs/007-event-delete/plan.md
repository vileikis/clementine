# Implementation Plan: Delete Event (Soft Delete)

**Branch**: `007-event-delete` | **Date**: 2025-11-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-event-delete/spec.md`

## Summary

Add soft delete functionality for events, allowing administrators to delete events from the event list page with confirmation. Events are marked as "deleted" rather than physically removed, preserving data integrity. Delete functionality is intentionally NOT available in the Event Studio to prevent accidental deletion while editing.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16 (App Router), React 19, Zod 4.x, shadcn/ui (AlertDialog), lucide-react (Trash2 icon)
**Storage**: Firebase Firestore (existing `/events` collection)
**Testing**: Jest for unit tests (repository and action tests)
**Target Platform**: Web (mobile-first responsive design)
**Project Type**: Monorepo with pnpm workspaces (web workspace)
**Performance Goals**: Delete operation completes in < 3 seconds
**Constraints**: Mobile-first (320px-768px primary viewport), touch targets ≥44x44px
**Scale/Scope**: Single event deletion, existing event list page modification

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Delete button meets 44x44px touch target, dialog works on mobile viewport
- [x] **Clean Code & Simplicity**: Following existing patterns (companies soft delete), no new abstractions
- [x] **Type-Safe Development**: TypeScript strict mode, Zod validation for eventId, schema updates for "deleted" status
- [x] **Minimal Testing Strategy**: Unit tests for deleteEvent repository function and deleteEventAction
- [x] **Validation Loop Discipline**: Plan includes validation tasks (lint, type-check, test) before completion
- [x] **Firebase Architecture Standards**: Admin SDK for delete operation via Server Action, query filter for deleted events
- [x] **Technical Standards**: Following existing events feature patterns, shadcn/ui for dialog

**Complexity Violations**: None - this feature follows existing patterns and adds minimal new code.

## Project Structure

### Documentation (this feature)

```text
specs/007-event-delete/
├── plan.md              # This file
├── research.md          # Phase 0 output (patterns from companies)
├── data-model.md        # Phase 1 output (schema changes)
├── quickstart.md        # Phase 1 output (implementation guide)
├── contracts/           # Phase 1 output (Server Action contract)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
web/src/features/events/
├── schemas/
│   └── events.schemas.ts        # UPDATE: Add "deleted" to eventStatusSchema, add deletedAt field
├── types/
│   └── event.types.ts           # UPDATE: Add deletedAt to Event type
├── repositories/
│   └── events.ts                # UPDATE: Add deleteEvent function, modify listEvents to filter deleted
├── actions/
│   └── events.ts                # UPDATE: Add deleteEventAction
└── components/
    └── studio/
        └── EventCard.tsx        # UPDATE: Add delete button with AlertDialog
```

**Structure Decision**: Extending existing events feature module following established patterns. No new directories needed.

## Complexity Tracking

> No violations - feature follows existing soft delete pattern from companies feature.
