# Quickstart: App Navigation Refactor

**Branch**: `020-app-nav-refactor` | **Date**: 2025-01-12

## Overview

This guide covers implementing the bottom-up composition pattern for the app navigation sidebar. The refactor transforms a top-down pattern (shell dispatches to areas) into a bottom-up pattern (area sidebars compose a generic shell).

## Prerequisites

- Working development environment: `pnpm dev` runs successfully
- Familiarity with navigation domain: `src/domains/navigation/`
- Understanding of TanStack Router Link component

## Implementation Steps

### Step 1: Create Shared Components

**1.1 Create `shared/` folder structure**

```
src/domains/navigation/components/shared/
├── NavigationLink.tsx
├── LogoutButton.tsx
└── index.ts
```

**1.2 Move and update NavigationLink**

Move from `components/NavigationLink.tsx` to `components/shared/NavigationLink.tsx`.

Update to add `params` prop:

```tsx
interface NavigationLinkProps {
  label: string
  to: string
  params?: Record<string, string>  // NEW: Type-safe route params
  icon?: LucideIcon
  isCollapsed: boolean
}

export function NavigationLink({
  label,
  to,
  params,
  icon,
  isCollapsed,
}: NavigationLinkProps) {
  const { closeMobile } = useSidebarState()  // NEW: Auto-close mobile on navigate
  const Icon = icon

  return (
    <Link
      to={to}
      params={params}        // NEW: Pass params to Link
      onClick={closeMobile}  // NEW: Close mobile sheet on navigate
      className={cn(...)}
      activeProps={{ className: ... }}
    >
      {/* ... existing icon/label rendering ... */}
    </Link>
  )
}
```

**1.3 Extract LogoutButton**

Create `components/shared/LogoutButton.tsx`:

```tsx
import { LogOut } from 'lucide-react'
import { Button } from '@/ui-kit/ui/button'
import { useAuth } from '@/domains/auth'
import { cn } from '@/shared/utils'

interface LogoutButtonProps {
  isCollapsed: boolean
}

export function LogoutButton({ isCollapsed }: LogoutButtonProps) {
  const { logout } = useAuth()

  return (
    <Button
      variant="ghost"
      className={cn(
        'w-full justify-start gap-3',
        isCollapsed && 'justify-center',
      )}
      onClick={logout}
      title={isCollapsed ? 'Logout' : undefined}
    >
      <LogOut className="h-5 w-5 shrink-0" />
      {!isCollapsed && <span>Logout</span>}
    </Button>
  )
}
```

**1.4 Create barrel export**

Create `components/shared/index.ts`:

```tsx
export { NavigationLink } from './NavigationLink'
export { LogoutButton } from './LogoutButton'
```

---

### Step 2: Create Shell Component

**2.1 Create `shell/` folder structure**

```
src/domains/navigation/components/shell/
├── AppSidebarShell.tsx
└── index.ts
```

**2.2 Extract AppSidebarShell**

Create `components/shell/AppSidebarShell.tsx`:

```tsx
import type { ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { useSidebarState } from '../../hooks'
import { cn } from '@/shared/utils'
import { Button } from '@/ui-kit/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/ui-kit/ui/sheet'

const SIDEBAR_WIDTH = {
  expanded: 256,
  collapsed: 64,
}
const SIDEBAR_ANIMATION_DURATION = 200

interface AppSidebarShellProps {
  children: ReactNode
}

export function AppSidebarShell({ children }: AppSidebarShellProps) {
  const {
    isCollapsed,
    isMobileOpen,
    toggleCollapsed,
    toggleMobileOpen,
    closeMobile,
  } = useSidebarState()

  return (
    <>
      {/* Mobile: Sheet */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={isMobileOpen} onOpenChange={toggleMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Toggle navigation">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-64 bg-background border-r [&>button]:hidden"
          >
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">
              Navigate through workspaces, projects, and settings
            </SheetDescription>
            <div className="px-2 py-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={closeMobile}
                className="h-11 w-11"
                aria-label="Close navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
            {children}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Collapsible sidebar */}
      <aside
        className={cn(
          'hidden md:flex md:flex-col md:h-screen md:bg-background md:border-r md:shrink-0',
          'transition-[width] ease-out',
        )}
        style={{
          width: isCollapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded,
          transitionDuration: `${SIDEBAR_ANIMATION_DURATION}ms`,
        }}
      >
        <div className="px-2 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="h-11 w-11"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        {children}
      </aside>
    </>
  )
}
```

