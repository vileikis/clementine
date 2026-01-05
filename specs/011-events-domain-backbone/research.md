# Research: Events Domain Backbone

**Feature**: Events Domain Backbone
**Date**: 2026-01-05
**Status**: Complete

## Overview

This document consolidates research findings for implementing the Events Domain backbone. Research focused on Zod schema patterns for Firestore safety, TanStack Router nested routing patterns, and vertical tabs UI implementation.

## Research Areas

### 1. Firestore-Safe Zod Schemas

**Decision**: Use `.nullable().default(null)` for all optional fields in Firestore schemas

**Rationale**:
- Firestore does not support `undefined` - it will throw errors if you try to write undefined values
- Using `.nullable().default(null)` ensures optional fields are always defined (as null) when validated
- Prevents runtime errors when writing to Firestore
- Matches existing pattern in codebase (`project-event.schema.ts` line 34-38, `theme.schemas.ts` line 22-24, 34)

**Pattern**:
```typescript
export const schema = z.object({
  // Required field
  requiredField: z.string(),

  // Optional primitive
  optionalField: z.string().nullable().default(null),

  // Optional object
  optionalObject: z.object({ ... }).nullable().default(null),

  // Optional array
  optionalArray: z.array(z.string()).default([]),
})
```

**Alternatives Considered**:
- `.optional()` - Rejected: Firestore doesn't support undefined, causes runtime errors
- `.optional().default(null)` - Rejected: Redundant, `.nullable().default(null)` is clearer

**Source**:
- Existing schemas: `apps/clementine-app/src/domains/project/events/schemas/project-event.schema.ts:34-38`
- Existing schemas: `apps/clementine-app/src/shared/theming/schemas/theme.schemas.ts:22-24,34`
- Standards: `apps/clementine-app/standards/global/zod-validation.md`

---

### 2. Schema Versioning with passthrough()

**Decision**: Use `.passthrough()` on all Firestore schemas for forward compatibility

**Rationale**:
- Allows schemas to accept unknown fields without throwing validation errors
- Enables gradual schema evolution without breaking existing data
- Safe for Firestore documents that may have fields added by future features
- When combined with strict schema definitions, provides both safety and flexibility

**Pattern**:
```typescript
export const eventConfigSchema = z.object({
  schemaVersion: z.number().default(1),
  // ... defined fields
}).passthrough() // Allow unknown fields for future evolution
```

**Alternatives Considered**:
- `.strict()` - Rejected: Would break when new fields are added to Firestore documents
- No modifier - Rejected: Default Zod behavior strips unknown fields, can cause data loss

**Source**:
- Requirement: `requirements/011-events-domain-backbone.md:138,182`
- Zod docs: https://zod.dev/?id=passthrough
- Standards: `apps/clementine-app/standards/global/zod-validation.md`

---

### 3. TanStack Router Nested Routes with Outlets

**Decision**: Use `<Outlet />` component in parent layout to render child routes

**Rationale**:
- TanStack Router convention for nested routing
- Parent route (`$eventId.tsx`) defines layout shell and shared loader data
- Child routes (`$eventId.welcome.tsx`, etc.) render in the outlet
- Enables shared layout (top nav, tabs) with dynamic content area
- Already used in existing codebase (`$eventId.tsx:124`)

**Pattern**:
```typescript
// Parent route ($eventId.tsx)
function EventLayout() {
  return (
    <>
      {/* Shared layout */}
      <TopNav />
      <Tabs />

      {/* Child route renders here */}
      <Outlet />
    </>
  )
}

// Child route ($eventId.welcome.tsx)
function WelcomePage() {
  return <div>Welcome content</div>
}
```

**Alternatives Considered**:
- Manual route matching with conditionals - Rejected: Less maintainable, loses type safety
- Separate layouts per route - Rejected: Code duplication, inconsistent UX

**Source**:
- Existing implementation: `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.tsx:124`
- TanStack Router docs: https://tanstack.com/router/latest/docs/framework/react/guide/outlets
- Standards: `apps/clementine-app/standards/frontend/routing.md`

---

### 4. Index Route Redirects with beforeLoad

**Decision**: Use `beforeLoad` with `throw redirect()` for index route redirects

**Rationale**:
- TanStack Router convention for redirects during route loading
- Executes before component renders, preventing flash of wrong content
- Type-safe redirect with proper params inheritance
- Cleaner than component-level redirects with useEffect

