# Quickstart: Sidebar Navigation System

**Feature**: 013-sidebar-nav
**Date**: 2025-12-02

## Prerequisites

- Node.js 18+
- pnpm 8+
- Firebase project configured (for existing company data)
- Branch `012-company-context` merged (company slug routing)

## Setup

```bash
# Clone and checkout feature branch
git checkout 013-sidebar-nav

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Key Files to Create/Modify

### New Feature Module (in order of implementation)

1. **Zustand Store** - `web/src/features/sidebar/stores/sidebar.store.ts`
   - Combined state for collapse + last company slug
   - Persist middleware handles localStorage automatically

2. **Types** - `web/src/features/sidebar/types/sidebar.types.ts`
   - NavigationItem, SidebarStore interfaces

3. **Constants** - `web/src/features/sidebar/constants.ts`
   - Navigation items configuration (Projects, Experiences, etc.)

4. **Sidebar Components**:
   - `web/src/features/sidebar/components/Sidebar.tsx` - Main container
   - `web/src/features/sidebar/components/SidebarNavItem.tsx` - Nav item
   - `web/src/features/sidebar/components/SidebarNav.tsx` - Nav items list
   - `web/src/features/sidebar/components/CompanySwitcher.tsx` - Company display
   - `web/src/features/sidebar/components/SidebarLogout.tsx` - Logout button
   - `web/src/features/sidebar/components/index.ts` - Barrel export

5. **Feature Entry** - `web/src/features/sidebar/index.ts`
   - Public API (exports components, store hook, types)

### Routes to Modify

1. **Root Page** - `web/src/app/page.tsx`
   - Add client-side redirect logic (check lastCompanySlug)

2. **Workspace Layout** - `web/src/app/(workspace)/layout.tsx`
   - Add SidebarProvider
   - Add Sidebar component

3. **Company Layout** - `web/src/app/(workspace)/(company)/[companySlug]/layout.tsx`
   - Remove AppNavbar (replaced by sidebar)
   - Add breadcrumbs in content header
   - Store last company slug on load

4. **Companies Page** - `web/src/app/(workspace)/companies/page.tsx` (NEW)
   - Move company list from `(workspace)/page.tsx`

5. **Analytics Page** - `web/src/app/(workspace)/(company)/[companySlug]/analytics/page.tsx` (NEW)
   - Placeholder "Coming Soon" page

## Implementation Order

### Phase 1: Foundation
1. Install Zustand: `pnpm add zustand`
2. Create sidebar types (`features/sidebar/types/`)
3. Create Zustand store with persist (`features/sidebar/stores/`)
4. Create navigation constants (`features/sidebar/constants.ts`)

### Phase 2: Components
5. Create SidebarNavItem component
6. Create SidebarNav component
7. Create CompanySwitcher component
8. Create SidebarLogout component
9. Create main Sidebar component
10. Create barrel exports and feature index

### Phase 3: Layout Integration
11. Update workspace layout (add Sidebar)
12. Update company layout (remove AppNavbar, integrate with sidebar)
13. Update breadcrumbs in content area

### Phase 4: Routing
14. Create /companies page
15. Add root redirect logic (read from Zustand store)
16. Create analytics placeholder page
17. Update last company slug on company navigation

### Phase 5: Polish
18. Add collapse/expand CSS animation
19. Add tooltips for collapsed state
20. Test persistence across sessions

## Component Usage

### Sidebar in Layout

```tsx
// (workspace)/layout.tsx
import { Sidebar } from '@/features/sidebar';

export default function WorkspaceLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar company={company} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

### Using the Store

```tsx
// Any component
import { useSidebarStore } from '@/features/sidebar';

function MyComponent() {
  // Get state and actions
  const { isCollapsed, toggleCollapsed } = useSidebarStore();

  // Or use selectors for granular subscriptions
  const lastSlug = useSidebarStore((s) => s.lastCompanySlug);
  const setLastSlug = useSidebarStore((s) => s.setLastCompanySlug);

  return <button onClick={toggleCollapsed}>Toggle</button>;
}
```

### Breadcrumbs in Content Area

```tsx
// (company)/[companySlug]/layout.tsx
import { Breadcrumbs } from '@/components/shared';

export default function CompanyLayout({ children, params }) {
  const company = await getCompanyBySlugAction(params.companySlug);

  return (
    <>
      <header className="px-6 py-4 border-b">
        <Breadcrumbs
          items={[
            { label: '🍊', href: '/', isLogo: true },
            { label: company.name },
          ]}
        />
      </header>
      <div className="p-6">{children}</div>
    </>
  );
}
```

## Testing

```bash
# Run type checking
pnpm type-check

# Run linter
pnpm lint

# Run tests (once created)
pnpm test

# Build for production
pnpm build
```

## Manual Testing Checklist

- [ ] Sidebar renders in expanded state by default
- [ ] Click hamburger toggles collapse/expand
- [ ] Collapse state persists after page refresh
- [ ] Navigation items navigate to correct routes
- [ ] Active item highlighted based on current route
- [ ] Company switcher shows company name (expanded) / avatar (collapsed)
- [ ] Clicking company switcher opens /companies in new tab
- [ ] Logout button logs user out
- [ ] Root URL `/` redirects to last company or /companies
- [ ] Breadcrumbs show correct hierarchy (no company name)
- [ ] Analytics nav item is disabled (grayed out)

## Troubleshooting

### Hydration Mismatch

If you see hydration errors, Zustand's persist middleware should handle this automatically. If issues persist:
- Check that components using `useSidebarStore` are client components (`'use client'`)
- Zustand's `onRehydrateStorage` callback runs after hydration

### Sidebar Not Persisting

Check browser localStorage:
```javascript
// Zustand stores state as JSON under single key
localStorage.getItem('clementine-sidebar')
// Expected format: {"state":{"isCollapsed":false,"lastCompanySlug":"acme-corp"},"version":0}
```

### Company Slug Redirect Loop

If redirect loops on root:
1. Clear Zustand storage: `localStorage.removeItem('clementine-sidebar')`
2. Check if stored slug matches existing company
3. Verify `getCompanyBySlugAction` returns valid result
4. Check that `clearLastCompanySlug()` is called on invalid slugs
