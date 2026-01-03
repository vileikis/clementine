# Component API Contracts

**Feature**: 010-project-event-topnav
**Date**: 2026-01-03
**Type**: Frontend Component APIs
**Status**: Complete

## Overview

This document defines the **public API contracts** for the top navigation bar components. These contracts specify the TypeScript interfaces, props, and behaviors that consuming code (route layouts) can rely on.

---

## TopNavBar Component

**Purpose**: Main container component that displays breadcrumb navigation and action buttons.

### Public API

```typescript
interface BreadcrumbItem {
  /** Display text for the breadcrumb item */
  label: string;

  /** Optional href for navigation (if present, item is clickable) */
  href?: string;

  /** Optional icon component (typically used for first item) */
  icon?: LucideIcon;
}

interface ActionButton {
  /** Button label text */
  label: string;

  /** Icon component to display in button */
  icon: LucideIcon;

  /** Click handler function */
  onClick: () => void;

  /** Button style variant (defaults to 'ghost') */
  variant?: 'default' | 'outline' | 'ghost';

  /** Accessible label for screen readers (defaults to label) */
  ariaLabel?: string;
}

interface TopNavBarProps {
  /** Array of breadcrumb items to display (left side) */
  breadcrumbs: BreadcrumbItem[];

  /** Array of action buttons to display (right side) */
  actions: ActionButton[];

  /** Optional additional CSS classes */
  className?: string;
}

export function TopNavBar(props: TopNavBarProps): JSX.Element;
```

### Contract Guarantees

**Rendering**:
- Renders a horizontal bar spanning full container width
- Breadcrumbs rendered on left side
- Actions rendered on right side
- Content vertically centered
- Height: 48-56px (consistent with existing navigation)

**Responsiveness**:
- Works at minimum 320px viewport width
- Breadcrumb text truncates with ellipsis when space is limited
- Action buttons maintain minimum 44x44px touch targets on mobile
- Icons remain visible even when text is hidden on narrow screens

**Accessibility**:
- Uses semantic HTML (`<nav>` element)
- Breadcrumb links use proper `<a>` tags with href
- Action buttons use `<button>` elements
- ARIA labels provided for icon-only buttons
- Keyboard navigation supported

**Behavior**:
- Clicking breadcrumb item with `href` navigates using TanStack Router `<Link>`
- Clicking breadcrumb item without `href` does nothing (current page indicator)
- Clicking action button triggers `onClick` handler
- No internal state (pure component)

### Usage Examples

**Project Route**:
```typescript
import { TopNavBar } from '@/domains/navigation';
import { FolderOpen, Share2 } from 'lucide-react';
import { toast } from 'sonner';

function ProjectLayout() {
  const { project } = Route.useLoaderData();

  return (
    <>
      <TopNavBar
        breadcrumbs={[
          {
            label: project.name,
            icon: FolderOpen
          }
        ]}
        actions={[
          {
            label: "Share",
            icon: Share2,
            onClick: () => toast.success("Coming soon"),
            variant: "ghost"
          }
        ]}
      />
      <Outlet />
    </>
  );
}
```

**Event Route**:
```typescript
import { TopNavBar } from '@/domains/navigation';
import { FolderOpen, Play, Upload } from 'lucide-react';
import { toast } from 'sonner';

function EventLayout() {
  const { event } = Route.useLoaderData();
  const { project } = Route.useParams(); // Parent loader data
  const { workspaceSlug, projectId } = Route.useParams();

  return (
    <>
      <TopNavBar
        breadcrumbs={[
          {
            label: project.name,
            href: `/workspace/${workspaceSlug}/projects/${projectId}`,
            icon: FolderOpen
          },
          {
            label: event.name
          }
        ]}
        actions={[
          {
            label: "Preview",
            icon: Play,
            onClick: () => toast.success("Coming soon"),
            variant: "ghost",
            ariaLabel: "Preview event"
          },
          {
            label: "Publish",
            icon: Upload,
            onClick: () => toast.success("Coming soon"),
            variant: "default",
            ariaLabel: "Publish event"
          }
        ]}
      />
      {/* Event content */}
    </>
  );
}
```

---

## TopNavBreadcrumb Component (Internal)

**Purpose**: Renders breadcrumb trail with icons and separators.

