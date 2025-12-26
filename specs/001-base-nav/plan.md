# Implementation Plan: Base Navigation System

**Branch**: `001-base-nav` | **Date**: 2025-12-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-base-nav/spec.md`

## Summary

Establish the navigation backbone for the Clementine TanStack Start application with three distinct routing areas (admin, workspace, guest) and a collapsible sidebar navigation. This is a UI structure feature using mock data with no authentication or real data fetching. The implementation will use TanStack Router for file-based routing, shadcn/ui components for the sidebar, and client-side state management for sidebar toggle state.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**:
- TanStack Start (full-stack React framework)
- TanStack Router (file-based routing)
- React 19
- shadcn/ui + Radix UI (UI components)
- Tailwind CSS 4 (monochrome styling)
- lucide-react (icons)

**Storage**: N/A (using hardcoded mock workspace data, no database integration)
**Testing**: Vitest + Testing Library (unit tests for navigation logic and workspace initials calculation)
**Target Platform**: Web application (TanStack Start SSR + client-side rendering)
**Project Type**: Web application (single workspace: `apps/clementine-app/`)
**Performance Goals**:
- Page load < 1 second (Success Criteria SC-005)
- Sidebar animation < 300ms (Success Criteria SC-004)
- Navigation response < 2 clicks (Success Criteria SC-001)

**Constraints**:
- Mobile-first design (Constitution Principle I)
- Touch targets 44x44px minimum
- Monochrome styling (FR-014)
- No authentication logic (Out of Scope)
- Mock workspace data only (Out of Scope)

**Scale/Scope**:
- 8 routes total: 1 index redirect, 3 admin routes, 3 workspace routes, 1 guest route
- 1 shared sidebar component with 2 layout variants (admin, workspace)
- Mock data: 3-5 sample workspaces for testing workspace selector logic

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Design ✅ PASS
- **Requirement**: Primary viewport 320px-768px, touch targets 44x44px minimum
- **Compliance**: Sidebar navigation with hamburger icon designed for mobile. Touch targets will use shadcn/ui defaults (44x44px). Collapsible sidebar optimized for narrow viewports.
- **Verification**: Component design will include responsive breakpoints, touch-friendly navigation items

### Principle II: Clean Code & Simplicity ✅ PASS
- **Requirement**: YAGNI, single responsibility, small functions (~30 lines)
- **Compliance**: Simple navigation structure with no premature abstraction. Workspace initials calculation is a single pure function. Sidebar state managed with simple useState hook. Mock data as const arrays.
- **Verification**: No complex state management needed, no over-engineering

### Principle III: Type-Safe Development ✅ PASS
- **Requirement**: TypeScript strict mode, no `any`, Zod validation for external inputs
- **Compliance**: All route params typed via TanStack Router. Mock workspace data typed with interface. Workspace initials function fully typed.
- **Verification**: No external data sources (mock data only), so Zod validation not required for this feature

### Principle IV: Minimal Testing Strategy ✅ PASS
- **Requirement**: Jest/Vitest unit tests, focus on behavior, 70%+ coverage
- **Compliance**: Unit tests for workspace initials calculation (pure function). Component tests for sidebar toggle behavior. No E2E needed for static navigation structure.
- **Verification**: Test coverage for critical logic (workspace selector), visual components tested via manual QA

### Principle V: Validation Gates ✅ PASS
- **Requirement**: `pnpm app:check` before commit, format + lint + type-check + test
- **Compliance**: Standard validation workflow applies. No exceptions needed.
- **Verification**: Will run `pnpm app:check` before marking feature complete

### Principle VI: Frontend Architecture ✅ PASS
- **Requirement**: Client-first pattern, Firebase client SDKs, minimal SSR
- **Compliance**: Pure client-side navigation with no data fetching. Mock workspace data lives in client code. SSR only for route entry points (TanStack Router default). No Firebase integration for this feature.
- **Verification**: No server functions needed, no API calls

### Principle VII: Backend & Firebase ✅ N/A
- **Requirement**: Client SDK for reads, Admin SDK for writes, security rules
- **Compliance**: Not applicable - this feature uses mock data only, no Firebase integration
- **Verification**: Firebase will be integrated in future features

### Principle VIII: Project Structure ✅ PASS
- **Requirement**: Vertical slice architecture, domain-driven structure, barrel exports
- **Compliance**: Navigation domain in `src/domains/navigation/` with components, hooks, types. Routes in `src/routes/` import from navigation domain. Follows DDD structure from CLAUDE.md.
- **Verification**: Domain structure: `domains/navigation/{components,hooks,types,constants}/`

**Gate Result**: ✅ ALL CHECKS PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/001-base-nav/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (apps/clementine-app/)

```text
apps/clementine-app/src/
├── domains/
│   └── navigation/              # NEW - Navigation domain (this feature)
│       ├── components/
│       │   ├── Sidebar.tsx      # Main sidebar component
│       │   ├── AdminNav.tsx     # Admin navigation items
│       │   ├── WorkspaceNav.tsx # Workspace navigation items
│       │   ├── WorkspaceSelector.tsx  # Workspace selector with initials
│       │   └── index.ts         # Barrel export
│       ├── hooks/
│       │   ├── useSidebarState.ts  # Sidebar toggle state hook
│       │   └── index.ts
│       ├── types/
│       │   ├── navigation.types.ts  # Workspace, RouteArea types
│       │   └── index.ts
│       ├── constants/
│       │   ├── mockWorkspaces.ts    # Mock workspace data
│       │   └── index.ts
│       ├── lib/
│       │   ├── getWorkspaceInitials.ts  # Workspace initials calculation
│       │   └── index.ts
│       └── index.ts             # Feature-level barrel export
│
├── routes/
│   ├── __root.tsx               # MODIFIED - Add sidebar layout logic
│   ├── index.tsx                # MODIFIED - Replace home page content
│   ├── admin/
│   │   ├── index.tsx            # NEW - Redirect to /admin/workspaces
│   │   ├── workspaces.tsx       # NEW - WIP placeholder
│   │   └── dev-tools.tsx        # NEW - WIP placeholder
│   ├── workspace/
│   │   └── $workspaceId/
│   │       ├── index.tsx        # NEW - Redirect to /workspace/[id]/projects
│   │       ├── projects.tsx     # NEW - WIP placeholder
│   │       └── settings.tsx     # NEW - WIP placeholder
│   └── guest/
│       └── $projectId.tsx       # NEW - WIP placeholder (no sidebar)
│
└── ui-kit/
    └── components/              # EXISTING - will use existing shadcn/ui components
        ├── button.tsx
        ├── sheet.tsx            # For mobile sidebar
        └── ... (other shadcn components)

