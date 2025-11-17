# Implementation Plan: Events Designer

**Branch**: `001-events-designer` | **Date**: 2025-11-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-events-designer/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature improves the event design workflow by introducing URL-based navigation, renaming "Content" to "Design", replacing modal-based experience creation with an inline form, and making the experiences list permanently visible in the sidebar. The update reduces cognitive load for event organizers and creates a more scalable foundation by enabling deep linking, browser-native navigation, and a more intuitive mental model of "designing an event."

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui, Firebase (Firestore Client SDK)
**Storage**: Firebase Firestore (events collection with experiences subcollection)
**Testing**: Jest + React Testing Library (unit tests for components)
**Target Platform**: Web browsers (mobile-first: 320px-768px primary, desktop 1024px+)
**Project Type**: Web application (pnpm monorepo, web/ workspace)
**Performance Goals**: Navigation transitions <200ms, page load <2s on 4G networks
**Constraints**: Mobile-first responsive design, touch targets ≥44px, no modals for creation flow
**Scale/Scope**: Single event context, multiple experiences per event (typical: 1-5 experiences)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Feature designed mobile-first (320px-768px), touch targets ≥44x44px, readable typography (≥14px)
- [x] **Clean Code & Simplicity**: No premature optimization, YAGNI applied, single responsibility maintained
- [x] **Type-Safe Development**: TypeScript strict mode, no `any` escapes, Zod validation for external inputs
- [x] **Minimal Testing Strategy**: Jest unit tests for critical paths (70%+ coverage goal), tests co-located with source
- [x] **Validation Loop Discipline**: Plan includes validation tasks (lint, type-check, test) before completion
- [x] **Technical Standards**: Applicable standards from `standards/` reviewed and referenced

**Complexity Violations** (if any):
None. This feature maintains existing architecture patterns (Next.js App Router, Client Components with Server Actions) without introducing new abstraction layers or patterns.

## Project Structure

### Documentation (this feature)

```text
specs/001-events-designer/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
web/                                          # Next.js 16 web application
├── src/
│   ├── app/
│   │   └── (event-builder)/
│   │       └── events/
│   │           └── [eventId]/
│   │               ├── layout.tsx            # Event builder layout (existing)
│   │               ├── design/               # NEW: Renamed from /content
│   │               │   ├── page.tsx          # NEW: Redirect to /welcome
│   │               │   ├── welcome/
│   │               │   │   └── page.tsx      # NEW: Welcome editor route
│   │               │   ├── experiences/
│   │               │   │   ├── create/
│   │               │   │   │   └── page.tsx  # NEW: Inline create form
│   │               │   │   └── [experienceId]/
│   │               │   │       └── page.tsx  # NEW: Experience editor route
│   │               │   └── ending/
│   │               │       └── page.tsx      # NEW: Ending editor route
│   │               ├── distribution/         # Existing tab (unchanged)
│   │               ├── results/              # Existing tab (unchanged)
│   │               └── page.tsx              # Event overview (existing)
│   │
│   └── components/
│       └── organizer/
│           └── builder/
│               ├── DesignBuilder.tsx         # NEW: Replaces ContentBuilder, manages shared state
│               ├── BuilderSidebar.tsx        # MODIFIED: Remove Experiences menu, show list by default
│               ├── ExperiencesList.tsx       # MODIFIED: Update to work with routing
│               ├── WelcomeEditor.tsx         # MODIFIED: Extract from ContentBuilder
│               ├── ExperienceEditor.tsx      # MODIFIED: Extract from ContentBuilder
│               ├── EndingEditor.tsx          # MODIFIED: Extract from ContentBuilder
│               ├── CreateExperienceForm.tsx  # NEW: Inline form component
│               └── ExperienceTypeDialog.tsx  # DEPRECATED: Remove (replaced by inline form)
│
└── __tests__/                                # Test files co-located with components
```

