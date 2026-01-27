# Data Model: Flatten Project/Event Structure

**Feature**: 042-flatten-structure-refactor
**Date**: 2026-01-26

## Overview

This document defines the **new** flattened data model that merges `ProjectEvent` configuration directly into the `Project` entity. The events subcollection is eliminated.

---

## Entity: Project (Updated)

**Firestore Path**: `/projects/{projectId}`

### Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | - | Firestore document ID |
| `name` | string | Yes | - | Project name (1-100 chars) |
| `workspaceId` | string | Yes | - | Parent workspace ID |
| `status` | ProjectStatus | Yes | - | Lifecycle state |
| `type` | ProjectType | Yes | `'standard'` | Project type |
| `draftConfig` | ProjectConfig \| null | No | `null` | Working configuration |
| `publishedConfig` | ProjectConfig \| null | No | `null` | Live configuration |
| `draftVersion` | number | Yes | `1` | Draft revision counter |
| `publishedVersion` | number \| null | No | `null` | Last published version |
| `publishedAt` | number \| null | No | `null` | Timestamp of last publish |
| `createdAt` | number | Yes | - | Creation timestamp (Unix ms) |
| `updatedAt` | number | Yes | - | Last update timestamp (Unix ms) |
| `deletedAt` | number \| null | No | `null` | Soft delete timestamp |

### Removed Fields

| Field | Reason |
|-------|--------|
| `activeEventId` | No longer needed - config embedded in project |

### Schema Definition

```typescript
// packages/shared/src/schemas/project/project.schema.ts

import { z } from 'zod'
import { projectConfigSchema } from './project-config.schema'

export const projectStatusSchema = z.enum(['draft', 'live', 'deleted'])
export const projectTypeSchema = z.enum(['standard', 'ghost'])

export const projectSchema = z.looseObject({
  // Identity
  id: z.string().min(1, 'Project ID is required'),
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  workspaceId: z.string().min(1, 'Workspace ID is required'),

  // Status
  status: projectStatusSchema,
  type: projectTypeSchema.default('standard'),

  // Configuration (NEW - from ProjectEventFull)
  draftConfig: projectConfigSchema.nullable().default(null),
  publishedConfig: projectConfigSchema.nullable().default(null),

  // Versioning (NEW - from ProjectEventFull)
  draftVersion: z.number().default(1),
  publishedVersion: z.number().nullable().default(null),
  publishedAt: z.number().nullable().default(null),

  // Timestamps
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable().default(null),
})

export type Project = z.infer<typeof projectSchema>
export type ProjectStatus = z.infer<typeof projectStatusSchema>
export type ProjectType = z.infer<typeof projectTypeSchema>
```

---

## Entity: ProjectConfig (Renamed)

**Embedded in**: `Project.draftConfig` and `Project.publishedConfig`

Previously named `ProjectEventConfig`.

### Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `schemaVersion` | number | Yes | `1` | Schema version for migrations |
| `overlays` | OverlaysConfig \| null | No | `null` | Overlay images by aspect ratio |
| `shareOptions` | ShareOptionsConfig \| null | No | `null` | Sharing platform toggles |
| `share` | ShareConfig \| null | No | `null` | Share screen text/CTA |
| `welcome` | WelcomeConfig \| null | No | `null` | Welcome screen config |
| `theme` | Theme \| null | No | `null` | Visual theming |
| `experiences` | ExperiencesConfig \| null | No | `null` | Experience references |

### Schema Definition

```typescript
// packages/shared/src/schemas/project/project-config.schema.ts
// (renamed from event/project-event-config.schema.ts)

import { z } from 'zod'
import { mediaReferenceSchema, overlayReferenceSchema } from '../media/media-reference.schema'
import { themeSchema } from '../theme'
import { experiencesConfigSchema } from './experiences.schema'

export const CURRENT_CONFIG_VERSION = 1

export const overlaysConfigSchema = z
  .object({
    '1:1': overlayReferenceSchema.default(null),
    '9:16': overlayReferenceSchema.default(null),
  })
  .nullable()
  .default(null)

export const shareOptionsConfigSchema = z.object({
  download: z.boolean().default(true),
  copyLink: z.boolean().default(true),
  email: z.boolean().default(false),
  instagram: z.boolean().default(false),
  facebook: z.boolean().default(false),
  linkedin: z.boolean().default(false),
  twitter: z.boolean().default(false),
  tiktok: z.boolean().default(false),
  telegram: z.boolean().default(false),
})

export const ctaConfigSchema = z.object({
  label: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
})

export const shareConfigSchema = z.object({
  title: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  cta: ctaConfigSchema.nullable().default(null),
})

export const welcomeConfigSchema = z.object({
  title: z.string().default('Choose your experience'),
  description: z.string().nullable().default(null),
  media: mediaReferenceSchema.nullable().default(null),
  layout: z.enum(['list', 'grid']).default('list'),
})

export const projectConfigSchema = z.looseObject({
  schemaVersion: z.number().default(CURRENT_CONFIG_VERSION),
  overlays: overlaysConfigSchema,
  shareOptions: shareOptionsConfigSchema.nullable().default(null),
  share: shareConfigSchema.nullable().default(null),
  welcome: welcomeConfigSchema.nullable().default(null),
  theme: themeSchema.nullable().default(null),
  experiences: experiencesConfigSchema.nullable().default(null),
})

export type ProjectConfig = z.infer<typeof projectConfigSchema>
export type OverlaysConfig = z.infer<typeof overlaysConfigSchema>
export type ShareOptionsConfig = z.infer<typeof shareOptionsConfigSchema>
export type WelcomeConfig = z.infer<typeof welcomeConfigSchema>
export type CtaConfig = z.infer<typeof ctaConfigSchema>
export type ShareConfig = z.infer<typeof shareConfigSchema>
```

