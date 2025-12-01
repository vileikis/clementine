# Phase 0: Company Context - PRD

## Overview

Transform Clementine from a flat admin structure into a company-centric multi-tenant architecture where all work happens "inside a selected company".

### Key Outcomes
- Company as top-level context for all entities
- URL-friendly company slugs (e.g., `/acme-corp` instead of `/abc123`)
- Reusable navigation bar with breadcrumbs + tabs
- Clear multi-tenant structure

---

## 1. Routing Structure

### Next.js App Router Layout

```
web/src/app/
├── (workspace)/                            # Route group for admin area
│   ├── layout.tsx                          # Minimal shell (Toaster)
│   ├── page.tsx                            # Companies list (root)
│   │
│   └── [companySlug]/                      # Dynamic company segment
│       ├── layout.tsx                      # Company layout + navbar
│       ├── page.tsx                        # Redirect to /projects
│       ├── projects/
│       │   └── page.tsx                    # Projects list (placeholder)
│       ├── exps/
│       │   ├── page.tsx                    # Experiences list (placeholder)
│       │   └── [expId]/
│       │       └── page.tsx                # Experience editor (placeholder)
│       ├── settings/
│       │   └── page.tsx                    # Company settings (CompanyForm)
│       │
│       └── [projectId]/                    # Dynamic project segment
│           ├── layout.tsx                  # Project layout
│           ├── page.tsx                    # Redirect to /events
│           ├── events/
│           │   └── page.tsx                # Events list (placeholder)
│           ├── distribute/
│           │   └── page.tsx                # Distribute (placeholder)
│           ├── results/
│           │   └── page.tsx                # Results (placeholder)
│           │
│           └── [eventId]/                  # Dynamic event segment
│               ├── layout.tsx              # Event layout
│               ├── page.tsx                # Redirect to /experiences
│               ├── experiences/
│               │   └── page.tsx            # Experiences (placeholder)
│               └── theme/
│                   └── page.tsx            # Theme (placeholder)
│
└── (public)/                               # Unchanged
    └── join/[eventId]/
```

---

## 2. Schema Update: Add `slug` to Company

### Files to Modify

**`features/companies/constants.ts`**
```ts
export const COMPANY_CONSTRAINTS = {
  NAME_LENGTH: { min: 1, max: 100 },
  SLUG_LENGTH: { min: 1, max: 50 },
  SLUG_PATTERN: /^[a-z0-9-]+$/,
} as const;
```

**`features/companies/types/companies.types.ts`**
```ts
export interface Company {
  id: string;
  name: string;
  slug: string;  // NEW
  status: CompanyStatus;
  // ... rest unchanged
}
```

**`features/companies/schemas/companies.schemas.ts`**
- Add `slug` field with validation
- Make slug optional in `createCompanyInput` (auto-generate if not provided)

**New: `lib/utils/slug.ts`** (general-purpose utility)
```ts
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}
```

**`features/companies/repositories/companies.repository.ts`**
- Add `getCompanyBySlug(slug: string)` query
- Update `createCompany` to generate slug if not provided
- Add slug uniqueness validation

**`features/companies/actions/companies.actions.ts`**
- Add `getCompanyBySlugAction(slug: string)`

---

## 3. Navigation Components

### Reuse Existing `EditorBreadcrumbs`

The existing `components/shared/EditorBreadcrumbs.tsx` is a generic breadcrumb component that accepts `BreadcrumbItem[]`. We'll reuse it directly.

### New: `AppNavbar` Component

Create in `components/shared/AppNavbar.tsx`:

```tsx
interface AppNavbarProps {
  breadcrumbs: BreadcrumbItem[];
  tabs?: TabItem[];
  basePath?: string;
  actions?: React.ReactNode;
}
```

Two-row layout:
- Row 1: Breadcrumbs (using EditorBreadcrumbs)
- Row 2: Tabs (context-dependent, optional)

### New: `NavTabs` Component

Create in `components/shared/NavTabs.tsx`:

Client component using `usePathname()` for active state. Follows pattern from existing `EventTabs.tsx`.

### Tab Configurations by Context

| Context | Tabs |
|---------|------|
| Company workspace | Projects, Experiences, Settings |
| Project editor | Events, Distribute, Results |
| Event editor | Experiences, Theme |
| Experience editor | (no tabs) |

### Breadcrumb Patterns

| Route | Breadcrumbs |
|-------|-------------|
| `/` | `[🍊]` |
| `/acme-corp` | `[🍊] / Acme Corp` |
| `/acme-corp/proj123` | `[🍊] / Acme Corp / Project Name` |
| `/acme-corp/proj123/evt456` | `[🍊] / Acme Corp / Project Name / Event Name` |
| `/acme-corp/exps/exp789` | `[🍊] / Acme Corp / experiences / Experience Name` |

Last item is display-only (no link, no edit dialog).

---

## 4. Implementation Order

### Phase 0a: Schema & Data Layer
1. `lib/utils/slug.ts` - Slug utilities (new file, general-purpose)
2. `features/companies/constants.ts` - Add slug constraints
3. `features/companies/types/companies.types.ts` - Add slug field
4. `features/companies/schemas/companies.schemas.ts` - Add slug validation
5. `features/companies/repositories/companies.repository.ts` - Add getBySlug
6. `features/companies/actions/companies.actions.ts` - Add getBySlugAction