**Structure Decision**: This is a web application using Next.js App Router with route groups. The feature modifies the existing `(event-builder)` route group by restructuring the content tab into nested design routes. Components follow the existing pattern of organizing organizer-specific components under `components/organizer/builder/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

_No complexity violations. This feature follows established Next.js App Router patterns and maintains existing architecture._

## Phase 0: Research & Technical Decisions

### Research Questions

1. **Next.js App Router - Nested Dynamic Routes**
   - How to structure nested dynamic routes with both `[eventId]` and `[experienceId]`?
   - How to handle redirects in page.tsx (e.g., `/design` → `/design/welcome`)?
   - Best practices for maintaining shared state across sibling routes?

2. **Client-Side State Management Across Routes**
   - How to preserve experiences list state across navigation without prop drilling?
   - Should we use React Context, URL state, or client-side cache?
   - How to handle real-time Firestore subscriptions across route changes?

3. **Form Validation with Zod**
   - Schema structure for experience creation form (name + type)?
   - How to integrate Zod with React Hook Form for inline form?
   - Server-side validation patterns with Next.js Server Actions?

4. **404 Handling for Invalid Experience IDs**
   - How to implement custom 404 page in App Router for invalid experience routes?
   - Should we use `notFound()` from next/navigation or custom error boundary?
   - Best practices for displaying link back to design section from 404?

5. **Mobile Sidebar Pattern**
   - Best practices for persistent sidebar on desktop + collapsible drawer on mobile?
   - Should sidebar use Sheet component or custom implementation?
   - How to maintain selected state when opening/closing mobile drawer?

### Output Artifact

`research.md` - Consolidated findings with decisions, rationale, and alternatives considered for each research question.

## Phase 1: Design Artifacts

### Data Model

**Output**: `data-model.md`

Key entities from feature spec:
- **Experience**: name (string), type (enum), enabled (boolean), createdAt (timestamp)
- **Event**: existing entity, no schema changes required

Data model document will specify:
- Firestore collection/subcollection structure
- TypeScript interfaces
- Zod validation schemas
- State transitions (experience creation flow)

### API Contracts

**Output**: `contracts/`

Define contracts for:
- **Create Experience**: Input (name, type), Output (experience ID), Validation rules
- **Get Experiences**: Input (eventId), Output (experiences array), Sort order
- **Update Experience**: Input (experienceId, partial data), Output (success/error)
- **Delete Experience**: Input (experienceId), Output (success/error)

Contracts will use existing Server Actions pattern (already established in codebase).

### Quickstart Guide

**Output**: `quickstart.md`

Developer setup guide covering:
1. Understanding the routing structure (`/design/*` hierarchy)
2. How to add new design sections (if needed in future)
3. How to modify the sidebar navigation
4. How to test the inline creation flow
5. How to handle route-based state management

## Phase 2: Task Breakdown

**Output**: `tasks.md` (generated by `/speckit.tasks` command - NOT part of this plan command)

Tasks will be organized by user story priority (P1 → P4) and include:
- Route structure setup
- Component refactoring (ContentBuilder → DesignBuilder)
- Inline form implementation
- Sidebar updates
- Validation and testing
- Polish and cleanup

## Dependencies & Assumptions

### Dependencies

- Existing event builder infrastructure (layout, navigation tabs)
- Existing BuilderSidebar component
- Existing WelcomeEditor, ExperienceEditor, EndingEditor components
- Existing Server Actions for experience CRUD operations
- Firebase Firestore client SDK setup

### Assumptions

1. Event IDs and Experience IDs are valid Firestore document IDs
2. Users will create experiences one at a time (no bulk creation)
3. Experiences list will remain small (1-10 experiences typical)
4. Real-time updates via Firestore snapshots are acceptable (no optimistic UI required)
5. Browser back/forward navigation should work without confirmation dialogs
6. Sidebar can be hidden on mobile (Sheet component) without losing context

## Validation Checkpoints

Before marking feature complete, validate:

1. **Routing Validation**
   - [ ] All design routes render correctly (`/welcome`, `/experiences/create`, `/experiences/:id`, `/ending`)
   - [ ] URL updates reflect selected section at all times
   - [ ] Browser back/forward buttons navigate correctly
   - [ ] Direct navigation to routes works (deep linking)
   - [ ] Invalid experience IDs show 404 page with back link

2. **Component Validation**
   - [ ] Sidebar shows experiences list by default (no menu expansion needed)
   - [ ] Inline creation form validates name and type before submission
   - [ ] Form redirects to experience editor after successful creation
   - [ ] Experiences list updates immediately after creation

3. **Mobile Validation**
   - [ ] All design routes work on mobile viewport (320px-768px)
   - [ ] Sidebar collapses into Sheet on mobile
   - [ ] Touch targets meet 44x44px minimum
   - [ ] Form inputs are usable on mobile

4. **Code Quality Validation**
   - [ ] `pnpm lint` passes with no errors
   - [ ] `pnpm type-check` passes with no TypeScript errors
   - [ ] All tests pass (`pnpm test`)
   - [ ] Test coverage ≥70% for new components

5. **Constitution Compliance**
   - [ ] Mobile-first design verified on real mobile device
   - [ ] TypeScript strict mode maintained (no `any`)
   - [ ] Zod validation applied to form inputs
   - [ ] No premature optimization or unnecessary abstractions

## Next Steps

After this plan is complete:

1. Run `/speckit.tasks` to generate actionable task breakdown
2. Run `/speckit.implement` to execute tasks systematically
3. Validate each checkpoint as tasks are completed
4. Conduct final validation loop before merging to main
