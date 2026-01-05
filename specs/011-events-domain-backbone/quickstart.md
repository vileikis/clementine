# Quickstart Guide: Events Domain Backbone

**Feature**: Events Domain Backbone
**Date**: 2026-01-05

## Overview

This guide provides a quick reference for implementing the Events Domain backbone. Follow these steps to create the domain structure, schemas, EventDesignerPage component, and route files.

## Prerequisites

- [x] On feature branch: `011-events-domain-backbone`
- [x] TanStack Start app running (`pnpm dev` from `apps/clementine-app/`)
- [x] Existing event route at `/workspace/:workspaceSlug/projects/:projectId/events/:eventId`
- [x] Existing `@domains/project/events/` subdomain (unchanged)
- [x] Existing `@/shared/theming/schemas/theme.schemas.ts` (referenced by new schemas)

## Implementation Checklist

### Phase 1: Domain Structure

**Create domain folders**:

```bash
cd apps/clementine-app/src/domains

# Create event domain (singular)
mkdir -p event/{designer/{components,containers},welcome/{components,containers},theme/{components,containers},settings/{components,containers},shared/{schemas,hooks,types}}
```

**Expected structure**:
```
domains/event/
├── designer/
│   ├── components/
│   ├── containers/
│   └── index.ts
├── welcome/
│   ├── components/
│   ├── containers/
│   └── index.ts
├── theme/
│   ├── components/
│   ├── containers/
│   └── index.ts
├── settings/
│   ├── components/
│   ├── containers/
│   └── index.ts
├── shared/
│   ├── schemas/
│   │   └── index.ts
│   ├── hooks/
│   └── types/
│       └── index.ts
└── index.ts
```

---

### Phase 2: Schemas

**Create ProjectEventConfig schema**:

File: `apps/clementine-app/src/domains/event/shared/schemas/project-event-config.schema.ts`

```typescript
import { z } from 'zod'
import { themeSchema } from '@/shared/theming/schemas/theme.schemas'

export const CURRENT_CONFIG_VERSION = 1

export const overlaysConfigSchema = z.object({
  '1:1': z.string().url().nullable().default(null),
  '9:16': z.string().url().nullable().default(null),
}).nullable().default(null)

export const socialSharingConfigSchema = z.object({
  email: z.boolean().default(false),
  instagram: z.boolean().default(false),
  facebook: z.boolean().default(false),
  linkedin: z.boolean().default(false),
  twitter: z.boolean().default(false),
  tiktok: z.boolean().default(false),
  telegram: z.boolean().default(false),
})

export const sharingConfigSchema = z.object({
  downloadEnabled: z.boolean().default(true),
  copyLinkEnabled: z.boolean().default(true),
  socials: socialSharingConfigSchema.nullable().default(null),
})

export const projectEventConfigSchema = z.object({
  schemaVersion: z.number().default(CURRENT_CONFIG_VERSION),
  theme: themeSchema.nullable().default(null),
  overlays: overlaysConfigSchema,
  sharing: sharingConfigSchema.nullable().default(null),
}).passthrough()

export type ProjectEventConfig = z.infer<typeof projectEventConfigSchema>
export type OverlaysConfig = z.infer<typeof overlaysConfigSchema>
export type SharingConfig = z.infer<typeof sharingConfigSchema>
export type SocialSharingConfig = z.infer<typeof socialSharingConfigSchema>
```

**Create ProjectEventFull schema**:

File: `apps/clementine-app/src/domains/event/shared/schemas/project-event-full.schema.ts`

```typescript
import { z } from 'zod'
import { projectEventConfigSchema } from './project-event-config.schema'

export const projectEventFullSchema = z.object({
  // Admin metadata (also in @domains/project/events/schemas/project-event.schema.ts)
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'deleted']).default('active'),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable().default(null),

  // Guest-facing configuration (events domain only)
  draftConfig: projectEventConfigSchema.nullable().default(null),
  publishedConfig: projectEventConfigSchema.nullable().default(null),

  // Publish tracking (events domain only)
  draftVersion: z.number().default(1),
  publishedVersion: z.number().nullable().default(null),
  publishedAt: z.number().nullable().default(null),
}).passthrough()

export type ProjectEventFull = z.infer<typeof projectEventFullSchema>
```

**Create barrel exports**:

File: `apps/clementine-app/src/domains/event/shared/schemas/index.ts`

```typescript
export * from './project-event-config.schema'
export * from './project-event-full.schema'
```

**Create types barrel**:

File: `apps/clementine-app/src/domains/event/shared/types/index.ts`

```typescript
export type {
  ProjectEventConfig,
  ProjectEventFull,
  OverlaysConfig,
  SharingConfig,
  SocialSharingConfig,
} from '../schemas'
```

---

### Phase 3: EventDesignerPage Component

**Create EventDesignerPage**:

