# Implementation Plan: Events Builder Redesign

**Branch**: `001-events-builder-redesign` | **Date**: 2025-11-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-events-builder-redesign/events-data-model.md` and `events-builder.md`

**Note**: This plan covers the redesign of the events builder to support fully-fledged flows with 4 key components: welcome, experiences, survey, and ending. The implementation will focus on the event builder UI first (without logic), ensuring the core layout is correct before adding functionality in subsequent phases.

## Summary

Redesign the events builder to transition from the current scene-based architecture to a more scalable experience-collection model. The new builder will feature a tabbed interface (Content, Distribute, Results) with a left sidebar for navigation between Welcome screen, Experiences, Survey, and Ending sections. Each section will have its own design controls and preview. The data model introduces new Firestore subcollections: /experiences, /experienceItems, /surveySteps, /surveyResponses, /participants, /sessions, and /shares under each event. This phase focuses exclusively on the builder UI (Content tab with static previews), leaving guest experience implementation for a separate project.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Next.js 16 (App Router), React 19
**Primary Dependencies**: Firebase (Firestore + Storage), Zod 4.x, Tailwind CSS v4, shadcn/ui, lucide-react
**Storage**: Firestore (events collection with 7 subcollections: experiences, experienceItems, surveySteps, surveyResponses, participants, sessions, shares), Firebase Storage (images/media)
**Testing**: Jest for unit tests, React Testing Library for components (minimal strategy per constitution)
**Target Platform**: Web (Next.js SSR + Client Components), mobile-first (320px-768px primary viewport)
**Project Type**: Web application (monorepo structure: web/ and functions/ workspaces)
**Performance Goals**: Event builder page load < 2s on 4G, real-time preview updates < 300ms, support up to 20 experiences per event
**Constraints**: Mobile-first design (44x44px touch targets), TypeScript strict mode (no `any`), Zod validation for all external inputs, Firebase security rules (allow reads, deny writes from client)
**Scale/Scope**: Support 100+ events per company, 20+ experiences per event, 50+ survey steps per event, builder UI only (guest experience out of scope)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Builder UI designed mobile-first with responsive sidebar/main content layout, all interactive elements (tab buttons, + buttons, list items) meet 44x44px touch target minimum, typography uses 14px+ for body text
- [x] **Clean Code & Simplicity**: YAGNI applied - implementing UI structure first without business logic, keeping components focused (sidebar navigation separate from content panels), no premature abstractions for state management
- [x] **Type-Safe Development**: TypeScript strict mode enforced, all new types defined in lib/types/firestore.ts and validated with Zod schemas in lib/schemas/firestore.ts, no `any` escapes
- [x] **Minimal Testing Strategy**: Tests focused on critical UI components (tab navigation, sidebar interactions), co-located with source files, Jest + React Testing Library for component tests
- [x] **Validation Loop Discipline**: Implementation plan includes final validation phase (pnpm lint, pnpm type-check, pnpm test, pnpm dev verification)
- [x] **Technical Standards**: Following frontend/css.md (Tailwind CSS v4), frontend/components.md (React composition), frontend/responsive.md (mobile-first breakpoints), backend/firebase.md (Firestore subcollections pattern)

**Complexity Violations** (if any):
None. This feature adds new UI sections and Firestore subcollections, but follows existing architectural patterns (App Router pages, shadcn/ui components, Firebase subcollections). No new abstraction layers or complex state management introduced in this phase.

## Project Structure

### Documentation (this feature)

```text
specs/003-events-builder-redesign/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (already exists)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
web/
├── src/
│   ├── app/
│   │   └── (admin)/
│   │       └── events/
│   │           └── [eventId]/
│   │               ├── layout.tsx              # Event-level navigation (tabs, breadcrumb, status)
│   │               ├── content/
│   │               │   └── page.tsx            # NEW: Content tab (builder UI)
│   │               ├── distribute/
│   │               │   └── page.tsx            # Existing: Distribute tab (no changes)
│   │               ├── results/
│   │               │   └── page.tsx            # NEW: Results tab (placeholder)
│   │               ├── branding/
│   │               │   └── page.tsx            # Existing: To be deprecated
│   │               └── scene/
│   │                   └── page.tsx            # Existing: To be deprecated
│   │
│   ├── components/
│   │   └── organizer/
│   │       ├── builder/                        # NEW: Builder components
│   │       │   ├── BuilderSidebar.tsx          # Left navigation panel
│   │       │   ├── BuilderContent.tsx          # Main content area wrapper
│   │       │   ├── WelcomeEditor.tsx           # Welcome screen controls + preview
│   │       │   ├── ExperiencesList.tsx         # Experiences section with + button
│   │       │   ├── ExperienceEditor.tsx        # Experience design controls
│   │       │   ├── ExperienceTypeDialog.tsx    # Experience type selector dialog
│   │       │   ├── SurveySection.tsx           # Survey section with toggles + steps list
│   │       │   ├── SurveyStepEditor.tsx        # Survey step design controls + preview
│   │       │   ├── SurveyStepTypeDialog.tsx    # Survey step type selector dialog
│   │       │   ├── EndingEditor.tsx            # Ending screen controls + preview
│   │       │   └── PreviewPanel.tsx            # Reusable preview container
│   │       │
│   │       ├── EventTabs.tsx                   # NEW: Tab navigation component
│   │       ├── EventBreadcrumb.tsx             # NEW: Events > [Event name] breadcrumb
│   │       └── [existing components...]
│   │
│   └── lib/
│       ├── types/
│       │   └── firestore.ts                    # UPDATED: Add Experience, ExperienceItem, SurveyStep, etc.
│       │
│       ├── schemas/
│       │   └── firestore.ts                    # UPDATED: Add Zod schemas for new types
│       │
│       └── actions/
│           ├── experiences.ts                  # NEW: Server Actions for experiences CRUD
│           ├── survey.ts                       # NEW: Server Actions for survey steps CRUD
│           └── [existing actions...]
│
└── tests/
    └── [component tests co-located with source]
```

**Structure Decision**: Web application structure (Next.js App Router). The feature adds new pages under the existing `(admin)/events/[eventId]` route group. New builder components are organized under `components/organizer/builder/` to keep them separate from existing organizer components. New Firestore types and schemas extend the existing pattern in `lib/types/firestore.ts` and `lib/schemas/firestore.ts`. Server Actions follow the existing pattern (Firebase Admin SDK for mutations).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. All architectural decisions follow existing patterns in the codebase.
