# Implementation Plan: App Navigation Refactor

**Branch**: `020-app-nav-refactor` | **Date**: 2025-01-12 | **Spec**: [app-nav-refactor-prd.md](../../requirements/app-nav-refactor-prd.md)
**Input**: Feature specification from `/requirements/app-nav-refactor-prd.md`

## Summary

Refactor the application sidebar navigation from a top-down pattern (shell knows about areas) to a bottom-up composition pattern (area-specific sidebars compose a generic shell). This improves separation of concerns, discoverability, and extensibility. The refactor includes migrating `NavigationLink` to use TanStack Router's type-safe `params` prop instead of string replacement.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode enabled)
**Primary Dependencies**: TanStack Start 1.132.0, TanStack Router 1.132.0, React 19.2.0, Zustand 5.x
**Storage**: N/A (navigation state persisted to localStorage via Zustand)
**Testing**: Vitest
**Target Platform**: Web (mobile-first, responsive)
**Project Type**: Web application (monorepo - `apps/clementine-app/`)
**Performance Goals**: Page load < 2 seconds on 4G, 60fps animations
**Constraints**: Must preserve existing UX (collapse state persistence, mobile sheet behavior, 200ms animation duration)
**Scale/Scope**: 2 navigation areas (admin, workspace), ~10 files modified/created

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | Preserves existing mobile Sheet + desktop aside pattern |
| II. Clean Code & Simplicity | ✅ PASS | Improves separation of concerns; removes area dispatch logic from shell |
| III. Type-Safe Development | ✅ PASS | Adds type-safe route params via TanStack Router |
| IV. Minimal Testing Strategy | ✅ PASS | No new tests required (refactor, not new feature) |
| V. Validation Gates | ✅ PASS | Will run lint/type-check/format before commit |
| VI. Frontend Architecture | ✅ PASS | Client-first pattern unchanged |
| VII. Backend & Firebase | N/A | No backend changes |
| VIII. Project Structure | ✅ PASS | Follows vertical slice architecture (shell/, admin/, workspace/, shared/) |

**Standards to Review Before Implementation:**
- `frontend/component-libraries.md` - shadcn/ui patterns for Sheet, Button
- `global/project-structure.md` - Feature module structure with barrel exports
- `global/code-quality.md` - Validation workflows

## Project Structure

### Documentation (this feature)

```text
specs/020-app-nav-refactor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── app/
│   └── routes/
│       ├── admin/
│       │   └── route.tsx        # MODIFIED: Use AdminSidebar
│       └── workspace/
│           └── route.tsx        # MODIFIED: Use WorkspaceSidebar
└── domains/
    └── navigation/
        ├── components/
        │   ├── shell/
        │   │   ├── AppSidebarShell.tsx    # NEW: Generic shell component
        │   │   └── index.ts               # NEW: Barrel export
        │   ├── admin/
        │   │   ├── AdminSidebar.tsx       # NEW: Admin-specific sidebar
        │   │   ├── adminNavItems.ts       # NEW: Admin nav configuration
        │   │   └── index.ts               # NEW: Barrel export
        │   ├── workspace/
        │   │   ├── WorkspaceSidebar.tsx   # NEW: Workspace-specific sidebar
        │   │   ├── workspaceNavItems.ts   # NEW: Workspace nav configuration
        │   │   ├── WorkspaceSelector.tsx  # MOVED from parent
        │   │   └── index.ts               # NEW: Barrel export
        │   ├── shared/
        │   │   ├── NavigationLink.tsx     # MODIFIED: Add params prop
        │   │   ├── LogoutButton.tsx       # NEW: Extracted from Sidebar
        │   │   └── index.ts               # NEW: Barrel export
        │   ├── Sidebar.tsx                # DELETED
        │   ├── AdminNav.tsx               # DELETED (merged into AdminSidebar)
        │   ├── WorkspaceNav.tsx           # DELETED (merged into WorkspaceSidebar)
        │   └── index.ts                   # MODIFIED: Update exports
        └── types/
            └── navigation.types.ts        # MODIFIED: Update NavItem type
```

**Structure Decision**: Web application using vertical slice architecture. Navigation domain reorganized into submodules (shell, admin, workspace, shared) with barrel exports. Each area sidebar is self-contained and composes the generic shell.

## Complexity Tracking

> **No violations. Feature follows Clean Code & Simplicity principles.**

This refactor reduces complexity by:
- Removing area dispatch logic from shell component
- Creating clear ownership boundaries (admin owns AdminSidebar, workspace owns WorkspaceSidebar)
- Improving discoverability (nav items in dedicated files)