**2.3 Create barrel export**

Create `components/shell/index.ts`:

```tsx
export { AppSidebarShell } from './AppSidebarShell'
```

---

### Step 3: Create Admin Sidebar

**3.1 Create `admin/` folder structure**

```
src/domains/navigation/components/admin/
├── AdminSidebar.tsx
├── adminNavItems.ts
└── index.ts
```

**3.2 Create adminNavItems.ts**

```tsx
import { Briefcase, Wrench } from 'lucide-react'
import type { NavItem } from '../../types'

export const adminNavItems: NavItem[] = [
  { label: 'Workspaces', to: '/admin/workspaces', icon: Briefcase },
  { label: 'Dev Tools', to: '/admin/dev-tools', icon: Wrench },
]
```

**3.3 Create AdminSidebar**

```tsx
import { AppSidebarShell } from '../shell'
import { NavigationLink, LogoutButton } from '../shared'
import { adminNavItems } from './adminNavItems'
import { useSidebarState } from '../../hooks'

export function AdminSidebar() {
  const { isCollapsed } = useSidebarState()

  return (
    <AppSidebarShell>
      <div className="flex flex-col h-full">
        <nav className="flex-1 px-2 flex flex-col gap-4">
          {adminNavItems.map((item) => (
            <NavigationLink
              key={item.to}
              label={item.label}
              to={item.to}
              icon={item.icon}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>
        <div className="px-2 py-3">
          <LogoutButton isCollapsed={isCollapsed} />
        </div>
      </div>
    </AppSidebarShell>
  )
}
```

**3.4 Create barrel export**

```tsx
export { AdminSidebar } from './AdminSidebar'
```

---

### Step 4: Create Workspace Sidebar

**4.1 Create `workspace/` folder structure**

```
src/domains/navigation/components/workspace/
├── WorkspaceSidebar.tsx
├── workspaceNavItems.ts
├── WorkspaceSelector.tsx  # MOVED from parent
└── index.ts
```

**4.2 Move WorkspaceSelector**

Move `components/WorkspaceSelector.tsx` to `components/workspace/WorkspaceSelector.tsx` (no changes needed).

**4.3 Create workspaceNavItems.ts**

```tsx
import { FolderOpen, Settings } from 'lucide-react'
import type { NavItem } from '../../types'

export const workspaceNavItems: NavItem[] = [
  { label: 'Projects', to: '/workspace/$workspaceSlug/projects', icon: FolderOpen },
  { label: 'Settings', to: '/workspace/$workspaceSlug/settings', icon: Settings },
]
```

**4.4 Create WorkspaceSidebar**

```tsx
import { AppSidebarShell } from '../shell'
import { NavigationLink, LogoutButton } from '../shared'
import { WorkspaceSelector } from './WorkspaceSelector'
import { workspaceNavItems } from './workspaceNavItems'
import { useSidebarState } from '../../hooks'

interface WorkspaceSidebarProps {
  workspaceSlug: string
}

export function WorkspaceSidebar({ workspaceSlug }: WorkspaceSidebarProps) {
  const { isCollapsed } = useSidebarState()

  return (
    <AppSidebarShell>
      <div className="flex flex-col h-full">
        <div className="flex-1 px-2">
          <WorkspaceSelector
            workspaceSlug={workspaceSlug}
            isCollapsed={isCollapsed}
          />
          <nav className="flex flex-col gap-4 mt-4">
            {workspaceNavItems.map((item) => (
              <NavigationLink
                key={item.to}
                label={item.label}
                to={item.to}
                params={{ workspaceSlug }}
                icon={item.icon}
                isCollapsed={isCollapsed}
              />
            ))}
          </nav>
        </div>
        <div className="px-2 py-3">
          <LogoutButton isCollapsed={isCollapsed} />
        </div>
      </div>
    </AppSidebarShell>
  )
}
```

**4.5 Create barrel export**

```tsx
export { WorkspaceSidebar } from './WorkspaceSidebar'
export { WorkspaceSelector } from './WorkspaceSelector'
```

