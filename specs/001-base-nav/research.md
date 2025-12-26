# Research: Base Navigation System

**Feature**: 001-base-nav | **Date**: 2025-12-26
**Purpose**: Research technical decisions and patterns for navigation implementation

## Overview

This document captures research findings for implementing the base navigation system with TanStack Router, shadcn/ui components, and mobile-first design. No external API research needed since this feature uses mock data only.

## Research Areas

### 1. TanStack Router File-Based Routing

**Decision**: Use TanStack Router's file-based routing with nested route structures

**Rationale**:
- TanStack Router is already integrated in the TanStack Start application
- File-based routing provides type-safe navigation with automatic route parameter typing
- Nested routes (`workspace/$workspaceId/projects.tsx`) map naturally to URL structure
- Index routes (`index.tsx`) enable clean redirects without additional route definitions

**Alternatives Considered**:
- **Manual React Router**: Rejected - TanStack Router is already integrated and provides better TypeScript support
- **Next.js App Router**: Rejected - We're using TanStack Start, not Next.js

**Implementation Pattern**:
```typescript
// Route: /workspace/$workspaceId/projects.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/workspace/$workspaceId/projects')({
  component: WorkspaceProjectsPage,
})

function WorkspaceProjectsPage() {
  const { workspaceId } = Route.useParams()
  // workspaceId is fully typed
}
```

**References**:
- TanStack Router Docs: https://tanstack.com/router/latest/docs/framework/react/guide/file-based-routing
- Existing app structure: `apps/clementine-app/src/routes/`

---

### 2. Sidebar Component Implementation

**Decision**: Use shadcn/ui Sheet component for mobile sidebar, custom component for desktop sidebar

**Rationale**:
- shadcn/ui Sheet (built on Radix UI Dialog) provides accessible, mobile-optimized slide-out panel
- Sheet component handles focus trapping, ESC key closing, and overlay backdrop automatically
- Desktop sidebar can be a simpler custom component since it doesn't need modal behavior
- Responsive design switches between Sheet (mobile) and static sidebar (desktop) using Tailwind breakpoints

**Alternatives Considered**:
- **Custom sidebar from scratch**: Rejected - Reinventing accessibility features that Sheet provides
- **Sheet only for all viewports**: Rejected - Overkill for desktop where static sidebar is preferable
- **Drawer component**: Rejected - Sheet is more appropriate for navigation panels

**Implementation Pattern**:
```typescript
import { Sheet, SheetContent, SheetTrigger } from '@/ui-kit/components/sheet'
import { Menu } from 'lucide-react'

export function Sidebar() {
  return (
    <>
      {/* Mobile: Sheet */}
      <Sheet>
        <SheetTrigger className="md:hidden">
          <Menu />
        </SheetTrigger>
        <SheetContent side="right">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop: Static sidebar */}
      <aside className="hidden md:block">
        <SidebarContent />
      </aside>
    </>
  )
}
```

**References**:
- shadcn/ui Sheet: https://ui.shadcn.com/docs/components/sheet
- Constitution Principle I (Mobile-First Design)
- `standards/frontend/component-libraries.md`

---

### 3. Workspace Initials Calculation Logic

**Decision**: Pure function extracting first letter of first two words, with fallback for edge cases

**Rationale**:
- Simple, testable pure function with no side effects
- Handles edge cases: single word ("Acme" → "A"), empty string, null/undefined
- Easy to unit test with Vitest
- No external dependencies needed

**Algorithm**:
1. Handle null/undefined → return "?" fallback
2. Trim whitespace and split by spaces
3. Filter empty strings from split result
4. Take first letter of first word (capitalized)
5. If two+ words exist, add first letter of second word (capitalized)
6. Return result or "?" if no valid words

**Implementation Pattern**:
```typescript
export function getWorkspaceInitials(workspaceName: string | null | undefined): string {
  if (!workspaceName || workspaceName.trim() === '') {
    return '?'
  }

  const words = workspaceName.trim().split(/\s+/).filter(Boolean)

  if (words.length === 0) {
    return '?'
  }

  if (words.length === 1) {
    return words[0][0].toUpperCase()
  }

  return (words[0][0] + words[1][0]).toUpperCase()
}
```

**Test Cases**:
- "Acme" → "A"
- "Acme Inc" → "AI"
- "Acme Corporation Inc" → "AC"
- "" → "?"
- null → "?"
- undefined → "?"
- "   " → "?"
- "A" → "A"

**References**:
- Spec FR-008: Workspace selector initials logic
- Spec Edge Cases: Handling empty workspace names

---

### 4. Mock Workspace Data Structure

**Decision**: Simple TypeScript const array with Workspace interface

**Rationale**:
- No database integration needed for this phase (Out of Scope)
- Const array provides type safety with TypeScript
- Easy to extend with more workspaces for testing
- Lives in `constants/mockWorkspaces.ts` following DDD structure

