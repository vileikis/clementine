# 011: Events Domain Backbone

**Status**: Draft
**Created**: 2026-01-05
**Domain**: Events (Guest-Facing Configuration)

## Overview

Create the foundational architecture for the **Events Domain** in the TanStack Start app. This domain handles **guest-facing event configuration** (theme, overlays, sharing settings) and provides a visual event designer interface.

This is **separate from** the existing `@domains/project/events/` which handles basic event CRUD (name, status, timestamps). Both domains work with the same Firestore documents but manage different concerns:

- **`@domains/project/events/`** - Admin view (event list, create, delete, basic metadata)
- **`@domains/event/`** - Designer view (guest experience configuration)

## Domain Structure

Create new domain at `@apps/clementine-app/src/domains/event/` with the following structure:

```
src/domains/event/
├── designer/                # Designer shell and layout
│   ├── components/          # Designer-specific components
│   ├── containers/          # EventDesignerPage container
│   └── index.ts
├── welcome/                 # Welcome tab editor
│   ├── components/
│   ├── containers/
│   └── index.ts
├── theme/                   # Theme tab editor
│   ├── components/
│   ├── containers/
│   └── index.ts
├── settings/                # Settings tab (overlays, sharing)
│   ├── components/
│   ├── containers/
│   └── index.ts
├── shared/                  # Domain-wide shared resources
│   ├── schemas/             # Event configuration schemas
│   │   ├── project-event-config.schema.ts
│   │   ├── project-event-full.schema.ts
│   │   └── index.ts
│   ├── hooks/               # Domain-wide hooks
│   │   └── useProjectEvent.ts
│   └── types/               # Shared types
│       └── index.ts
└── index.ts
```

## Data Model

### Schema Architecture

The event data model consists of two parts:

1. **Admin Metadata** (existing in `@domains/project/events/schemas/project-event.schema.ts`)
   - `id`, `name`, `status`, `createdAt`, `updatedAt`, `deletedAt`
   - Managed by project events domain (event list, create, archive)

2. **Guest-Facing Configuration** (new in `@domains/event/shared/schemas/`)
   - `draftConfig`, `publishedConfig`, versioning fields
   - Managed by events domain (event designer)

**Two schemas for different domain views**:
- `@domains/project/events/schemas/project-event.schema.ts` - Lightweight (admin view)
- `@domains/event/shared/schemas/project-event-full.schema.ts` - Complete with config (designer view)

### ProjectEventConfig Schema

Create `@domains/event/shared/schemas/project-event-config.schema.ts`:

```typescript
import { z } from 'zod'
import { themeSchema } from '@/shared/theming/schemas/theme.schemas'

/**
 * Project Event Config Schema - Guest-facing configuration only
 *
 * For admin fields (name, status), see @domains/project/events/schemas/project-event.schema.ts
 *
 * This schema defines the configuration that guests interact with when
 * they visit an event. It includes theme, overlays, and sharing settings.
 */

/**
 * Schema version for future migrations
 */
export const CURRENT_CONFIG_VERSION = 1

/**
 * Overlays configuration for different aspect ratios
 */
export const overlaysConfigSchema = z.object({
  '1:1': z.string().url().nullable().default(null),    // Square overlay image URL
  '9:16': z.string().url().nullable().default(null),   // Portrait overlay image URL
}).nullable().default(null)

/**
 * Social media sharing configuration
 */
export const socialSharingConfigSchema = z.object({
  email: z.boolean().default(false),
  instagram: z.boolean().default(false),
  facebook: z.boolean().default(false),
  linkedin: z.boolean().default(false),
  twitter: z.boolean().default(false),
  tiktok: z.boolean().default(false),
  telegram: z.boolean().default(false),
})

/**
 * Sharing configuration
 */
export const sharingConfigSchema = z.object({
  downloadEnabled: z.boolean().default(true),
  copyLinkEnabled: z.boolean().default(true),
  socials: socialSharingConfigSchema.nullable().default(null),
})

/**
 * Complete event configuration for guest-facing settings
 *
 * Firestore-safe: All optional fields use .nullable().default(null)
 * or .default([]) for arrays to prevent undefined values
 */
export const projectEventConfigSchema = z.object({
  // Schema version for migrations
  schemaVersion: z.number().default(CURRENT_CONFIG_VERSION),

  // Theme configuration (full embedded object)
  theme: themeSchema.nullable().default(null),

  // Overlays for different aspect ratios
  overlays: overlaysConfigSchema,

  // Sharing settings
  sharing: sharingConfigSchema.nullable().default(null),
}).passthrough() // Allow unknown fields for future schema evolution

/**
 * Inferred TypeScript types
 */
export type ProjectEventConfig = z.infer<typeof projectEventConfigSchema>
export type OverlaysConfig = z.infer<typeof overlaysConfigSchema>
export type SharingConfig = z.infer<typeof sharingConfigSchema>
export type SocialSharingConfig = z.infer<typeof socialSharingConfigSchema>
```

