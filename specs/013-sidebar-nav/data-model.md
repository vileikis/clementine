# Data Model: Sidebar Navigation System

**Feature**: 013-sidebar-nav
**Date**: 2025-12-02
**Status**: Complete

## Overview

This feature primarily involves **client-side state** (localStorage) and **UI components**. No new Firestore collections or documents are required. The sidebar reads from existing Company data.

## Client-Side State (Zustand Store)

### SidebarStore

Combined state for sidebar UI and last company, managed by Zustand with persist middleware.

```typescript
interface SidebarState {
  /** Whether the sidebar is collapsed (icons only) or expanded (full width) */
  isCollapsed: boolean;
  /** Most recently accessed company slug for root URL redirect */
  lastCompanySlug: string | null;
}

interface SidebarActions {
  /** Toggle sidebar between collapsed and expanded */
  toggleCollapsed: () => void;
  /** Set the last accessed company slug */
  setLastCompanySlug: (slug: string) => void;
  /** Clear the last company slug (e.g., on invalid slug) */
  clearLastCompanySlug: () => void;
}

type SidebarStore = SidebarState & SidebarActions;
```

**Storage Key**: `clementine-sidebar` (single key for entire store)
**Storage Format**: JSON (handled automatically by Zustand persist)
**Default Values**: `{ isCollapsed: false, lastCompanySlug: null }`

**Zustand Store Implementation**:
```typescript
// features/sidebar/stores/sidebar.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      // State
      isCollapsed: false,
      lastCompanySlug: null,

      // Actions
      toggleCollapsed: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
      setLastCompanySlug: (slug) => set({ lastCompanySlug: slug }),
      clearLastCompanySlug: () => set({ lastCompanySlug: null }),
    }),
    {
      name: 'clementine-sidebar',
      // Zustand handles JSON serialization automatically
    }
  )
);
```

**Company Slug Validation**: When reading `lastCompanySlug`, validate against existing company:
- Must match slug pattern: `^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$`
- Must exist in Firestore (active company)
- If invalid, call `clearLastCompanySlug()` and redirect to `/companies`

## UI State Types

### NavigationItem

Represents a single navigation item in the sidebar.

```typescript
interface NavigationItem {
  /** Unique identifier for the nav item */
  id: string;
  /** Display label */
  label: string;
  /** Lucide icon component name */
  icon: LucideIcon;
  /** URL path segment (appended to company base path) */
  href: string;
  /** Whether the item is enabled (clickable) */
  enabled: boolean;
}
```

**Navigation Items Configuration**:
```typescript
const NAVIGATION_ITEMS: NavigationItem[] = [
  { id: 'projects', label: 'Projects', icon: FolderIcon, href: '/projects', enabled: true },
  { id: 'experiences', label: 'Experiences', icon: SparklesIcon, href: '/exps', enabled: true },
  { id: 'analytics', label: 'Analytics', icon: BarChartIcon, href: '/analytics', enabled: false },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, href: '/settings', enabled: true },
];
```

### BreadcrumbItem

Existing type from 012-company-context, reused for content area breadcrumbs.

```typescript
interface BreadcrumbItem {
  /** Display text */
  label: string;
  /** Optional navigation URL (if clickable) */
  href?: string;
  /** Whether this is the logo item (rendered larger) */
  isLogo?: boolean;
}
```

### CompanySwitcherProps

Props for the company switcher component.

```typescript
interface CompanySwitcherProps {
  /** Company data (from layout context) */
  company: {
    id: string;
    name: string;
    slug: string;
    avatarUrl?: string;
  };
  /** Whether sidebar is collapsed */
  isCollapsed: boolean;
}
```

## Existing Data (Read-Only)

This feature reads from existing Firestore data but does not write.

### Company (from 012-company-context)

```typescript
interface Company {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'deleted';
  deletedAt: number | null;
  contactEmail: string | null;
  termsUrl: string | null;
  privacyUrl: string | null;
  createdAt: number;
  updatedAt: number;
}
```

**Collection**: `/companies`
**Query**: `getCompanyBySlugAction(slug)` - fetches company by slug

