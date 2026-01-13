# Data Model: Horizontal Tabs Navigation in Top Bar

**Feature**: 023-top-bar-with-tabs
**Date**: 2026-01-13

## Overview

This feature is a **UI-only change** with no data model modifications.

## Data Model Changes

**None** - This feature modifies only:
- Component structure (TopNavBar, NavTabs)
- Layout arrangement (editor pages)
- Visual presentation (sidebar → tabs)

## TypeScript Interfaces

The following interfaces are introduced for type safety, but they represent **runtime UI state only**, not persisted data:

### TabItem

```typescript
/**
 * Represents a single navigation tab in the TopNavBar
 * Used for type-safe tab configuration
 */
export interface TabItem {
  /** Unique identifier for the tab */
  id: string

  /** Display label shown to users */
  label: string

  /** TanStack Router path pattern (e.g., '/workspace/$workspaceSlug/...') */
  to: string
}
```

### Usage

```typescript
// Tab configuration (defined in EventDesignerLayout)
const eventDesignerTabs: TabItem[] = [
  { id: 'welcome', label: 'Welcome', to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/welcome' },
  { id: 'theme', label: 'Theme', to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/theme' },
  { id: 'settings', label: 'Settings', to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/settings' },
]
```

## Database Impact

**None** - No Firestore collections, documents, or fields are affected.

## Migration Requirements

**None** - No data migration needed.
