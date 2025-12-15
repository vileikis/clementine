# Implementation Plan: Event Frame Overlay Configuration

**Branch**: `027-output-config` | **Date**: 2025-12-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/027-output-config/spec.md`

## Summary

Add frame overlay configuration at the event level, allowing event organizers to upload frame images per aspect ratio (square 1:1, story 9:16), toggle them on/off without losing the uploaded asset, and preview how frames will appear on generated images. This extends the Event data model with an `overlay` field and creates a dedicated `/overlays` settings page following existing event settings patterns.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Next.js 16, React 19
**Primary Dependencies**: Tailwind CSS v4, shadcn/ui, Zod 4.x, Firebase (Admin SDK + Client SDK), react-hook-form
**Storage**: Firebase Firestore (Event documents), Firebase Storage (frame images at `media/{companyId}/frames/`)
**Testing**: Jest unit tests (minimal testing strategy per Constitution)
**Target Platform**: Web (mobile-first 320px-768px primary, desktop secondary)
**Project Type**: Web application (Next.js App Router monorepo)
**Performance Goals**: Frame upload/save < 2 seconds, preview update immediate
**Constraints**: Mobile-first design, touch targets ≥44x44px, frame images as full public URLs
**Scale/Scope**: Single event-level configuration page, 2 aspect ratios (square, story)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Feature designed mobile-first (320px-768px), touch targets ≥44x44px, readable typography (≥14px)
- [x] **Clean Code & Simplicity**: No premature optimization, YAGNI applied, single responsibility maintained
- [x] **Type-Safe Development**: TypeScript strict mode, no `any` escapes, Zod validation for external inputs
- [x] **Minimal Testing Strategy**: Jest unit tests for critical paths (70%+ coverage goal), tests co-located with source
- [x] **Validation Loop Discipline**: Plan includes validation tasks (lint, type-check, test) before completion
- [x] **Firebase Architecture Standards**: Admin SDK for writes/server-side, Client SDK for real-time reads, schemas in `features/events/schemas/`, public images stored as full URLs
- [x] **Feature Module Architecture**: Extends existing `features/events/` module, follows vertical slice pattern
- [x] **Technical Standards**: Applicable standards from `standards/` reviewed and referenced

**Complexity Violations**: None - this feature follows existing patterns (EventThemeEditor, WelcomePreview) without introducing new abstractions.

## Project Structure

### Documentation (this feature)

```text
specs/027-output-config/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (server actions)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
web/src/
├── features/events/
│   ├── actions/
│   │   └── events.actions.ts        # Add updateEventOverlayAction
│   ├── components/
│   │   └── overlay/                 # NEW: Overlay configuration components
│   │       ├── OverlaySection.tsx       # Main form section
│   │       ├── OverlayPreview.tsx       # Preview with frame overlay
│   │       ├── FrameCard.tsx            # Per-aspect ratio card
│   │       └── index.ts
│   ├── schemas/
│   │   └── events.schemas.ts        # Add overlay schemas
│   ├── types/
│   │   └── event.types.ts           # Add overlay types
│   ├── repositories/
│   │   └── events.repository.ts     # Add overlay repository functions
│   └── constants.ts                 # Add overlay defaults
└── app/(workspace)/[companySlug]/[projectId]/[eventId]/
    └── overlays/
        └── page.tsx                 # NEW: Overlays settings page
```

**Structure Decision**: Extends existing `features/events/` module following established patterns. Overlay components in `components/overlay/` subfolder similar to `components/welcome/` and `components/designer/`. New route at `overlays/page.tsx` following existing settings page pattern.

## Complexity Tracking

_No violations - feature uses existing patterns without new abstractions._

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       | N/A        | N/A                                  |