File: `apps/clementine-app/src/domains/event/designer/containers/EventDesignerPage.tsx`

```typescript
import { Link, Outlet, useMatchRoute, useParams } from '@tanstack/react-router'

export function EventDesignerPage() {
  const matchRoute = useMatchRoute()
  const { workspaceSlug, projectId, eventId } = useParams({
    from: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId',
  })

  const tabs = [
    { id: 'welcome', label: 'Welcome', href: './welcome' },
    { id: 'theme', label: 'Theme', href: './theme' },
    { id: 'settings', label: 'Settings', href: './settings' },
  ]

  return (
    <div className="flex h-full">
      {/* Left: Vertical Tabs */}
      <aside className="w-48 border-r">
        <nav className="flex flex-col gap-1 p-2">
          {tabs.map((tab) => {
            const isActive = matchRoute({ to: tab.href })
            return (
              <Link
                key={tab.id}
                to={tab.href}
                params={{ workspaceSlug, projectId, eventId }}
                className={`px-4 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Right: Content Area */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
```

**Create barrel exports**:

File: `apps/clementine-app/src/domains/event/designer/index.ts`

```typescript
export { EventDesignerPage } from './containers/EventDesignerPage'
```

**Create domain barrel export**:

File: `apps/clementine-app/src/domains/event/index.ts`

```typescript
export { EventDesignerPage } from './designer'
export type {
  ProjectEventConfig,
  ProjectEventFull,
  OverlaysConfig,
  SharingConfig,
  SocialSharingConfig,
} from './shared/types'
```

---

### Phase 4: Route Files

**Update existing event route** (`$eventId.tsx`):

File: `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.tsx`

**Changes**:
1. Import `EventDesignerPage` from `@/domains/event`
2. Update loader to use `projectEventFullSchema` (instead of `projectEventSchema`)
3. Replace BODY section (keep TOP NAV BAR)

```typescript
// ADD IMPORT
import { EventDesignerPage } from '@/domains/event'
import { projectEventFullSchema } from '@/domains/event/shared/schemas'

// UPDATE LOADER (change schema)
export const Route = createFileRoute('...')({
  loader: async ({ params }) => {
    // ... existing code ...

    // CHANGE: Use projectEventFullSchema instead of projectEventSchema
    const event = convertFirestoreDoc(eventDoc, projectEventFullSchema)

    return { event, project }
  },
  component: EventLayout,
  notFoundComponent: EventNotFound,
})

function EventLayout() {
  // ... existing code (keep TOP NAV BAR) ...

  return (
    <>
      {/* TOP NAV BAR - KEEP EXISTING */}
      <TopNavBar ... />

      {/* BODY - REPLACE WITH EventDesignerPage */}
      <EventDesignerPage />
    </>
  )
}
```

**Create index route** (redirect to welcome):

File: `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.index.tsx`

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/',
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/welcome',
      params,
    })
  },
})
```

**Create welcome tab route**:

File: `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.welcome.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/welcome',
)({
  component: WelcomePage,
})

function WelcomePage() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Welcome Tab</h2>
      <p className="text-muted-foreground mt-2">
        Work in progress - Welcome screen editor coming soon
      </p>
    </div>
  )
}
```

**Create theme tab route**:

File: `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.theme.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/theme',
)({
  component: ThemePage,
})

function ThemePage() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Theme Tab</h2>
      <p className="text-muted-foreground mt-2">
        Work in progress - Theme editor coming soon
      </p>
    </div>
  )
}
```

**Create settings tab route**:

File: `apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.settings.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/settings',
)({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Settings Tab</h2>
      <p className="text-muted-foreground mt-2">
        Work in progress - Settings editor (overlays, sharing) coming soon
      </p>
    </div>
  )
}
```

---

### Phase 5: Testing

**Manual Testing Checklist**:

1. **Navigate to an event**:
   ```
   /workspace/{slug}/projects/{id}/events/{eventId}
   ```
   - [ ] Auto-redirects to `/welcome` tab
   - [ ] EventDesignerPage renders with vertical tabs
   - [ ] Welcome tab content displays

2. **Tab Navigation**:
   - [ ] Click "Theme" tab → URL updates to `/theme`, content changes
   - [ ] Click "Settings" tab → URL updates to `/settings`, content changes
   - [ ] Click "Welcome" tab → Returns to `/welcome`
   - [ ] Active tab highlights correctly

3. **Route Loading**:
   - [ ] Event data loads from Firestore
   - [ ] No console errors about schema validation
   - [ ] Top nav breadcrumb shows project + event names

4. **Type Safety**:
   - [ ] Run `pnpm type-check` → No TypeScript errors
   - [ ] IDE autocomplete works for `event` object (shows config fields)

**Schema Validation Testing**:

