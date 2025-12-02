# Research: Sidebar Navigation System

**Feature**: 013-sidebar-nav
**Date**: 2025-12-02
**Status**: Complete

## Research Questions

### 1. Sidebar State Management Pattern

**Decision**: Zustand with persist middleware

**Rationale**:
- Zustand's `persist` middleware handles localStorage automatically with SSR-safe hydration
- No Provider wrapper needed (cleaner component tree)
- Selector-based subscriptions prevent unnecessary re-renders
- Tiny bundle size (~1kb) for significant DX improvement
- Built-in handling of hydration mismatch via `onRehydrateStorage` callback

**Alternatives Considered**:
- **React Context + localStorage**: More boilerplate, manual hydration handling, re-renders all consumers
- **URL state (searchParams)**: Not appropriate for UI preference (pollutes URLs, lost on navigation)
- **Cookies**: Requires server-side handling, more complex for simple UI state

**Implementation Pattern**:
```typescript
// sidebar.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isCollapsed: boolean;
  lastCompanySlug: string | null;
  toggleCollapsed: () => void;
  setLastCompanySlug: (slug: string) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      lastCompanySlug: null,
      toggleCollapsed: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
      setLastCompanySlug: (slug) => set({ lastCompanySlug: slug }),
    }),
    { name: 'clementine-sidebar' }
  )
);
```

### 2. YouTube-Style Collapse Animation

**Decision**: CSS transitions with Tailwind classes, width-based animation

**Rationale**:
- YouTube sidebar uses smooth width transition (not instant toggle)
- CSS transitions are GPU-accelerated and performant
- Tailwind's `transition-all duration-200` provides smooth 200ms animation
- Width values: 256px (expanded) → 72px (collapsed)

**Alternatives Considered**:
- **Framer Motion**: Overkill for simple width transition, adds bundle size
- **CSS Grid with `fr` units**: Less predictable transition behavior
- **Transform scale**: Distorts content rather than reflowing

**Implementation Pattern**:
```css
/* Sidebar container */
.sidebar {
  width: 256px; /* var(--sidebar-expanded) */
  transition: width 200ms ease-out;
}
.sidebar.collapsed {
  width: 72px; /* var(--sidebar-collapsed) */
}
```

### 3. Navigation Item Collapsed State (YouTube-Style)

**Decision**: Icon + small label underneath in collapsed mode

**Rationale**:
- YouTube's collapsed sidebar shows icon with tiny label underneath
- More discoverable than icon-only (users can read labels without hovering)
- Maintains scannability while saving space
- Tooltip still useful for longer labels that get truncated

**Alternatives Considered**:
- **Icon only**: Less discoverable, requires hover/tooltip for all items
- **Icon with tooltip only**: Poor experience on touch devices
- **Popout menu on hover**: Complex interaction, jarring UX

**Implementation Pattern**:
```tsx
// Expanded: horizontal layout (icon + label)
// Collapsed: vertical layout (icon above label, label truncated)
<div className={cn(
  "flex items-center gap-3",
  isCollapsed && "flex-col gap-1 text-center"
)}>
  <Icon className="h-5 w-5 shrink-0" />
  <span className={cn(
    isCollapsed && "text-[10px] truncate max-w-[56px]"
  )}>
    {label}
  </span>
</div>
```

### 4. Company Switcher UX

**Decision**: Click opens `/companies` in new tab (as specified in PRD)

**Rationale**:
- PRD explicitly states: "Clicking opens `/companies` in a new tab"
- New tab preserves user's current work context
- Company list page already exists from 012-company-context
- Simple implementation: anchor tag with `target="_blank"`

**Alternatives Considered**:
- **Dropdown menu**: More complex, requires fetching company list on sidebar load
- **Modal**: Interrupts workflow more than new tab
- **Same-tab navigation**: Loses current work context

**Implementation**:
```tsx
<a
  href="/companies"
  target="_blank"
  rel="noopener noreferrer"
  className="..."
>
  <Avatar src={company.avatarUrl} />
  {!isCollapsed && <span>{company.name}</span>}
</a>
```

### 5. Root URL Redirect Logic

**Decision**: Client-side redirect using Next.js router + localStorage

**Rationale**:
- Root page (`/`) needs to check localStorage for `lastCompanySlug`
- Server-side redirect not possible (localStorage is client-only)
- Next.js `useRouter().replace()` provides instant client-side redirect
- Fallback to `/companies` if no stored slug or slug is invalid

**Alternatives Considered**:
- **Middleware with cookies**: Requires syncing localStorage to cookies, complex
- **Server component with cookies**: Same issue, cookie/localStorage sync required
- **Loading state then redirect**: Adds unnecessary delay

**Implementation Pattern**:
```tsx
// app/page.tsx (root page)
'use client';
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const lastSlug = localStorage.getItem('last-company-slug');
    if (lastSlug) {
      router.replace(`/${lastSlug}/projects`);
    } else {
      router.replace('/companies');
    }
  }, [router]);

  return <LoadingSpinner />; // Brief flash during redirect
}
```

### 6. Breadcrumb Placement (Post-Sidebar)

