# Component Contracts: 056 Project Router Restructure

**Date**: 2026-02-09

## New Components

### WipPlaceholder (Shared)

Reusable placeholder component for sections under development.

```typescript
// Location: shared/components/WipPlaceholder.tsx

interface WipPlaceholderProps {
  icon: LucideIcon
  title: string
  description: string
}

// Renders:
// - Centered layout with muted icon
// - Title text
// - Description text
// - Uses theme tokens: text-muted-foreground, bg-muted
```

### DistributePage

```typescript
// Location: domains/project/distribute/containers/DistributePage.tsx

// No props — gets projectId from route params

// Renders full-page distribution view:
// - Page title "Distribute"
// - ShareLinkSection (reused from domains/project/share/components/)
// - QRCodeDisplay (reused from domains/project/share/components/)
// - Help instructions section
// - Layout: centered max-w container with spacing
```

### ConnectPage

```typescript
// Location: domains/project/connect/containers/ConnectPage.tsx

// No props

// Renders:
// - WipPlaceholder with Plug icon
// - Title: "Connect"
// - Description: "Set up integrations and webhooks to automatically send results to Dropbox, Google Drive, and more."
```

### AnalyticsPage

```typescript
// Location: domains/project/analytics/containers/AnalyticsPage.tsx

// No props

// Renders:
// - WipPlaceholder with BarChart3 icon
// - Title: "Analytics"
// - Description: "Track engagement, shares, and campaign performance."
```

### ProjectLayout

```typescript
// Location: domains/project/layout/containers/ProjectLayout.tsx

interface ProjectLayoutProps {
  project: Project
  workspaceSlug: string
}

// Primary tabs configuration:
const projectTabs: TabItem[] = [
  { id: 'designer', label: 'Designer', to: '/workspace/$workspaceSlug/projects/$projectId/designer' },
  { id: 'distribute', label: 'Distribute', to: '/workspace/$workspaceSlug/projects/$projectId/distribute' },
  { id: 'connect', label: 'Connect', to: '/workspace/$workspaceSlug/projects/$projectId/connect' },
  { id: 'analytics', label: 'Analytics', to: '/workspace/$workspaceSlug/projects/$projectId/analytics' },
]

// Renders:
// - TopNavBar
//   - breadcrumbs: [{ label: project.name, icon: FolderOpen, iconHref: projectsListPath }]
//   - tabs: projectTabs
//   - right: conditional publish workflow (visible on Designer + Distribute only)
// - ShareDialog (managed by this layout)
// - <Outlet /> for child route content
```

## Modified Components

### ProjectConfigDesignerLayout (Simplified)

```typescript
// Location: domains/project-config/designer/containers/ProjectConfigDesignerLayout.tsx (modified)

// Changes:
// - REMOVE: TopNavBar rendering (moved to ProjectLayout)
// - REMOVE: Breadcrumbs (moved to ProjectLayout)
// - REMOVE: Primary tabs (moved to ProjectLayout)
// - REMOVE: Publish workflow controls (moved to ProjectLayout)
// - REMOVE: ShareDialog (moved to ProjectLayout)
// - KEEP: Sub-tabs rendering (Welcome, Share, Theme, Settings)
// - KEEP: <Outlet /> for editor content

// Sub-tabs configuration (updated paths with /designer/ prefix):
const designerSubTabs: TabItem[] = [
  { id: 'welcome', label: 'Welcome', to: '/workspace/$workspaceSlug/projects/$projectId/designer/welcome' },
  { id: 'share', label: 'Share', to: '/workspace/$workspaceSlug/projects/$projectId/designer/share' },
  { id: 'theme', label: 'Theme', to: '/workspace/$workspaceSlug/projects/$projectId/designer/theme' },
  { id: 'settings', label: 'Settings', to: '/workspace/$workspaceSlug/projects/$projectId/designer/settings' },
]

// Renders:
// - NavTabs with designerSubTabs (styled as secondary tabs)
// - <Outlet /> for editor page content
```