**Data Structure**:
```typescript
export interface Workspace {
  id: string
  name: string
}

export const MOCK_WORKSPACES: Workspace[] = [
  { id: 'acme', name: 'Acme' },
  { id: 'acme-inc', name: 'Acme Inc' },
  { id: 'acme-corp', name: 'Acme Corporation Inc' },
  { id: 'single-letter', name: 'X' },
  { id: 'empty-name', name: '' }, // Test edge case
]
```

**Alternatives Considered**:
- **JSON file**: Rejected - TypeScript interface provides better type safety
- **LocalStorage**: Rejected - Unnecessary complexity for mock data
- **Context API**: Rejected - Simple import is sufficient

**References**:
- Spec FR-009: Mock workspace data requirement
- Spec Out of Scope: No real data fetching

---

### 5. Monochrome Styling Approach

**Decision**: Use Tailwind CSS grayscale color palette with custom theme configuration

**Rationale**:
- Tailwind CSS 4 already integrated in TanStack Start app
- Grayscale palette (slate-50 through slate-950) provides monochrome colors
- Consistent with design requirement (FR-014)
- Can extend with custom CSS variables if specific monochrome palette needed

**Color Palette**:
- Background: `bg-slate-900` (dark) or `bg-slate-50` (light)
- Text: `text-slate-50` (on dark) or `text-slate-900` (on light)
- Borders: `border-slate-700` or `border-slate-300`
- Hover states: `hover:bg-slate-800` or `hover:bg-slate-100`

**Implementation Pattern**:
```tsx
<div className="bg-slate-900 text-slate-50">
  <nav className="border-b border-slate-700">
    <button className="hover:bg-slate-800 active:bg-slate-700">
      Navigation Item
    </button>
  </nav>
</div>
```

**References**:
- Spec FR-014: Monochrome styling requirement
- Tailwind CSS Colors: https://tailwindcss.com/docs/customizing-colors
- Existing styles: `apps/clementine-app/src/styles.css`

---

### 6. Route Redirect Implementation

**Decision**: Use TanStack Router's `Navigate` component for index route redirects

**Rationale**:
- TanStack Router's `Navigate` component provides declarative redirects
- Type-safe with route paths
- Works with TanStack Router's history management
- No need for programmatic navigation in index routes

**Implementation Pattern**:
```typescript
// /admin/index.tsx
import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/')({
  component: () => <Navigate to="/admin/workspaces" />,
})
```

**Alternatives Considered**:
- **useNavigate hook**: Rejected - Navigate component is cleaner for index redirects
- **Redirect component from React Router**: Rejected - Use TanStack Router's equivalent

**References**:
- Spec FR-011: /admin redirect to /admin/workspaces
- Spec FR-012: /workspace/[id] redirect to /workspace/[id]/projects
- TanStack Router Navigation: https://tanstack.com/router/latest/docs/framework/react/guide/navigation

---

### 7. Sidebar State Management

**Decision**: Use React useState hook for sidebar open/closed state (client-side only)

**Rationale**:
- Simple boolean state (open/closed) doesn't require complex state management
- useState is sufficient for local component state
- No need for Zustand or other state management for single component state
- State doesn't need to persist across page reloads

**Implementation Pattern**:
```typescript
export function useSidebarState() {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  return { isOpen, toggle, open, close }
}
```

**Alternatives Considered**:
- **Zustand store**: Rejected - Overkill for single boolean state
- **Context API**: Rejected - No need to share state across deeply nested components
- **URL state**: Rejected - Sidebar state shouldn't affect URL or be shareable

**References**:
- Spec FR-004: Sidebar toggle behavior
- Constitution Principle II: Simplicity (YAGNI)

---

## Technology Stack Summary

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Routing** | TanStack Router | File-based routing with type safety |
| **UI Components** | shadcn/ui + Radix UI | Accessible sidebar (Sheet), Button components |
| **Styling** | Tailwind CSS 4 | Monochrome styling, responsive design |
| **Icons** | lucide-react | Hamburger menu, navigation icons |
| **State Management** | React useState | Sidebar toggle state (local component state) |
| **Testing** | Vitest + Testing Library | Unit tests for initials logic and components |
| **Type Safety** | TypeScript 5.7 | Strict mode, full type coverage |

---

## Open Questions

✅ All questions resolved. No [NEEDS CLARIFICATION] items remain.

---

## Next Steps

Proceed to **Phase 1: Design & Contracts**:
1. Generate `data-model.md` (Workspace entity, RouteArea enum)
2. Generate `contracts/` (N/A - no API contracts for this feature)
3. Generate `quickstart.md` (Developer guide for navigation setup)
4. Update agent context with navigation domain patterns
