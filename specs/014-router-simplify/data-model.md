# Data Model: Router Simplification

**Feature Branch**: `014-router-simplify`
**Date**: 2024-12-02

## Overview

This feature does not introduce new database entities. It reorganizes routing structure and adds a utility type for breadcrumb construction.

## Types (Non-Persisted)

### Breadcrumb

Represents a single navigation segment in the breadcrumb trail.

```typescript
// Location: web/src/lib/breadcrumbs.ts

/**
 * Single breadcrumb segment
 * @property label - Display text for the breadcrumb
 * @property href - Optional navigation link (last item has no href)
 */
export type Breadcrumb = {
  label: string;
  href?: string;
};
```

**Usage**:
- Computed at render time in each page
- Never persisted to database
- Passed to `ContentHeader` component

---

### BreadcrumbSegments

Input parameters for the breadcrumb builder helper.

```typescript
// Location: web/src/lib/breadcrumbs.ts

/**
 * Segments used to build breadcrumb trail
 */
export type BreadcrumbSegments = {
  project?: { name: string; id: string };
  event?: { name: string; id: string };
  experience?: { name: string; id: string };
  current?: string;
};
```

**Field Descriptions**:
| Field | Type | Description |
|-------|------|-------------|
| `project` | `{ name, id }` | Optional project context |
| `event` | `{ name, id }` | Optional event context (requires project) |
| `experience` | `{ name, id }` | Optional experience context (standalone path) |
| `current` | `string` | Current page label (last breadcrumb, no link) |

---

## Existing Entities (No Changes)

### Company

Used by layout for Sidebar context.

```typescript
// Existing: web/src/features/companies/schemas/company.schema.ts
// Only these fields needed for Sidebar:
{
  id: string;
  name: string;
  slug: string;
}
```

### Event

Used by pages for breadcrumb construction.

```typescript
// Existing: web/src/features/events/schemas/event.schema.ts
// Only these fields needed for breadcrumbs:
{
  id: string;
  name: string;
}
```

### Experience

Used by pages for breadcrumb construction.

```typescript
// Existing: web/src/features/experiences/schemas/experience.schema.ts
// Only these fields needed for breadcrumbs:
{
  id: string;
  name: string;
}
```

### Project (Not Yet Implemented)

Will be needed when Projects feature is built.

```typescript
// Future: web/src/features/projects/schemas/project.schema.ts
// Minimum fields for breadcrumbs:
{
  id: string;
  name: string;
}
```

---

## Relationships

```
Company (1) ─────────────────┬───── (*) Event
                             │
                             └───── (*) Experience
```

**Navigation Context**:
- Company is always present (from layout)
- Project is optional (placeholder until feature exists)
- Event requires Project context (for URL construction)
- Experience is a standalone path from Company

---

## State Transitions

Not applicable. Breadcrumbs are computed values, not stateful entities.

---

## Validation Rules

| Type | Validation |
|------|------------|
| `Breadcrumb.label` | Non-empty string, max 100 chars for display |
| `Breadcrumb.href` | Valid relative URL path if present |
| `BreadcrumbSegments.event` | Only valid if `project` also provided |
