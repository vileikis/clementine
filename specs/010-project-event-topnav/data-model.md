# Data Model: Project & Event Top Navigation Bar

**Feature**: 010-project-event-topnav
**Date**: 2026-01-03
**Status**: Complete

## Overview

This feature does **not introduce new database entities**. It uses existing Firestore data (Project and Event entities) loaded via route loaders. The data model documented here describes the **component props interfaces** that define how data flows through the UI components.

## Component Data Structures

### BreadcrumbItem

Represents a single item in the breadcrumb trail.

**TypeScript Interface**:
```typescript
interface BreadcrumbItem {
  label: string;           // Display text (e.g., "My Project", "Summer Event")
  href?: string;           // Optional navigation link (if clickable)
  icon?: LucideIcon;       // Optional icon (only for first item - folder icon)
}
```

**Validation Rules**:
- `label` is required (non-empty string)
- `href` is optional (if present, item is clickable/navigable)
- `icon` is optional (if present, must be a valid Lucide React icon component)

**State Transitions**: None (static data from route loaders)

**Relationships**:
- Array of BreadcrumbItem passed to TopNavBar
- First item typically has icon (folder) and may link to parent
- Last item never has href (current page)

---

### ActionButton

Represents an action button in the top navigation bar.

**TypeScript Interface**:
```typescript
interface ActionButton {
  label: string;                                    // Button text (e.g., "Share", "Publish")
  icon: LucideIcon;                                 // Icon component (e.g., Share2, Play, Upload)
  onClick: () => void;                              // Click handler function
  variant?: 'default' | 'outline' | 'ghost';        // Button style variant
  ariaLabel?: string;                               // Accessible label for screen readers
}
```

**Validation Rules**:
- `label` is required (non-empty string)
- `icon` is required (valid Lucide React icon component)
- `onClick` is required (function)
- `variant` is optional (defaults to 'default' or 'ghost' based on design)
- `ariaLabel` is optional (defaults to label if not provided)

**State Transitions**: None (stateless buttons - trigger side effects via onClick)

**Relationships**:
- Array of ActionButton passed to TopNavBar
- Each button is independent (no inter-button state)

---

### TopNavBarProps

Main props interface for the TopNavBar component.

**TypeScript Interface**:
```typescript
interface TopNavBarProps {
  breadcrumbs: BreadcrumbItem[];                    // Breadcrumb trail items
  actions: ActionButton[];                          // Action buttons (right side)
  className?: string;                               // Optional additional CSS classes
}
```

**Validation Rules**:
- `breadcrumbs` is required (array with at least 1 item)
- `actions` is required (array, may be empty)
- `className` is optional (for layout customization)

**Relationships**:
- Passed to TopNavBar component
- Breadcrumbs rendered by TopNavBreadcrumb subcomponent
- Actions rendered by TopNavActions subcomponent

---

## Data Flow

### Project Route (`$projectId.tsx`)

**Source Data**: Route loader provides `project` object
```typescript
// Loaded via route loader (existing)
project: {
  id: string;
  name: string;
  status: string;
  // ... other fields
}
```

**Transform to Props**:
```typescript
const breadcrumbs: BreadcrumbItem[] = [
  {
    label: project.name,
    icon: FolderOpen,
    // No href - current page
  }
];

const actions: ActionButton[] = [
  {
    label: "Share",
    icon: Share2,
    onClick: () => toast.success("Coming soon"),
    variant: "ghost"
  }
];
```

---

### Event Route (`$eventId.tsx`)

**Source Data**: Route loader provides `event` object, parent loader provides `project` object
```typescript
// Loaded via route loaders (existing)
project: {
  id: string;
  name: string;
  status: string;
}

event: {
  id: string;
  name: string;
  status: string;
  projectId: string;
  // ... other fields
}
```

**Transform to Props**:
```typescript
const projectPath = `/workspace/${workspaceSlug}/projects/${project.id}`;

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: project.name,
    href: projectPath,    // Clickable - navigate to project
    icon: FolderOpen
  },
  {
    label: event.name     // Current page - no href
  }
];

const actions: ActionButton[] = [
  {
    label: "Preview",
    icon: Play,
    onClick: () => toast.success("Coming soon"),
    variant: "ghost"
  },
  {
    label: "Publish",
    icon: Upload,
    onClick: () => toast.success("Coming soon"),
    variant: "default"
  }
];
```

---

## Existing Firestore Entities (No Changes)

This feature uses existing Firestore entities **without modifications**:

### Project Entity
**Collection**: `projects`
**Used Fields**:
- `name` (string) - Displayed in breadcrumb
- `id` (string) - Used for navigation links

**Not Modified**: Feature only reads data via route loaders

---

### Event Entity
**Collection**: `events`
**Used Fields**:
- `name` (string) - Displayed in breadcrumb
- `id` (string) - Used for navigation links
- `projectId` (string) - Relationship to parent project

**Not Modified**: Feature only reads data via route loaders

---

## Validation Summary

**No runtime validation required** because:
1. Data comes from typed route loaders (TanStack Router provides type safety)
2. Props are typed with TypeScript strict mode (compile-time validation)
3. No external input (no user-submitted data, no API calls)
4. No form submissions or mutations

**Type Safety Strategy**:
- Component props use explicit TypeScript interfaces
- Route loaders already typed (existing codebase)
- Lucide icons are typed (React components)
- Click handlers are strongly typed functions

---

## State Management

**No state management library needed** because:
- Component receives data via props (no local state)
- No shared state between routes
- No persistence required
- No mutations or updates

**Rendering Strategy**:
- Props change → Component re-renders (React default behavior)
- Route navigation → New loader data → New props → Re-render

---

## Summary

This feature is **data-simple**:
- No new database entities
- No mutations or writes
- No state management
- No runtime validation (TypeScript strict mode sufficient)
- Data flows via props from route loaders to components

The data model consists entirely of **component props interfaces** that define how existing Firestore data (Project, Event) is transformed and passed to UI components.
