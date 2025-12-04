# Implementation Plan: Event Experiences & Extras (General Tab)

**Branch**: `019-event-experiences` | **Date**: 2024-12-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/019-event-experiences/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement the **General Tab** for Events, enabling attachment of guest-facing **Experiences** and **Extras** (slot-based flows like pre-entry gates and pre-reward surveys). This transforms the placeholder "Experiences" tab into a functional configuration interface with two sections: a grid of guest-selectable experiences with enable/disable toggles, and two extra slots for pre-entry gate and pre-reward flows.

**Technical Approach:**
- Extend existing `EventExperienceLink` type with `enabled` boolean and optional `frequency` field
- Add `EventExtras` object to Event schema with two slot fields
- Create new server actions for experience/extras CRUD operations using existing patterns
- Build drawer-based UI using shadcn Sheet component (right-side drawers)
- Use real-time hooks pattern for fetching company experiences

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui, Zod 4.x
**Storage**: Firebase Firestore (existing `/projects/{projectId}/events/{eventId}` collection)
**Testing**: Jest (minimal testing per constitution - critical paths only)
**Target Platform**: Web (mobile-first, 320px-768px primary)
**Project Type**: Web monorepo (pnpm workspace)
**Performance Goals**: Page load < 2s on 4G, drawer interactions < 300ms
**Constraints**: Mobile-first touch targets (44x44px min), Admin SDK for all writes
**Scale/Scope**: Single feature module extension, ~15 new components, 6 server actions

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Feature designed mobile-first (320px-768px), touch targets ≥44x44px, readable typography (≥14px)
  - All drawer components will be full-width or near-full-width on mobile
  - Toggle switches and buttons will meet 44x44px minimum touch targets
  - Cards will stack vertically on mobile viewports
- [x] **Clean Code & Simplicity**: No premature optimization, YAGNI applied, single responsibility maintained
  - Following existing codebase patterns (dialogs, server actions, repositories)
  - No new architectural patterns introduced
  - Single-purpose components (one card type, one drawer type per use case)
- [x] **Type-Safe Development**: TypeScript strict mode, no `any` escapes, Zod validation for external inputs
  - All new types defined with TypeScript interfaces
  - Zod schemas for all server action inputs
  - Runtime validation on all mutations
- [x] **Minimal Testing Strategy**: Jest unit tests for critical paths (70%+ coverage goal), tests co-located with source
  - Server actions will have unit tests for validation and error paths
  - Components will have basic render tests
- [x] **Validation Loop Discipline**: Plan includes validation tasks (lint, type-check, test) before completion
  - Each implementation phase will include validation loop
- [x] **Firebase Architecture Standards**: Admin SDK for writes/server-side, Client SDK for real-time reads, schemas in `features/events/schemas/`, public images stored as full URLs
  - All mutations via Server Actions with Admin SDK
  - Experience list fetching via hooks with Client SDK
  - Schemas added to existing `features/events/schemas/events.schemas.ts`
- [x] **Feature Module Architecture**: Vertical slice architecture followed
  - All new code within `features/events/` module
  - Components organized in `components/general/` subdirectory
  - Barrel exports at each directory level
- [x] **Technical Standards**: Applicable standards from `standards/` reviewed and referenced
  - `standards/backend/firebase.md` for Firebase patterns
  - `standards/frontend/components.md` for React patterns
  - `standards/frontend/responsive.md` for mobile-first design

**Complexity Violations**: None - this feature follows existing patterns without introducing new abstractions.

## Project Structure

### Documentation (this feature)

```text
specs/019-event-experiences/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── server-actions.ts # Server action signatures and Zod schemas
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
web/src/features/events/
├── types/
│   └── event.types.ts           # Update: EventExperienceLink, EventExtras, ExtraSlotFrequency
├── schemas/
│   └── events.schemas.ts        # Update: New Zod schemas for experiences/extras
├── repositories/
│   └── events.repository.ts     # Update: New repository functions for array operations
├── actions/
│   └── events.actions.ts        # Update: 6 new server actions
├── hooks/
│   ├── useEvent.ts             # (existing)
│   ├── useCompanyExperiences.ts # New: Real-time company experiences list
│   └── useExperienceDetails.ts  # New: Batch fetch experience details
├── constants.ts                 # Update: EXTRA_SLOTS, EXTRA_FREQUENCIES
└── components/
    ├── EventDetailsHeader.tsx   # Update: Tab rename to "General"
    ├── EventExperiencesTab.tsx  # Delete: Replaced by EventGeneralTab
    └── general/
        ├── index.ts
        ├── EventGeneralTab.tsx
        ├── experiences/
        │   ├── index.ts
        │   ├── ExperiencesSection.tsx
        │   ├── AddExperienceCard.tsx
        │   ├── EventExperienceCard.tsx
        │   ├── ExperiencePickerDrawer.tsx
        │   └── EventExperienceDrawer.tsx
        └── extras/
            ├── index.ts
            ├── ExtrasSection.tsx
            ├── ExtraSlotCard.tsx
            └── ExtraSlotDrawer.tsx

web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/
├── layout.tsx                   # (existing - no changes needed)
├── general/
│   └── page.tsx                 # New: Route for General tab (replaces experiences/)
└── experiences/
    └── page.tsx                 # Delete: Replaced by general/
```

**Structure Decision**: Following existing feature module organization in `web/src/features/events/`. New components organized under `components/general/` with subdirectories for experiences and extras sections. Route structure updated to match tab rename.

## Complexity Tracking

> No violations - this feature follows established patterns

---

## Post-Design Constitution Re-Check

_Verified after Phase 1 design completion._

All constitution principles remain satisfied after detailed design:

| Principle | Status | Notes |
|-----------|--------|-------|
| Mobile-First | ✅ Pass | Sheet component uses `w-3/4` on mobile, cards use responsive grid |
| Clean Code & Simplicity | ✅ Pass | No new patterns; unified `EventExperienceLink` type reduces complexity |
| Type-Safe Development | ✅ Pass | Full Zod schemas defined in contracts/server-actions.ts |
| Minimal Testing | ✅ Pass | Focus on server action validation tests |
| Validation Loop | ✅ Pass | Each phase in quickstart.md includes validation steps |
| Firebase Architecture | ✅ Pass | Admin SDK for writes, Client SDK hooks for reads |
| Feature Module Architecture | ✅ Pass | All code in `features/events/` with barrel exports |
| Technical Standards | ✅ Pass | References firebase.md, components.md, responsive.md |

**Risk Assessment**: Low - all decisions follow established patterns in the codebase.

---

## Generated Artifacts

| Artifact | Path | Purpose |
|----------|------|---------|
| Implementation Plan | `specs/019-event-experiences/plan.md` | This file |
| Research Findings | `specs/019-event-experiences/research.md` | Technical decisions |
| Data Model | `specs/019-event-experiences/data-model.md` | Entity definitions |
| Server Actions Contract | `specs/019-event-experiences/contracts/server-actions.ts` | API signatures |
| Quickstart Guide | `specs/019-event-experiences/quickstart.md` | Implementation order |

**Next Step**: Run `/speckit.tasks` to generate the tasks.md file for implementation.