**Pattern**:
```typescript
// $eventId.index.tsx
export const Route = createFileRoute('/path/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/path/welcome',
      params,
    })
  },
})
```

**Alternatives Considered**:
- `<Navigate />` component - Rejected: Causes component render, flash of content
- `useEffect` redirect - Rejected: Runs after render, worse UX
- `loader` redirect - Acceptable: Works, but `beforeLoad` is semantically clearer for pure redirects

**Source**:
- TanStack Router docs: https://tanstack.com/router/latest/docs/framework/react/guide/navigation#redirecting
- Standards: `apps/clementine-app/standards/frontend/routing.md`

---

### 5. Vertical Tabs with Active State

**Decision**: Use TanStack Router's `useMatchRoute()` hook for active tab detection

**Rationale**:
- Type-safe way to detect active route in TanStack Router
- Returns boolean indicating if current route matches the pattern
- Works with nested routes and relative paths
- Integrates seamlessly with TanStack Router's Link component

**Pattern**:
```typescript
import { Link, useMatchRoute } from '@tanstack/react-router'

function TabNav() {
  const matchRoute = useMatchRoute()

  const isActive = matchRoute({ to: './welcome' })

  return (
    <Link
      to="./welcome"
      className={isActive ? 'active-styles' : 'inactive-styles'}
    >
      Welcome
    </Link>
  )
}
```

**Alternatives Considered**:
- Manual URL parsing - Rejected: Brittle, not type-safe
- Link's `activeProps` - Acceptable: Also works, but less flexible for custom logic
- `useRouter().state.location` - Rejected: More verbose, harder to read

**Source**:
- TanStack Router docs: https://tanstack.com/router/latest/docs/framework/react/api/router/useMatchRouteHook
- Requirement: `requirements/011-events-domain-backbone.md:226-232`

---

### 6. Draft Version Starting at 1

**Decision**: Use `draftVersion: z.number().default(1)` (not 0)

**Rationale**:
- More intuitive for users ("Version 1" vs "Version 0")
- Matches semantic versioning conventions (1.0.0, not 0.0.0 for initial releases)
- Clear state differentiation:
  - `draftVersion: 1` = first draft
  - `publishedVersion: null` = never published
  - `publishedVersion: 1` = published version 1

**Alternatives Considered**:
- Starting at 0 - Rejected: Feels unnatural to non-technical users ("Version 0" is confusing)
- Starting at timestamp - Rejected: Not human-readable, harder to understand

**Source**:
- Requirement: `requirements/011-events-domain-backbone.md:470-477`

---

### 7. Lazy Config Initialization

**Decision**: Don't create `draftConfig` on event creation. Create on first edit.

**Rationale**:
- Event creation should be lightweight (name, status, timestamps only)
- Config creation happens when user opens designer for first time
- Avoids creating unused data (many events may never be configured)
- Matches YAGNI principle (don't create what isn't needed yet)

**Pattern**:
```typescript
// Event creation (in project domain)
const newEvent = {
  id: eventId,
  name: 'Untitled Event',
  status: 'active',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  deletedAt: null,
  // No draftConfig, no publishedConfig - will be created on first edit
}

// First edit (in event domain - future)
if (!event.draftConfig) {
  await updateDoc(eventRef, {
    draftConfig: {
      schemaVersion: 1,
      theme: null,
      overlays: null,
      sharing: null,
    },
    draftVersion: 1,
  })
}
```

**Alternatives Considered**:
- Create empty config on event creation - Rejected: Wastes Firestore storage, creates unused data
- Create config with defaults on creation - Rejected: Premature, violates YAGNI

**Source**:
- Requirement: `requirements/011-events-domain-backbone.md:459-467`

---

### 8. Component Library Usage (shadcn/ui + Radix)

**Decision**: Use shadcn/ui and Radix UI primitives for all UI components

**Rationale**:
- Already installed and configured in project
- Provides accessible, customizable components
- Matches design system standards
- No need to build custom components for standard UI patterns

**Components to Use**:
- Tabs navigation: Not needed (using custom Link components per design)
- Link component: TanStack Router's `<Link />` (already type-safe)
- Button: shadcn/ui `<Button />` for publish/preview actions (already in use)

