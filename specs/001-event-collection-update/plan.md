# Implementation Plan: Event Collection Schema Refactor

**Branch**: `001-event-collection-update` | **Date**: 2025-11-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-event-collection-update/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Refactor the Event Firestore document schema to group related fields into semantic nested objects (`welcome`, `ending`, `share`, `theme`) instead of flat prefixed fields. Update Event Designer UI components (WelcomeEditor, EndingEditor) to read/write from the new nested structure. Remove deprecated fields (`brandColor`, `showTitleOverlay`, survey-prefixed fields). Update Zod schemas, TypeScript types, and Firestore security rules to enforce the new structure.

**Technical Approach**: This is a schema refactor with UI updates—no data migration in Firestore. Existing events keep legacy fields; new events use only nested objects. Event Designer components will be updated to work with the new structure, and validation will prevent writing to deprecated fields.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Next.js 16, React 19
**Primary Dependencies**: Zod 4.x, Firebase Admin SDK, Firebase Client SDK, Tailwind CSS v4, shadcn/ui
**Storage**: Firebase Firestore (events collection), Firebase Storage (images)
**Testing**: Jest (unit tests), React Testing Library (component tests)
**Target Platform**: Web (Next.js App Router), mobile-first (320px-768px primary viewport)
**Project Type**: Web monorepo (pnpm workspace: `web/` + `functions/`)
**Performance Goals**: <2 seconds for Event Designer save operations, real-time updates via Firestore onSnapshot
**Constraints**: Mobile-first design (≥44x44px touch targets, ≥14px typography), TypeScript strict mode (no `any`), Firestore security rules (deny writes to deprecated fields)
**Scale/Scope**: Event Designer UI refactor (2 editors: WelcomeEditor, EndingEditor), 4 new Zod schemas (EventTheme, EventWelcome, EventEnding, EventShareConfig), Firestore rules update, ~10-15 TypeScript files affected

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Event Designer editors already designed mobile-first; no UI layout changes required (only data binding updates). Existing components meet 44x44px touch targets and ≥14px typography.
- [x] **Clean Code & Simplicity**: Schema refactor simplifies data model by grouping related fields into logical objects. Removes deprecated fields. YAGNI applied—no new abstractions, just reorganizing existing structure.
- [x] **Type-Safe Development**: TypeScript strict mode maintained. New Zod schemas for nested objects (`EventTheme`, `EventWelcome`, `EventEnding`, `EventShareConfig`). No `any` escapes. Runtime validation for all event updates.
- [x] **Minimal Testing Strategy**: Update existing Jest unit tests for schemas, Server Actions, and repositories. Add React Testing Library tests for updated editor components. Focus on critical paths (save/load nested objects). Co-located tests.
- [x] **Validation Loop Discipline**: Validation tasks included in implementation: lint (`pnpm lint`), type-check (`pnpm type-check`), test (`pnpm test`) before completion.
- [x] **Firebase Architecture Standards**: Admin SDK used for event updates (Server Actions), Client SDK for real-time subscriptions (Event Designer). Schemas moved to `web/src/lib/schemas/` (currently in `web/src/features/events/lib/schemas.ts`—will consolidate). Public images already stored as full URLs.
- [x] **Technical Standards**: Reviewed `standards/backend/firebase.md`, `standards/global/validation.md`, `standards/frontend/components.md`. All applicable.

**Complexity Violations**: None. This is a simplifying refactor that reduces naming clutter and improves data model readability. No new abstractions or patterns introduced.

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

### Source Code (repository root)

```text
web/
├── src/
│   ├── features/events/
│   │   ├── types/
│   │   │   └── event.types.ts              # Event TypeScript interfaces (REFACTOR: update to nested objects)
│   │   ├── lib/
│   │   │   ├── schemas.ts                  # Event Zod schemas (REFACTOR: add nested object schemas)
│   │   │   └── validation.ts               # Event validation utilities
│   │   ├── actions/
│   │   │   ├── events.ts                   # Server Actions (REFACTOR: update to use nested objects)
│   │   │   └── events.test.ts              # Server Actions tests (UPDATE)
│   │   ├── repositories/
│   │   │   ├── events.ts                   # Firestore repository (REFACTOR: update queries/writes)
│   │   │   └── events.test.ts              # Repository tests (UPDATE)
│   │   └── components/designer/
│   │       ├── WelcomeEditor.tsx           # Welcome screen editor (REFACTOR: use event.welcome.*)
│   │       ├── WelcomeEditor.test.tsx      # (CREATE)
│   │       ├── EndingEditor.tsx            # Ending/share editor (REFACTOR: use event.ending.*, event.share.*)
│   │       ├── EndingEditor.test.tsx       # (CREATE)
│   │       ├── ThemeEditor.tsx             # Theme editor (CREATE: use event.theme.*)
│   │       └── ThemeEditor.test.tsx        # (CREATE)
│   └── lib/
│       └── schemas/                        # Centralized schemas location
│           └── event.ts                    # (CREATE/MOVE: consolidate from features/events/lib/schemas.ts)
└── firestore.rules                         # Firestore security rules (UPDATE: deny deprecated fields)
```

**Structure Decision**: Web monorepo structure. All event-related code lives in `web/src/features/events/`. Schemas will be consolidated into `web/src/lib/schemas/event.ts` per Firebase Architecture Standards. No backend changes needed—this is purely frontend (Event Designer) + schema refactor.

## Complexity Tracking

**No violations.** This feature simplifies the existing architecture by reducing naming clutter and improving schema organization.

---

## Post-Phase 1 Constitution Re-Check

After completing Phase 1 design (research, data model, contracts), re-verify constitution compliance:

- [x] **Mobile-First Responsive Design**: ✅ Still compliant. No UI layout changes in design phase.
- [x] **Clean Code & Simplicity**: ✅ Still compliant. Design simplifies schema, no new abstractions.
- [x] **Type-Safe Development**: ✅ Still compliant. Zod schemas and TypeScript types defined in data-model.md maintain strict typing.
- [x] **Minimal Testing Strategy**: ✅ Still compliant. Test strategy in quickstart.md covers critical paths with Jest + React Testing Library.
- [x] **Validation Loop Discipline**: ✅ Still compliant. Quickstart.md includes validation loop before completion.
- [x] **Firebase Architecture Standards**: ✅ Still compliant. Server Actions use Admin SDK, contracts defined in server-actions.md follow patterns.
- [x] **Technical Standards**: ✅ Still compliant. Design adheres to Firebase, validation, and component standards.

**Result**: ✅ Constitution compliance maintained through Phase 1 design.

---

## Implementation Artifacts

### Phase 0: Research (Complete)

- ✅ [research.md](./research.md) - Technical decisions and architectural choices

### Phase 1: Design & Contracts (Complete)

- ✅ [data-model.md](./data-model.md) - Complete Event schema with nested objects
- ✅ [contracts/server-actions.md](./contracts/server-actions.md) - Server Action contracts
- ✅ [quickstart.md](./quickstart.md) - Developer implementation guide

### Phase 2: Tasks (NOT GENERATED BY /speckit.plan)

Tasks will be generated by the `/speckit.tasks` command. This command (`/speckit.plan`) stops here.
