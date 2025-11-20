# Implementation Plan: Survey Experience

**Branch**: `001-survey-experience` | **Date**: 2025-11-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-survey-experience/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add a new "Survey" experience type to Clementine's event builder that enables event creators to collect structured feedback from guests through configurable question steps. The feature supports 7 step types (short_text, long_text, multiple_choice, yes_no, opinion_scale, email, statement) with drag-and-drop reordering, real-time preview, and type-safe validation using Zod schemas. Survey steps are stored in Firestore subcollections under `/events/{eventId}/steps/{stepId}` with ordering managed by the SurveyExperience's `config.stepsOrder` array. All mutations go through Server Actions using Firebase Admin SDK, while real-time UI updates leverage Firebase Client SDK subscriptions for instant feedback.

**Note**: Basic survey schemas already exist in `features/experiences/lib/schemas.ts` (lines 99-103, 215-289). This implementation will convert the existing flat schema to a discriminated union pattern for stronger type safety and add the missing `yes_no` step type.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js (Next.js 16 runtime)  
**Primary Dependencies**: Next.js 16 (App Router), React 19, Firebase (Admin SDK + Client SDK), Zod 4.x  
**Storage**: Firebase Firestore (subcollection `/events/{eventId}/steps/{stepId}`), Firebase Storage (for optional step media)  
**Testing**: Jest (unit tests), React Testing Library (component tests), target 70%+ coverage  
**Target Platform**: Web (mobile-first: 320px-768px, desktop enhancement)
**Project Type**: Web application (monorepo: `web/` workspace, feature-based architecture)  
**Performance Goals**: Survey editor loads in <2s on mobile, step config changes reflected in preview within 1s, drag-and-drop reordering with 100% success rate  
**Constraints**: Max 10 steps per survey (soft limit warning at 5), character limits (title: 200, description: 500, placeholder: 100, option: 100), touch targets ≥44x44px, mobile-first responsive  
**Scale/Scope**: Single feature within existing event builder, adds survey experience type alongside existing photo/video/gif/wheel types (only photo currently implemented)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution standards:

- [x] **Mobile-First Responsive Design**: Survey editor designed mobile-first with vertical stacking (320px-768px), all interactive elements (buttons, toggles, drag handles) meet 44x44px minimum, typography ≥14px body text, ≥16px input fields
- [x] **Clean Code & Simplicity**: No premature abstractions, follows existing experience editor patterns (photo/video/gif/wheel), single responsibility per component (editor wrapper, step list, step editor, preview)
- [x] **Type-Safe Development**: TypeScript strict mode enforced, Zod schemas for all survey data (StepBase, discriminated Step union with type-specific configs), no `any` types
- [x] **Minimal Testing Strategy**: Jest unit tests for critical paths (step CRUD operations, validation logic, drag-and-drop), React Testing Library for components, 70%+ coverage goal
- [x] **Validation Loop Discipline**: Includes type-check, lint, and test tasks before completion; step validation enforced before save (e.g., multiple choice requires ≥1 option, opinion scale min < max)
- [x] **Firebase Architecture Standards**: Admin SDK for mutations via Server Actions, Client SDK for real-time subscriptions, schemas in `web/src/lib/schemas/survey.ts`, optional step media stored as full public URLs
- [x] **Technical Standards**: Reviewed `standards/global/` (coding-style, conventions, feature-modules, validation, error-handling), `standards/frontend/` (responsive, accessibility, components, css), `standards/backend/` (firebase, api)

**Complexity Violations** (if any):
None identified. Survey experience follows existing experience type patterns established in the codebase (photo/video/gif/wheel types). Uses standard Firestore subcollection pattern (`/events/{eventId}/steps/{stepId}`) consistent with existing design. No new architectural abstractions required.

## Project Structure

### Documentation (this feature)

```text
specs/001-survey-experience/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
├── spec.md              # Feature specification (already exists)
└── checklists/
    └── requirements.md  # Spec quality checklist (already exists)
```

### Source Code (repository root)