**Decision**: Breadcrumbs in main content area header, not in sidebar

**Rationale**:
- PRD states: "Breadcrumbs appear in the main content area, above page content"
- Breadcrumbs exclude company (company context shown in sidebar)
- Existing Breadcrumbs component can be reused
- Each layout renders breadcrumbs independently based on route context

**Alternatives Considered**:
- **Breadcrumbs in sidebar**: Takes up valuable sidebar space, redundant with nav
- **No breadcrumbs**: Loses hierarchical navigation capability for nested routes
- **Breadcrumbs below sidebar header**: Confusing placement

**Layout Pattern**:
```tsx
// (workspace)/layout.tsx
<div className="flex min-h-screen">
  <Sidebar company={company} />
  <main className="flex-1 flex flex-col">
    <header className="px-6 py-4 border-b">
      <Breadcrumbs items={[...]} />
    </header>
    <div className="flex-1 p-6">
      {children}
    </div>
  </main>
</div>
```

### 7. LocalStorage Key Naming Convention

**Decision**: Prefix with `clementine-` for namespace isolation

**Rationale**:
- Prevents collision with other apps on same domain (dev tools, etc.)
- Clear ownership of stored data
- Easy to clear all app data if needed

**Keys**:
- `clementine-sidebar-collapsed`: boolean string ("true"/"false")
- `clementine-last-company-slug`: string (company slug)

### 8. Hamburger Menu Position (Collapse Toggle)

**Decision**: Fixed position at top-left of sidebar, above company switcher

**Rationale**:
- PRD Option B selected: "Separate hamburger icon above company switcher"
- Toggle stays in same position whether collapsed or expanded (YouTube-style)
- Users always know where to click to toggle
- Hamburger icon (three horizontal lines) is universally recognized

**Implementation**:
```tsx
<aside className="flex flex-col h-screen">
  {/* Toggle - always at top */}
  <button onClick={toggleCollapsed} className="p-4">
    <Menu className="h-6 w-6" />
  </button>

  {/* Company Switcher */}
  <CompanySwitcher company={company} isCollapsed={isCollapsed} />

  {/* Nav Items */}
  <nav className="flex-1">...</nav>

  {/* Logout - anchored to bottom */}
  <SidebarLogout isCollapsed={isCollapsed} />
</aside>
```

### 9. Active Navigation State Detection

**Decision**: Use `usePathname()` with path matching

**Rationale**:
- Next.js `usePathname()` hook provides current path
- Match navigation item paths using `startsWith()` for nested route matching
- Example: `/acme-corp/projects/123` matches `/{slug}/projects` nav item

**Existing Pattern** (from NavTabs.tsx):
```typescript
const pathname = usePathname();
const isActive = pathname.startsWith(`${basePath}${item.href}`);
```

### 10. Logout Implementation

**Decision**: Reuse existing LogoutButton component from 012-company-context

**Rationale**:
- Logout functionality already implemented
- Button triggers Firebase signOut
- Redirects to login page after signout
- Can be styled to fit sidebar (icon + label in expanded, icon only in collapsed)

**Location**: `/web/src/components/shared/LogoutButton.tsx` (or similar)

## Dependencies & Integrations

### Existing Infrastructure (from 012-company-context)

| Component | Location | Usage |
|-----------|----------|-------|
| Company type | `features/companies/types/` | Company data structure with slug |
| getCompanyBySlugAction | `features/companies/actions/` | Validate company slug exists |
| LogoutButton | `components/shared/` | Reuse for sidebar logout |
| Breadcrumbs | `components/shared/` | Reuse in content header |
| Company slug validation | `features/companies/schemas/` | Validate stored slug |

### New Components Required

| Component | Purpose |
|-----------|---------|
| Sidebar | Main sidebar container with collapse animation |
| SidebarContext | React context for collapse state |
| SidebarNav | Navigation items container |
| SidebarNavItem | Individual nav item with active state |
| CompanySwitcher | Company avatar + name, links to /companies |
| SidebarLogout | Logout button styled for sidebar |
| useSidebarState | Hook for localStorage persistence |
| useLastCompany | Hook for last company slug management |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Hydration mismatch with localStorage | Medium | Low | Use null initial state, hydrate on mount |
| Animation jank on slower devices | Low | Low | Use CSS transitions (GPU-accelerated) |
| Invalid stored company slug | Medium | Low | Validate slug on use, fallback to /companies |
| Sidebar overlapping content on resize | Low | Medium | Use proper flex layout with sidebar shrink-0 |

## Conclusion

All research questions resolved. The sidebar implementation will:

1. Use Zustand with persist middleware for state management (collapse state + last company slug)
2. CSS width transitions for smooth YouTube-style collapse animation
3. Icon + small label underneath pattern for collapsed navigation items
4. Click company switcher opens `/companies` in new tab
5. Client-side root redirect based on Zustand store's last company slug
6. Breadcrumbs in main content header (not sidebar)
7. Reuse existing company infrastructure from 012-company-context
8. Sidebar as dedicated feature module at `features/sidebar/`

Ready to proceed to Phase 1: Data Model & Contracts.
