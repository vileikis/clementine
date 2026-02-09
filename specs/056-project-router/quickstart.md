# Quickstart: 056 Project Router Restructure

**Date**: 2026-02-09

## Prerequisites

- Node.js 18+
- pnpm 10.18.1
- Access to Firebase project (for Firestore data)

## Setup

```bash
# From monorepo root
pnpm install
pnpm app:dev
```

## Key Files to Understand

Before implementing, read these files in order:

### 1. Current Route Structure
- `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.tsx` — Current project layout route
- `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.index.tsx` — Current redirect
- `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.welcome.tsx` — Example child route

### 2. Current Layout & Navigation
- `apps/clementine-app/src/domains/project-config/designer/containers/ProjectConfigDesignerLayout.tsx` — **Main file to refactor** (contains everything being split)
- `apps/clementine-app/src/domains/navigation/components/TopNavBar.tsx` — Navigation bar (unchanged)
- `apps/clementine-app/src/domains/navigation/components/NavTabs.tsx` — Tab component (unchanged)

### 3. Share Components (reused for Distribute)
- `apps/clementine-app/src/domains/project/share/components/ShareDialog.tsx` — Content to extract
- `apps/clementine-app/src/domains/project/share/components/ShareLinkSection.tsx` — Reuse directly
- `apps/clementine-app/src/domains/project/share/components/QRCodeDisplay.tsx` — Reuse directly

### 4. Publish Workflow
- `apps/clementine-app/src/domains/project-config/designer/hooks/usePublishProjectConfig.ts`
- `apps/clementine-app/src/shared/editor-status/components/EditorSaveStatus.tsx`
- `apps/clementine-app/src/shared/editor-status/components/EditorChangesBadge.tsx`

## Implementation Order

1. Create `ProjectLayout` in `domains/project/layout/`
2. Create WIP placeholders (`ConnectPage`, `AnalyticsPage`)
3. Create `DistributePage` in `domains/project/distribute/`
4. Simplify `ProjectConfigDesignerLayout` (remove what moved to ProjectLayout)
5. Update route files (add designer nesting, add new routes)
6. Update redirects (index → designer/welcome)
7. Run `pnpm app:dev` and manually verify all routes
8. Run `pnpm app:type-check` and `pnpm app:lint`

## Verification

```bash
# Type check
pnpm app:type-check

# Lint
pnpm app:lint

# Dev server
pnpm app:dev
```

Then navigate to:
- `/workspace/{slug}/projects/{id}` — Should redirect to `/designer/welcome`
- `/workspace/{slug}/projects/{id}/designer` — Designer with sub-tabs
- `/workspace/{slug}/projects/{id}/distribute` — Full page with URL + QR
- `/workspace/{slug}/projects/{id}/connect` — WIP placeholder
- `/workspace/{slug}/projects/{id}/analytics` — WIP placeholder
