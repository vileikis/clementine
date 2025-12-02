# Router Simplification Plan

## Problem

Current structure has 4 route groups with nearly identical layouts:

```
(workspace)/
├── (company)/[companySlug]/         # layout.tsx + pages
├── (project)/[companySlug]/[projectId]/        # layout.tsx + pages
├── (event)/[companySlug]/[projectId]/[eventId]/ # layout.tsx + pages
├── (experience)/[companySlug]/exps/[expId]/    # layout.tsx + pages
```

Each layout:
- Fetches company by slug
- Renders the same `<Sidebar company={company} />`
- Uses the same flex container structure
- Includes `<LastCompanyUpdater />`

The only difference is the breadcrumbs in ContentHeader.

---

## Solution: Flatten to Single Layout + Page-Based Breadcrumbs

### New Structure

```
(workspace)/[companySlug]/
├── layout.tsx              # Single layout: Sidebar + company fetch (once)
├── page.tsx                # Dashboard
├── analytics/page.tsx
├── settings/page.tsx
├── exps/
│   ├── page.tsx            # Experiences list
│   └── [expId]/page.tsx    # Experience detail
├── projects/page.tsx
├── [projectId]/
│   ├── page.tsx            # Project detail
│   ├── events/page.tsx
│   ├── distribute/page.tsx
│   └── [eventId]/
│       ├── page.tsx        # Event detail
│       ├── experiences/page.tsx
│       └── theme/page.tsx
```

### Key Decisions

1. **Single layout at `[companySlug]/layout.tsx`**
   - Fetches company once
   - Renders Sidebar
   - No nested layouts needed

2. **Page-based breadcrumbs**
   - Each page defines its own breadcrumbs via `<ContentHeader>`
   - Simple helper function for consistency
   - No providers or context needed

---

## Implementation

### Layout (single file)

```tsx
// (workspace)/[companySlug]/layout.tsx
import { Sidebar } from "@/components/workspace/sidebar";
import { getCompanyBySlugAction } from "@/features/companies/actions";
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
    <div className="flex min-h-screen">
      <Sidebar company={result.company} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

### Breadcrumbs Helper

```tsx
// lib/breadcrumbs.ts
export type Breadcrumb = {
  label: string;
  href?: string;
};

export function buildBreadcrumbs(
  company: { name: string; slug: string },
  segments?: {
    project?: { name: string; id: string };
    event?: { name: string; id: string };
    experience?: { name: string; id: string };
    current?: string;
  }
): Breadcrumb[] {
  const { project, event, experience, current } = segments ?? {};
  const crumbs: Breadcrumb[] = [
    { label: company.name, href: `/${company.slug}` },
  ];

  if (project) {
    crumbs.push({
      label: project.name,
      href: `/${company.slug}/${project.id}`,
    });
  }

  if (event) {
    crumbs.push({
      label: event.name,
      href: `/${company.slug}/${project?.id}/${event.id}`,
    });
  }

  if (experience) {
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

### Example Page

```tsx
// (workspace)/[companySlug]/[projectId]/[eventId]/theme/page.tsx
import { ContentHeader } from "@/components/workspace/content-header";
import { buildBreadcrumbs } from "@/lib/breadcrumbs";
import { getCompanyBySlugAction } from "@/features/companies/actions";
import { getProject } from "@/features/projects/actions";
import { getEvent } from "@/features/events/actions";

export default async function ThemePage({
  params,
}: {
  params: Promise<{ companySlug: string; projectId: string; eventId: string }>;
}) {
  const { companySlug, projectId, eventId } = await params;

  const [companyResult, project, event] = await Promise.all([
    getCompanyBySlugAction(companySlug),
    getProject(projectId),
    getEvent(eventId),
  ]);

  const breadcrumbs = buildBreadcrumbs(companyResult.company!, {
    project: { name: project.name, id: project.id },
    event: { name: event.name, id: event.id },
    current: "Theme",
  });

  return (
    <>
      <ContentHeader breadcrumbs={breadcrumbs} />
      <ThemeEditor event={event} />
    </>
  );
}
```

---

## Migration Steps

1. Create `lib/breadcrumbs.ts` helper
2. Create new `(workspace)/[companySlug]/layout.tsx`
3. Migrate pages one route group at a time:
   - Move page files to new flat structure
   - Update each page to use `buildBreadcrumbs()` + `<ContentHeader>`
   - Delete old layout.tsx files
4. Remove empty route group folders

---

## Benefits

- **Single company fetch** - layout fetches once, cached for all child pages
- **No layout duplication** - one layout file instead of four
- **Explicit breadcrumbs** - each page clearly defines what it shows
- **Server components** - pages remain server components, no client boundary needed
- **Simple mental model** - flat structure is easier to navigate
