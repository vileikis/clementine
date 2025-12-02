# Research: Router Simplification

**Feature Branch**: `014-router-simplify`
**Date**: 2024-12-02
**Status**: Complete

## Research Questions

### 1. Current Route Group Structure

**Decision**: 4 duplicate route groups exist, each with nearly identical layout logic.

**Current Structure**:
```
web/src/app/(workspace)/
├── (company)/[companySlug]/         # Layout fetches company, renders Sidebar
│   ├── layout.tsx
│   ├── page.tsx (dashboard)
│   ├── projects/page.tsx
│   ├── exps/page.tsx
│   ├── settings/page.tsx
│   └── analytics/page.tsx
├── (project)/[companySlug]/[projectId]/    # Layout fetches company, renders Sidebar + breadcrumbs
│   ├── layout.tsx
│   ├── page.tsx
│   ├── events/page.tsx
│   ├── results/page.tsx
│   └── distribute/page.tsx
├── (event)/[companySlug]/[projectId]/[eventId]/   # Layout fetches company, renders Sidebar + breadcrumbs
│   ├── layout.tsx
│   ├── page.tsx
│   ├── experiences/page.tsx
│   └── theme/page.tsx
├── (experience)/[companySlug]/exps/[expId]/   # Layout fetches company, renders Sidebar + breadcrumbs
│   ├── layout.tsx
│   └── page.tsx
└── companies/page.tsx
```

**Rationale**: Each route group provides the same structure:
1. Fetch company by slug
2. Validate company exists (or 404)
3. Render `<Sidebar company={company} />`
4. Render `<LastCompanyUpdater />`
5. Render children (with optional ContentHeader for nested routes)

**Alternatives Considered**:
- Keep separate layouts but extract shared logic → Still requires 4 layout files
- Use middleware for company fetch → Not recommended for server components in App Router

---

### 2. Duplicate Layout Code Analysis

**Decision**: All 4 layouts share ~80% identical code.

**Common Pattern in All Layouts**:
```tsx
const result = await getCompanyBySlugAction(companySlug);
if (!result.success || !result.company) {
  notFound();
}
const company = result.company;

return (
  <div className="flex h-screen">
    <Sidebar company={company} />
    <main className="...">
      {/* Only difference: ContentHeader with different breadcrumbs */}
      {children}
    </main>
    <LastCompanyUpdater companySlug={companySlug} />
  </div>
);
```

**Key Differences**:
| Route Group | Has ContentHeader | Breadcrumb Pattern |
|------------|-------------------|-------------------|
| Company | No | N/A |
| Project | Yes | `Projects > {projectName}` |
| Event | Yes | `Projects > {projectName} > {eventName}` |
| Experience | Yes | `Experiences > {experienceName}` |

**Rationale**: The only meaningful difference is the breadcrumb content, which can be page-specific instead of layout-specific.

---

### 3. Existing Breadcrumb Implementation

**Decision**: Reuse existing `Breadcrumbs` and `ContentHeader` components as-is.

**Current Components**:

1. **`Breadcrumbs`** (`web/src/components/shared/Breadcrumbs.tsx`):
   ```tsx
   interface BreadcrumbItem {
     label: string;
     href?: string;
     isLogo?: boolean;
   }
   ```
   - Renders "/" separated navigation
   - Last item is non-clickable (current page)
   - Supports logo-sized items

2. **`ContentHeader`** (`web/src/features/sidebar/components/ContentHeader.tsx`):
   - Wraps Breadcrumbs in a header with border-b and padding
   - Accepts `breadcrumbs: BreadcrumbItem[]`

**Rationale**: Components are well-designed and don't need changes. Only the location of breadcrumb construction needs to move from layouts to pages.

---

### 4. Sidebar Component Requirements

**Decision**: Sidebar requires minimal company data: `{ id, name, slug }`.

**Sidebar Props**:
```tsx
interface SidebarProps {
  company: {
    id: string;
    name: string;
    slug: string;
  };
}
```

**Sub-components**:
- `CompanySwitcher`: Uses company name and navigation
- `SidebarNav`: Uses `basePath={/${company.slug}}`
- `SidebarLogout`: No company data needed

**Rationale**: The unified layout only needs to fetch and pass these 3 fields. Full company data isn't required.

---

### 5. Server Actions for Entity Fetching

**Decision**: Use existing server actions; Projects feature needs to be considered.

**Available Actions**:

| Entity | Action | File |
|--------|--------|------|
| Company | `getCompanyBySlugAction(slug)` | `features/companies/actions/companies.actions.ts` |
| Event | `getEventAction(eventId)` | `features/events/actions/events.ts` |
| Experience | `listExperiencesByEventAction(eventId)` | `features/experiences/actions/list.ts` |

**Missing**:
- **Projects feature**: Does not exist yet. Current layouts use placeholder: `Project ${projectId}`
- **Experience by ID**: Only list action exists, no `getExperienceAction(expId)`

**Rationale**: Pages will need to fetch their own entity data for breadcrumbs. Missing server actions can be added as needed or use placeholders initially.

---

### 6. Projects Feature Status

**Decision**: Projects feature does not exist; use placeholder or skip breadcrumb for now.

**Research**:
- No `web/src/features/projects/` directory
- No `getProjectAction` or similar server actions
- Current layouts already use placeholder: `Project ${projectId}`

**Rationale**: Two options for project breadcrumbs:
1. Continue using `Project ${projectId}` placeholder (consistent with current behavior)
2. Add minimal `getProjectAction` if projects are stored in Firestore

**Recommendation**: Keep placeholder for now; add proper fetching when Projects feature is built.

---

### 7. Next.js App Router Best Practices

**Decision**: Single layout at route segment root is the recommended pattern.

**Best Practices Applied**:
1. **Single layout per segment**: Layout at `[companySlug]/layout.tsx` is the idiomatic pattern
2. **Route groups for organization only**: Use `(workspace)` for organization, not multiple layouts
3. **Server Component layouts**: Keep layouts as server components for data fetching
4. **Request deduplication**: Next.js automatically deduplicates identical fetch requests

**Rationale**: The proposed structure follows Next.js recommended patterns and will benefit from built-in request deduplication.

---

### 8. Mobile Breadcrumb Handling

**Decision**: Existing Breadcrumbs component may need overflow handling for mobile.

**Current Behavior**:
- No explicit overflow handling
- Long breadcrumbs will wrap or overflow

**Recommendations**:
1. Add `overflow-x-auto` or `overflow-hidden text-ellipsis` for mobile
2. Consider collapsing middle segments on very long paths (future enhancement)
3. Touch target compliance: Current links don't specify minimum size

**Rationale**: Mobile-first design requires graceful handling of long breadcrumb trails. This can be addressed in the Breadcrumbs component or via Tailwind classes.

---

## Summary

All research questions resolved. No clarifications needed. Ready for Phase 1 design.

### Key Decisions

1. **Layout consolidation**: Merge 4 layouts into 1 at `[companySlug]/layout.tsx`
2. **Page-based breadcrumbs**: Each page constructs its own breadcrumbs using a helper
3. **Breadcrumb helper location**: `lib/breadcrumbs.ts` (cross-cutting utility)
4. **Existing components**: Reuse `Breadcrumbs` and `ContentHeader` as-is
5. **Entity fetching**: Pages fetch their own data; use placeholders for Projects
6. **Mobile handling**: Add overflow handling to breadcrumbs for mobile viewports
