# Research: 056 Project Router Restructure

**Date**: 2026-02-09
**Status**: Complete

## R1: Current Routing Architecture

**Decision**: TanStack Router file-based routing with layout routes and domain-owned containers.

**Findings**:
- Routes live in `apps/clementine-app/src/app/` using file-based routing
- Current project route hierarchy:
  - `$projectId.tsx` — Layout route, loads project from Firestore, renders `ProjectConfigDesignerLayout`
  - `$projectId.index.tsx` — Redirects to `/welcome`
  - `$projectId.welcome.tsx`, `$projectId.theme.tsx`, `$projectId.share.tsx`, `$projectId.settings.tsx` — Thin child routes importing domain containers
- `routeTree.gen.ts` is auto-generated from file structure
- Routes are thin: they import and render domain containers, no business logic

**Implications for restructure**:
- Must introduce an intermediate `designer` layout route to nest the sub-tabs (welcome, share, theme, settings)
- Primary tabs (Designer, Distribute, Connect, Analytics) will live in a new project-level layout
- TanStack Router supports nested layouts natively via file-based routing hierarchy

## R2: TopNavBar & Navigation Components

**Decision**: Existing TopNavBar already supports a two-row layout with tabs — can be reused directly.

**Findings**:
- `TopNavBar` renders breadcrumbs (row 1) + optional `NavTabs` (row 2)
- `NavTabs` renders `<Link>` components with `activeProps`/`inactiveProps` for active state
- `TabItem` type: `{ id: string, label: string, to: string }`
- The TopNavBar accepts `left` and `right` slots for custom content (editor status, publish button)
- Currently, only **one** level of tabs is rendered — we need **two** levels (primary + Designer sub-tabs)

**Design decision**: Use TopNavBar for primary tabs (Designer, Distribute, Connect, Analytics). For Designer sub-tabs, render a second NavTabs inside the Designer layout — either inline below the TopNavBar or as a secondary tab bar within the content area.

## R3: ProjectConfigDesignerLayout Refactoring

**Decision**: Split into two layers — project layout (primary tabs + publish workflow) and designer layout (sub-tabs).

**Findings**:
- `ProjectConfigDesignerLayout` currently:
  - Renders TopNavBar with breadcrumbs, tabs (Welcome/Share/Theme/Settings), and right-side actions
  - Handles publish workflow (change detection, publish button, save status, changes badge)
  - Renders ShareDialog
  - Renders `ProjectConfigDesignerPage` (which is just `<Outlet />`)
- This component conflates two responsibilities:
  1. Project-level navigation (will become primary tabs)
  2. Designer-specific layout (sub-tabs + editor shell)

**Refactoring approach**:
- Extract a new `ProjectLayout` in the `project` domain for primary tabs + conditional publish workflow
- Keep `ProjectConfigDesignerLayout` (renamed or simplified) for Designer sub-tabs only
- Publish workflow controls shown on Designer + Distribute, hidden on Connect + Analytics (per FR-008)

## R4: ShareDialog → Distribute Page

**Decision**: Extract ShareDialog content into a standalone `DistributePage` component.

**Findings**:
- `ShareDialog` renders: guest URL (ShareLinkSection), QR code (QRCodeDisplay), help instructions
- Sub-components (`ShareLinkSection`, `QRCodeDisplay`) and hooks (`useCopyToClipboard`, `useQRCodeGenerator`) are already modular and can be reused
- The Dialog wrapper (`Dialog`/`DialogContent`) would be removed; content renders as a full page instead
- Guest URL generation: `generateGuestUrl(projectId)` in `shareUrl.utils.ts`

**Approach**: Create a `DistributePage` container that renders the same content as ShareDialog but as a full page layout. Reuse all existing sub-components and hooks from `domains/project/share/`.

## R5: Domain Boundary Responsibilities

**Decision**: Split responsibilities between `project` and `project-config` domains.

**Findings**:
- **`project` domain** (currently): Share dialog, hooks (`useProject`, `useGhostProject`), project queries
- **`project-config` domain** (currently): Designer layout, welcome/share/theme/settings editors, experiences, shared config hooks/queries
- Per FR-006/FR-007, the restructure assigns:
  - `project` domain: Root project layout + primary navigation (Designer, Distribute, Connect, Analytics tabs)
  - `project-config` domain: Designer section with sub-navigation (Welcome, Share, Theme, Settings)

**New domain organization**:
- `project` domain gets: `ProjectLayout` container (primary tabs, publish workflow, breadcrumbs)
- `project` domain keeps: Share utilities (needed by both ShareDialog and DistributePage)
- `project` domain gets: `DistributePage`, `ConnectPage` (WIP), `AnalyticsPage` (WIP) containers
- `project-config` domain keeps: Designer sub-layout, all editor pages

## R6: TanStack Router Nested Layouts

**Decision**: Use TanStack Router's pathless layout routes or additional route segments for the two-level tab structure.

**Findings**:
- TanStack Router supports nested layouts via file hierarchy
- Current: `$projectId.tsx` (layout) → `$projectId.welcome.tsx` (child)
- New structure needs: `$projectId.tsx` (project layout) → `$projectId.designer.tsx` (designer layout) → `$projectId.designer.welcome.tsx` (child)
- Alternative: Use `$projectId/designer/` directory structure for file-based nesting
- The index redirect needs to change from `/welcome` to `/designer/welcome`

**Route file mapping**:
```
$projectId.tsx                     → Project layout (primary tabs)
$projectId.index.tsx               → Redirect to /designer/welcome
$projectId.designer.tsx            → Designer layout (sub-tabs)
$projectId.designer.index.tsx      → Redirect to /designer/welcome
$projectId.designer.welcome.tsx    → WelcomeEditorPage
$projectId.designer.share.tsx      → ShareEditorPage
$projectId.designer.theme.tsx      → ThemeEditorPage
$projectId.designer.settings.tsx   → ProjectConfigSettingsPage
$projectId.distribute.tsx          → DistributePage
$projectId.connect.tsx             → ConnectPage (WIP)
$projectId.analytics.tsx           → AnalyticsPage (WIP)
```

## R7: Publish Workflow Visibility

**Decision**: Conditionally render publish workflow based on active primary tab.

**Findings**:
- Publish workflow components: `EditorSaveStatus`, `EditorChangesBadge`, Share icon button, Publish button
- Currently always visible (single layout wraps all project pages)
- Per FR-008: visible on Designer + Distribute, hidden on Connect + Analytics
- Approach: Pass a prop or use route matching in `ProjectLayout` to conditionally show/hide publish controls

**Implementation**: The `ProjectLayout` can check the current route path or accept a prop from the active tab to determine whether to render publish controls. Using TanStack Router's `useMatch` or checking the pathname is the cleanest approach.

## R8: Standards Compliance

**Decision**: Implementation follows all applicable standards.

**Findings**:
- **Routing standard** (`frontend/routing.md`): Thin routes, domain containers, type-safe navigation — all maintained
- **Project structure** (`global/project-structure.md`): Vertical slices, barrel exports, domain boundaries — restructure improves this by clarifying project vs project-config responsibilities
- **Design system** (`frontend/design-system.md`): All new UI uses theme tokens — no hard-coded colors
- **Component libraries** (`frontend/component-libraries.md`): Reuse existing NavTabs, TopNavBar; WIP pages use standard shadcn/ui patterns
- **Constitution**: Mobile-first (tabs must work on mobile), clean code (YAGNI — WIP pages are simple placeholders), type-safe (all route params typed)
