# Implementation Plan: Sidebar Navigation System

**Branch**: `013-sidebar-nav` | **Date**: 2025-12-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-sidebar-nav/spec.md`

## Summary

Replace the current top navigation (AppNavbar + NavTabs) with a collapsible left sidebar that provides persistent navigation across all admin pages. The sidebar will feature a company switcher at top, navigation items (Projects, Experiences, Analytics, Settings) with YouTube-style collapse behavior, and a logout button at bottom. Uses existing company slug routing infrastructure from 012-company-context.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui, lucide-react (icons), Zustand (state management)
**Storage**: Browser localStorage via Zustand persist middleware, Firestore (read-only via existing Companies feature)
**Testing**: Jest + React Testing Library (unit tests, co-located)
**Target Platform**: Web (modern browsers), mobile-first but sidebar for desktop (mobile overlay out of scope)
**Project Type**: Web application (Next.js App Router monorepo)
**Performance Goals**: Sidebar toggle < 300ms with smooth animation, page navigation instant
**Constraints**: Touch targets ≥44x44px, localStorage available, company slug lookup < 500ms
**Scale/Scope**: ~10 new/modified components, 4 navigation routes, affects all admin layouts

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Sidebar touch targets ≥44x44px, collapse toggle accessible, collapsed state works on narrow viewports. Note: Full mobile sidebar drawer is out of scope per PRD.
- [x] **Clean Code & Simplicity**: Reuses existing company lookup infrastructure, no new abstractions beyond sidebar component family
- [x] **Type-Safe Development**: TypeScript strict mode, Zod validation for localStorage state parsing
- [x] **Minimal Testing Strategy**: Jest unit tests for sidebar state management and navigation logic
- [x] **Validation Loop Discipline**: Plan includes lint, type-check, test tasks before completion
- [x] **Firebase Architecture Standards**: Read-only company lookup via existing Client SDK pattern, no new writes
- [x] **Feature Module Architecture**: Sidebar as dedicated feature module in `web/src/features/sidebar/` following vertical slice architecture
- [x] **Technical Standards**: Applicable standards from `standards/` reviewed

**Complexity Violations**: None. This feature uses existing patterns and infrastructure.

## Project Structure

### Documentation (this feature)

```text
specs/013-sidebar-nav/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no API contracts)
├── checklists/
│   └── requirements.md  # Spec validation checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
web/src/
├── app/
│   ├── page.tsx                             # Root redirect logic (smart company redirect)
│   └── (workspace)/
│       ├── layout.tsx                       # Update: Workspace layout with sidebar
│       ├── page.tsx                         # Companies list (update: move to /companies)
│       ├── companies/
│       │   └── page.tsx                     # NEW: Company list page
│       └── (company)/
│           └── [companySlug]/
│               ├── layout.tsx               # Update: Remove top nav, integrate with sidebar
│               ├── projects/page.tsx        # Existing
│               ├── exps/page.tsx            # Existing
│               ├── analytics/page.tsx       # NEW: Placeholder
│               └── settings/page.tsx        # Existing
├── features/
│   └── sidebar/                             # NEW: Sidebar feature module
│       ├── components/
│       │   ├── Sidebar.tsx                  # Main sidebar container
│       │   ├── SidebarNav.tsx               # Navigation items list
│       │   ├── SidebarNavItem.tsx           # Individual nav item
│       │   ├── CompanySwitcher.tsx          # Company avatar + name
│       │   ├── SidebarLogout.tsx            # Logout button
│       │   └── index.ts                     # Barrel export
│       ├── stores/
│       │   ├── sidebar.store.ts             # Zustand store with persist
│       │   └── index.ts                     # Barrel export
│       ├── hooks/
│       │   ├── useSidebarStore.ts           # Store hook (re-export for convenience)
│       │   └── index.ts                     # Barrel export
│       ├── types/
│       │   ├── sidebar.types.ts             # NavigationItem, SidebarState types
│       │   └── index.ts                     # Barrel export
│       ├── constants.ts                     # Navigation items config
│       └── index.ts                         # Feature public API
└── components/
    └── shared/
        ├── Breadcrumbs.tsx                  # Update: Use in content area (not sidebar)
        └── AppNavbar.tsx                    # DEPRECATE: Replace with sidebar
```

**Structure Decision**: Sidebar is a dedicated feature module following vertical slice architecture. State management via Zustand store with built-in persist middleware for localStorage (no Provider needed, cleaner API).

## Complexity Tracking

> No complexity violations identified. Feature uses existing patterns.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       | N/A        | N/A                                  |