**Visibility**: Internal to navigation domain (not exported from `index.ts`)

### API

```typescript
interface TopNavBreadcrumbProps {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[];
}

export function TopNavBreadcrumb(props: TopNavBreadcrumbProps): JSX.Element;
```

### Contract Guarantees

**Rendering**:
- Renders items horizontally with separators between them
- First item icon rendered if provided
- Last item is not clickable (current page)
- Separator: `/` or chevron icon (visual only)

**Responsiveness**:
- Text truncates with ellipsis on narrow screens
- Icons maintain visibility
- Separators remain visible

---

## TopNavActions Component (Internal)

**Purpose**: Renders action buttons in horizontal layout.

**Visibility**: Internal to navigation domain (not exported from `index.ts`)

### API

```typescript
interface TopNavActionsProps {
  /** Array of action buttons */
  actions: ActionButton[];
}

export function TopNavActions(props: TopNavActionsProps): JSX.Element;
```

### Contract Guarantees

**Rendering**:
- Renders buttons horizontally with consistent spacing
- Uses shadcn/ui Button component
- Icons positioned before text (icon-left pattern)
- Maintains visual consistency with other navigation elements

**Responsiveness**:
- Buttons maintain minimum 44x44px touch targets
- Text may be hidden on mobile (icon-only fallback)
- Button order preserved

---

## Breaking Change Policy

**Public API** (`TopNavBar` component):
- Props interface is **stable** - changes require major version bump
- Adding optional props is **non-breaking**
- Changing required props is **breaking**
- Behavioral changes require documentation and migration guide

**Internal APIs** (`TopNavBreadcrumb`, `TopNavActions`):
- Not part of public API (not exported from domain)
- Can change freely without affecting consumers
- Only used internally by TopNavBar

---

## Type Safety

**All interfaces use TypeScript strict mode**:
- No `any` types allowed
- Null/undefined handled explicitly
- LucideIcon type from `lucide-react` package
- Function types strictly defined

**Runtime Validation**:
- Not required (props come from typed route loaders)
- Component crashes are prevented by TypeScript compile-time checks
- No Zod schemas needed (no external input)

---

## Dependencies

**Required Imports for Consumers**:
```typescript
import { TopNavBar } from '@/domains/navigation';
import type { BreadcrumbItem, ActionButton } from '@/domains/navigation';
import { FolderOpen, Share2, Play, Upload } from 'lucide-react';
import { toast } from 'sonner';
```

**Component Dependencies** (internal):
- `@/ui-kit/components/button` - shadcn/ui Button
- `@tanstack/react-router` - Router Link component
- `lucide-react` - Icon components
- `tailwindcss` - Styling utilities

---

## Versioning

**Current Version**: 1.0.0 (initial release)

**Semantic Versioning Rules**:
- **MAJOR**: Breaking changes to public API (TopNavBar props)
- **MINOR**: New optional props, new features
- **PATCH**: Bug fixes, internal refactoring

---

## Testing Contract

**Component guarantees testable behaviors**:

1. **Breadcrumb Rendering**:
   - Given breadcrumbs array, renders all items
   - Given item with icon, renders icon
   - Given item with href, renders clickable link
   - Given item without href, renders plain text

2. **Action Button Rendering**:
   - Given actions array, renders all buttons
   - Given button with onClick, triggers handler on click
   - Given button with variant, applies correct styling

3. **Responsive Behavior**:
   - Given narrow viewport, truncates text with ellipsis
   - Given mobile viewport, maintains 44x44px touch targets
   - Given long text, does not break layout

4. **Accessibility**:
   - Given component, renders semantic `<nav>` element
   - Given action buttons, provides ARIA labels
   - Given clickable breadcrumb, uses proper `<a>` tag

---

## Summary

The TopNavBar component provides a **stable, type-safe public API** for displaying contextual navigation and actions. The contract guarantees:

- ✅ TypeScript strict mode type safety
- ✅ Responsive layout (320px+ viewports)
- ✅ Accessibility compliance (semantic HTML, ARIA labels, keyboard navigation)
- ✅ Mobile-first design (44x44px touch targets)
- ✅ Pure component (no internal state)
- ✅ Consistent styling with existing navigation

Consuming code can rely on these guarantees for project and event route layouts.