```typescript
// Test in browser console or Jest
import { projectEventConfigSchema, projectEventFullSchema } from '@/domains/event/shared/schemas'

// Valid config
const validConfig = projectEventConfigSchema.parse({
  schemaVersion: 1,
  theme: null,
  overlays: null,
  sharing: null,
})

// Valid full event
const validEvent = projectEventFullSchema.parse({
  id: 'test',
  name: 'Test Event',
  status: 'active',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  deletedAt: null,
  draftConfig: null,
  publishedConfig: null,
  draftVersion: 1,
  publishedVersion: null,
  publishedAt: null,
})
```

---

### Phase 6: Validation

**Run validation gates**:

```bash
cd apps/clementine-app

# Format + Lint + Fix
pnpm check

# Type Check
pnpm type-check

# All should pass with no errors
```

**Standards Compliance Review**:

- [ ] **Project Structure** (`standards/global/project-structure.md`):
  - [ ] Domain created at `@domains/event/` (singular)
  - [ ] Subdomains use correct folder structure (components, containers)
  - [ ] `/shared` folder for domain-wide resources
  - [ ] Barrel exports in every folder

- [ ] **Zod Validation** (`standards/global/zod-validation.md`):
  - [ ] All optional fields use `.nullable().default(null)`
  - [ ] All schemas use `.passthrough()`
  - [ ] TypeScript types exported from schemas

- [ ] **Routing** (`standards/frontend/routing.md`):
  - [ ] File-based routes follow naming convention
  - [ ] Index route uses `beforeLoad` for redirect
  - [ ] Child routes use `<Outlet />` pattern

- [ ] **Design System** (`standards/frontend/design-system.md`):
  - [ ] Use theme tokens (`bg-accent`, `text-accent-foreground`)
  - [ ] No hard-coded colors

- [ ] **Component Libraries** (`standards/frontend/component-libraries.md`):
  - [ ] Use TanStack Router `<Link />` (no custom tab components)
  - [ ] Use shadcn/ui Button for actions (top nav)

---

## Quick Commands Reference

```bash
# Start dev server
cd apps/clementine-app
pnpm dev

# Navigate to event designer (replace with real IDs)
# http://localhost:3000/workspace/{slug}/projects/{projectId}/events/{eventId}

# Format + Lint
pnpm check

# Type check
pnpm type-check

# Run tests (if written)
pnpm test
```

---

## File Locations Quick Reference

| File | Path |
|------|------|
| **Schemas** | |
| ProjectEventConfig | `domains/event/shared/schemas/project-event-config.schema.ts` |
| ProjectEventFull | `domains/event/shared/schemas/project-event-full.schema.ts` |
| **Components** | |
| EventDesignerPage | `domains/event/designer/containers/EventDesignerPage.tsx` |
| **Routes** | |
| Event layout | `app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.tsx` |
| Index redirect | `app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.index.tsx` |
| Welcome tab | `app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.welcome.tsx` |
| Theme tab | `app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.theme.tsx` |
| Settings tab | `app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.settings.tsx` |

---

## Troubleshooting

**Issue**: TypeScript error "Cannot find module '@/domains/event'"
- **Fix**: Ensure barrel exports exist in `domains/event/index.ts`

**Issue**: Route not found (404)
- **Fix**: Check route file naming (must match TanStack Router convention)
- **Fix**: Restart dev server after creating new route files

**Issue**: Schema validation fails
- **Fix**: Check Firestore document has all required fields
- **Fix**: Use `convertFirestoreDoc` helper to convert Timestamps

**Issue**: Tabs don't highlight active state
- **Fix**: Check `useMatchRoute({ to: './welcome' })` uses relative path
- **Fix**: Ensure `className` conditional applies correct styles

**Issue**: Outlet doesn't render child route
- **Fix**: Ensure child routes are created at correct path
- **Fix**: Check `<Outlet />` is present in parent component

---

## Next Steps (After Phase 1)

After completing this implementation:

1. **Phase 2: Welcome Editor** - Implement welcome screen configuration UI
2. **Phase 3: Theme Editor** - Implement theme configuration UI
3. **Phase 4: Settings Editor** - Implement overlays + sharing configuration UI
4. **Phase 5: Publish Workflow** - Implement draft/publish functionality

**Note**: This foundation (Phase 1) provides the structure. Editors are WIP placeholders for now.

---

## Standards & References

- **Zod Validation**: `apps/clementine-app/standards/global/zod-validation.md`
- **Project Structure**: `apps/clementine-app/standards/global/project-structure.md`
- **Client-First Architecture**: `apps/clementine-app/standards/global/client-first-architecture.md`
- **Routing**: `apps/clementine-app/standards/frontend/routing.md`
- **Component Libraries**: `apps/clementine-app/standards/frontend/component-libraries.md`
- **Design System**: `apps/clementine-app/standards/frontend/design-system.md`