tests/
└── navigation/                  # NEW - Navigation tests
    ├── getWorkspaceInitials.test.ts
    └── Sidebar.test.tsx
```

**Structure Decision**: Using vertical slice architecture (Domain-Driven Design) as defined in `standards/global/project-structure.md`. Navigation is a distinct domain with components, hooks, types, and utilities. Routes are thin layers that import from the navigation domain. This follows the client-first architecture from `standards/frontend/architecture.md` with all logic in client-side domain modules.

## Complexity Tracking

N/A - No constitution violations. This is a straightforward UI navigation feature using standard patterns.

---

## Post-Design Constitution Check

*Re-evaluated after Phase 1 design completion*

### Design Artifacts Review

**Artifacts Generated**:
- ✅ `research.md` - Technical decisions documented
- ✅ `data-model.md` - Entities and types defined
- ✅ `contracts/README.md` - No API contracts needed (confirmed)
- ✅ `quickstart.md` - Implementation guide complete

### Constitution Compliance After Design

**Principle I: Mobile-First Design** ✅ CONFIRMED
- Design uses shadcn/ui Sheet component for mobile sidebar (slide-out panel)
- Desktop uses static sidebar (responsive with Tailwind breakpoints)
- All touch targets use shadcn/ui defaults (44x44px minimum)
- Hamburger menu icon for mobile navigation

**Principle II: Clean Code & Simplicity** ✅ CONFIRMED
- Workspace initials: Pure function, ~15 lines
- Sidebar state: Simple useState hook, no complex state management
- Mock data: Const array, no unnecessary abstraction
- Navigation components: Single responsibility (AdminNav, WorkspaceNav, WorkspaceSelector)

**Principle III: Type-Safe Development** ✅ CONFIRMED
- All types defined in `navigation.types.ts` (Workspace, RouteArea, NavItem)
- Route params fully typed via TanStack Router
- No `any` types in design
- Mock data typed with interface

**Principle IV: Minimal Testing Strategy** ✅ CONFIRMED
- Unit tests for `getWorkspaceInitials` function (critical logic)
- Component tests for sidebar toggle behavior
- Coverage focused on business logic, not implementation details
- Manual QA for visual components

**Principle V: Validation Gates** ✅ CONFIRMED
- Quickstart includes `pnpm check` validation step
- Standard validation workflow documented
- Tests included in validation loop

**Principle VI: Frontend Architecture** ✅ CONFIRMED
- Pure client-side navigation (no server functions)
- Mock data in client code (`constants/mockWorkspaces.ts`)
- No Firebase integration needed
- SSR only for route entry points (TanStack Router default)

**Principle VII: Backend & Firebase** ✅ N/A
- No Firebase integration in this feature
- Confirmed in contracts/README.md

**Principle VIII: Project Structure** ✅ CONFIRMED
- Domain structure: `domains/navigation/{components,hooks,types,constants,lib}/`
- Barrel exports defined for all modules
- Routes are thin layers importing from navigation domain
- Follows DDD vertical slice architecture

**Final Gate Result**: ✅ ALL CHECKS PASS - Design adheres to all constitution principles

**No regressions** - Design maintains compliance with all principles validated in pre-research check.
