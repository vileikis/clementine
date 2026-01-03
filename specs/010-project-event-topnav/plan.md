# Implementation Plan: Project & Event Top Navigation Bar

**Branch**: `010-project-event-topnav` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-project-event-topnav/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a reusable top navigation bar component for project and event detail pages that displays contextual breadcrumbs and action buttons. The component will show project hierarchy (folder icon + project name for projects, project name / event name for events) and provide quick access to actions (share, preview, publish) with placeholder toast notifications. This enhances user orientation and establishes UI patterns for future functionality.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**: React 19.2, TanStack Start 1.132, TanStack Router 1.132, Lucide React (icons), Sonner (toasts), shadcn/ui components
**Storage**: Firebase Firestore (existing project/event data loaded via route loaders)
**Testing**: Vitest (unit tests for component behavior and interactions)
**Target Platform**: Web (Chrome, Safari, Firefox, Edge - modern browsers), Mobile-responsive (320px minimum width)
**Project Type**: Web application (TanStack Start monorepo, single frontend app)
**Performance Goals**: Component render < 16ms (60fps), navigation transitions < 100ms, mobile touch target minimum 44x44px
**Constraints**: Mobile-first design, must work at 320px viewport width, maintain existing route loader performance, reuse existing UI components (no new dependencies)
**Scale/Scope**: Single reusable component, 2 route integrations (project + event layouts), ~3-5 new component files in navigation domain

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Design ✅ PASS

- **Primary viewport**: Feature explicitly designed for 320px-768px mobile devices
- **Touch targets**: FR-006 requires minimum 44x44px touch targets for all interactive elements
- **Mobile testing**: Spec requires testing on narrow screens (320px) with truncation behavior
- **Responsive behavior**: Breadcrumb truncation and button visibility maintained on mobile

**Verdict**: PASS - Feature follows mobile-first principle with explicit mobile requirements.

### Principle II: Clean Code & Simplicity ✅ PASS

- **YAGNI**: Implementing only current requirements (breadcrumb + placeholder actions), no premature abstractions
- **Reusability**: Single TopNavBar component shared across routes, avoiding duplication
- **Scope**: Small, focused component with clear responsibility (navigation context display)
- **Dependencies**: Uses existing libraries (Lucide, Sonner, shadcn/ui), no new dependencies

**Verdict**: PASS - Feature maintains simplicity with focused scope and reuses existing patterns.

### Principle III: Type-Safe Development ✅ PASS

- **TypeScript strict**: All code will use TypeScript 5.7 strict mode (existing project standard)
- **Type safety**: Route params and loader data already typed via TanStack Router
- **Zod validation**: Not required (no external input - data comes from typed route loaders)
- **No `any` types**: Component props will be fully typed with explicit interfaces

**Verdict**: PASS - Feature follows type-safe development practices.

### Principle IV: Minimal Testing Strategy ✅ PASS

- **Test focus**: Unit tests for component rendering, click handlers, responsive behavior
- **Critical paths**: Test breadcrumb navigation, toast triggers, truncation behavior
- **Coverage**: Target 70%+ coverage for TopNavBar component and subcomponents
- **Pragmatic**: No E2E tests needed (leverages existing route loaders, minimal integration complexity)

**Verdict**: PASS - Testing strategy is pragmatic and focused on component behavior.

### Principle V: Validation Gates ✅ PASS

- **Pre-commit validation**: Will run `pnpm app:check` (format, lint, type-check) before commits
- **Standards compliance**: Component will follow design system (theme tokens, no hard-coded colors)
- **Manual review**: Review against frontend/design-system.md, frontend/component-libraries.md, global/project-structure.md
- **Dev server testing**: Verify navigation behavior in local dev server before committing

**Verdict**: PASS - Validation workflow will be followed.

### Principle VI: Frontend Architecture ✅ PASS

- **Client-first**: Component uses client-side data from route loaders (no server-side data fetching)
- **No SSR needed**: Navigation component renders client-side, uses existing SSR route data
- **Real-time**: Not applicable (static breadcrumb data from loaders)
- **TanStack Router**: Uses `<Link>` component for navigation, route params for context

**Verdict**: PASS - Follows client-first architecture pattern.

