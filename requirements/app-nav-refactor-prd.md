# App Navigation Refactor PRD

## Overview

Refactor the application sidebar navigation to use a bottom-up composition pattern, improving separation of concerns and discoverability.

## Current State

### Structure
```
domains/navigation/components/
├── Sidebar.tsx           # Main component (handles shell + area dispatch)
├── SidebarContent.tsx    # Embedded in Sidebar.tsx (not separate)
├── AdminNav.tsx          # Admin navigation items
├── WorkspaceNav.tsx      # Workspace navigation items
├── NavigationLink.tsx    # Individual nav link component
└── WorkspaceSelector.tsx # Workspace dropdown
```

### Current Pattern (Top-Down)
```
Sidebar (knows about areas via `area` prop)
  └── SidebarContent (embedded, dispatches to area nav)
        └── AdminNav | WorkspaceNav (just nav items)
```

### Issues
1. **Generic naming** - `Sidebar` is too generic
2. **Embedded component** - `SidebarContent` lives inside `Sidebar.tsx`
3. **Area awareness in shell** - Shell component knows about admin/workspace contexts
4. **Poor discoverability** - Nav items hidden in component files; adding items requires knowing where to look
5. **Tight coupling** - Adding new areas requires modifying the shell component

## Proposed State

### Structure
```
domains/navigation/components/
├── shell/
│   ├── AppSidebarShell.tsx      # Generic shell (mobile/desktop, collapse)
│   ├── AppSidebarContext.tsx    # Optional: context for collapse state
│   └── index.ts
├── admin/
│   ├── AdminSidebar.tsx         # Admin-specific sidebar
│   ├── adminNavItems.ts         # Admin nav configuration
│   └── index.ts
├── workspace/
│   ├── WorkspaceSidebar.tsx     # Workspace-specific sidebar
│   ├── workspaceNavItems.ts     # Workspace nav configuration
│   ├── WorkspaceSelector.tsx    # Workspace dropdown
│   └── index.ts
├── shared/
│   ├── NavigationLink.tsx       # Reusable nav link
│   ├── LogoutButton.tsx         # Extracted logout button
│   └── index.ts
└── index.ts
```

### Proposed Pattern (Bottom-Up)
```
AdminSidebar | WorkspaceSidebar (area-specific, self-contained)
  └── AppSidebarShell (dumb shell, no area knowledge)
        └── children (nav items, selectors, logout)
```

## Detailed Design

### AppSidebarShell

Generic shell component that handles:
- Mobile: Sheet with hamburger trigger
- Desktop: Collapsible sidebar with width animation
- Collapse state management (via Zustand store)

```tsx
// shell/AppSidebarShell.tsx
interface AppSidebarShellProps {
  children: React.ReactNode
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
          <SheetContent side="left" className="w-64 ...">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">
              Navigate through the application
            </SheetDescription>
            <div className="px-2 py-3">
              <Button variant="ghost" size="icon" onClick={closeMobile}>
                <Menu className="h-5 w-5" />
              </Button>
            </div>
            {children}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Collapsible sidebar */}
      <aside
        className="hidden md:flex md:flex-col md:h-screen ..."
        style={{ width: isCollapsed ? 64 : 256 }}
      >
        <div className="px-2 py-3">
          <Button variant="ghost" size="icon" onClick={toggleCollapsed}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        {children}
      </aside>
    </>
  )
}
```

### Collapse State Access

**Option A: Direct Store Access (Recommended)**

Components that need `isCollapsed` call `useSidebarState()` directly. Zustand handles multiple subscribers efficiently.

```tsx
// workspace/WorkspaceSidebar.tsx
export function WorkspaceSidebar({ workspaceSlug }: Props) {
  const { isCollapsed } = useSidebarState()

  return (
    <AppSidebarShell>
      <div className="flex flex-col h-full">
        <div className="flex-1 px-2">
          <WorkspaceSelector workspaceSlug={workspaceSlug} isCollapsed={isCollapsed} />
          <nav className="flex flex-col gap-4">
            {workspaceNavItems.map((item) => (
              <NavigationLink
                key={item.label}
                {...item}
                href={item.href.replace('$workspaceSlug', workspaceSlug)}
                isCollapsed={isCollapsed}
              />
            ))}
          </nav>
        </div>
        <LogoutButton isCollapsed={isCollapsed} />
      </div>
    </AppSidebarShell>
  )
}
```

**Option B: React Context**

Shell provides context; children consume it. More explicit but adds indirection.

```tsx
// shell/AppSidebarContext.tsx
interface SidebarContextValue {
  isCollapsed: boolean
  closeMobile: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function useSidebarContext() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebarContext must be used within AppSidebarShell')
  return ctx
}

// In AppSidebarShell:
<SidebarContext.Provider value={{ isCollapsed, closeMobile }}>
  {children}
</SidebarContext.Provider>
```

**Recommendation**: Use Option A (direct store access). It's simpler, Zustand handles it well, and avoids extra abstraction. Context adds complexity without clear benefit here.

### Area-Specific Sidebars

#### WorkspaceSidebar

