# Route Contracts: 056 Project Router Restructure

**Date**: 2026-02-09

## Route Hierarchy

```
/workspace/$workspaceSlug/projects/$projectId          (ProjectLayout - primary tabs)
├── /                                                   (redirect → /designer/welcome)
├── /designer                                           (DesignerLayout - sub-tabs)
│   ├── /                                               (redirect → /designer/welcome)
│   ├── /welcome                                        (WelcomeEditorPage)
│   ├── /share                                          (ShareEditorPage)
│   ├── /theme                                          (ThemeEditorPage)
│   └── /settings                                       (ProjectConfigSettingsPage)
├── /distribute                                         (DistributePage)
├── /connect                                            (ConnectPage - WIP)
└── /analytics                                          (AnalyticsPage - WIP)
```

## Route File Mapping

All routes in `apps/clementine-app/src/app/workspace/`

| File | Route Path | Component | Purpose |
|------|-----------|-----------|---------|
| `$workspaceSlug.projects/$projectId.tsx` | `/workspace/$ws/projects/$pid` | `ProjectLayout` | Primary layout: breadcrumbs, primary tabs, conditional publish controls |
| `$workspaceSlug.projects/$projectId.index.tsx` | `/workspace/$ws/projects/$pid/` | (redirect) | Redirect to `/designer/welcome` |
| `$workspaceSlug.projects/$projectId.designer.tsx` | `/workspace/$ws/projects/$pid/designer` | `DesignerLayout` | Designer sub-layout: sub-tabs + `<Outlet />` |
| `$workspaceSlug.projects/$projectId.designer.index.tsx` | `/workspace/$ws/projects/$pid/designer/` | (redirect) | Redirect to `/designer/welcome` |
| `$workspaceSlug.projects/$projectId.designer.welcome.tsx` | `/workspace/$ws/projects/$pid/designer/welcome` | `WelcomeEditorPage` | Welcome screen editor |
| `$workspaceSlug.projects/$projectId.designer.share.tsx` | `/workspace/$ws/projects/$pid/designer/share` | `ShareEditorPage` | Share screen editor |
| `$workspaceSlug.projects/$projectId.designer.theme.tsx` | `/workspace/$ws/projects/$pid/designer/theme` | `ThemeEditorPage` | Theme editor |
| `$workspaceSlug.projects/$projectId.designer.settings.tsx` | `/workspace/$ws/projects/$pid/designer/settings` | `ProjectConfigSettingsPage` | Project settings |
| `$workspaceSlug.projects/$projectId.distribute.tsx` | `/workspace/$ws/projects/$pid/distribute` | `DistributePage` | Full-page distribution (URL, QR, instructions) |
| `$workspaceSlug.projects/$projectId.connect.tsx` | `/workspace/$ws/projects/$pid/connect` | `ConnectPage` | WIP placeholder for integrations |
| `$workspaceSlug.projects/$projectId.analytics.tsx` | `/workspace/$ws/projects/$pid/analytics` | `AnalyticsPage` | WIP placeholder for analytics |

## Component Contracts

### ProjectLayout

```typescript
// Domain: project
// Location: domains/project/layout/containers/ProjectLayout.tsx
// Rendered by: $projectId.tsx route

interface ProjectLayoutProps {
  project: Project
  workspaceSlug: string
}

// Renders:
// - TopNavBar with breadcrumbs (project name → projects list)
// - Primary NavTabs: Designer, Distribute, Connect, Analytics
// - Conditional right-side actions (publish workflow) based on active route
// - <Outlet /> for child route content
```

### DesignerLayout (refactored ProjectConfigDesignerLayout)

```typescript
// Domain: project-config
// Location: domains/project-config/designer/containers/ProjectConfigDesignerLayout.tsx
// Rendered by: $projectId.designer.tsx route

// No props needed — uses Outlet context or hooks for project data

// Renders:
// - Sub-NavTabs: Welcome, Share, Theme, Settings
// - <Outlet /> for editor page content
```

### DistributePage

```typescript
// Domain: project
// Location: domains/project/distribute/containers/DistributePage.tsx
// Rendered by: $projectId.distribute.tsx route

// Uses route params for projectId
// Reuses: ShareLinkSection, QRCodeDisplay, useCopyToClipboard, useQRCodeGenerator
// from domains/project/share/

// Renders:
// - Full-page layout with shareable URL, QR code, help instructions
```

### ConnectPage (WIP)

```typescript
// Domain: project
// Location: domains/project/connect/containers/ConnectPage.tsx
// Rendered by: $projectId.connect.tsx route

// Renders:
// - WIP placeholder with icon, title, description
// - Indicates integrations & webhooks feature is coming
```

### AnalyticsPage (WIP)

```typescript
// Domain: project
// Location: domains/project/analytics/containers/AnalyticsPage.tsx
// Rendered by: $projectId.analytics.tsx route

// Renders:
// - WIP placeholder with icon, title, description
// - Indicates analytics feature is coming
```

## Publish Workflow Visibility

| Route | EditorSaveStatus | EditorChangesBadge | Share Button | Publish Button |
|-------|-----------------|-------------------|--------------|----------------|
| `/designer/*` | Yes | Yes | Yes | Yes |
| `/distribute` | Yes | Yes | No (already on distribute) | Yes |
| `/connect` | No | No | No | No |
| `/analytics` | No | No | No | No |