**Pattern**:
```typescript
import { Link } from '@tanstack/react-router'
import { Button } from '@/ui-kit/components/button'

// Vertical tabs with Link (no shadcn Tabs needed)
<Link
  to="./welcome"
  className="px-4 py-2 hover:bg-accent"
  activeProps={{ className: 'bg-accent' }}
>
  Welcome
</Link>

// Action buttons
<Button variant="default" onClick={handlePublish}>
  Publish
</Button>
```

**Alternatives Considered**:
- shadcn/ui Tabs component - Rejected: Designed for horizontal tabs, requirement specifies vertical sidebar
- Custom tab component - Rejected: TanStack Router Links provide better integration and type safety
- Headless UI - Rejected: Project already uses Radix UI via shadcn/ui

**Source**:
- Standards: `apps/clementine-app/standards/frontend/component-libraries.md`
- Existing usage: `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.tsx:1,102-121`
- shadcn/ui docs: https://ui.shadcn.com
- Radix UI docs: https://www.radix-ui.com

---

### 9. Embedded Theme Objects vs References

**Decision**: Embed full `themeSchema` object in EventConfig (no theme references)

**Rationale**:
- Self-contained configuration (all event settings in one document)
- Easy to version and publish as a unit (draft vs published)
- No need for additional Firestore reads to resolve theme references
- Clear ownership of theme settings per event
- Simpler to implement draft/publish workflow (entire config is versioned together)

**Pattern**:
```typescript
export const projectEventConfigSchema = z.object({
  // Embed full theme object
  theme: themeSchema.nullable().default(null),

  // NOT a reference like:
  // themeId: z.string().nullable() ❌
})
```

**Alternatives Considered**:
- Theme reference by ID - Rejected: Adds complexity (resolving references), harder to version
- Project-level default themes - Future consideration: Events can override project defaults

**Source**:
- Requirement: `requirements/011-events-domain-backbone.md:508-515`
- Existing theme schema: `apps/clementine-app/src/shared/theming/schemas/theme.schemas.ts:42-48`

---

### 10. Social Sharing Configuration (Boolean Flags)

**Decision**: Use simple boolean flags for social media enable/disable

**Rationale**:
- Meets current requirements (enable/disable per platform)
- Keep initial version simple
- Can extend later with platform-specific config (hashtags, handles)
- Follows YAGNI principle

**Pattern**:
```typescript
export const socialSharingConfigSchema = z.object({
  email: z.boolean().default(false),
  instagram: z.boolean().default(false),
  facebook: z.boolean().default(false),
  linkedin: z.boolean().default(false),
  twitter: z.boolean().default(false),
  tiktok: z.boolean().default(false),
  telegram: z.boolean().default(false),
})
```

**Future Extensions** (if needed):
```typescript
// Future: Platform-specific config
export const socialPlatformConfigSchema = z.object({
  enabled: z.boolean(),
  defaultHashtags: z.array(z.string()).optional(),
  accountHandle: z.string().optional(),
})
```

**Alternatives Considered**:
- Platform-specific config objects from start - Rejected: Over-engineering, not currently needed
- String array of enabled platforms - Rejected: Less type-safe, harder to work with in UI

**Source**:
- Requirement: `requirements/011-events-domain-backbone.md:517-524`

---

## Summary of Key Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Firestore Optional Fields** | `.nullable().default(null)` | Firestore doesn't support undefined |
| **Schema Evolution** | `.passthrough()` | Allow unknown fields for future compatibility |
| **Nested Routing** | `<Outlet />` component | TanStack Router convention |
| **Index Redirects** | `beforeLoad` with `throw redirect()` | Executes before render, no flash |
| **Active Tab Detection** | `useMatchRoute()` hook | Type-safe route matching |
| **Version Numbering** | Start at 1 (not 0) | More intuitive for users |
| **Config Initialization** | Lazy (on first edit) | YAGNI principle, avoid unused data |
| **UI Components** | shadcn/ui + TanStack Router Link | Already in use, standards-compliant |
| **Theme Storage** | Embedded objects | Self-contained, easier to version |
| **Social Config** | Boolean flags | Simple, meets current needs |

## Standards Applied

All decisions align with:
- ✅ `standards/global/project-structure.md` - Domain architecture
- ✅ `standards/global/zod-validation.md` - Schema patterns
- ✅ `standards/global/client-first-architecture.md` - Firebase client SDK
- ✅ `standards/frontend/routing.md` - TanStack Router patterns
- ✅ `standards/frontend/component-libraries.md` - shadcn/ui usage

No research gaps remain. Ready for Phase 1 (Design & Contracts).