```text
web/src/
├── features/
│   ├── experiences/
│   │   ├── components/
│   │   │   ├── shared/
│   │   │   │   ├── ExperienceEditorWrapper.tsx    # Existing wrapper for all experience editors
│   │   │   │   └── ...
│   │   │   ├── survey/                            # NEW: Survey-specific components
│   │   │   │   ├── SurveyExperienceEditor.tsx     # Main editor container
│   │   │   │   ├── SurveyStepList.tsx             # Draggable list of steps
│   │   │   │   ├── SurveyStepEditor.tsx           # Step configuration form
│   │   │   │   ├── SurveyStepPreview.tsx          # Real-time step preview
│   │   │   │   ├── SurveyStepTypeSelector.tsx     # Dialog for selecting step type
│   │   │   │   └── step-types/                    # Type-specific editors
│   │   │   │       ├── MultipleChoiceEditor.tsx
│   │   │   │       ├── YesNoEditor.tsx
│   │   │   │       ├── OpinionScaleEditor.tsx
│   │   │   │       ├── TextEditor.tsx             # Short/long text
│   │   │   │       ├── EmailEditor.tsx
│   │   │   │       └── StatementEditor.tsx
│   │   │   ├── photo/                             # Existing photo experience
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── schemas.ts                         # MODIFIED: Update existing survey schemas (lines 99-103, 215-289)
│   │   │   ├── repository.ts                      # MODIFIED: Add survey step operations (extend existing)
│   │   │   └── constants.ts                       # Existing constants
│   │   ├── hooks/
│   │   │   ├── useSurveySteps.ts                  # NEW: Firestore subscription hook
│   │   │   ├── useSurveyStepMutations.ts          # NEW: Mutation hooks (create/update/delete)
│   │   │   └── ...
│   │   ├── actions/
│   │   │   ├── survey-steps.ts                    # NEW: Server Actions for step CRUD
│   │   │   └── ...
│   │   └── index.ts                               # Public API exports
│   ├── events/
│   │   ├── components/
│   │   │   └── designer/
│   │   │       └── DesignSidebar.tsx              # MODIFIED: Add survey type to selector
│   │   └── ...
├── lib/
│   ├── firebase/
│   │   ├── admin.ts                               # Existing Admin SDK setup
│   │   ├── client.ts                              # Existing Client SDK setup
│   │   └── ...
│   └── utils.ts                                   # Existing utilities (cn helper)
├── components/ui/                                 # shadcn/ui components (existing)
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── select.tsx
│   ├── switch.tsx
│   ├── textarea.tsx
│   └── ...
└── app/
    └── events/[eventId]/
        └── ...                                    # Event builder pages (existing)

web/src/features/experiences/__tests__/           # NEW: Test files
├── components/
│   └── survey/
│       ├── SurveyExperienceEditor.test.tsx
│       ├── SurveyStepList.test.tsx
│       └── ...
├── hooks/
│   ├── useSurveySteps.test.ts
│   └── ...
├── actions/
│   ├── survey-steps.test.ts
│   └── ...
└── repositories/
    ├── survey-steps.repository.test.ts
    └── ...
```

**Structure Decision**: This is a web application using feature-based architecture. The survey experience is implemented as an extension of the existing `experiences` feature module at `web/src/features/experiences/`. All survey-specific code is co-located within `components/survey/`, `hooks/`, `actions/`, and `repositories/` subdirectories. Tests are co-located within `__tests__/` directories following the same structure. This follows the feature module standards defined in `standards/global/feature-modules.md` and maintains consistency with the existing photo experience implementation.

## Complexity Tracking

No complexity violations identified. This feature adheres to all constitution principles and existing architectural patterns.

---

## Phase 0: Research ✅ COMPLETE

**Output**: [research.md](./research.md)

**Key Decisions**:

1. **Drag-and-Drop**: @dnd-kit/core + @dnd-kit/sortable (React 19 compatible, accessible, touch-friendly)
2. **Form State**: React Hook Form + Zod resolver (type-safe, performant)
3. **Real-Time Data**: Firebase Client SDK `onSnapshot` (instant updates)
4. **Survey UX**: Typeform-inspired patterns, mobile-first
5. **Validation**: Zod schemas at client + server (defense in depth)
6. **Step Ordering**: Array in experience config (simple, atomic)
7. **Type System**: Discriminated unions (compile-time + runtime safety)

---

## Phase 1: Design & Contracts ✅ COMPLETE

**Outputs**:

- [data-model.md](./data-model.md) - Complete entity definitions with Zod schemas
- [contracts/server-actions.md](./contracts/server-actions.md) - Server Action specifications
- [quickstart.md](./quickstart.md) - Developer implementation guide

**Key Artifacts**:

1. **Data Model**: SurveyExperience + 7 discriminated SurveyStep types
2. **Schemas**: Complete Zod validation schemas with character limits and type-specific rules
3. **Contracts**: 4 Server Actions (create, update, delete, reorder steps)
4. **Architecture**: Feature-based structure in `web/src/features/experiences/`

**Constitution Re-Check**: ✅ All principles satisfied post-design

---

## Next Steps (Not Part of /speckit.plan)

The planning phase is complete. To proceed with implementation:

1. **Run `/speckit.tasks`**: Generate detailed implementation tasks from this plan
2. **Install Dependencies**: `pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-hook-form @hookform/resolvers`
3. **Follow Quickstart**: Use [quickstart.md](./quickstart.md) as implementation guide
4. **Implement in Order**:
   - Step 1: Schemas (`lib/schemas/survey.ts`)
   - Step 2: Repository (`repositories/survey-steps.repository.ts`)
   - Step 3: Server Actions (`actions/survey-steps.ts`)
   - Step 4: Hooks (`hooks/useSurveySteps.ts`, `hooks/useSurveyStepMutations.ts`)
   - Step 5: Components (`components/survey/*`)
5. **Test**: Write unit tests alongside implementation (70%+ coverage goal)
6. **Validate**: Run `pnpm lint`, `pnpm type-check`, `pnpm test` before completion

---

## Summary

**Branch**: `001-survey-experience`  
**Status**: Planning Complete ✅  
**Next Command**: `/speckit.tasks` (generates implementation tasks)

**Artifacts Generated**:

- ✅ `plan.md` - This implementation plan
- ✅ `research.md` - Technical research and decisions
- ✅ `data-model.md` - Entity definitions and schemas
- ✅ `contracts/server-actions.md` - API contracts
- ✅ `quickstart.md` - Developer quick reference

**Constitution Compliance**: All principles satisfied (mobile-first, type-safe, clean code, minimal testing, Firebase standards)

**Ready for Implementation**: Yes - all technical decisions resolved, contracts defined, data model complete
