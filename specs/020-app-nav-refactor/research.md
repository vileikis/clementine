# Research: App Navigation Refactor

**Branch**: `020-app-nav-refactor` | **Date**: 2025-01-12

## Research Questions

This refactor addresses architectural improvements without introducing new technologies. The following research validates the approach and confirms existing patterns.

---

## 1. TanStack Router Link `params` Prop

**Question**: How does TanStack Router's Link component handle type-safe route parameters?

**Decision**: Use `params` prop on Link component for type-safe route parameter injection.

**Rationale**: The codebase already uses this pattern successfully in `EventDesignerSidebar.tsx`:

```tsx
// Existing pattern in codebase (EventDesignerSidebar.tsx:55-69)
interface SidebarLinkProps {
  to: string
  params: Record<string, string>
  isActive: boolean
  children: ReactNode
}

function SidebarLink({ to, params, isActive, children }: SidebarLinkProps) {
  return (
    <Link
      to={to}
      params={params}
      className={cn(...)}
    >
      {children}
    </Link>
  )
}
```

**Alternatives Considered**:
- String replacement (current pattern in WorkspaceNav): Rejected because it's not type-safe and requires manual string manipulation
- URL construction with template literals: Rejected because TanStack Router provides built-in params support

---

## 2. Sidebar State Management

**Question**: Should the refactored shell use React Context or direct Zustand store access for collapse state?

**Decision**: Use direct Zustand store access via `useSidebarState()` hook.

**Rationale**:
- The existing implementation already uses Zustand with persist middleware (`sidebarStore.ts`)
- Zustand handles multiple subscribers efficiently
- Adding React Context would introduce unnecessary indirection
- The `useSidebarState()` hook already exists and provides clean API

**Existing Implementation** (`sidebarStore.ts`):
```tsx
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      toggleMobileOpen: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
      closeMobile: () => set({ isMobileOpen: false }),
    }),
    {
      name: 'sidebar-storage',
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    },
  ),
)
```

**Alternatives Considered**:
- React Context wrapping shell: Rejected because it adds complexity without benefit; Zustand already optimizes for multiple consumers
- Prop drilling from shell to children: Rejected because composition pattern means children don't render inside shell

---

## 3. Mobile Close-on-Navigate Behavior

**Question**: How should the mobile sheet close when navigating to a new route?

**Decision**: Call `closeMobile()` in `NavigationLink` after navigation (not via `onNavigate` callback).

**Rationale**:
- Current implementation passes `onNavigate={closeMobile}` to `SidebarContent`
- With bottom-up composition, there's no callback chain from shell to links
- `NavigationLink` can call `useSidebarState().closeMobile()` directly
- Cleaner: navigation component handles its own close behavior

**Implementation**:
```tsx
// shared/NavigationLink.tsx
export function NavigationLink({ to, params, ... }: NavigationLinkProps) {
  const { closeMobile } = useSidebarState()

  const handleClick = () => {
    closeMobile()  // Close mobile sheet on any navigation
  }

  return (
    <Link to={to} params={params} onClick={handleClick} ...>
      ...
    </Link>
  )
}
```

**Alternatives Considered**:
- TanStack Router's `onBeforeLoad` in Link: Not available for this use case
- Keeping `onNavigate` callback: Rejected because it couples shell to navigation behavior

---

## 4. Guest Area Handling

**Question**: How should guest routes handle the absence of a sidebar?

**Decision**: Guest routes simply don't render any sidebar component.

**Rationale**:
- Current implementation: `Sidebar` returns `null` for `area === 'guest'`
- With bottom-up pattern: guest routes don't import or render any sidebar component
- This is cleaner - no null-returning component needed

**Current Pattern**:
```tsx
// Current Sidebar.tsx
if (area === 'guest') {
  return null
}
```

**New Pattern**:
```tsx
// Guest route simply doesn't render a sidebar
function GuestLayout() {
  return (
    <main className="min-h-screen">
      <Outlet />
    </main>
  )
}
```

---

## 5. NavItem Type Update

**Question**: Should `NavItem` use `to` (router path) or keep `href` (URL string)?

**Decision**: Rename `href` to `to` for consistency with TanStack Router naming.

**Rationale**:
- TanStack Router uses `to` prop for route paths
- Aligns with codebase convention (EventDesignerSidebar uses `to`)
- Clearer semantic meaning: `to` indicates router navigation, `href` suggests raw URL

**Updated Type**:
```tsx
// navigation.types.ts
export interface NavItem {
  label: string
  to: string     // Route path (can include $param placeholders)
  icon?: LucideIcon
}
```

**Migration**: Rename `href` to `to` in all nav item definitions.

---

## 6. Folder Structure Within Navigation Domain

**Question**: Should area-specific components go in separate folders or use flat structure with prefixes?

**Decision**: Use nested folder structure: `shell/`, `admin/`, `workspace/`, `shared/`.

**Rationale**:
- Follows PRD recommendation
- Matches project-structure standard (vertical slice within domain)
- Improves discoverability - clear where to add new workspace nav items
- Each folder has its own `index.ts` barrel export

**Structure**:
```
components/
├── shell/           # Generic shell, no area knowledge
├── admin/           # Admin-specific sidebar + nav items
├── workspace/       # Workspace-specific sidebar + nav items + selector
└── shared/          # Reusable: NavigationLink, LogoutButton
```

**Alternatives Considered**:
- Flat with prefixes (AdminSidebar.tsx, WorkspaceSidebar.tsx): Rejected because discoverability is worse; harder to see all admin-related files together
- Keeping current structure: Rejected because it doesn't solve the discoverability issues

---

## 7. Constants/Styling Preservation

**Question**: Should sidebar width and animation constants stay in the shell or move to a shared location?

**Decision**: Keep constants co-located in `AppSidebarShell.tsx`.

**Rationale**:
- Constants are only used by the shell component
- No other component needs `SIDEBAR_WIDTH` or `SIDEBAR_ANIMATION_DURATION`
- Moving to a constants file would spread implementation details unnecessarily

**Constants to Preserve**:
```tsx
const SIDEBAR_WIDTH = {
  expanded: 256, // 16rem / w-64
  collapsed: 64, // 4rem / w-16
}
const SIDEBAR_ANIMATION_DURATION = 200 // ms
```

---

## Summary of Decisions

| Decision | Choice | Key Reason |
|----------|--------|------------|
| Route params | TanStack Router `params` prop | Type-safe, existing pattern |
| State management | Direct Zustand access | Already implemented, no extra complexity |
| Mobile close | Direct `closeMobile()` in NavigationLink | Clean, no callback chains |
| Guest handling | Don't render sidebar | Cleaner than null-returning component |
| NavItem type | Rename `href` to `to` | TanStack Router convention |
| Folder structure | Nested (`shell/`, `admin/`, etc.) | Better discoverability |
| Constants | Co-locate in shell | Only used there |

All research questions resolved. Ready for Phase 1: Design & Contracts.
