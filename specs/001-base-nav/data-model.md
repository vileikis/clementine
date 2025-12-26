# Data Model: Base Navigation System

**Feature**: 001-base-nav | **Date**: 2025-12-26
**Purpose**: Define data structures and types for navigation domain

## Overview

This feature uses **mock data only** with no database integration. All data structures are TypeScript interfaces and const arrays living in the client-side navigation domain.

## Entities

### 1. Workspace

**Purpose**: Represents a team or organization context for workspace-scoped routes

**Fields**:
- `id` (string, required): Unique identifier for the workspace (URL-safe, lowercase-hyphenated)
- `name` (string, required): Display name of the workspace (used for workspace selector initials)

**TypeScript Interface**:
```typescript
export interface Workspace {
  id: string
  name: string
}
```

**Validation Rules**:
- `id`: Must be non-empty string, URL-safe (alphanumeric + hyphens)
- `name`: Can be any string including empty string (for edge case testing)

**Example Data**:
```typescript
const workspace: Workspace = {
  id: 'acme-inc',
  name: 'Acme Inc',
}
```

**Relationships**:
- No relationships (this is mock data only)
- In future: Will have relationship to Projects, Settings, Members (out of scope)

**State Transitions**:
- N/A (mock data is immutable const array)

---

### 2. RouteArea

**Purpose**: Enum/type representing the three distinct navigation contexts

**Values**:
- `admin`: Admin area routes (/admin/*)
- `workspace`: Workspace area routes (/workspace/[workspaceId]/*)
- `guest`: Guest area routes (/guest/[projectId])

**TypeScript Type**:
```typescript
export type RouteArea = 'admin' | 'workspace' | 'guest'
```

**Usage**:
Used to determine which navigation layout to render:
- `admin` → Sidebar with AdminNav component
- `workspace` → Sidebar with WorkspaceNav + WorkspaceSelector components
- `guest` → No sidebar (clean interface)

**Example**:
```typescript
function getSidebarContent(area: RouteArea) {
  switch (area) {
    case 'admin':
      return <AdminNav />
    case 'workspace':
      return <WorkspaceNav />
    case 'guest':
      return null
  }
}
```

---

### 3. NavItem

**Purpose**: Type representing a single navigation item in the sidebar

**Fields**:
- `label` (string, required): Display text for the navigation item
- `href` (string, required): Target route path
- `icon` (optional, LucideIcon): Icon component from lucide-react

**TypeScript Interface**:
```typescript
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon?: LucideIcon
}
```

**Example Data**:
```typescript
import { Briefcase, Settings } from 'lucide-react'

const adminNavItems: NavItem[] = [
  { label: 'Workspaces', href: '/admin/workspaces', icon: Briefcase },
  { label: 'Dev Tools', href: '/admin/dev-tools', icon: Settings },
]
```

**Validation Rules**:
- `label`: Must be non-empty string
- `href`: Must be valid route path starting with `/`
- `icon`: Optional, must be a LucideIcon component if provided

---

## Mock Data Constants

### MOCK_WORKSPACES

**Location**: `src/domains/navigation/constants/mockWorkspaces.ts`

**Purpose**: Provide sample workspace data for testing navigation and workspace selector

**Data**:
```typescript
export const MOCK_WORKSPACES: Workspace[] = [
  { id: 'acme', name: 'Acme' },
  { id: 'acme-inc', name: 'Acme Inc' },
  { id: 'acme-corp', name: 'Acme Corporation Inc' },
  { id: 'single-letter', name: 'X' },
  { id: 'empty-name', name: '' }, // Edge case: empty name → "?" initials
]
```

**Usage**:
- Lookup workspace by ID from route params
- Display workspace name in workspace selector
- Calculate workspace initials for workspace selector display

---

## Helper Functions

### getWorkspaceInitials

**Purpose**: Calculate workspace initials from workspace name for workspace selector display

**Signature**:
```typescript
function getWorkspaceInitials(workspaceName: string | null | undefined): string
```

**Algorithm**:
1. Return "?" if workspaceName is null, undefined, or empty/whitespace-only
2. Split workspaceName by whitespace, filter empty strings
3. If 1 word: return first letter capitalized
4. If 2+ words: return first letter of first two words capitalized
5. If no valid words: return "?"

**Examples**:
- `getWorkspaceInitials('Acme')` → `'A'`
- `getWorkspaceInitials('Acme Inc')` → `'AI'`
- `getWorkspaceInitials('Acme Corporation Inc')` → `'AC'`
- `getWorkspaceInitials('')` → `'?'`
- `getWorkspaceInitials(null)` → `'?'`

**Location**: `src/domains/navigation/lib/getWorkspaceInitials.ts`

**Test Coverage**: Unit tests in `tests/navigation/getWorkspaceInitials.test.ts`

---

## Type Safety

All entities and types are fully typed with TypeScript strict mode:

- No `any` types allowed
- All fields explicitly typed
- Route parameters typed via TanStack Router
- Mock data uses `as const` where appropriate for literal type inference

**Example: Type-Safe Route Params**:
```typescript
// TanStack Router automatically types params from file path
export const Route = createFileRoute('/workspace/$workspaceId/projects')({
  component: WorkspaceProjectsPage,
})

function WorkspaceProjectsPage() {
  const { workspaceId } = Route.useParams()
  // workspaceId is typed as string, not any
}
```

---

## Future Extensions (Out of Scope)

These are intentionally NOT included in this feature but documented for future reference:

- **Project entity**: For /guest/[projectId] routes (will be added in project management feature)
- **User entity**: For authentication and permissions (will be added in auth feature)
- **Workspace members**: For role-based access control (out of scope)
- **Workspace settings**: Customization options (out of scope)
- **Real data fetching**: Firebase integration for workspaces (out of scope)

---

## Database Schema (N/A)

This feature uses mock data only. No database schema or Firestore collections are created.

When Firebase integration is added in future features:
- Workspaces will live in `workspaces` collection
- Projects will live in `projects` collection
- Navigation will fetch from Firestore using Firebase client SDK

---

## Summary

**Total Entities**: 3 (Workspace, RouteArea, NavItem)
**Mock Data Arrays**: 1 (MOCK_WORKSPACES)
**Helper Functions**: 1 (getWorkspaceInitials)
**External Dependencies**: lucide-react (for icon types)
**Type Safety**: Full TypeScript strict mode compliance

All data structures are simple, immutable, and designed for easy testing with mock data.
