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

Uses **flat route groups** to avoid layout nesting issues. Each context (company, project, event, experience) has its own isolated layout - no stacking of navbars.

```
web/src/app/
├── layout.tsx                                    # Root layout (existing - fonts, Toaster)
├── (workspace)/                                  # Route group for admin area (no layout needed)
│   │
│   ├── page.tsx                                  # Companies list (root /)
│   │
│   ├── (company)/[companySlug]/                  # Company context
│   │   ├── layout.tsx                            # Company navbar (Projects, Exps, Settings)
│   │   ├── page.tsx                              # Redirect to /projects
│   │   ├── projects/page.tsx                     # Projects list (placeholder)
│   │   ├── exps/page.tsx                         # Experiences list (placeholder)
│   │   └── settings/page.tsx                     # Company settings (CompanyForm)
│   │
│   ├── (project)/[companySlug]/[projectId]/      # Project context (NOT nested in company!)
│   │   ├── layout.tsx                            # Project navbar (Events, Distribute, Results)
│   │   ├── page.tsx                              # Redirect to /events
│   │   ├── events/page.tsx                       # Events list (placeholder)
│   │   ├── distribute/page.tsx                   # Distribute (placeholder)
│   │   └── results/page.tsx                      # Results (placeholder)
│   │
│   ├── (event)/[companySlug]/[projectId]/[eventId]/  # Event context
│   │   ├── layout.tsx                            # Event navbar (Experiences, Theme)
│   │   ├── page.tsx                              # Redirect to /experiences
│   │   ├── experiences/page.tsx                  # Experiences (placeholder)
│   │   └── theme/page.tsx                        # Theme (placeholder)
│   │
│   └── (experience)/[companySlug]/exps/[expId]/  # Experience context
│       ├── layout.tsx                            # Experience navbar (breadcrumbs only)
│       └── page.tsx                              # Experience editor (placeholder)
│
└── (public)/                                     # Unchanged
    └── join/[eventId]/
```

### Route Matching

| URL | Route Group | Layout |
|-----|-------------|--------|
| `/` | `(workspace)/page.tsx` | Companies list (no navbar) |
| `/acme-corp` | `(company)/[companySlug]` | Company navbar |
| `/acme-corp/projects` | `(company)/[companySlug]/projects` | Company navbar |
| `/acme-corp/proj123` | `(project)/[companySlug]/[projectId]` | Project navbar only |
| `/acme-corp/proj123/events` | `(project)/[companySlug]/[projectId]/events` | Project navbar only |
| `/acme-corp/proj123/evt456` | `(event)/[companySlug]/[projectId]/[eventId]` | Event navbar only |
| `/acme-corp/exps/exp789` | `(experience)/[companySlug]/exps/[expId]` | Experience navbar only |

**Key insight**: Route groups `(company)`, `(project)`, `(event)`, `(experience)` break layout inheritance - each context renders only its own navbar.

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
9. `app/(workspace)/(company)/[companySlug]/layout.tsx` - Company navbar
10. `app/(workspace)/(project)/[companySlug]/[projectId]/layout.tsx` - Project navbar
11. `app/(workspace)/(event)/[companySlug]/[projectId]/[eventId]/layout.tsx` - Event navbar
12. `app/(workspace)/(experience)/[companySlug]/exps/[expId]/layout.tsx` - Experience navbar

### Phase 0d: Pages
13. `app/(workspace)/page.tsx` - Companies list
14. `app/(workspace)/(company)/[companySlug]/page.tsx` - Redirect to projects
15. `app/(workspace)/(company)/[companySlug]/projects/page.tsx` - Projects placeholder
16. `app/(workspace)/(company)/[companySlug]/exps/page.tsx` - Experiences placeholder
17. `app/(workspace)/(company)/[companySlug]/settings/page.tsx` - Settings with CompanyForm
18. `app/(workspace)/(project)/[companySlug]/[projectId]/page.tsx` - Redirect
19. `app/(workspace)/(project)/[companySlug]/[projectId]/events/page.tsx` - Placeholder
20. `app/(workspace)/(project)/[companySlug]/[projectId]/distribute/page.tsx` - Placeholder
21. `app/(workspace)/(project)/[companySlug]/[projectId]/results/page.tsx` - Placeholder
22. `app/(workspace)/(event)/[companySlug]/[projectId]/[eventId]/page.tsx` - Redirect
23. `app/(workspace)/(event)/[companySlug]/[projectId]/[eventId]/experiences/page.tsx` - Placeholder
24. `app/(workspace)/(event)/[companySlug]/[projectId]/[eventId]/theme/page.tsx` - Placeholder
25. `app/(workspace)/(experience)/[companySlug]/exps/[expId]/page.tsx` - Placeholder

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
- `app/(workspace)/page.tsx`
- `app/(workspace)/(company)/[companySlug]/layout.tsx`
- `app/(workspace)/(company)/[companySlug]/page.tsx`
- `app/(workspace)/(company)/[companySlug]/projects/page.tsx`
- `app/(workspace)/(company)/[companySlug]/exps/page.tsx`
- `app/(workspace)/(company)/[companySlug]/settings/page.tsx`
- `app/(workspace)/(project)/[companySlug]/[projectId]/layout.tsx`
- `app/(workspace)/(project)/[companySlug]/[projectId]/page.tsx`
- `app/(workspace)/(project)/[companySlug]/[projectId]/events/page.tsx`
- `app/(workspace)/(project)/[companySlug]/[projectId]/distribute/page.tsx`
- `app/(workspace)/(project)/[companySlug]/[projectId]/results/page.tsx`
- `app/(workspace)/(event)/[companySlug]/[projectId]/[eventId]/layout.tsx`
- `app/(workspace)/(event)/[companySlug]/[projectId]/[eventId]/page.tsx`
- `app/(workspace)/(event)/[companySlug]/[projectId]/[eventId]/experiences/page.tsx`
- `app/(workspace)/(event)/[companySlug]/[projectId]/[eventId]/theme/page.tsx`
- `app/(workspace)/(experience)/[companySlug]/exps/[expId]/layout.tsx`
- `app/(workspace)/(experience)/[companySlug]/exps/[expId]/page.tsx`

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

1. **Flat route groups (Option D)** - Use `(company)`, `(project)`, `(event)`, `(experience)` route groups to break layout inheritance. Each context has isolated layout - no navbar stacking.
2. **No `(workspace)` layout** - Root `app/layout.tsx` already provides shell (fonts, Toaster). No additional wrapper needed.
3. **Reuse `EditorBreadcrumbs`** - No need for new breadcrumb component
4. **Generic `AppNavbar`** - Single component for all contexts, configured via props
5. **Slug auto-generation** - If not provided, generate from name
6. **Display-only last breadcrumb** - No edit dialogs in breadcrumbs
7. **Settings uses existing `CompanyForm`** - Full edit capability
8. **Keep old `(admin)` routes** - Both route groups coexist; cleanup in later phase
9. **Use `[companySlug]`** - Specific param names for clarity (vs generic `[slug]`)
10. **Slug utilities in `lib/utils/`** - General-purpose, not company-specific
11. **Route precedence** - Static routes (projects, exps, settings) take precedence over dynamic `[projectId]`. Accepted limitation.
12. **Authentication** - Existing `proxy.ts` middleware handles auth; new routes protected by default

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
