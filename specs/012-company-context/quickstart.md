# Quickstart: Company Context Architecture

**Feature**: 012-company-context
**Date**: 2025-12-01

## Prerequisites

- Node.js 18+
- pnpm installed globally
- Firebase project configured (existing setup)

## Setup

```bash
# Clone and install (if not already)
cd /Users/iggyvileikis/Projects/@attempt-n2/clementine
pnpm install

# Start development server
pnpm dev
```

## Development Workflow

### 1. Schema & Data Layer (Phase 0a)

Start with the data foundation:

```bash
# Files to modify/create:
web/src/lib/utils/slug.ts              # NEW - Slug utilities
web/src/features/companies/constants.ts # ADD slug constraints
web/src/features/companies/types/companies.types.ts    # ADD slug field
web/src/features/companies/schemas/companies.schemas.ts # ADD slug validation
web/src/features/companies/repositories/companies.repository.ts # ADD getBySlug
web/src/features/companies/actions/companies.actions.ts # ADD getBySlugAction
```

**Validation after Phase 0a**:
```bash
pnpm type-check
pnpm lint
```

### 2. Navigation Components (Phase 0b)

Create reusable navigation:

```bash
# Files to create/modify:
web/src/components/shared/Breadcrumbs.tsx  # RENAME from EditorBreadcrumbs
web/src/components/shared/NavTabs.tsx      # NEW
web/src/components/shared/AppNavbar.tsx    # NEW
```

**Validation after Phase 0b**:
```bash
pnpm type-check
pnpm lint
```

### 3. Route Structure (Phase 0c)

Create layout files for each context:

```bash
# Directory structure:
web/src/app/(workspace)/
├── page.tsx                                    # Companies list
├── (company)/[companySlug]/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── projects/page.tsx
│   ├── exps/page.tsx
│   └── settings/page.tsx
├── (project)/[companySlug]/[projectId]/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── events/page.tsx
│   ├── distribute/page.tsx
│   └── results/page.tsx
├── (event)/[companySlug]/[projectId]/[eventId]/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── experiences/page.tsx
│   └── theme/page.tsx
└── (experience)/[companySlug]/exps/[expId]/
    ├── layout.tsx
    └── page.tsx
```

**Validation after Phase 0c**:
```bash
pnpm type-check
pnpm lint
pnpm dev  # Manual testing
```

### 4. Form Updates (Phase 0d)

Update company forms to handle slugs:

```bash
# Files to modify:
web/src/features/companies/components/CompanyForm.tsx  # ADD slug field
web/src/features/companies/components/CompanyCard.tsx  # Link uses slug
```

## Testing Routes

After implementation, test these URLs:

| URL | Expected |
|-----|----------|
| `/` | Companies list |
| `/acme-corp` | Redirect to `/acme-corp/projects` |
| `/acme-corp/projects` | Projects placeholder (Company navbar) |
| `/acme-corp/settings` | Company settings form |
| `/acme-corp/proj123` | Redirect to `/acme-corp/proj123/events` |
| `/acme-corp/proj123/events` | Events placeholder (Project navbar) |
| `/acme-corp/proj123/evt456` | Experiences placeholder (Event navbar) |
| `/acme-corp/exps/exp789` | Experience editor placeholder |

## Key Patterns

### Server Action Pattern
```typescript
// actions/companies.actions.ts
export async function getCompanyBySlugAction(slug: string) {
  const admin = await verifyAdminSecret();
  if (!admin) return { success: false, error: "Not authenticated" };

  const company = await getCompanyBySlug(slug);
  if (!company) return { success: false, error: "Company not found" };

  return { success: true, data: company };
}
```

### Layout Pattern
```typescript
// (company)/[companySlug]/layout.tsx
export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const result = await getCompanyBySlugAction(companySlug);

  if (!result.success) {
    notFound();
  }

  return (
    <div className="flex flex-col h-full">
      <AppNavbar
        breadcrumbs={[
          { label: "🍊", href: "/" },
          { label: result.data.name }
        ]}
        tabs={[
          { label: "Projects", href: "/projects" },
          { label: "Experiences", href: "/exps" },
          { label: "Settings", href: "/settings" },
        ]}
        basePath={`/${companySlug}`}
      />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
```

### NavTabs Pattern
```typescript
// components/shared/NavTabs.tsx
"use client";

interface NavTabsProps {
  tabs: { label: string; href: string }[];
  basePath: string;
}

export function NavTabs({ tabs, basePath }: NavTabsProps) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-4 overflow-x-auto">
      {tabs.map((tab) => {
        const fullHref = `${basePath}${tab.href}`;
        const isActive = pathname.startsWith(fullHref);

        return (
          <Link
            key={tab.href}
            href={fullHref}
            className={cn(
              "py-2 px-1 text-sm whitespace-nowrap min-h-[44px]",
              isActive
                ? "border-b-2 border-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

## Validation Checklist

Before marking complete:

- [ ] `pnpm type-check` passes
- [ ] `pnpm lint` passes
- [ ] All routes accessible in dev server
- [ ] Company slug lookup works
- [ ] Navigation tabs switch correctly
- [ ] Breadcrumbs display properly
- [ ] Mobile viewport tested (320px)
- [ ] Old `(admin)` routes still work
