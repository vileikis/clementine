# Data Model: 056 Project Router Restructure

**Date**: 2026-02-09

## Overview

This feature is primarily a **routing and UI restructure** — no new data entities or Firestore collections are introduced. The existing `Project` and `ProjectConfig` entities remain unchanged. This document captures the route model and component contracts.

## Existing Entities (Unchanged)

### Project

- **Collection**: `projects`
- **Key fields used by this feature**:
  - `id: string` — Project identifier (route param)
  - `name: string` — Displayed in breadcrumbs
  - `status: 'active' | 'deleted'` — Soft-delete filtering
  - `draftVersion: number | null` — Current draft version
  - `publishedVersion: number | null` — Last published version
- **Validated by**: `projectSchema` from `@clementine/shared`
- **No changes required**

### ProjectConfig

- **Collection**: Sub-document of project
- **Key fields**: Welcome, share, theme, settings configuration
- **Accessed via**: `useProjectConfig()` hook
- **No changes required**

## Route Model (New)

### Primary Navigation (Project Level)

| Tab | Route | Status | Publish Controls |
|-----|-------|--------|-----------------|
| Designer | `/workspace/$ws/projects/$pid/designer/*` | Active | Yes |
| Distribute | `/workspace/$ws/projects/$pid/distribute` | Active | Yes |
| Connect | `/workspace/$ws/projects/$pid/connect` | WIP | No |
| Analytics | `/workspace/$ws/projects/$pid/analytics` | WIP | No |

### Designer Sub-Navigation (Project Config Level)

| Sub-Tab | Route | Container |
|---------|-------|-----------|
| Welcome | `/designer/welcome` | `WelcomeEditorPage` |
| Share | `/designer/share` | `ShareEditorPage` |
| Theme | `/designer/theme` | `ThemeEditorPage` |
| Settings | `/designer/settings` | `ProjectConfigSettingsPage` |

## Component Model

### New Components

| Component | Domain | Purpose |
|-----------|--------|---------|
| `ProjectLayout` | `project` | Project-level layout with primary tabs + conditional publish workflow |
| `DistributePage` | `project` | Full-page distribution view (extracted from ShareDialog content) |
| `ConnectPage` | `project` | WIP placeholder for integrations & webhooks |
| `AnalyticsPage` | `project` | WIP placeholder for analytics |

### Modified Components

| Component | Domain | Change |
|-----------|--------|--------|
| `ProjectConfigDesignerLayout` | `project-config` | Remove primary navigation + breadcrumbs; keep only sub-tabs and editor shell |

### Unchanged Components

| Component | Domain | Notes |
|-----------|--------|-------|
| `TopNavBar` | `navigation` | No changes — already supports tabs |
| `NavTabs` | `navigation` | No changes — used by both primary and sub-tab levels |
| `ShareDialog` | `project/share` | Kept as-is; DistributePage reuses its sub-components |
| `EditorSaveStatus` | `shared/editor-status` | No changes |
| `EditorChangesBadge` | `shared/editor-status` | No changes |
| All editor pages | `project-config/*` | No changes to welcome, share, theme, settings editors |

## State & Hooks

### Existing Hooks (Unchanged)

- `useProject(projectId)` — Real-time project data subscription
- `useProjectConfig()` — Project config data
- `usePublishProjectConfig(projectId)` — Publish mutation
- `useProjectConfigDesignerStore()` — Save state tracking (pendingSaves, lastCompletedAt)

### No New Hooks Required

The publish workflow visibility is determined by route matching, not new state.