```tsx
// workspace/WorkspaceSidebar.tsx
import { AppSidebarShell } from '../shell'
import { NavigationLink, LogoutButton } from '../shared'
import { WorkspaceSelector } from './WorkspaceSelector'
import { workspaceNavItems } from './workspaceNavItems'

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
          <nav className="flex flex-col gap-4">
            {workspaceNavItems.map((item) => (
              <NavigationLink
                key={item.label}
                label={item.label}
                href={item.href.replace('$workspaceSlug', workspaceSlug)}
                icon={item.icon}
                isCollapsed={isCollapsed}
              />
            ))}
          </nav>
        </div>
        <LogoutButton isCollapsed={isCollapsed} />
      </div>
    </AppSidebarShell>
  )
}
```

#### workspaceNavItems.ts

```tsx
// workspace/workspaceNavItems.ts
import { FolderOpen, Sparkles, Settings } from 'lucide-react'
import type { NavItem } from '../../types'

export const workspaceNavItems: NavItem[] = [
  {
    label: 'Projects',
    href: '/workspace/$workspaceSlug/projects',
    icon: FolderOpen,
  },
  {
    label: 'Experiences',
    href: '/workspace/$workspaceSlug/experiences',
    icon: Sparkles,
  },
  {
    label: 'Settings',
    href: '/workspace/$workspaceSlug/settings',
    icon: Settings,
  },
]
```

#### AdminSidebar

```tsx
// admin/AdminSidebar.tsx
import { AppSidebarShell } from '../shell'
import { NavigationLink, LogoutButton } from '../shared'
import { adminNavItems } from './adminNavItems'

export function AdminSidebar() {
  const { isCollapsed } = useSidebarState()

  return (
    <AppSidebarShell>
      <div className="flex flex-col h-full">
        <nav className="flex-1 px-2 flex flex-col gap-4">
          {adminNavItems.map((item) => (
            <NavigationLink
              key={item.href}
              label={item.label}
              href={item.href}
              icon={item.icon}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>
        <LogoutButton isCollapsed={isCollapsed} />
      </div>
    </AppSidebarShell>
  )
}
```

### Route Integration

```tsx
// app/admin/route.tsx
import { AdminSidebar } from '@/domains/navigation'

export function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

// app/workspace/route.tsx
import { WorkspaceSidebar } from '@/domains/navigation'

export function WorkspaceLayout() {
  const { workspaceSlug } = useParams()

  return (
    <div className="flex min-h-screen">
      <WorkspaceSidebar workspaceSlug={workspaceSlug} />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
```

## Benefits

1. **Clear separation of concerns**
   - Shell handles responsive behavior and collapse
   - Area sidebars own their navigation configuration
   - Shared components are reusable

2. **Improved discoverability**
   - Adding "Experiences" to workspace: edit `workspace/workspaceNavItems.ts`
   - Nav config files are obvious entry points

3. **Open for extension**
   - Adding new area (e.g., `ProjectSidebar`) doesn't touch shell
   - Each area is self-contained

4. **Better testability**
   - Shell can be tested independently
   - Nav items are plain data, easy to test
   - Area sidebars have clear boundaries

## Migration Steps

1. **Create shell components**
   - Extract `AppSidebarShell` from current `Sidebar`
   - Keep mobile/desktop logic intact

2. **Create shared components**
   - Extract `LogoutButton` from `SidebarContent`
   - Keep `NavigationLink` as-is

3. **Create area-specific sidebars**
   - Create `AdminSidebar` with `adminNavItems.ts`
   - Create `WorkspaceSidebar` with `workspaceNavItems.ts`

4. **Update route files**
   - Replace `<Sidebar area="admin" />` with `<AdminSidebar />`
   - Replace `<Sidebar area="workspace" />` with `<WorkspaceSidebar workspaceSlug={...} />`

5. **Clean up**
   - Remove old `Sidebar.tsx` and embedded `SidebarContent`
   - Update barrel exports in `index.ts`

## File Changes Summary

### New Files
- `components/shell/AppSidebarShell.tsx`
- `components/shell/index.ts`
- `components/admin/AdminSidebar.tsx`
- `components/admin/adminNavItems.ts`
- `components/admin/index.ts`
- `components/workspace/WorkspaceSidebar.tsx`
- `components/workspace/workspaceNavItems.ts`
- `components/workspace/index.ts`
- `components/shared/LogoutButton.tsx`
- `components/shared/index.ts`

### Modified Files
- `components/index.ts` (update exports)
- `app/admin/route.tsx` (use AdminSidebar)
- `app/workspace/route.tsx` (use WorkspaceSidebar)

### Deleted Files
- `components/Sidebar.tsx`
- `components/AdminNav.tsx` (merged into AdminSidebar)
- `components/WorkspaceNav.tsx` (merged into WorkspaceSidebar)

## Open Questions

1. **Guest area handling** - Current `Sidebar` returns `null` for guest area. With this pattern, guest routes simply don't render any sidebar. Is this acceptable?

2. **Mobile close on navigate** - Current implementation passes `onNavigate={closeMobile}` to close sheet on navigation. Need to preserve this behavior, possibly via `useSidebarState().closeMobile()` in `NavigationLink`.

3. **Future areas** - Are there other areas planned beyond admin/workspace? This pattern scales well but good to confirm.
