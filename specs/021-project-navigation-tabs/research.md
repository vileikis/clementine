# Research: Project Navigation Tabs

**Feature**: 021-project-navigation-tabs
**Date**: 2025-12-05

## Research Questions

### 1. Where should the shared InlineTabs component be placed?

**Decision**: `/web/src/components/shared/InlineTabs.tsx`

**Rationale**:
- Follows existing pattern established by `NavTabs.tsx` in the same directory
- `components/shared/` contains reusable cross-feature components (NavTabs, Breadcrumbs, EditorHeader)
- Feature modules (`features/`) are for domain-specific code; InlineTabs is UI infrastructure
- Barrel export via `index.ts` already exists for easy imports

**Alternatives Considered**:
- `components/ui/` - Rejected: Reserved for shadcn/ui primitives
- `features/projects/components/` - Rejected: Would duplicate for experiences
- New `components/navigation/` folder - Rejected: Unnecessary abstraction, shared/ suffices

### 2. What styling pattern should InlineTabs follow?

**Decision**: Hybrid of ExperienceTabs (visual) and NavTabs (accessibility)

**Rationale**:
- ExperienceTabs uses `bg-accent` background for active state - matches the spec requirement for "Experience Editor style"
- ExperienceTabs uses `rounded-md` pill-style appearance
- NavTabs has better accessibility (`min-h-[44px]` touch targets, `overflow-x-auto` for mobile)
- Both use semantic color tokens (`text-muted-foreground`, `bg-accent`, etc.)

**Styling Specification**:
```typescript
// Active tab
"bg-accent text-accent-foreground font-semibold rounded-md"

// Inactive tab
"text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md"

// Common
"inline-block px-3 py-2 text-sm font-medium transition-colors"
"min-h-[44px] min-w-[44px] flex items-center justify-center"
```

**Alternatives Considered**:
- Bottom border indicator (like NavTabs) - Rejected: Spec requires ExperienceTabs style with background highlight
- Custom styling - Rejected: Consistency with existing patterns is priority

### 3. How should navigation persist when viewing events?

**Decision**: Remove the `if (eventId) return <>{children}</>` early return in ProjectLayout

**Rationale**:
- Current behavior: Layout checks for `eventId` param and skips rendering project header/tabs
- New behavior: Always render project header with tabs regardless of route depth
- Event layout will render below project layout (nested layouts)
- This matches FR-005: "display project navigation tabs even when an event route is active"

**Implementation**:
```typescript
// BEFORE (layout.tsx)
if (eventId) {
  return <>{children}</>;
}

// AFTER - Remove this check entirely
// Always render project header + tabs + children
```

**Alternatives Considered**:
- Conditional rendering based on pathname - Rejected: More complex, same result
- Portal-based approach - Rejected: Overengineered for this use case

### 4. What content container pattern should be used?

**Decision**: CSS max-width with `mx-auto` centering, applied at content level

**Rationale**:
- Spec requires "reasonable width" on large viewports (>1024px)
- Standard web pattern: `max-w-5xl mx-auto` or similar
- Mobile-first: Full width by default, constrained on larger screens
- Applied to content area, not header (header stays full-width)

**Implementation**:
```typescript
// In layout.tsx content wrapper
<div className="flex-1 overflow-auto">
  <div className="max-w-5xl mx-auto px-4 py-6">
    {children}
  </div>
</div>
```

**Alternatives Considered**:
- `max-w-4xl` (896px) - Considered: Slightly narrower, could work
- `max-w-6xl` (1152px) - Considered: Slightly wider, could work
- `container` class - Rejected: Less control over exact width
- No max-width - Rejected: Doesn't meet spec requirement

**Recommended**: `max-w-5xl` (1024px) as it matches the spec's "1024px" threshold reference

### 5. Should ExperienceTabs be refactored to use InlineTabs?

**Decision**: Yes - refactor ExperienceTabs to use InlineTabs internally

**Rationale**:
- Eliminates duplicate tab styling code
- Ensures visual consistency across project and experience headers
- ExperienceTabs becomes a thin wrapper that provides tab configuration
- Follows DRY principle without premature abstraction

**Implementation**:
```typescript
// ExperienceTabs.tsx - AFTER refactor
import { InlineTabs } from "@/components/shared";

export function ExperienceTabs({ companySlug, experienceId }) {
  const tabs = [
    { label: "Design", href: `/${companySlug}/exps/${experienceId}/design` },
    { label: "Settings", href: `/${companySlug}/exps/${experienceId}/settings` },
  ];

  return <InlineTabs tabs={tabs} ariaLabel="Experience sections" />;
}
```

**Alternatives Considered**:
- Keep ExperienceTabs separate - Rejected: Violates FR-008 (shared component requirement)
- Delete ExperienceTabs entirely - Rejected: Maintains feature-specific abstraction

## Component Design

### InlineTabs Props Interface

```typescript
interface TabItem {
  label: string;
  href: string;
}

interface InlineTabsProps {
  tabs: TabItem[];
  ariaLabel?: string;  // For nav aria-label, defaults to "Section navigation"
  className?: string;  // For container customization
}
```

### InlineTabs Implementation Outline

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface TabItem {
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

## Route Analysis

### Routes affected by this change

| Route | Current Behavior | New Behavior |
|-------|------------------|--------------|
| `/{companySlug}/{projectId}/events` | Tabs in layout body | Tabs in header |
| `/{companySlug}/{projectId}/distribute` | Tabs in layout body | Tabs in header |
| `/{companySlug}/{projectId}/{eventId}/*` | No project tabs | Project tabs visible |

### Content width impact

All pages under `[projectId]/` will have content constrained to `max-w-5xl` (1024px) centered:
- `events/page.tsx` - Event list will be centered
- `distribute/page.tsx` - Distribution settings will be centered
- `[eventId]/*/page.tsx` - Event pages will be centered (nested under project)

## Summary

All research questions resolved. Key decisions:
1. **Component location**: `components/shared/InlineTabs.tsx`
2. **Styling**: ExperienceTabs pattern (bg-accent active state, rounded-md)
3. **Navigation persistence**: Remove eventId early-return in ProjectLayout
4. **Content width**: `max-w-5xl mx-auto` (1024px centered)
5. **Refactoring**: ExperienceTabs will use InlineTabs internally
