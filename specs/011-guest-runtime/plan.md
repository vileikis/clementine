# Implementation Plan: Guest Experience Runtime Engine

**Branch**: `011-guest-runtime` | **Date**: 2025-11-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-guest-runtime/spec.md`

## Summary

The Guest Experience Runtime Engine enables guests to complete full journeys (multi-step experiences) via join links, with real camera capture, AI processing, and session persistence. This builds on the existing `useGuestFlow` hook, step renderers, and sessions infrastructure to create a journey-aware runtime that orchestrates all 11 step types end-to-end.

**Technical Approach**: Extend the existing guest module with a new `JourneyGuestContainer` component and `useJourneyRuntime` hook that loads journey/step definitions, renders step renderers interactively, collects user input, persists session data, triggers AI processing, and handles errors gracefully.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 19, Next.js 16
**Primary Dependencies**: Next.js App Router, Firebase (Firestore + Storage), Zod 4.x, Tailwind CSS v4, shadcn/ui, lucide-react
**Storage**: Firebase Firestore (sessions at `/events/{eventId}/sessions/{sessionId}`), Firebase Storage (captured images, AI results)
**Testing**: Jest for unit tests, React Testing Library for components
**Target Platform**: Web (mobile-first, 320px-768px primary viewport)
**Project Type**: Web application (Next.js monorepo)
**Performance Goals**: Page load < 3s on 4G, AI processing < 60s, journey completion < 2min (excluding AI time)
**Constraints**: Camera access requires HTTPS, real-time session updates via Firestore subscriptions
**Scale/Scope**: Single event at a time per guest, 11 step types, sessions persisted 24 hours

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Guest runtime designed mobile-first (320px-768px), touch targets ≥44x44px (existing components already compliant), readable typography (≥14px body, 16px inputs)
- [x] **Clean Code & Simplicity**: Extends existing patterns (useGuestFlow, step renderers), no new abstraction layers, YAGNI applied
- [x] **Type-Safe Development**: TypeScript strict mode, discriminated unions for steps, Zod validation for session data and form inputs
- [x] **Minimal Testing Strategy**: Jest unit tests for critical hooks (useJourneyRuntime), component tests for new containers
- [x] **Validation Loop Discipline**: Plan includes validation tasks (lint, type-check, test) before completion
- [x] **Firebase Architecture Standards**: Admin SDK for writes via server actions, Client SDK for real-time session subscriptions, schemas in `features/sessions/schemas/`, images stored as full public URLs
- [x] **Feature Module Architecture**: New code follows vertical slice pattern in `features/guest/`
- [x] **Technical Standards**: Following existing patterns from guest, sessions, and steps features

**Complexity Violations**: None - implementation extends existing patterns without introducing new architectural complexity.

## Project Structure

### Documentation (this feature)

```text
specs/011-guest-runtime/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (server actions interface)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
web/src/
├── app/(public)/join/[eventId]/
│   └── page.tsx                        # MODIFY: Route to JourneyGuestContainer
│
├── features/guest/
│   ├── components/
│   │   ├── JourneyGuestContainer.tsx   # NEW: Main journey orchestrator
│   │   ├── JourneyStepRenderer.tsx     # NEW: Interactive step rendering
│   │   ├── JourneyErrorBoundary.tsx    # NEW: Journey-specific error handling
│   │   └── [existing components...]    # REUSE: CameraView, ResultViewer, etc.
│   ├── hooks/
│   │   ├── useJourneyRuntime.ts        # NEW: Journey state machine
│   │   └── [existing hooks...]         # REUSE: useGuestFlow, useCamera
│   └── index.ts                        # UPDATE: Export new components/hooks
│
├── features/sessions/
│   ├── actions/
│   │   └── sessions.actions.ts         # MODIFY: Wire AI transform, add journey actions
│   └── [existing files...]             # REUSE: types, schemas, repository
│
├── features/steps/
│   └── components/preview/
│       └── steps/                      # REUSE: All 11 step type renderers
│
└── lib/ai/
    └── [existing files...]             # REUSE: AI client factory and providers
```

**Structure Decision**: Extends existing Next.js feature module architecture. New code concentrated in `features/guest/` with minimal modifications to join page and session actions. Reuses existing step renderers, camera hooks, and AI module.

## Complexity Tracking

No complexity violations identified. Implementation follows established patterns:
- State machine pattern (extends useGuestFlow model)
- Server actions for mutations (existing pattern)
- Real-time subscriptions for session updates (existing pattern)
- Step renderer composition (existing pattern from preview/playback)

## Generated Artifacts

Phase 0 and Phase 1 have produced the following design artifacts:

| Artifact | Purpose | Status |
|----------|---------|--------|
| [research.md](./research.md) | Design decisions and alternatives | Complete |
| [data-model.md](./data-model.md) | Session entity schema and Zod validation | Complete |
| [contracts/server-actions.md](./contracts/server-actions.md) | Server action signatures and contracts | Complete |
| [quickstart.md](./quickstart.md) | Implementation guide with code snippets | Complete |

## Next Steps

Run `/speckit.tasks` to generate the detailed task breakdown for implementation.

## Constitution Check (Post-Design Re-evaluation)

All principles verified after design phase:

- [x] **Mobile-First**: All UI components use existing mobile-first renderers, camera fills viewport
- [x] **Clean Code**: No new patterns introduced, extends existing hooks and actions
- [x] **Type-Safe**: StepInputValue discriminated union, Zod schemas for session data
- [x] **Minimal Testing**: Tests focused on useJourneyRuntime hook and integration
- [x] **Validation Loop**: quickstart.md includes validation checklist
- [x] **Firebase Standards**: Admin SDK for writes, Client SDK for subscriptions, schemas in feature folder
- [x] **Feature Modules**: All new code in `features/guest/`, barrel exports maintained

**Design approved for implementation.**