### Principle VII: Backend & Firebase ✅ PASS (N/A)

- **No backend changes**: Feature uses existing Firestore data via route loaders
- **No Admin SDK**: No server-side operations required
- **Client SDK**: Project/event data already loaded via existing route loaders

**Verdict**: PASS - No backend changes needed, uses existing data.

### Principle VIII: Project Structure ✅ PASS

- **Vertical slice**: Component belongs to `domains/navigation/` (existing domain)
- **File organization**: Components in `components/`, barrel exports in `index.ts`
- **File naming**: `TopNavBar.tsx`, `TopNavBreadcrumb.tsx`, `TopNavActions.tsx`
- **Public API**: Export only components (TopNavBar), not internal subcomponents

**Verdict**: PASS - Follows vertical slice architecture in navigation domain.

### Standards Compliance Review

**Applicable Standards**:
- ✅ `global/project-structure.md` - Navigation domain, barrel exports
- ✅ `global/code-quality.md` - Validation workflow, ESLint, Prettier
- ✅ `global/coding-style.md` - File naming, component structure
- ✅ `frontend/design-system.md` - Theme tokens (no hard-coded colors)
- ✅ `frontend/component-libraries.md` - shadcn/ui Button component
- ✅ `frontend/architecture.md` - Client-first pattern
- ✅ `frontend/responsive.md` - Mobile-first breakpoints, 320px minimum
- ✅ `frontend/accessibility.md` - Touch targets, semantic HTML

**Overall Gate Status**: ✅ **PASS** - All constitution principles satisfied, no violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/010-project-event-topnav/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── component-api.md # Component props interface contracts
├── checklists/          # Quality validation checklists
│   └── requirements.md  # Specification quality checklist (completed)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/clementine-app/
└── src/
    ├── domains/navigation/
    │   └── components/
    │       ├── TopNavBar.tsx           # NEW: Main navigation bar container
    │       ├── TopNavBreadcrumb.tsx    # NEW: Breadcrumb display component
    │       ├── TopNavActions.tsx       # NEW: Action buttons container
    │       └── index.ts                # UPDATED: Add exports for new components
    │
    ├── app/workspace/$workspaceSlug.projects/
    │   ├── $projectId.tsx              # UPDATED: Add TopNavBar to project layout
    │   └── $projectId.events/
    │       └── $eventId.tsx            # UPDATED: Add TopNavBar to event layout
    │
    └── ui-kit/components/
        ├── button.tsx                  # EXISTING: shadcn/ui Button component
        └── sonner.tsx                  # EXISTING: Toast notification system

tests/ (if applicable)
└── domains/navigation/
    └── components/
        ├── TopNavBar.test.tsx          # NEW: Component unit tests
        ├── TopNavBreadcrumb.test.tsx   # NEW: Breadcrumb unit tests
        └── TopNavActions.test.tsx      # NEW: Actions unit tests
```

**Structure Decision**:

This feature follows the existing **monorepo web application structure** with vertical slice architecture. Components are organized in the `domains/navigation/` domain alongside existing navigation components (Sidebar, AdminNav, WorkspaceNav). The navigation domain already exists and contains related components, making it the natural home for the top navigation bar.

**Key Integration Points**:
1. **Navigation Domain** (`domains/navigation/components/`) - Add 3 new components
2. **Project Layout Route** (`$projectId.tsx`) - Integrate TopNavBar above `<Outlet />`
3. **Event Layout Route** (`$eventId.tsx`) - Integrate TopNavBar above existing content
4. **UI Kit** - Reuse existing Button and Sonner (toast) components

**Rationale**:
- Maintains consistency with existing codebase structure
- Leverages established navigation domain patterns
- Minimizes new files (3 components + tests)
- Reuses existing UI components and patterns
- No new dependencies required

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations detected - this section is not applicable.*

All constitution principles are satisfied:
- Mobile-first design with explicit 320px minimum width
- Simple, focused component with clear responsibility
- TypeScript strict mode with full type safety
- Pragmatic testing strategy (unit tests only)
- Follows validation gates and standards compliance
- Client-first architecture (no backend changes)
- Vertical slice structure in navigation domain