---

### Step 5: Update Types

**5.1 Update NavItem type**

Edit `types/navigation.types.ts`:

```tsx
export interface NavItem {
  label: string
  to: string     // Changed from 'href' to 'to'
  icon?: LucideIcon
}
```

---

### Step 6: Update Route Files

**6.1 Update admin route**

Edit `app/admin/route.tsx`:

```tsx
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { AdminSidebar } from '@/domains/navigation'  // Changed import
import { requireAdmin } from '@/domains/auth/guards'

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    await requireAdmin()
  },
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />  {/* Changed from <Sidebar area="admin" /> */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
```

**6.2 Update workspace route**

Edit `app/workspace/route.tsx`:

```tsx
import { Outlet, createFileRoute, useParams } from '@tanstack/react-router'
import { WorkspaceSidebar } from '@/domains/navigation'  // Changed import
import { requireAdmin } from '@/domains/auth/guards'

export const Route = createFileRoute('/workspace')({
  beforeLoad: async () => {
    await requireAdmin()
  },
  component: WorkspaceLayout,
})

function WorkspaceLayout() {
  const params = useParams({ strict: false })
  const workspaceSlug = 'workspaceSlug' in params ? params.workspaceSlug : undefined

  // Show nothing if no workspace slug (shouldn't happen in normal flow)
  if (!workspaceSlug) {
    return (
      <main className="flex-1 min-h-screen bg-background">
        <Outlet />
      </main>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <WorkspaceSidebar workspaceSlug={workspaceSlug} />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
```

---

### Step 7: Update Barrel Exports

**7.1 Update main index.ts**

Edit `components/index.ts`:

```tsx
// Shell (generic)
export { AppSidebarShell } from './shell'

// Area-specific sidebars
export { AdminSidebar } from './admin'
export { WorkspaceSidebar, WorkspaceSelector } from './workspace'

// Shared components
export { NavigationLink, LogoutButton } from './shared'

// Top navigation (unchanged)
export { TopNavBar } from './TopNavBar'
export { TopNavBreadcrumb } from './TopNavBreadcrumb'
export { TopNavActions } from './TopNavActions'
```

**7.2 Update domain index.ts**

Edit `domains/navigation/index.ts`:

```tsx
// Components
export {
  AppSidebarShell,
  AdminSidebar,
  WorkspaceSidebar,
  WorkspaceSelector,
  NavigationLink,
  LogoutButton,
  TopNavBar,
  TopNavBreadcrumb,
  TopNavActions,
} from './components'

// Hooks
export { useSidebarState } from './hooks'

// Types
export type { NavItem, RouteArea, Workspace } from './types'
```

---

### Step 8: Clean Up

**8.1 Delete old files**

- `components/Sidebar.tsx` - Replaced by `AppSidebarShell` + area sidebars
- `components/AdminNav.tsx` - Merged into `admin/AdminSidebar.tsx`
- `components/WorkspaceNav.tsx` - Merged into `workspace/WorkspaceSidebar.tsx`
- `components/WorkspaceSelector.tsx` - Moved to `workspace/WorkspaceSelector.tsx`
- `components/NavigationLink.tsx` - Moved to `shared/NavigationLink.tsx`

---

## Validation Checklist

After implementation, verify:

- [ ] `pnpm type-check` passes
- [ ] `pnpm lint` passes (or `pnpm check` to auto-fix)
- [ ] Desktop sidebar collapses/expands correctly
- [ ] Mobile sheet opens/closes correctly
- [ ] Mobile sheet closes on navigation
- [ ] Admin navigation works: `/admin/workspaces`, `/admin/dev-tools`
- [ ] Workspace navigation works with param substitution
- [ ] Collapse state persists across page refreshes
- [ ] Logout button works in both areas

---

## Adding New Navigation Areas (Future)

To add a new area (e.g., `ProjectSidebar`):

1. Create folder: `components/project/`
2. Create nav items: `projectNavItems.ts`
3. Create sidebar: `ProjectSidebar.tsx` (composes `AppSidebarShell`)
4. Export from `components/project/index.ts`
5. Update `components/index.ts` barrel export
6. Use in route file: `<ProjectSidebar projectId={...} />`

The shell component (`AppSidebarShell`) requires no changes.