## State Transitions

### Sidebar Collapse State

```
[Expanded] --toggle--> [Collapsed]
[Collapsed] --toggle--> [Expanded]

On toggle:
1. Update React state (isCollapsed)
2. Persist to localStorage (clementine-sidebar-collapsed)
3. Trigger CSS transition animation
```

### Last Company Slug

```
[No Stored Slug] --visit company--> [Slug Stored]
[Slug Stored] --visit different company--> [New Slug Stored]
[Invalid Slug] --validation fails--> [Slug Cleared, redirect to /companies]

On company visit:
1. Extract companySlug from URL params
2. Validate company exists (via getCompanyBySlugAction)
3. Store slug in localStorage (clementine-last-company-slug)
```

### Root URL Redirect

```
User visits "/"
  |
  v
Check localStorage for lastCompanySlug
  |
  +-- Has slug --> Validate slug exists
  |                  |
  |                  +-- Valid --> Redirect to /{slug}/projects
  |                  |
  |                  +-- Invalid --> Clear stored slug, redirect to /companies
  |
  +-- No slug --> Redirect to /companies
```

## Validation Rules

### Sidebar State Validation

| Field | Rule | Error |
|-------|------|-------|
| isCollapsed | Must be boolean | Reset to default (false) |

### Company Slug Validation

| Field | Rule | Error |
|-------|------|-------|
| slug | 1-50 characters | Invalid slug |
| slug | Pattern match `^[a-z0-9][a-z0-9-]*[a-z0-9]$\|^[a-z0-9]$` | Invalid slug |
| slug | Company exists in Firestore (status: active) | Company not found |

## Storage (Zustand Persist)

Zustand's persist middleware handles all localStorage operations automatically:

- **Serialization**: JSON stringify/parse handled internally
- **SSR Safety**: Hydration handled via `onRehydrateStorage` callback
- **Single Key**: All sidebar state stored under `clementine-sidebar`

```typescript
// Usage in components - no manual storage calls needed
const { isCollapsed, toggleCollapsed } = useSidebarStore();
const lastCompanySlug = useSidebarStore((s) => s.lastCompanySlug);
```

**localStorage Data Format**:
```json
{
  "state": {
    "isCollapsed": false,
    "lastCompanySlug": "acme-corp"
  },
  "version": 0
}
```

## Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌─────────────────┐      ┌─────────────────────────────┐   │
│  │   localStorage  │      │      Zustand Store          │   │
│  │                 │◄─────►                             │   │
│  │ clementine-     │      │  useSidebarStore()          │   │
│  │   sidebar       │      │  - isCollapsed: boolean     │   │
│  │ (JSON blob)     │      │  - lastCompanySlug: string  │   │
│  │                 │      │  - toggleCollapsed()        │   │
│  │                 │      │  - setLastCompanySlug()     │   │
│  └─────────────────┘      └─────────────────────────────┘   │
│                                      │                      │
│                                      ▼ selector subscriptions│
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   UI Components                      │   │
│  │                                                      │   │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────────────────┐ │   │
│  │  │ Sidebar │  │ NavItems │  │ CompanySwitcher     │ │   │
│  │  │         │  │          │  │                     │ │   │
│  │  │ width:  │  │ Projects │  │ Avatar + Name       │ │   │
│  │  │ 256px ↔ │  │ Exps     │  │ Opens /companies    │ │   │
│  │  │ 72px    │  │ Analytics│  │ in new tab          │ │   │
│  │  │         │  │ Settings │  │                     │ │   │
│  │  └─────────┘  └──────────┘  └─────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Read company data
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Firestore                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  /companies/{companyId}                              │   │
│  │  - id, name, slug, status, ...                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Summary

| Entity | Storage | Write | Read | Notes |
|--------|---------|-------|------|-------|
| SidebarStore | Zustand (localStorage) | Yes | Yes | Client-side, auto-persisted |
| NavigationItem | Code constant | No | Yes | Static configuration |
| Company | Firestore | No | Yes | Existing, read-only for this feature |

No new Firestore schema changes required. All new state is client-side via Zustand store with persist middleware.