### Full Project Event Schema (Events Domain)

Create `@domains/event/shared/schemas/project-event-full.schema.ts`:

```typescript
import { z } from 'zod'
import { projectEventConfigSchema } from './project-event-config.schema'

/**
 * Full Project Event Schema - Events domain view
 *
 * This schema includes both admin fields AND guest-facing configuration.
 * Used by the event designer for managing complete event documents.
 *
 * For lightweight admin-only schema, see @domains/project/events/schemas/project-event.schema.ts
 */
export const projectEventFullSchema = z.object({
  // Admin metadata (also in project domain schema)
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'archived']).default('active'),
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

/**
 * Inferred TypeScript type
 */
export type ProjectEventFull = z.infer<typeof projectEventFullSchema>
```

**Note**: The existing `@domains/project/events/schemas/project-event.schema.ts` remains **unchanged**. No modifications needed to the project domain schema.

## UI Architecture

### EventDesignerPage Layout

Create `@domains/event/designer/containers/EventDesignerPage.tsx`:

**Layout**: 2-column design with vertical tabs

```
┌─────────────────────────────────────────────┐
│  Event Name                      [Publish]  │  ← Top bar (from existing route)
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Welcome  │                                  │
│          │                                  │
│ Theme    │         <Outlet />               │  ← Right: Content area
│          │                                  │
│ Settings │                                  │
│          │                                  │
└──────────┴──────────────────────────────────┘
   ↑ Left: Vertical tabs
```

**Key Features**:
- **Left sidebar**: Vertical tabs for navigation (Welcome, Theme, Settings)
- **Right area**: Outlet renders the active tab's content
- **Top bar**: Event name and publish button (from parent route)
- **Active state**: Highlight current tab

**Component Structure**:

```typescript
import { Outlet, Link, useMatchRoute } from '@tanstack/react-router'

export function EventDesignerPage() {
  const matchRoute = useMatchRoute()

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
          {tabs.map(tab => {
            const isActive = matchRoute({ to: tab.href })
            return (
              <Link
                key={tab.id}
                to={tab.href}
                className={/* active styles */}
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

## Routing

Update routes in `@app/workspace/$workspaceSlug.projects/$projectId.events/`:

### Route Structure

```
/workspace/:workspaceSlug/projects/:projectId/events/:eventId
  ├── (index) → Redirects to ./welcome
  ├── /welcome → WelcomePage (WIP)
  ├── /theme → ThemePage (WIP)
  └── /settings → SettingsPage (WIP)
```

### Route Files

**1. Update `$eventId.tsx`** (existing file):

Replace the BODY section with `<EventDesignerPage />`:

```typescript
// Add import
import { EventDesignerPage } from '@/domains/event/designer'

export default function EventRoute() {
  return (
    <div>
      {/* TOP BAR (keep existing) */}
      <header>...</header>

      {/* BODY (replace with designer) */}
      <EventDesignerPage />
    </div>
  )
}
```

**2. Create `$eventId.index.tsx`** (new file):

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/workspace/$workspaceSlug/projects/$projectId/events/$eventId/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/workspace/$workspaceSlug/projects/$projectId/events/$eventId/welcome',
      params,
    })
  },
})
```