### Phase 0b: Navigation Components
7. `components/shared/NavTabs.tsx` - Tab component (new file)
8. `components/shared/AppNavbar.tsx` - Combined navbar (new file)

### Phase 0c: App Structure (Layouts)
9. `app/(workspace)/layout.tsx` - Workspace shell
10. `app/(workspace)/[companySlug]/layout.tsx` - Company layout with navbar
11. `app/(workspace)/[companySlug]/[projectId]/layout.tsx` - Project layout
12. `app/(workspace)/[companySlug]/[projectId]/[eventId]/layout.tsx` - Event layout

### Phase 0d: Pages
13. `app/(workspace)/page.tsx` - Companies list
14. `app/(workspace)/[companySlug]/page.tsx` - Redirect to projects
15. `app/(workspace)/[companySlug]/projects/page.tsx` - Projects placeholder
16. `app/(workspace)/[companySlug]/exps/page.tsx` - Experiences placeholder
17. `app/(workspace)/[companySlug]/exps/[expId]/page.tsx` - Experience placeholder
18. `app/(workspace)/[companySlug]/settings/page.tsx` - Settings with CompanyForm
19. `app/(workspace)/[companySlug]/[projectId]/page.tsx` - Redirect
20. `app/(workspace)/[companySlug]/[projectId]/events/page.tsx` - Placeholder
21. `app/(workspace)/[companySlug]/[projectId]/distribute/page.tsx` - Placeholder
22. `app/(workspace)/[companySlug]/[projectId]/results/page.tsx` - Placeholder
23. `app/(workspace)/[companySlug]/[projectId]/[eventId]/page.tsx` - Redirect
24. `app/(workspace)/[companySlug]/[projectId]/[eventId]/experiences/page.tsx` - Placeholder
25. `app/(workspace)/[companySlug]/[projectId]/[eventId]/theme/page.tsx` - Placeholder

### Phase 0e: Form Updates
26. `features/companies/components/CompanyForm.tsx` - Add slug input
27. `features/companies/components/CompanyCard.tsx` - Link uses slug
28. `app/page.tsx` - Update redirect

---

## 5. Files Summary

### New Files (20)
- `lib/utils/slug.ts`
- `components/shared/NavTabs.tsx`
- `components/shared/AppNavbar.tsx`
- `app/(workspace)/layout.tsx`
- `app/(workspace)/page.tsx`
- `app/(workspace)/[companySlug]/layout.tsx`
- `app/(workspace)/[companySlug]/page.tsx`
- `app/(workspace)/[companySlug]/projects/page.tsx`
- `app/(workspace)/[companySlug]/exps/page.tsx`
- `app/(workspace)/[companySlug]/exps/[expId]/page.tsx`
- `app/(workspace)/[companySlug]/settings/page.tsx`
- `app/(workspace)/[companySlug]/[projectId]/layout.tsx`
- `app/(workspace)/[companySlug]/[projectId]/page.tsx`
- `app/(workspace)/[companySlug]/[projectId]/events/page.tsx`
- `app/(workspace)/[companySlug]/[projectId]/distribute/page.tsx`
- `app/(workspace)/[companySlug]/[projectId]/results/page.tsx`
- `app/(workspace)/[companySlug]/[projectId]/[eventId]/layout.tsx`
- `app/(workspace)/[companySlug]/[projectId]/[eventId]/page.tsx`
- `app/(workspace)/[companySlug]/[projectId]/[eventId]/experiences/page.tsx`
- `app/(workspace)/[companySlug]/[projectId]/[eventId]/theme/page.tsx`

### Modified Files (7)
- `features/companies/constants.ts`
- `features/companies/types/companies.types.ts`
- `features/companies/schemas/companies.schemas.ts`
- `features/companies/repositories/companies.repository.ts`
- `features/companies/actions/companies.actions.ts`
- `features/companies/components/CompanyForm.tsx`
- `features/companies/components/CompanyCard.tsx`

### Reference Files (patterns to follow)
- `app/(admin)/events/[eventId]/layout.tsx` - Layout with navbar pattern
- `features/events/components/shared/EventTabs.tsx` - Tab component pattern
- `components/shared/EditorBreadcrumbs.tsx` - Reuse directly

---

## 6. Key Design Decisions

1. **Route group `(workspace)`** - Cleaner than nested `(admin)/(dashboard)`
2. **Reuse `EditorBreadcrumbs`** - No need for new breadcrumb component
3. **Generic `AppNavbar`** - Single component for all contexts, configured via props
4. **Slug auto-generation** - If not provided, generate from name
5. **Display-only last breadcrumb** - No edit dialogs in breadcrumbs
6. **Settings uses existing `CompanyForm`** - Full edit capability
7. **Keep old `(admin)` routes** - Both route groups coexist; cleanup in later phase
8. **Use `[companySlug]`** - Specific param names for clarity (vs generic `[slug]`)
9. **Slug utilities in `lib/utils/`** - General-purpose, not company-specific
10. **Route precedence** - Static routes (projects, exps, settings) take precedence over dynamic `[projectId]`. This is accepted; IDs matching static routes won't be reachable.
11. **Authentication** - Existing `proxy.ts` middleware handles auth; new routes protected by default

---

## 7. Placeholder Page Template

For pages that are placeholders:

```tsx
export default function PlaceholderPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-muted-foreground">
          Coming Soon
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          This feature is under development.
        </p>
      </div>
    </div>
  );
}
```