---

## Entity: Session (Updated)

**Firestore Path**: `/projects/{projectId}/sessions/{sessionId}`

### Removed Fields

| Field | Reason |
|-------|--------|
| `eventId` | Redundant - sessions already have `projectId` |

### Updated Schema

```typescript
// packages/shared/src/schemas/session/session.schema.ts

export const sessionSchema = z.looseObject({
  // Identity
  id: z.string(),

  // Context
  projectId: z.string(),           // Links to project (unchanged)
  workspaceId: z.string(),         // For analytics (unchanged)
  // eventId: REMOVED - no longer needed
  experienceId: z.string(),        // Specific experience (unchanged)

  // Mode
  mode: sessionModeSchema,
  configSource: configSourceSchema,

  // ... rest unchanged
})
```

---

## Deleted Entities

### ProjectEventFull

**Previous Path**: `/projects/{projectId}/events/{eventId}`

**Status**: DELETED - merged into `Project`

All fields from `ProjectEventFull` are now either:
- Merged into `Project` (config fields, versioning)
- Eliminated (redundant id, name, status)

### ProjectEventStatus

**Previous Definition**: `z.enum(['active', 'deleted'])`

**Status**: DELETED - `ProjectStatus` on Project handles lifecycle

---

## Relationships

### Before (Nested)

```
Workspace (1) ──────────► Experience (N)
     │
     │
Project (1) ───► activeEventId ───► ProjectEvent (1)
     │                                    │
     │                                    └─► draftConfig
     │                                    └─► publishedConfig
     │
     └───────────────────────────────────► Session (N)
                                               │
                                               └─► eventId (nullable)
```

### After (Flattened)

```
Workspace (1) ──────────► Experience (N)
     │
     │
Project (1) ───► draftConfig
     │       └─► publishedConfig
     │
     └───────────────────────────────────► Session (N)
```

---

## Collection Structure

### Before

```
/workspaces/{workspaceId}
  └── /experiences/{experienceId}

/projects/{projectId}
  ├── /events/{eventId}              # DELETED
  ├── /sessions/{sessionId}
  ├── /jobs/{jobId}
  └── /guests/{guestId}
```

### After

```
/workspaces/{workspaceId}
  └── /experiences/{experienceId}

/projects/{projectId}                 # Now contains config directly
  ├── /sessions/{sessionId}           # Unchanged path
  ├── /jobs/{jobId}                   # Unchanged path
  └── /guests/{guestId}               # Unchanged path
```

---

## Type Aliases (Backward Compatibility)

For gradual migration, export aliases that point to new types:

```typescript
// packages/shared/src/schemas/project/index.ts

// New exports
export * from './project.schema'
export * from './project-config.schema'
export * from './experiences.schema'

// Backward compatibility aliases
export { projectConfigSchema as projectEventConfigSchema } from './project-config.schema'
export type { ProjectConfig as ProjectEventConfig } from './project-config.schema'
```

These aliases can be removed after migration is complete and all consumers are updated.

---

## Migration Notes

### Firestore Document Transformation

```typescript
// Before: Two documents
// /projects/proj-123
{
  id: "proj-123",
  name: "My Project",
  workspaceId: "ws-456",
  status: "live",
  type: "standard",
  activeEventId: "evt-789",
  createdAt: 1706299200000,
  updatedAt: 1706299200000,
  deletedAt: null
}

// /projects/proj-123/events/evt-789
{
  id: "evt-789",
  name: "Main Event",
  status: "active",
  draftConfig: { /* ... */ },
  publishedConfig: { /* ... */ },
  draftVersion: 3,
  publishedVersion: 2,
  publishedAt: 1706299200000,
  createdAt: 1706299200000,
  updatedAt: 1706299200000,
  deletedAt: null
}

// After: Single document
// /projects/proj-123
{
  id: "proj-123",
  name: "My Project",
  workspaceId: "ws-456",
  status: "live",
  type: "standard",
  // activeEventId: REMOVED
  draftConfig: { /* merged from event */ },
  publishedConfig: { /* merged from event */ },
  draftVersion: 3,
  publishedVersion: 2,
  publishedAt: 1706299200000,
  createdAt: 1706299200000,
  updatedAt: 1706299200000,
  deletedAt: null
}
```

### Session Document Transformation

```typescript
// Before
{
  id: "sess-123",
  projectId: "proj-123",
  eventId: "evt-789",        // REMOVED
  experienceId: "exp-456",
  // ... rest
}

// After
{
  id: "sess-123",
  projectId: "proj-123",
  // eventId: REMOVED (field simply not written)
  experienceId: "exp-456",
  // ... rest
}
```

Existing sessions with `eventId` will continue to work due to `z.looseObject()` - the field is simply ignored when parsing.
