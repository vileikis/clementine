# Implementation Plan: Project Router Restructure

**Branch**: `056-project-router` | **Date**: 2026-02-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/056-project-router/spec.md`

## Summary

Restructure the project router from a flat single-layout architecture to a two-level navigation hierarchy. The current `ProjectConfigDesignerLayout` handles everything (breadcrumbs, tabs, publish workflow, editor shell). This restructure splits it into:

1. **Project Layout** (primary tabs: Designer, Distribute, Connect, Analytics) — owned by `project` domain
2. **Designer Layout** (sub-tabs: Welcome, Share, Theme, Settings) — owned by `project-config` domain

Additionally, introduces three new pages: Distribute (full-page sharing), Connect (WIP placeholder for integrations), and Analytics (WIP placeholder).

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: TanStack Start 1.132.0, TanStack Router 1.132.0, React 19.2.0, Zustand 5.x
**Storage**: Firebase Firestore (no schema changes)
**Testing**: Vitest
**Target Platform**: Web (mobile-first)
**Project Type**: Web application (pnpm monorepo)
**Performance Goals**: Page load < 2s on 4G, tab switches instant (client-side routing)
**Constraints**: Mobile-first (320px-768px primary), touch targets 44x44px
**Scale/Scope**: ~11 route files, ~5 new/modified domain components, 0 backend changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gate (Phase 0)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First | PASS | Primary tabs must render well on mobile; NavTabs already supports horizontal scrolling |
| II. Clean Code | PASS | Restructure improves clarity by separating project-level from designer-level concerns |
| III. Type-Safe | PASS | TanStack Router provides full type-safe routing; no `any` escapes |
| IV. Minimal Testing | PASS | Focus on navigation behavior tests if added |
| V. Validation Gates | PASS | Will run `pnpm app:check` + `pnpm app:type-check` before completion |
| VI. Frontend Architecture | PASS | Client-first pattern maintained; no new server functions |
| VII. Backend & Firebase | PASS | No Firestore schema changes; no new Firebase operations |
| VIII. Project Structure | PASS | Vertical slice architecture improved — clearer domain boundaries |

### Post-Design Gate (Phase 1)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First | PASS | Two-level tabs tested against mobile viewport; secondary tabs use horizontal scroll |
| II. Clean Code | PASS | Single responsibility: ProjectLayout handles project nav, DesignerLayout handles designer nav |
| III. Type-Safe | PASS | All route params (`workspaceSlug`, `projectId`) typed by TanStack Router |
| IV. Minimal Testing | PASS | Existing tests unaffected; no mandatory new tests for routing restructure |
| V. Validation Gates | PASS | Standards compliance reviewed: design-system tokens, project-structure patterns |
| VI. Frontend Architecture | PASS | No server-side changes; all navigation is client-side |
| VII. Backend & Firebase | N/A | No backend changes |
| VIII. Project Structure | PASS | Domain boundaries clarified: project owns layout, project-config owns designer |

## Project Structure

### Documentation (this feature)

```text
specs/056-project-router/
├── plan.md              # This file
├── research.md          # Phase 0 output (completed)
├── data-model.md        # Phase 1 output (completed)
├── quickstart.md        # Phase 1 output (completed)
├── contracts/           # Phase 1 output (completed)
│   ├── routes.md        # Route hierarchy and file mapping
│   └── components.md    # Component contracts and interfaces
├── checklists/
│   └── requirements.md  # Requirements checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── app/workspace/                                    # Route files (thin)
│   └── $workspaceSlug.projects/
│       ├── $projectId.tsx                            # MODIFY: Render ProjectLayout instead of ProjectConfigDesignerLayout
│       ├── $projectId.index.tsx                      # MODIFY: Redirect to /designer/welcome
│       ├── $projectId.designer.tsx                   # NEW: Designer layout route
│       ├── $projectId.designer.index.tsx             # NEW: Redirect to /designer/welcome
│       ├── $projectId.designer.welcome.tsx           # RENAME: from $projectId.welcome.tsx
│       ├── $projectId.designer.share.tsx             # RENAME: from $projectId.share.tsx
│       ├── $projectId.designer.theme.tsx             # RENAME: from $projectId.theme.tsx
│       ├── $projectId.designer.settings.tsx          # RENAME: from $projectId.settings.tsx
│       ├── $projectId.distribute.tsx                 # NEW: Distribute page route
│       ├── $projectId.connect.tsx                    # NEW: Connect WIP route
│       └── $projectId.analytics.tsx                  # NEW: Analytics WIP route
│
├── domains/project/                                  # Project domain (expanded)
│   ├── layout/                                       # NEW subdomain
│   │   ├── index.ts
│   │   └── containers/
│   │       ├── index.ts
│   │       └── ProjectLayout.tsx                     # NEW: Primary project layout
│   ├── distribute/                                   # NEW subdomain
│   │   ├── index.ts
│   │   └── containers/
│   │       ├── index.ts
│   │       └── DistributePage.tsx                    # NEW: Full-page distribution
│   ├── connect/                                      # NEW subdomain
│   │   ├── index.ts
│   │   └── containers/
│   │       ├── index.ts
│   │       └── ConnectPage.tsx                       # NEW: WIP placeholder
│   ├── analytics/                                    # NEW subdomain
│   │   ├── index.ts
│   │   └── containers/
│   │       ├── index.ts
│   │       └── AnalyticsPage.tsx                     # NEW: WIP placeholder
│   ├── share/                                        # UNCHANGED
│   ├── shared/                                       # UNCHANGED
│   └── index.ts                                      # MODIFY: Add new exports
│
├── domains/project-config/
│   └── designer/containers/
│       └── ProjectConfigDesignerLayout.tsx            # MODIFY: Simplify to sub-tabs only
│
└── shared/components/
    └── WipPlaceholder.tsx                            # NEW: Reusable WIP placeholder
```

**Structure Decision**: Follows the existing monorepo web application structure. New subdomains (`layout`, `distribute`, `connect`, `analytics`) added to the `project` domain following vertical slice patterns. Each subdomain has `containers/` with barrel exports.

## Complexity Tracking

> No constitution violations. The restructure reduces complexity by clarifying domain boundaries.

No entries needed.