**3. Create `$eventId.welcome.tsx`** (new file):

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/workspace/$workspaceSlug/projects/$projectId/events/$eventId/welcome')({
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

**4. Create `$eventId.theme.tsx`** (new file):

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/workspace/$workspaceSlug/projects/$projectId/events/$eventId/theme')({
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

**5. Create `$eventId.settings.tsx`** (new file):

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/workspace/$workspaceSlug/projects/$projectId/events/$eventId/settings')({
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

## Implementation Phases

### Phase 1: Foundation (This Requirement)

- [ ] Create domain folder structure at `@domains/event/`
- [ ] Create `/shared` folder with schemas, hooks, types subdirectories
- [ ] Create ProjectEventConfig schema with Firestore-safe patterns
- [ ] Create ProjectEventFull schema (complete view for designer)
- [ ] Create EventDesignerPage with vertical tabs layout in `/designer`
- [ ] Create route files with WIP placeholders
- [ ] Test navigation between tabs

### Phase 2: Welcome Editor (Future)

- Implement welcome screen configuration
- Text, images, call-to-action buttons
- Preview functionality

### Phase 3: Theme Editor (Future)

- Implement theme configuration UI
- Color pickers, font selection
- Live preview

### Phase 4: Settings Editor (Future)

- Implement overlays upload/management
- Implement sharing configuration
- Social media toggles

### Phase 5: Publish Workflow (Future)

- Draft/publish functionality
- Version comparison
- Rollback support

## Out of Scope (For Now)

- ❌ **Experiences**: Will have its own schema, added to EventConfig later
- ❌ **Welcome Editor Implementation**: WIP placeholder only
- ❌ **Theme Editor Implementation**: WIP placeholder only
- ❌ **Settings Editor Implementation**: WIP placeholder only
- ❌ **Publish/Draft Workflow**: Schema ready, UI later
- ❌ **Schema Migration**: No migration needed, additive changes only

## Key Decisions & Notes

### 1. Domain Structure with `/shared`

**Decision**: Use `/shared` folder for domain-wide resources (schemas, hooks, types).

**Rationale**:
- Schemas used across all subdomains (welcome, theme, settings)
- Hooks like `useProjectEvent` are domain-wide utilities
- Follows DDD pattern - shared kernel within bounded context
- Keeps `/designer` focused on layout/shell components

### 2. Schema Location

**Decision**: Keep schemas in app (`@domains/event/shared/schemas/`), not shared package.

**Rationale**:
- Theme schemas are app-specific (in `@/shared/theming/schemas/`)
- Functions don't currently need project event schemas
- YAGNI principle - don't over-engineer for hypothetical needs
- Can be extracted later if needed

### 3. Two Schema Files for Different Domain Views

**Decision**: Create two separate schemas with different names:
- `@domains/project/events/schemas/project-event.schema.ts` - Lightweight (admin view)
- `@domains/event/shared/schemas/project-event-full.schema.ts` - Complete (designer view)

**Rationale**:
- Different bounded contexts have different views of same entity
- Project domain doesn't need config complexity (just name, status, timestamps)
- Events domain needs complete view for designer operations
- Different names (`project-event-full.schema.ts`) prevent confusion
- No modifications needed to existing project domain schema

### 4. Lazy Config Initialization

**Decision**: Don't create `draftConfig` on event creation. Create on first edit.

**Rationale**:
- Event creation = lightweight (name, status only)
- Config creation = happens when user opens designer for first time
- Keeps initial event creation simple
- Avoids creating unused data

### 5. Draft Version Starts at 1

**Decision**: `draftVersion: z.number().default(1)` (not 0)

**Rationale**:
- More intuitive for users (Version 1, 2, 3...)
- Matches semantic versioning conventions
- "Version 0" feels weird to non-technical users
- Clear state: `publishedVersion: null` = never published

