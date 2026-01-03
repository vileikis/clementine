# Quickstart: Project & Event Top Navigation Bar

**Feature**: 010-project-event-topnav
**Date**: 2026-01-03
**Audience**: Developers implementing this feature

## Overview

This guide provides a **step-by-step implementation path** for adding the top navigation bar to project and event pages. Follow these steps in order for the fastest path to a working implementation.

**Estimated Time**: 2-3 hours

---

## Prerequisites

Before starting:
- ✅ Feature branch checked out: `010-project-event-topnav`
- ✅ Dev server running: `pnpm dev` (in `apps/clementine-app/`)
- ✅ Existing codebase knowledge: Navigation domain structure, route loaders, shadcn/ui components
- ✅ Design artifacts reviewed: spec.md, data-model.md, contracts/component-api.md

---

## Implementation Steps

### Step 1: Create Component Files (10 min)

Create the three core components in the navigation domain:

**Directory**: `apps/clementine-app/src/domains/navigation/components/`

**Files to create**:
1. `TopNavBar.tsx` - Main container component
2. `TopNavBreadcrumb.tsx` - Breadcrumb display
3. `TopNavActions.tsx` - Action buttons

**Start with TypeScript interfaces** (copy from data-model.md or contracts/component-api.md):
```typescript
// TopNavBar.tsx
interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

interface ActionButton {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  ariaLabel?: string;
}

interface TopNavBarProps {
  breadcrumbs: BreadcrumbItem[];
  actions: ActionButton[];
  className?: string;
}
```

---

### Step 2: Implement TopNavBreadcrumb (15 min)

**File**: `TopNavBreadcrumb.tsx`

**Key elements**:
- Render breadcrumb items horizontally
- Use `<Link>` from TanStack Router for items with `href`
- Render plain text for items without `href` (current page)
- Add separator between items (use `/` or `ChevronRight` icon)
- Apply truncation styles with Tailwind (`truncate` utility)

**Reference**: Look at `NavigationLink.tsx` for Link usage patterns

**Styling hints**:
```typescript
// Container: flex, items-center, gap-2
// Item: truncate, hover:text-primary (if clickable)
// Separator: text-muted-foreground, text-sm
// Icon: mr-2, flex-shrink-0 (prevent icon from truncating)
```

---

### Step 3: Implement TopNavActions (15 min)

**File**: `TopNavActions.tsx`

**Key elements**:
- Render action buttons horizontally
- Use shadcn/ui `Button` component
- Map over `actions` array
- Pass icon, label, onClick, variant to Button
- Apply consistent spacing between buttons

**Button component import**:
```typescript
import { Button } from '@/ui-kit/components/button';
```

**Styling hints**:
```typescript
// Container: flex, items-center, gap-2
// Button: variant from props, size="sm" or size="default"
// Icon: Use icon prop from action
```

---

### Step 4: Implement TopNavBar Container (20 min)

**File**: `TopNavBar.tsx`

**Key elements**:
- Render horizontal flex container
- Left side: `<TopNavBreadcrumb items={breadcrumbs} />`
- Right side: `<TopNavActions actions={actions} />`
- Use `justify-between` for spacing
- Add border-bottom for visual separation
- Height: ~48-56px (use padding for height)

**Styling structure**:
```typescript
<nav className="flex items-center justify-between border-b px-4 py-3">
  <TopNavBreadcrumb items={breadcrumbs} />
  <TopNavActions actions={actions} />
</nav>
```

**Theme tokens** (no hard-coded colors):
- Background: `bg-background` or `bg-card`
- Border: `border-border`
- Text: `text-foreground`

---

### Step 5: Update Navigation Domain Exports (5 min)

**File**: `domains/navigation/components/index.ts`

**Add exports**:
```typescript
export { TopNavBar } from './TopNavBar';
export type { BreadcrumbItem, ActionButton, TopNavBarProps } from './TopNavBar';
```

**Do NOT export**:
- `TopNavBreadcrumb` (internal only)
- `TopNavActions` (internal only)

---

### Step 6: Integrate in Project Route (15 min)

**File**: `app/workspace/$workspaceSlug.projects/$projectId.tsx`

**Steps**:
1. Import TopNavBar and icons
2. Get project data from loader
3. Create breadcrumbs and actions arrays
4. Render TopNavBar before `<Outlet />`

