# Research: Company Context Architecture

**Feature**: 012-company-context
**Date**: 2025-12-01
**Status**: Complete

## Research Tasks

### 1. Company Feature Module Pattern

**Decision**: Extend existing `features/companies/` module structure

**Rationale**: The existing module follows the established vertical slice architecture with:
- `actions/` - Server actions with auth verification
- `repositories/` - Firestore CRUD operations
- `schemas/` - Zod validation
- `types/` - TypeScript definitions
- `components/` - UI components
- `constants.ts` - Validation constraints

**Alternatives Considered**:
- Create new `features/company-context/` module → Rejected: Slug is a property of Company, not a separate domain
- Add to global `lib/` → Rejected: Violates feature-module architecture principle

**Key Files**:
- `web/src/features/companies/constants.ts` - Add SLUG_LENGTH, SLUG_PATTERN
- `web/src/features/companies/types/companies.types.ts` - Add `slug` field
- `web/src/features/companies/schemas/companies.schemas.ts` - Add slug validation
- `web/src/features/companies/repositories/companies.repository.ts` - Add `getCompanyBySlug()`
- `web/src/features/companies/actions/companies.actions.ts` - Add `getCompanyBySlugAction()`

### 2. Navigation Component Patterns

**Decision**: Create reusable `NavTabs` and `AppNavbar` components following existing patterns

**Rationale**: The codebase already has:
- `EditorBreadcrumbs` - Breadcrumb navigation with ChevronRight separator
- `EventTabs` - Context-specific tabs using `usePathname()` for active detection
- `TabLink` - Individual tab link component

**Implementation Pattern**:
```typescript
// NavTabs - Generic tab navigation (follows EventTabs pattern)
interface TabItem {
  label: string;
  href: string; // Relative to basePath
}

interface NavTabsProps {
  tabs: TabItem[];
  basePath: string;
}

// AppNavbar - Combined breadcrumbs + tabs
interface AppNavbarProps {
  breadcrumbs: BreadcrumbItem[];
  tabs?: TabItem[];
  basePath?: string;
  actions?: React.ReactNode;
}
```

**Alternatives Considered**:
- Reuse EventTabs directly → Rejected: Hardcoded to event context
- Create per-context tab components → Rejected: Unnecessary duplication

### 3. Route Structure: Flat Route Groups

**Decision**: Use flat route groups `(company)`, `(project)`, `(event)`, `(experience)` within `(workspace)`

**Rationale**:
- Next.js App Router inherits layouts from parent segments
- Nested routes would cause layout stacking (multiple navbars)
- Route groups (parentheses) create organizational boundaries without affecting URLs

**Route Group Behavior**:
```text
URL: /acme-corp/projects
Matches: (workspace)/(company)/[companySlug]/projects/page.tsx
Layout: (workspace)/(company)/[companySlug]/layout.tsx ONLY

URL: /acme-corp/proj123/events
Matches: (workspace)/(project)/[companySlug]/[projectId]/events/page.tsx
Layout: (workspace)/(project)/[companySlug]/[projectId]/layout.tsx ONLY
```

**Alternatives Considered**:
- Nested route structure → Rejected: Causes layout inheritance/stacking
- Parallel routes with `@` syntax → Rejected: Overcomplicated for this use case
- Intercepting routes → Rejected: Not applicable (no modal patterns needed)

### 4. Slug Generation & Validation

**Decision**: Create `lib/utils/slug.ts` utility with deterministic slug generation

**Rationale**:
- Slugs are general-purpose (may be used for Projects, Events in future)
- Placing in `lib/utils/` makes it reusable across features
- Follows existing utility patterns (`lib/utils.ts` for cn() function)

**Implementation**:
```typescript
// slug.ts
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
    .substring(0, 50);             // Enforce max length
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(slug)
    && slug.length >= 1
    && slug.length <= 50;
}
```

**Alternatives Considered**:
- Use npm package (slugify) → Rejected: Simple enough to implement, avoids dependency
- Put in companies feature → Rejected: Slug utility is general-purpose

### 5. Slug Uniqueness Validation

**Decision**: Server-side uniqueness check in repository using Firestore query

**Rationale**:
- Uniqueness must be enforced server-side (client can't be trusted)
- Firestore query: `where('slug', '==', slug).limit(1)`
- Check on create AND update (exclude current company ID on update)

**Implementation Pattern**:
```typescript
// In companies.repository.ts
export async function isSlugAvailable(
  slug: string,
  excludeCompanyId?: string
): Promise<boolean> {
  const query = db.collection('companies')
    .where('slug', '==', slug)
    .where('status', '==', 'active')
    .limit(1);

  const snapshot = await query.get();

  if (snapshot.empty) return true;
  if (excludeCompanyId && snapshot.docs[0].id === excludeCompanyId) return true;

  return false;
}
```

**Alternatives Considered**:
- Firestore unique constraint → Not available in Firestore
- Transaction-based check → Used for create, adds complexity for updates

### 6. Breadcrumb Separator Change

**Decision**: Rename `EditorBreadcrumbs` to `Breadcrumbs` and change separator from ChevronRight to `/`

**Rationale**:
- PRD specifies "/" separator for cleaner look
- EditorBreadcrumbs name is too specific (not just for editors)
- Same component interface, just visual change

**Implementation**:
```tsx
// Before: 🍊 Events > Event Name
// After:  🍊 / Acme Corp / Project Name

// Change separator from:
<ChevronRight className="h-4 w-4 text-muted-foreground" />
// To:
<span className="text-muted-foreground">/</span>
```

### 7. Projects Entity Dependency

**Decision**: Use placeholder "Coming Soon" pages for Project-related routes

**Rationale**:
- Projects entity doesn't exist yet in the data model
- Phase 0 focuses on Company context and navigation architecture
- Project, Event, Experience contexts demonstrate the navigation pattern
- Actual entity fetching will be implemented when entities are created

**Placeholder Pattern**:
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

### 8. Authentication & Authorization

**Decision**: Rely on existing `proxy.ts` middleware for authentication

**Rationale**:
- Existing middleware handles admin authentication
- New `(workspace)` routes will be protected by same middleware
- No changes needed to auth system

**Key Files**:
- Existing auth middleware continues to protect all admin routes
- Server actions verify admin via `verifyAdminSecret()`

### 9. Old Routes Coexistence

**Decision**: Keep existing `(admin)` routes operational during transition

**Rationale**:
- Gradual migration reduces risk
- Existing functionality continues working
- Cleanup can happen in later phase

**Structure**:
```text
app/
├── (workspace)/  # NEW: Company-centric routes
│   └── ...
└── (admin)/      # EXISTING: ID-based routes (kept)
    └── ...
```

## Resolved Clarifications

All technical aspects are resolved:
1. ✅ Slug generation algorithm defined
2. ✅ Uniqueness validation approach chosen
3. ✅ Route structure decided (flat route groups)
4. ✅ Navigation component patterns established
5. ✅ Placeholder strategy for unimplemented features
6. ✅ Auth approach confirmed (existing middleware)
7. ✅ Migration strategy (coexistence)
