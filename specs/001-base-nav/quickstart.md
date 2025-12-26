# Quickstart: Base Navigation System

**Feature**: 001-base-nav | **Date**: 2025-12-26
**Purpose**: Developer guide for implementing and testing the navigation system

## Prerequisites

- TanStack Start app already set up at `apps/clementine-app/`
- shadcn/ui configured with Sheet, Button components
- Tailwind CSS 4 configured
- TypeScript 5.7 with strict mode
- Vitest configured for testing

## Implementation Steps

### 1. Create Navigation Domain Structure

```bash
cd apps/clementine-app/src/domains
mkdir -p navigation/{components,hooks,types,constants,lib}
```

Create barrel exports:
```bash
touch navigation/components/index.ts
touch navigation/hooks/index.ts
touch navigation/types/index.ts
touch navigation/constants/index.ts
touch navigation/lib/index.ts
touch navigation/index.ts
```

---

### 2. Define Types and Mock Data

**File**: `src/domains/navigation/types/navigation.types.ts`
```typescript
import type { LucideIcon } from 'lucide-react'

export interface Workspace {
  id: string
  name: string
}

export type RouteArea = 'admin' | 'workspace' | 'guest'

export interface NavItem {
  label: string
  href: string
  icon?: LucideIcon
}
```

**File**: `src/domains/navigation/constants/mockWorkspaces.ts`
```typescript
import type { Workspace } from '../types'

export const MOCK_WORKSPACES: Workspace[] = [
  { id: 'acme', name: 'Acme' },
  { id: 'acme-inc', name: 'Acme Inc' },
  { id: 'acme-corp', name: 'Acme Corporation Inc' },
  { id: 'single-letter', name: 'X' },
  { id: 'empty-name', name: '' },
]
```

**File**: `src/domains/navigation/lib/getWorkspaceInitials.ts`
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

---

### 3. Create Sidebar Hook

**File**: `src/domains/navigation/hooks/useSidebarState.ts`
```typescript
import { useState, useCallback } from 'react'

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

---

### 4. Build Navigation Components

**File**: `src/domains/navigation/components/AdminNav.tsx`
```typescript
import { Briefcase, Wrench } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { NavItem } from '../types'

const adminNavItems: NavItem[] = [
  { label: 'Workspaces', href: '/admin/workspaces', icon: Briefcase },
  { label: 'Dev Tools', href: '/admin/dev-tools', icon: Wrench },
]

export function AdminNav() {
  return (
    <nav className="flex flex-col gap-2">
      {adminNavItems.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            to={item.href}
            className="flex items-center gap-3 px-4 py-3 text-slate-50 hover:bg-slate-800 active:bg-slate-700 rounded-md"
            activeProps={{ className: 'bg-slate-800' }}
          >
            {Icon && <Icon className="w-5 h-5" />}
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
```

**File**: `src/domains/navigation/components/WorkspaceSelector.tsx`
```typescript
import { MOCK_WORKSPACES } from '../constants'
import { getWorkspaceInitials } from '../lib'

interface WorkspaceSelectorProps {
  workspaceId: string
}

export function WorkspaceSelector({ workspaceId }: WorkspaceSelectorProps) {
  const workspace = MOCK_WORKSPACES.find(w => w.id === workspaceId)
  const initials = getWorkspaceInitials(workspace?.name)

  const handleClick = () => {
    window.open('/admin/workspaces', '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center w-12 h-12 bg-slate-700 text-slate-50 rounded-md hover:bg-slate-600 active:bg-slate-500 font-semibold text-lg"
      aria-label={`Current workspace: ${workspace?.name || 'Unknown'}`}
    >
      {initials}
    </button>
  )
}
```

**File**: `src/domains/navigation/components/WorkspaceNav.tsx`
```typescript
import { FolderKanban, Settings } from 'lucide-react'
import { Link, useParams } from '@tanstack/react-router'
import type { NavItem } from '../types'
import { WorkspaceSelector } from './WorkspaceSelector'

const workspaceNavItems: NavItem[] = [
  { label: 'Projects', href: '/workspace/$workspaceId/projects', icon: FolderKanban },
  { label: 'Settings', href: '/workspace/$workspaceId/settings', icon: Settings },
]

export function WorkspaceNav() {
  const { workspaceId } = useParams({ from: '/workspace/$workspaceId' })

  return (
    <div className="flex flex-col gap-4">
      <WorkspaceSelector workspaceId={workspaceId} />
      <nav className="flex flex-col gap-2">
        {workspaceNavItems.map((item) => {
          const Icon = item.icon
          const href = item.href.replace('$workspaceId', workspaceId)
          return (
            <Link
              key={item.label}
              to={href}
              className="flex items-center gap-3 px-4 py-3 text-slate-50 hover:bg-slate-800 active:bg-slate-700 rounded-md"
              activeProps={{ className: 'bg-slate-800' }}
            >
              {Icon && <Icon className="w-5 h-5" />}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
```

**File**: `src/domains/navigation/components/Sidebar.tsx`
```typescript
import { Menu, LogOut } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/ui-kit/components/sheet'
import { Button } from '@/ui-kit/components/button'
import { useSidebarState } from '../hooks'
import type { RouteArea } from '../types'
import { AdminNav } from './AdminNav'
import { WorkspaceNav } from './WorkspaceNav'

interface SidebarProps {
  area: RouteArea
}

export function Sidebar({ area }: SidebarProps) {
  const { isOpen, toggle, close } = useSidebarState()

  if (area === 'guest') {
    return null // No sidebar for guest routes
  }

  return (
    <>
      {/* Mobile: Sheet */}
      <Sheet open={isOpen} onOpenChange={toggle}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" aria-label="Toggle navigation">
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="bg-slate-900 border-slate-700">
          <SidebarContent area={area} onNavigate={close} />
        </SheetContent>
      </Sheet>

      {/* Desktop: Static sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:h-screen md:bg-slate-900 md:border-l md:border-slate-700">
        <SidebarContent area={area} />
      </aside>
    </>
  )
}

interface SidebarContentProps {
  area: RouteArea
  onNavigate?: () => void
}

function SidebarContent({ area, onNavigate }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full py-6 px-4">
      {/* Navigation content */}
      <div className="flex-1">
        {area === 'admin' && <AdminNav />}
        {area === 'workspace' && <WorkspaceNav />}
      </div>

      {/* Logout button (placeholder) */}
      <Button
        variant="ghost"
        className="flex items-center gap-3 w-full justify-start text-slate-50 hover:bg-slate-800"
        onClick={() => {
          // Placeholder - no auth logic
          console.log('Logout clicked (placeholder)')
        }}
      >
        <LogOut className="w-5 h-5" />
        <span>Logout</span>
      </Button>
    </div>
  )
}
```

---

### 5. Create Routes

**File**: `src/routes/index.tsx` (replace existing)
```typescript
import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => <Navigate to="/admin/workspaces" />,
})
```

**File**: `src/routes/admin/index.tsx`
```typescript
import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/')({
  component: () => <Navigate to="/admin/workspaces" />,
})
```

**File**: `src/routes/admin/workspaces.tsx`
```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/workspaces')({
  component: WorkspacesPage,
})

function WorkspacesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-50">WIP</h1>
    </div>
  )
}
```

**File**: `src/routes/admin/dev-tools.tsx`
```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/dev-tools')({
  component: DevToolsPage,
})

function DevToolsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-50">WIP</h1>
    </div>
  )
}
```

Create workspace and guest routes similarly with WIP placeholders.

---

### 6. Update Root Layout

**File**: `src/routes/__root.tsx` (modify to include Sidebar)
```typescript
import { createRootRoute, Outlet, useMatches } from '@tanstack/react-router'
import { Sidebar } from '@/domains/navigation'
import type { RouteArea } from '@/domains/navigation'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const matches = useMatches()
  const currentPath = matches[matches.length - 1]?.pathname || '/'

  // Determine route area from path
  const area: RouteArea = currentPath.startsWith('/admin')
    ? 'admin'
    : currentPath.startsWith('/workspace')
    ? 'workspace'
    : 'guest'

  return (
    <div className="flex min-h-screen bg-slate-900">
      <main className="flex-1">
        <Outlet />
      </main>
      <Sidebar area={area} />
    </div>
  )
}
```

---

### 7. Write Tests

**File**: `tests/navigation/getWorkspaceInitials.test.ts`
```typescript
import { describe, it, expect } from 'vitest'
import { getWorkspaceInitials } from '@/domains/navigation'

describe('getWorkspaceInitials', () => {
  it('returns single letter for single word', () => {
    expect(getWorkspaceInitials('Acme')).toBe('A')
  })

  it('returns two letters for two words', () => {
    expect(getWorkspaceInitials('Acme Inc')).toBe('AI')
  })

  it('returns two letters for three+ words', () => {
    expect(getWorkspaceInitials('Acme Corporation Inc')).toBe('AC')
  })

  it('returns ? for empty string', () => {
    expect(getWorkspaceInitials('')).toBe('?')
  })

  it('returns ? for null', () => {
    expect(getWorkspaceInitials(null)).toBe('?')
  })

  it('returns ? for undefined', () => {
    expect(getWorkspaceInitials(undefined)).toBe('?')
  })

  it('returns ? for whitespace-only string', () => {
    expect(getWorkspaceInitials('   ')).toBe('?')
  })
})
```

---

### 8. Run Validation

```bash
cd apps/clementine-app

# Run all validation checks
pnpm check

# Run tests
pnpm test

# Start dev server
pnpm dev
```

---

## Testing the Feature

1. **Start dev server**: `pnpm dev` (from `apps/clementine-app/`)
2. **Test admin navigation**:
   - Visit `http://localhost:3000/admin`
   - Should redirect to `/admin/workspaces`
   - Click hamburger icon → sidebar opens
   - Click "Dev Tools" → navigates to `/admin/dev-tools`
3. **Test workspace navigation**:
   - Visit `http://localhost:3000/workspace/acme-inc`
   - Should redirect to `/workspace/acme-inc/projects`
   - Sidebar shows workspace selector with "AI" initials
   - Click workspace selector → opens `/admin/workspaces` in new tab
4. **Test guest route**:
   - Visit `http://localhost:3000/guest/test-project`
   - Should show WIP with no sidebar
5. **Test mobile**:
   - Resize browser to mobile width
   - Sidebar should use Sheet component (slide-out panel)

---

## Troubleshooting

**Sidebar not showing**: Check that `__root.tsx` includes Sidebar component and determines area correctly

**TypeScript errors**: Ensure all barrel exports (`index.ts`) are created and exporting properly

**Route params not working**: Verify TanStack Router route definitions use `$` prefix for params (e.g., `$workspaceId`)

**Workspace initials showing "?"**: Check that workspaceId in URL matches a mock workspace ID in `MOCK_WORKSPACES`

---

## Next Steps

After implementation:
1. Run `/speckit.tasks` to generate task breakdown
2. Follow tasks.md to implement feature step-by-step
3. Run validation loop before committing: `pnpm check && pnpm test`
4. Test all routes and sidebar variants (admin, workspace, guest)
5. Mark feature complete when all acceptance criteria pass