**Code**:
```typescript
import { TopNavBar } from '@/domains/navigation';
import { FolderOpen, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectLayout() {
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

**Test**: Navigate to any project page, verify navigation bar appears

---

### Step 7: Integrate in Event Route (20 min)

**File**: `app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.tsx`

**Steps**:
1. Import TopNavBar and icons
2. Get event and project data from loaders
3. Get route params for building project link
4. Create breadcrumbs (project + event) and actions arrays
5. Render TopNavBar before existing EventLayout content

**Code**:
```typescript
import { TopNavBar } from '@/domains/navigation';
import { FolderOpen, Play, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function EventLayout() {
  const { event, project } = Route.useLoaderData();
  const { workspaceSlug, projectId } = Route.useParams();

  const projectPath = `/workspace/${workspaceSlug}/projects/${projectId}`;

  return (
    <>
      <TopNavBar
        breadcrumbs={[
          {
            label: project.name,
            href: projectPath,
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
      {/* Existing EventLayout content */}
    </>
  );
}
```

**Test**: Navigate to any event page, verify navigation bar with breadcrumb and actions

---

### Step 8: Mobile Responsiveness Testing (20 min)

**Test at multiple breakpoints**:
- 320px (iPhone SE)
- 375px (iPhone 12/13)
- 768px (iPad)
- 1024px+ (desktop)

**Verify**:
- ✅ Breadcrumb text truncates with ellipsis at narrow widths
- ✅ Action buttons maintain 44x44px minimum touch targets
- ✅ Icons remain visible even when text is hidden
- ✅ Layout doesn't break or overflow
- ✅ Clicking breadcrumb navigates to project page
- ✅ Clicking action buttons shows toast

**Tools**:
- Chrome DevTools responsive mode
- Firefox responsive design mode
- Real device testing (if available)

---

### Step 9: Validation & Code Quality (30 min)

**Run validation loop** (before committing):
```bash
cd apps/clementine-app
pnpm app:check  # Auto-fix lint and format issues
pnpm type-check # Verify TypeScript types
pnpm test       # Run tests (if written)
```

**Manual standards review**:
- ✅ No hard-coded colors (use theme tokens)
- ✅ No magic numbers (use named constants)
- ✅ TypeScript strict mode (no `any` types)
- ✅ Component props fully typed
- ✅ Semantic HTML (`<nav>`, `<a>`, `<button>`)
- ✅ ARIA labels for icon-only buttons
- ✅ Barrel exports in `index.ts`
- ✅ File naming follows conventions (`TopNavBar.tsx`)

**Review against standards**:
- `standards/frontend/design-system.md` - Theme tokens
- `standards/frontend/component-libraries.md` - shadcn/ui usage
- `standards/global/project-structure.md` - Vertical slice architecture
- `standards/frontend/responsive.md` - Mobile-first breakpoints

---

### Step 10: Write Tests (Optional - 30-60 min)

**Create test files**:
- `TopNavBar.test.tsx`
- `TopNavBreadcrumb.test.tsx`
- `TopNavActions.test.tsx`

**Test coverage**:
1. **Rendering**: Component renders with props
2. **Breadcrumb navigation**: Clicking item with href navigates
3. **Breadcrumb current page**: Item without href is not clickable
4. **Action buttons**: onClick handlers are triggered
5. **Responsive**: Long text truncates without breaking layout
6. **Accessibility**: ARIA labels are present

**Reference**: Existing tests in `domains/navigation/` for patterns

---

## Quick Reference

### Component Hierarchy
```
TopNavBar (exported)
├── TopNavBreadcrumb (internal)
│   ├── Icon (optional, first item only)
│   ├── Link (if href present) or Text
│   └── Separator
└── TopNavActions (internal)
    └── Button[] (from shadcn/ui)
```

### Imports Cheat Sheet
```typescript
// Components
import { TopNavBar } from '@/domains/navigation';
import { Button } from '@/ui-kit/components/button';
import { Link } from '@tanstack/react-router';

// Icons
import { FolderOpen, Share2, Play, Upload, ChevronRight } from 'lucide-react';

// Toast
import { toast } from 'sonner';

// Types
import type { LucideIcon } from 'lucide-react';
```

### Tailwind Utilities
```typescript
// Layout
className="flex items-center justify-between gap-2"

// Truncation
className="truncate"

// Theme tokens
className="bg-background text-foreground border-border"

// Spacing
className="px-4 py-3"
```

---

## Troubleshooting

### Issue: Breadcrumb not navigating
**Solution**: Verify `href` prop is set and `<Link>` component is used

### Issue: Toast not appearing
**Solution**: Verify `<Toaster />` is in `__root.tsx` and `toast` is imported from 'sonner'

### Issue: Hard-coded colors flagged in linting
**Solution**: Use theme tokens from Tailwind CSS (e.g., `bg-background` instead of `bg-white`)

### Issue: TypeScript errors on props
**Solution**: Ensure all interfaces are properly typed, check LucideIcon import

### Issue: Layout breaks on mobile
**Solution**: Use `truncate` utility, set `flex-shrink-0` on icons, test at 320px width

---

## Next Steps

After implementation is complete:

1. **Manual testing**: Test all acceptance criteria from spec.md
2. **Code review**: Self-review against standards and constitution
3. **Commit**: Run validation, commit with clear message
4. **Create PR**: Use `/pr` skill to generate pull request
5. **Demo**: Test on real mobile device before merging

---

## Success Criteria Checklist

Before marking complete, verify all success criteria from spec.md:

- [ ] SC-001: Location identifiable within 1 second (breadcrumb visible)
- [ ] SC-002: One-click navigation from event to project (breadcrumb link works)
- [ ] SC-003: 44x44px minimum touch targets (verify on mobile)
- [ ] SC-004: Consistent visual design (matches existing navigation)
- [ ] SC-005: Graceful truncation at 320px width (test responsive)
- [ ] SC-006: Action buttons provide toast feedback (test clicks)

All ✅ → Feature complete!
