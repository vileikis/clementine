# Implementation Plan: Journey Editor

**Branch**: `006-journey-editor` | **Date**: 2025-11-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-journey-editor/spec.md`

## Summary

Build a visual 3-panel journey editor for creating and configuring guest journeys within events. The editor provides a step list (left), live preview with event theme (middle), and type-specific configuration forms (right). Supports all 11 step types with drag-and-drop reordering, real-time preview updates, and URL deep linking.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 19, Next.js 16
**Primary Dependencies**: @dnd-kit/core (drag-drop), react-hook-form + zod (forms), shadcn/ui (components), lucide-react (icons), sonner (toasts)
**Storage**: Firebase Firestore - Steps as subcollection `/events/{eventId}/steps/{stepId}`, Journeys at `/events/{eventId}/journeys/{journeyId}`
**Testing**: Jest + React Testing Library, co-located test files
**Target Platform**: Web (mobile-first: 320px-768px primary, tablet: 768px+, desktop: 1024px+)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Page load <3s for 20 steps, preview update <500ms, step selection <200ms
**Constraints**: Mobile-first responsive, touch targets ≥44x44px, offline-tolerant (optimistic updates)
**Scale/Scope**: 11 step types, 3-panel layout, ~15 new components, ~5 new hooks

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Feature designed mobile-first (320px-768px), panels stack vertically on mobile, touch targets ≥44x44px, readable typography (≥14px)
- [x] **Clean Code & Simplicity**: Reuses existing patterns (journeys module, legacy survey components), composition-based architecture, no premature abstractions
- [x] **Type-Safe Development**: TypeScript strict mode, discriminated unions for step types, Zod validation for all step data and URL params
- [x] **Minimal Testing Strategy**: Jest unit tests for critical paths (step CRUD, reordering), tests co-located with source
- [x] **Validation Loop Discipline**: Plan includes validation tasks (lint, type-check, test) before completion
- [x] **Firebase Architecture Standards**: Admin SDK for step writes via Server Actions, Client SDK for real-time subscriptions, schemas in feature module, media URLs stored as full public URLs
- [x] **Technical Standards**: Following existing patterns from journeys, events, experiences features

**Complexity Violations**: None. Feature follows established patterns from legacy survey components and existing feature modules.

## Project Structure

### Documentation (this feature)

```text
specs/006-journey-editor/
├── plan.md              # This file
├── research.md          # Phase 0 output - technology decisions
├── data-model.md        # Phase 1 output - step schemas
├── quickstart.md        # Phase 1 output - dev setup guide
├── contracts/           # Phase 1 output - API contracts
│   └── steps-api.md     # Step CRUD operations
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
web/src/
├── components/
│   ├── providers/
│   │   └── EventThemeProvider.tsx      # Shared theme context
│   └── step-primitives/                # Shared visual building blocks
│       ├── index.ts
│       ├── StepLayout.tsx
│       ├── ActionButton.tsx
│       ├── OptionButton.tsx
│       ├── ScaleButton.tsx
│       ├── TextInput.tsx
│       └── TextArea.tsx
│
├── features/
│   ├── steps/                          # NEW: Steps CRUD module
│   │   ├── index.ts
│   │   ├── types/
│   │   │   └── step.types.ts           # All step type definitions
│   │   ├── schemas/
│   │   │   └── step.schemas.ts         # Zod schemas for 11 step types
│   │   ├── repositories/
│   │   │   └── steps.repository.ts     # Firestore CRUD
│   │   ├── actions/
│   │   │   └── steps.ts                # Server actions
│   │   └── constants.ts                # Step limits, defaults
│   │
│   ├── simulator/                      # NEW: Display-only step previews
│   │   ├── index.ts
│   │   ├── components/
│   │   │   ├── SimulatorScreen.tsx     # Theme-aware wrapper
│   │   │   └── steps/                  # Read-only step renderers
│   │   │       ├── index.ts
│   │   │       ├── InfoStep.tsx
│   │   │       ├── ExperiencePickerStep.tsx
│   │   │       ├── CaptureStep.tsx
│   │   │       ├── ShortTextStep.tsx
│   │   │       ├── LongTextStep.tsx
│   │   │       ├── MultipleChoiceStep.tsx
│   │   │       ├── YesNoStep.tsx
│   │   │       ├── OpinionScaleStep.tsx
│   │   │       ├── EmailStep.tsx
│   │   │       ├── ProcessingStep.tsx
│   │   │       └── RewardStep.tsx
│   │   └── utils/
│   │       └── theme.utils.ts          # Theme CSS variable helpers
│   │
│   └── journeys/                       # EXTEND: Existing module
│       ├── components/
│       │   └── editor/                 # NEW: Journey editor UI
│       │       ├── JourneyEditor.tsx   # Main 3-panel layout
│       │       ├── JourneyEditorHeader.tsx
│       │       ├── StepList.tsx        # Left panel (dnd-kit)
│       │       ├── StepListItem.tsx
│       │       ├── StepPreview.tsx     # Middle panel (uses simulator)
│       │       ├── StepEditor.tsx      # Right panel (form router)
│       │       ├── StepTypeSelector.tsx
│       │       └── step-editors/       # Type-specific forms
│       │           ├── index.ts
│       │           ├── BaseStepEditor.tsx
│       │           ├── InfoStepEditor.tsx
│       │           ├── ExperiencePickerEditor.tsx
│       │           ├── CaptureStepEditor.tsx
│       │           ├── ShortTextEditor.tsx
│       │           ├── LongTextEditor.tsx
│       │           ├── MultipleChoiceEditor.tsx
│       │           ├── YesNoEditor.tsx
│       │           ├── OpinionScaleEditor.tsx
│       │           ├── EmailEditor.tsx
│       │           ├── ProcessingStepEditor.tsx
│       │           └── RewardStepEditor.tsx
│       └── hooks/                      # NEW: Journey editor hooks
│           ├── useSteps.ts             # Real-time steps subscription
│           ├── useStepMutations.ts     # CRUD operations
│           └── useSelectedStep.ts      # URL query param sync
│
└── app/
    └── events/
        └── [eventId]/
            └── design/
                └── journeys/
                    └── [journeyId]/
                        └── page.tsx    # Journey editor page
```

**Structure Decision**: Extends existing monorepo structure with three new modules:
1. `features/steps/` - Core CRUD operations for steps (data layer)
2. `features/simulator/` - Display-only step renderers (presentation layer)
3. `features/journeys/components/editor/` - Journey editor UI (application layer)

Shared primitives go in `components/` for reuse by both simulator and future guest feature.

## Complexity Tracking

> No complexity violations. Feature follows established patterns.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       | N/A        | N/A                                  |
