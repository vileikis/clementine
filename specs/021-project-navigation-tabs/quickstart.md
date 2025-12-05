# Quickstart: Project Navigation Tabs

**Feature**: 021-project-navigation-tabs
**Date**: 2025-12-05

## Overview

This feature updates the project layout navigation to:
1. Display inline tabs in the header (matching ExperienceTabs style)
2. Keep project navigation visible when viewing nested event pages
3. Center content at a readable width on large viewports

## Files to Create/Modify

### New Files
- `web/src/components/shared/InlineTabs.tsx` - Reusable inline tabs component
- `web/src/components/shared/InlineTabs.test.tsx` - Unit tests

### Modified Files
- `web/src/components/shared/index.ts` - Export InlineTabs
- `web/src/features/projects/components/ProjectDetailsHeader.tsx` - Integrate InlineTabs
- `web/src/features/experiences/components/editor/ExperienceTabs.tsx` - Use InlineTabs
- `web/src/app/(workspace)/[companySlug]/[projectId]/layout.tsx` - Update layout structure

## Implementation Steps

### Step 1: Create InlineTabs Component

```typescript
// web/src/components/shared/InlineTabs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface TabItem {
  label: string;
  href: string;
}

interface InlineTabsProps {
  tabs: TabItem[];
  ariaLabel?: string;
  className?: string;
}

export function InlineTabs({
  tabs,
  ariaLabel = "Section navigation",
  className
}: InlineTabsProps) {
  const pathname = usePathname();

  return (
    <nav role="navigation" aria-label={ariaLabel} className={className}>
      <ul className="flex gap-6">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "inline-flex items-center justify-center",
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  "min-h-[44px] min-w-[44px]",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-muted-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

### Step 2: Update barrel export

```typescript
// web/src/components/shared/index.ts
export { InlineTabs, type TabItem } from "./InlineTabs";
// ... existing exports
```

### Step 3: Update ProjectDetailsHeader

Add InlineTabs as a centered element in the header:

```typescript
// ProjectDetailsHeader.tsx - key changes
import { InlineTabs, type TabItem } from "@/components/shared";

interface ProjectDetailsHeaderProps {
  companySlug: string;
  project: Project;
  projectId: string;  // Add this prop
  onRenameClick?: () => void;
}

export function ProjectDetailsHeader({
  companySlug,
  project,
  projectId,
  onRenameClick,
}: ProjectDetailsHeaderProps) {
  const tabs: TabItem[] = [
    { label: "Events", href: `/${companySlug}/${projectId}/events` },
    { label: "Distribute", href: `/${companySlug}/${projectId}/distribute` },
  ];

  return (
    <header className="flex items-center gap-4 px-4 py-3 border-b bg-background">
      {/* Back Button */}
      {/* ... existing code ... */}

      {/* Project Name */}
      <div className="min-w-20">
        {/* ... existing code ... */}
      </div>

      {/* Centered Tabs */}
      <div className="flex flex-1 justify-center">
        <InlineTabs tabs={tabs} ariaLabel="Project sections" />
      </div>

      {/* Right side actions */}
      {/* ... existing code ... */}
    </header>
  );
}
```

### Step 4: Update Project Layout

Remove tab rendering from layout, keep navigation visible for events, add content container:

```typescript
// layout.tsx - key changes
export default function ProjectLayout({ children }: ProjectLayoutProps) {
  // ... existing code ...

  // REMOVE: if (eventId) return <>{children}</>
  // Navigation should persist for event pages

  return (
    <div className="flex flex-col h-full">
      <ProjectDetailsHeader
        companySlug={companySlug}
        project={project}
        projectId={projectId}
        onRenameClick={() => setIsRenameOpen(true)}
      />

      {/* REMOVE: Tab Navigation section (moved to header) */}

      {/* Content with max-width container */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {children}
        </div>
      </div>

      <RenameProjectDialog ... />
    </div>
  );
}
```

### Step 5: Refactor ExperienceTabs

```typescript
// ExperienceTabs.tsx - refactored to use InlineTabs
"use client";

import { InlineTabs, type TabItem } from "@/components/shared";

interface ExperienceTabsProps {
  companySlug: string;
  experienceId: string;
}

export function ExperienceTabs({ companySlug, experienceId }: ExperienceTabsProps) {
  const tabs: TabItem[] = [
    { label: "Design", href: `/${companySlug}/exps/${experienceId}/design` },
    { label: "Settings", href: `/${companySlug}/exps/${experienceId}/settings` },
  ];

  return <InlineTabs tabs={tabs} ariaLabel="Experience sections" />;
}
```

## Validation Checklist

Before marking complete:
- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes
- [ ] `pnpm test` passes (InlineTabs.test.tsx)
- [ ] Manual test: Project tabs visible on Events page
- [ ] Manual test: Project tabs visible on Distribute page
- [ ] Manual test: Project tabs visible when viewing an event
- [ ] Manual test: Content centered on wide viewport (>1024px)
- [ ] Manual test: Content full-width on mobile viewport

## Key Styling Classes

```typescript
// InlineTabs active state
"bg-accent text-accent-foreground font-semibold rounded-md"

// InlineTabs inactive state
"text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md"

// Touch target sizing
"min-h-[44px] min-w-[44px]"

// Content container
"max-w-5xl mx-auto px-4 py-6"
```
