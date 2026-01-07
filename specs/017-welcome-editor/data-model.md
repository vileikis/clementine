# Data Model: Welcome Editor

**Feature**: 017-welcome-editor
**Date**: 2026-01-07

## Overview

The Welcome Editor modifies `event.draftConfig.welcome` which stores the welcome screen configuration for guest-facing experiences.

---

## Entities

### WelcomeConfig

Welcome screen configuration embedded in ProjectEventConfig.

**Location**: `event.draftConfig.welcome` in Firestore

**Zod Schema**:
```typescript
import { z } from 'zod'
import { mediaReferenceSchema } from '@/shared/theming'

export const welcomeConfigSchema = z.object({
  /** Welcome screen title */
  title: z.string().default('Choose your experience'),
  /** Welcome screen description */
  description: z.string().nullable().default(null),
  /** Hero media (image) - uses shared MediaReference type */
  media: mediaReferenceSchema.nullable().default(null),
  /** Experience cards layout */
  layout: z.enum(['list', 'grid']).default('list'),
})

export type WelcomeConfig = z.infer<typeof welcomeConfigSchema>
```

| Field | Type | Default | Nullable | Description |
|-------|------|---------|----------|-------------|
| `title` | `string` | `'Choose your experience'` | No | Welcome screen heading |
| `description` | `string \| null` | `null` | Yes | Welcome screen subtitle/description |
| `media` | `MediaReference \| null` | `null` | Yes | Hero image reference |
| `layout` | `'list' \| 'grid'` | `'list'` | No | Experience cards layout mode |

---

### MediaReference (Reused)

Reference to a media asset stored in Firebase Storage. Defined in `@/shared/theming/schemas/media-reference.schema.ts`.

```typescript
export const mediaReferenceSchema = z.object({
  mediaAssetId: z.string(),
  url: z.string().url(),
})

export type MediaReference = z.infer<typeof mediaReferenceSchema>
```

| Field | Type | Description |
|-------|------|-------------|
| `mediaAssetId` | `string` | MediaAsset document ID from `workspaces/{workspaceId}/mediaAssets/{id}` |
| `url` | `string` | Firebase Storage download URL for immediate rendering |

---

## Schema Integration

### ProjectEventConfig (Modified)

Add welcome field to existing config schema in `apps/clementine-app/src/domains/event/shared/schemas/project-event-config.schema.ts`:

```typescript
import { mediaReferenceSchema } from '@/shared/theming'

// New schema definition
export const welcomeConfigSchema = z.object({
  title: z.string().default('Choose your experience'),
  description: z.string().nullable().default(null),
  media: mediaReferenceSchema.nullable().default(null),
  layout: z.enum(['list', 'grid']).default('list'),
})

// Add to projectEventConfigSchema
export const projectEventConfigSchema = z.looseObject({
  schemaVersion: z.number().default(CURRENT_CONFIG_VERSION),
  theme: themeSchema.nullable().default(null),
  overlays: overlaysConfigSchema,
  sharing: sharingConfigSchema.nullable().default(null),
  welcome: welcomeConfigSchema.nullable().default(null), // NEW
})

// Export type
export type WelcomeConfig = z.infer<typeof welcomeConfigSchema>
```

---

## Firestore Document Structure

### Project Event Document Path
```
projects/{projectId}/events/{eventId}
```

### Document Shape (relevant fields)
```json
{
  "id": "eventId",
  "name": "Event Name",
  "draftConfig": {
    "schemaVersion": 1,
    "theme": { ... },
    "overlays": { ... },
    "sharing": { ... },
    "welcome": {
      "title": "Choose your experience",
      "description": "Welcome to our event!",
      "media": {
        "mediaAssetId": "abc123",
        "url": "https://storage.googleapis.com/..."
      },
      "layout": "list"
    }
  },
  "publishedConfig": { ... },
  "draftVersion": 2,
  "publishedVersion": 1
}
```

---

## Update Schemas

### UpdateWelcome

Schema for partial welcome updates, used by `useUpdateWelcome` hook.

```typescript
// File: apps/clementine-app/src/domains/event/welcome/schemas/welcome.schemas.ts

import { z } from 'zod'
import { mediaReferenceSchema } from '@/shared/theming'

/**
 * Schema for partial welcome updates
 * All fields optional for granular updates
 */
export const updateWelcomeSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  media: mediaReferenceSchema.nullable().optional(),
  layout: z.enum(['list', 'grid']).optional(),
})

export type UpdateWelcome = z.infer<typeof updateWelcomeSchema>
```

---

## Validation Rules

### Title
- Required string (has default)
- No length limit specified
- Empty string allowed (will show default in UI)

### Description
- Nullable string
- No length limit specified
- `null` means no description displayed

### Media
- Nullable MediaReference
- Must have valid `mediaAssetId` and `url` if present
- `null` means no hero image displayed

### Layout
- Enum: `'list'` or `'grid'`
- Defaults to `'list'`
- Always required (non-nullable)

---

## Default Values

```typescript
// File: apps/clementine-app/src/domains/event/welcome/constants/defaults.ts

import type { WelcomeConfig } from '../schemas/welcome.schemas'

export const DEFAULT_WELCOME: WelcomeConfig = {
  title: 'Choose your experience',
  description: null,
  media: null,
  layout: 'list',
}
```

---

## State Transitions

No explicit state machine. Welcome configuration is:
- **Created**: When first welcome field is set
- **Updated**: On any field change via auto-save
- **Cleared**: When all fields reset to defaults (rare)

---

## Relationships

```
ProjectEvent
    └── draftConfig: ProjectEventConfig
            ├── theme: Theme | null
            ├── overlays: OverlaysConfig | null
            ├── sharing: SharingConfig | null
            └── welcome: WelcomeConfig | null  <-- NEW
                    └── media: MediaReference | null
                            └── references: MediaAsset (by mediaAssetId)
```

---

## Migration Notes

### Backward Compatibility
- `welcome` field is nullable with default `null`
- Existing events without welcome field will show DEFAULT_WELCOME
- No migration script needed - schema uses `z.looseObject()` for forward compatibility

### New Events
- `draftConfig.welcome` starts as `null`
- First save creates the welcome object with defaults
