# Implementation Plan: Events Domain Backbone

**Branch**: `011-events-domain-backbone` | **Date**: 2026-01-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/requirements/011-events-domain-backbone.md`

## Summary

Create the foundational architecture for the Events Domain in the TanStack Start app. This domain handles guest-facing event configuration (theme, overlays, sharing settings) and provides a visual event designer interface with vertical tabs navigation (Welcome, Theme, Settings). The domain establishes data schemas for event configuration with draft/publish workflow support, creates the EventDesignerPage layout component, and implements route structure with WIP placeholders for future editors.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**:
- TanStack Start 1.132.0
- TanStack Router 1.132.0 (file-based routing)
- React 19.2.0
- Zod 4.1.12 (runtime validation)
- Firebase SDK 12.5.0 (Firestore client)

**Storage**: Firebase Firestore (client SDK for reads/writes)
**Testing**: Vitest (unit tests, 70%+ coverage goal)
**Target Platform**: Web (mobile-first, 320px-768px primary viewport)
**Project Type**: Web application (TanStack Start full-stack)
**Performance Goals**:
- Page load < 2 seconds on 4G networks
- QR code generation client-side < 2 seconds
- Real-time Firestore subscriptions for collaborative editing

**Constraints**:
- Mobile-first design (320px minimum viewport)
- Type-safe (no `any`, strict null checks)
- Client-first architecture (Firebase client SDK, minimal server code)
- Firestore-safe schemas (.nullable().default(null) for optional fields)

**Scale/Scope**:
- New domain at `@domains/event/` with 4 subdomains (designer, welcome, theme, settings, shared)
- 2 new Zod schemas (ProjectEventConfig, ProjectEventFull)
- 1 EventDesignerPage container component
- 5 new route files ($eventId.tsx update + 4 new routes)
- WIP placeholders for 3 tab editors (welcome, theme, settings)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Design ✅
- **Compliant**: Event designer uses vertical tabs for mobile-friendly navigation
- **Compliant**: All interactive elements will follow 44x44px minimum touch targets
- **Compliant**: Mobile viewport (320px-768px) is primary design target

### Principle II: Clean Code & Simplicity ✅
- **Compliant**: YAGNI principle - implementing only Phase 1 foundation, leaving editors as WIP
- **Compliant**: Small, focused schemas - separate concerns (ProjectEventConfig vs ProjectEventFull)
- **Compliant**: No premature abstraction - simple domain structure

### Principle III: Type-Safe Development ✅
- **Compliant**: TypeScript strict mode enabled
- **Compliant**: Zod runtime validation for all Firestore data (ProjectEventConfig, ProjectEventFull)
- **Compliant**: Firestore-safe patterns (.nullable().default(null))
- **Compliant**: No `any` escapes

### Principle IV: Minimal Testing Strategy ✅
- **Compliant**: Focus on critical flows (event designer navigation, schema validation)
- **Compliant**: Unit tests for schemas (Zod validation)
- **Deferred**: E2E tests for full workflow (future - when editors are implemented)

### Principle V: Validation Gates ✅
- **Compliant**: Will run `pnpm check` before commit (format, lint, type-check)
- **Compliant**: Will review applicable standards:
  - `standards/global/project-structure.md` (domain architecture)
  - `standards/global/zod-validation.md` (schema patterns)
  - `standards/frontend/design-system.md` (UI components, theme tokens)
  - `standards/frontend/component-libraries.md` (shadcn/ui usage)
  - `standards/frontend/routing.md` (TanStack Router patterns)

### Principle VI: Frontend Architecture ✅
- **Compliant**: Client-first pattern - Firebase client SDK for event data operations
- **Compliant**: SSR for route loader (event fetch for metadata)
- **Compliant**: Real-time updates support (future - `onSnapshot` for collaborative editing)
- **Compliant**: TanStack Router for file-based routing

### Principle VII: Backend & Firebase ✅
- **Compliant**: Client SDK for reads (event configuration fetch)
- **Compliant**: Security rules will enforce mutations (future - when write operations are added)
- **Compliant**: Full public URLs stored in Firestore (for theme background images, overlays)

### Principle VIII: Project Structure ✅
- **Compliant**: Vertical slice architecture - new `@domains/event/` domain
- **Compliant**: Subdomains organized by feature (designer, welcome, theme, settings)
- **Compliant**: `/shared` folder for domain-wide resources (schemas, hooks, types)
- **Compliant**: Explicit file naming (`project-event-config.schema.ts`, `project-event-full.schema.ts`)
- **Compliant**: Barrel exports (index.ts in each folder)

**GATE RESULT**: ✅ **PASSED** - All constitution principles satisfied. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/011-events-domain-backbone/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── (No API contracts - client-side only feature)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── domains/
│   ├── project/                         # Existing domain (unchanged)
│   │   └── events/                      # Existing subdomain (admin view)
│   │       └── schemas/
│   │           └── project-event.schema.ts  # Existing (lightweight schema)
│   │
│   └── event/                           # NEW DOMAIN (guest-facing designer)
│       ├── designer/                    # Designer shell and layout
│       │   ├── components/              # Designer-specific UI components
│       │   ├── containers/              # EventDesignerPage container
│       │   │   └── EventDesignerPage.tsx
│       │   └── index.ts                 # Barrel export
│       │
│       ├── welcome/                     # Welcome tab editor (WIP)
│       │   ├── components/
│       │   ├── containers/
│       │   └── index.ts
│       │
│       ├── theme/                       # Theme tab editor (WIP)
│       │   ├── components/
│       │   ├── containers/
│       │   └── index.ts
│       │
│       ├── settings/                    # Settings tab editor (WIP)
│       │   ├── components/
│       │   ├── containers/
│       │   └── index.ts
│       │
│       ├── shared/                      # Domain-wide shared resources
│       │   ├── schemas/                 # Event configuration schemas
│       │   │   ├── project-event-config.schema.ts   # Guest-facing config
│       │   │   ├── project-event-full.schema.ts     # Complete view (config + admin fields)
│       │   │   └── index.ts
│       │   ├── hooks/                   # Domain-wide hooks
│       │   │   └── (future - useProjectEvent, useEventConfig)
│       │   └── types/                   # Shared types
│       │       └── index.ts
│       │
│       └── index.ts                     # Domain barrel export
│
├── app/workspace/$workspaceSlug.projects/$projectId.events/
│   ├── $eventId.tsx                     # UPDATED - Replace body with EventDesignerPage
│   ├── $eventId.index.tsx               # NEW - Redirect to welcome
│   ├── $eventId.welcome.tsx             # NEW - Welcome tab (WIP placeholder)
│   ├── $eventId.theme.tsx               # NEW - Theme tab (WIP placeholder)
│   └── $eventId.settings.tsx            # NEW - Settings tab (WIP placeholder)
│
└── shared/theming/schemas/
    └── theme.schemas.ts                 # Existing (referenced by ProjectEventConfig)
```

**Structure Decision**:

This feature creates a new **event** domain (singular) at `@domains/event/` following DDD vertical slice architecture. The domain is separate from the existing `@domains/project/events/` subdomain to establish clear bounded contexts:

- **`@domains/project/events/`** - Admin view (event list, create, delete, basic metadata)
- **`@domains/event/`** - Designer view (guest experience configuration)

Both domains work with the same Firestore documents but manage different concerns. The event domain uses a `/shared` folder for domain-wide resources (schemas, hooks, types) that are used across multiple subdomains (designer, welcome, theme, settings). The `/designer` subdomain contains the layout shell (EventDesignerPage) rather than being nested as `/event-designer`.

Routes are updated within the existing `$eventId.tsx` file (replace body section) and 4 new child routes are added for tab navigation.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - All constitution principles satisfied. No violations to justify.
