# Implementation Plan: Event Outro & Share Configuration

**Branch**: `028-outro-screen` | **Date**: 2025-12-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/028-outro-screen/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Allow event organizers to configure the end-of-experience screen (Outro) and sharing options at the event level, with live preview. The implementation follows established patterns from the Welcome screen configuration, extending the Event model with `EventOutro` and `EventShareOptions` fields, and providing a dedicated configuration page with real-time preview.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 19, Next.js 16
**Primary Dependencies**: react-hook-form, Zod 4.x, shadcn/ui, Tailwind CSS v4, lucide-react
**Storage**: Firebase Firestore (extends existing Event document)
**Testing**: Jest unit tests (minimal testing strategy per constitution)
**Target Platform**: Web (mobile-first 320px-768px, desktop-enhanced)
**Project Type**: Web monorepo (`web/` workspace)
**Performance Goals**: Preview updates <100ms (perceived instant), page load <2s on 4G
**Constraints**: Mobile-first responsive, touch targets ≥44x44px, no external API calls for preview
**Scale/Scope**: Event-level configuration, 2 new data fields (outro, shareOptions), 1 new route

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Feature designed mobile-first (320px-768px), touch targets ≥44x44px, readable typography (≥14px) - follows Welcome screen responsive patterns (stacked layout on mobile, side-by-side on desktop)
- [x] **Clean Code & Simplicity**: No premature optimization, YAGNI applied, single responsibility maintained - reuses existing patterns (useAutoSave, PreviewShell, ThemeProvider), no new abstractions
- [x] **Type-Safe Development**: TypeScript strict mode, no `any` escapes, Zod validation for external inputs - Zod schemas for EventOutro and EventShareOptions
- [x] **Minimal Testing Strategy**: Jest unit tests for critical paths (70%+ coverage goal), tests co-located with source - focus on schema validation tests
- [x] **Validation Loop Discipline**: Plan includes validation tasks (lint, type-check, test) before completion
- [x] **Firebase Architecture Standards**: Admin SDK for writes/server-side, Client SDK for real-time reads, schemas in `features/events/schemas/`, public images stored as full URLs
- [x] **Technical Standards**: Follows patterns from `standards/frontend/components.md`, `standards/backend/firebase.md`

**Complexity Violations**: None. Feature follows established patterns from Welcome screen configuration.

## Project Structure

### Documentation (this feature)

```text
specs/028-outro-screen/
├── plan.md              # This file
├── research.md          # Phase 0 output - pattern research
├── data-model.md        # Phase 1 output - EventOutro, EventShareOptions
├── quickstart.md        # Phase 1 output - implementation guide
├── contracts/           # Phase 1 output - server actions
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
web/src/
├── features/events/
│   ├── actions/
│   │   └── events.actions.ts           # Add updateEventOutroAction
│   ├── components/
│   │   └── outro/                      # NEW: Outro configuration components
│   │       ├── index.ts
│   │       ├── OutroSection.tsx        # Form section for outro fields
│   │       ├── ShareOptionsSection.tsx # Form section for share toggles
│   │       └── OutroPreview.tsx        # Live preview component
│   ├── repositories/
│   │   └── events.repository.ts        # Add updateEventOutro method
│   ├── schemas/
│   │   └── event.schemas.ts            # Add eventOutroSchema, eventShareOptionsSchema
│   └── types/
│       └── event.types.ts              # Add EventOutro, EventShareOptions interfaces
├── features/guest/
│   └── components/
│       └── outro/                      # NEW: Guest-facing outro screen
│           ├── index.ts
│           └── OutroContent.tsx        # Guest outro display component
└── app/(workspace)/[companySlug]/[projectId]/[eventId]/
    └── outro/                          # NEW: Admin route
        └── page.tsx                    # Outro configuration page
```

**Structure Decision**: Extends existing `web/src/features/events/` module for admin configuration, adds guest-facing component to `web/src/features/guest/`, and creates new route at `/[companySlug]/[projectId]/[eventId]/outro/`. Follows vertical slice architecture (Constitution Principle VII).

## Complexity Tracking

> No complexity violations. Feature follows established Welcome screen patterns.