### 6. Singular Domain Name

**Decision**: Use `event` (singular), not `events` (plural).

**Rationale**:
- Consistency with other domains (`project`, `workspace`)
- DDD convention - domain represents a bounded context, not a collection
- Path: `@domains/event/`

### 7. `/designer` Folder (Not Nested `/event-designer`)

**Decision**: Use `/designer` at domain root, not nested `/event-designer` subdomain.

**Rationale**:
- `EventDesignerPage` is the shell/layout, not a subdomain
- Designer may have its own components (toolbar, preview panel)
- Keeps separation between designer shell and content editors (welcome, theme, settings)
- More explicit about what the folder contains

### 8. No Create Schema

**Decision**: No `createProjectEventConfigSchema` needed.

**Rationale**:
- Config created during first update (lazy initialization)
- Each editor handles partial updates to its section
- Full schema used for validation, not creation

### 9. Embedded Theme

**Decision**: Embed full `themeSchema` object in EventConfig.

**Rationale**:
- Self-contained configuration
- Easy to version and publish as a unit
- No need for theme reference resolution
- Clear ownership of theme settings per event

### 10. Simple Sharing Config

**Decision**: Use boolean flags for social media (enable/disable only).

**Rationale**:
- Keep initial version simple
- Can extend later with platform-specific config (hashtags, handles)
- Meets current requirements

## Acceptance Criteria

### Domain Structure
- [ ] Domain folder structure created at `@domains/event/` (singular)
- [ ] `/shared` folder created with schemas, hooks, types subdirectories
- [ ] `/designer` folder created (not nested `/event-designer`)
- [ ] All subdomain folders have proper index.ts exports
- [ ] Folder structure follows DDD principles

### Schemas
- [ ] `projectEventConfigSchema` created at `@domains/event/shared/schemas/project-event-config.schema.ts`
- [ ] `projectEventFullSchema` created at `@domains/event/shared/schemas/project-event-full.schema.ts`
- [ ] All optional fields use `.nullable().default(null)` or `.default([])`
- [ ] Schemas include `passthrough()` for evolution
- [ ] TypeScript types exported from both schemas
- [ ] Cross-reference comments added to both schema files
- [ ] `draftVersion` defaults to 1 (not 0)
- [ ] Existing `@domains/project/events/schemas/project-event.schema.ts` remains unchanged

### UI Components
- [ ] `EventDesignerPage` created with 2-column layout
- [ ] Vertical tabs render correctly
- [ ] Active tab highlights correctly
- [ ] Outlet renders child routes

### Routing
- [ ] All route files created
- [ ] Index route redirects to welcome
- [ ] All tab routes show WIP placeholders
- [ ] Navigation between tabs works
- [ ] URL updates correctly

### Code Quality
- [ ] Follows Zod validation standards (`@standards/global/zod-validation.md`)
- [ ] Follows project structure standards (`@standards/global/project-structure.md`)
- [ ] TypeScript strict mode passes
- [ ] No console errors or warnings

## References

- **Zod Validation Standards**: `@standards/global/zod-validation.md`
- **Project Structure**: `@standards/global/project-structure.md`
- **Client-First Architecture**: `@standards/global/client-first-architecture.md`
- **Theme Schemas**: `@apps/clementine-app/src/shared/theming/schemas/theme.schemas.ts`
- **Existing Event Schema** (Project Domain): `@apps/clementine-app/src/domains/project/events/schemas/project-event.schema.ts`
- **Event Route**: `@apps/clementine-app/src/app/workspace/$workspaceSlug.projects/$projectId.events/$eventId.tsx`

## Future Considerations

- **Experiences Integration**: EventConfig will eventually include experience configurations
- **Advanced Sharing**: Social media configs may need platform-specific settings
- **Theme Inheritance**: Consider project-level theme defaults that events can override
- **Version History**: UI for viewing/comparing draft vs published versions
- **Rollback**: Ability to rollback to previous published versions
- **Analytics**: Track which config versions perform best
