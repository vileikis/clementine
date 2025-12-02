# Quickstart: Router Simplification

**Feature Branch**: `014-router-simplify`
**Date**: 2024-12-02

## Overview

This guide explains how to migrate from the current 4-layout route group structure to the simplified single-layout structure with page-based breadcrumbs.

## Prerequisites

- Understanding of Next.js App Router layouts and route groups
- Familiarity with existing Sidebar and ContentHeader components

## Migration Steps

### Step 1: Create the Unified Layout

Create a single layout at `web/src/app/(workspace)/[companySlug]/layout.tsx`:

```tsx
import { Sidebar } from "@/features/sidebar";
import { getCompanyBySlugAction } from "@/features/companies/actions";
import { LastCompanyUpdater } from "@/features/sidebar/components/LastCompanyUpdater";
import { notFound } from "next/navigation";

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const result = await getCompanyBySlugAction(companySlug);

  if (!result.success || !result.company) {
    notFound();
  }

  return (
    <div className="flex h-screen">
      <Sidebar company={result.company} />
      <main className="flex-1 overflow-auto">{children}</main>
      <LastCompanyUpdater companySlug={companySlug} />
    </div>
  );
}
```

### Step 2: Create the Breadcrumb Helper

Create `web/src/lib/breadcrumbs.ts`:

```tsx
export type Breadcrumb = {
  label: string;
  href?: string;
};

export type BreadcrumbSegments = {
  project?: { name: string; id: string };
  event?: { name: string; id: string };
  experience?: { name: string; id: string };
  current?: string;
};

export function buildBreadcrumbs(
  company: { name: string; slug: string },
  segments?: BreadcrumbSegments
): Breadcrumb[] {
  const crumbs: Breadcrumb[] = [];
  const { project, event, experience, current } = segments ?? {};

  if (project) {
    crumbs.push({
      label: "Projects",
      href: `/${company.slug}/projects`,
    });
    crumbs.push({
      label: project.name,
      href: `/${company.slug}/${project.id}`,
    });
  }

  if (event && project) {
    crumbs.push({
      label: event.name,
      href: `/${company.slug}/${project.id}/${event.id}`,
    });
  }

  if (experience) {
    crumbs.push({
      label: "Experiences",
      href: `/${company.slug}/exps`,
    });
    crumbs.push({
      label: experience.name,
      href: `/${company.slug}/exps/${experience.id}`,
    });
  }

  if (current) {
    crumbs.push({ label: current });
  }

  return crumbs;
}
```

### Step 3: Update Page Files

Each page that needs breadcrumbs should fetch its own data and use the helper:

```tsx
// Example: web/src/app/(workspace)/[companySlug]/[projectId]/[eventId]/theme/page.tsx
import { ContentHeader } from "@/features/sidebar/components/ContentHeader";
import { buildBreadcrumbs } from "@/lib/breadcrumbs";
import { getCompanyBySlugAction } from "@/features/companies/actions";
import { getEventAction } from "@/features/events/actions";

export default async function ThemePage({
  params,
}: {
  params: Promise<{ companySlug: string; projectId: string; eventId: string }>;
}) {
  const { companySlug, projectId, eventId } = await params;

  // Fetch data in parallel
  const [companyResult, eventResult] = await Promise.all([
    getCompanyBySlugAction(companySlug),
    getEventAction(eventId),
  ]);

  const company = companyResult.company!;
  const event = eventResult.data!;

  const breadcrumbs = buildBreadcrumbs(company, {
    project: { name: `Project ${projectId}`, id: projectId }, // Placeholder until Projects feature
    event: { name: event.name, id: event.id },
    current: "Theme",
  });

  return (
    <div className="flex flex-col h-full">
      <ContentHeader breadcrumbs={breadcrumbs} />
      <div className="flex-1 overflow-auto p-6">
        {/* Page content */}
      </div>
    </div>
  );
}
```

### Step 4: Migrate Pages by Route Group

1. **Company pages** (`page.tsx`, `projects/`, `exps/`, `settings/`, `analytics/`):
   - Move to `[companySlug]/`
   - Add breadcrumbs only where needed (deeper navigation)

2. **Project pages**:
   - Move from `(project)/[companySlug]/[projectId]/` to `[companySlug]/[projectId]/`
   - Add ContentHeader with project breadcrumbs

3. **Event pages**:
   - Move from `(event)/[companySlug]/[projectId]/[eventId]/` to `[companySlug]/[projectId]/[eventId]/`
   - Add ContentHeader with project + event breadcrumbs

4. **Experience pages**:
   - Move from `(experience)/[companySlug]/exps/[expId]/` to `[companySlug]/exps/[expId]/`
   - Add ContentHeader with experience breadcrumbs

### Step 5: Delete Old Layouts

After migrating all pages in a route group:

```bash
# After migrating company pages
rm -rf web/src/app/(workspace)/(company)/

# After migrating project pages
rm -rf web/src/app/(workspace)/(project)/

# After migrating event pages
rm -rf web/src/app/(workspace)/(event)/

# After migrating experience pages
rm -rf web/src/app/(workspace)/(experience)/
```

## Validation Checklist

After each migration step:

- [ ] Run `pnpm type-check` - No TypeScript errors
- [ ] Run `pnpm lint` - No ESLint warnings
- [ ] Run `pnpm dev` - Pages load correctly
- [ ] Verify breadcrumbs display correctly
- [ ] Verify Sidebar renders with company context
- [ ] Test on mobile viewport (320px width)

## Common Issues

### Breadcrumbs not showing

Ensure the page wraps content in ContentHeader:
```tsx
<ContentHeader breadcrumbs={breadcrumbs} />
```

### Company data not available

Pages needing company data for breadcrumbs must fetch it:
```tsx
const companyResult = await getCompanyBySlugAction(companySlug);
```

### Route conflicts during migration

Migrate atomically per route group - don't have both old and new routes active simultaneously.

## File Structure After Migration

```
web/src/app/(workspace)/
├── companies/page.tsx              # Root: Company list
└── [companySlug]/
    ├── layout.tsx                  # Single unified layout
    ├── page.tsx                    # Dashboard
    ├── projects/page.tsx           # Projects list
    ├── exps/
    │   ├── page.tsx                # Experiences list
    │   └── [expId]/page.tsx        # Experience detail
    ├── analytics/page.tsx
    ├── settings/page.tsx
    └── [projectId]/
        ├── page.tsx                # Project detail
        ├── events/page.tsx
        ├── distribute/page.tsx
        ├── results/page.tsx
        └── [eventId]/
            ├── page.tsx            # Event detail
            ├── experiences/page.tsx
            └── theme/page.tsx
```
