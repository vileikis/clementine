# Data Model: Events Domain Backbone

**Feature**: Events Domain Backbone
**Date**: 2026-01-05
**Status**: Complete

## Overview

This document defines the data model for the Events Domain. The model separates admin metadata (managed by `@domains/project/events/`) from guest-facing configuration (managed by `@domains/event/`), with both domains working on the same Firestore documents but managing different concerns.

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────┐
│ Project (Firestore: /projects/{projectId})          │
│                                                      │
│ - id: string                                         │
│ - name: string                                       │
│ - status: 'active' | 'deleted'                       │
│ - createdAt: number                                  │
│ - updatedAt: number                                  │
│ - ...                                                │
└─────────────────────────────────────────────────────┘
                        │
                        │ has many
                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ ProjectEvent (Firestore: /projects/{projectId}/events/{eventId})        │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐  │
│ │ ADMIN METADATA (managed by @domains/project/events/)              │  │
│ │                                                                    │  │
│ │ - id: string                                                       │  │
│ │ - name: string                                                     │  │
│ │ - status: 'active' | 'deleted'                                     │  │
│ │ - createdAt: number                                                │  │
│ │ - updatedAt: number                                                │  │
│ │ - deletedAt: number | null                                         │  │
│ └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐  │
│ │ GUEST-FACING CONFIG (managed by @domains/event/)                  │  │
│ │                                                                    │  │
│ │ - draftConfig: ProjectEventConfig | null                          │  │
│ │ - publishedConfig: ProjectEventConfig | null                      │  │
│ │ - draftVersion: number (default: 1)                               │  │
│ │ - publishedVersion: number | null                                 │  │
│ │ - publishedAt: number | null                                      │  │
│ └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                        │
                        │ embeds
                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ ProjectEventConfig (embedded object, not separate Firestore doc)        │
│                                                                          │
│ - schemaVersion: number (default: 1)                                    │
│ - theme: Theme | null (full embedded object)                            │
│ - overlays: OverlaysConfig | null                                       │
│ - sharing: SharingConfig | null                                         │
└─────────────────────────────────────────────────────────────────────────┘
                        │
                        │ embeds
                        ▼
┌──────────────────────────────────────────────────┐
│ Theme (embedded in ProjectEventConfig.theme)     │
│                                                   │
│ - fontFamily: string | null                      │
│ - primaryColor: string (hex)                     │
│ - text: ThemeText                                │
│ - button: ThemeButton                            │
│ - background: ThemeBackground                    │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ OverlaysConfig (embedded in config.overlays)     │
│                                                   │
│ - "1:1": string (URL) | null                     │
│ - "9:16": string (URL) | null                    │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ SharingConfig (embedded in config.sharing)       │
│                                                   │
│ - downloadEnabled: boolean                       │
│ - copyLinkEnabled: boolean                       │
│ - socials: SocialSharingConfig | null            │
└──────────────────────────────────────────────────┘
```

## Entities

### ProjectEvent (Firestore Document)

**Collection Path**: `/projects/{projectId}/events/{eventId}`

**Description**: Represents an event within a project. Contains both admin metadata (name, status, timestamps) and guest-facing configuration (theme, overlays, sharing). Different domains manage different aspects of the same document.

**Schema Views**:
1. **Project Domain View** (`project-event.schema.ts`) - Admin metadata only
2. **Event Domain View** (`project-event-full.schema.ts`) - Complete document with config

**Fields**:

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `id` | string | Yes | (Firestore ID) | min(1) | Unique event identifier |
| `name` | string | Yes | "Untitled event" | min(1), max(100) | Event display name |
| `status` | enum | Yes | `'active'` | `'active' \| 'deleted'` | Event lifecycle status |
| `createdAt` | number | Yes | `Date.now()` | positive integer | Unix timestamp (ms) |
| `updatedAt` | number | Yes | `Date.now()` | positive integer | Unix timestamp (ms) |
| `deletedAt` | number \| null | Yes | `null` | positive integer \| null | Soft delete timestamp |
| `draftConfig` | ProjectEventConfig \| null | No | `null` | (see ProjectEventConfig) | Draft guest configuration |
| `publishedConfig` | ProjectEventConfig \| null | No | `null` | (see ProjectEventConfig) | Published guest configuration |
| `draftVersion` | number | No | `1` | positive integer | Draft version number |
| `publishedVersion` | number \| null | No | `null` | positive integer \| null | Published version number |
| `publishedAt` | number \| null | No | `null` | positive integer \| null | Publish timestamp (ms) |

**State Transitions**:

```
┌─────────────┐
│   created   │ status = 'active', deletedAt = null, draftConfig = null
│             │ (Admin metadata only)
└──────┬──────┘
       │
       │ User opens designer
       ▼
┌─────────────┐
│ first edit  │ draftConfig created (lazy initialization)
│             │ draftVersion = 1
└──────┬──────┘
       │
       │ User makes changes
       ▼
┌─────────────┐
│   editing   │ draftConfig updated
│             │ updatedAt updated
└──────┬──────┘
       │
       │ User publishes
       ▼
┌─────────────┐
│  published  │ publishedConfig = draftConfig (snapshot)
│             │ publishedVersion = draftVersion
│             │ publishedAt = Date.now()
└──────┬──────┘
       │
       │ User makes more changes
       ▼
┌─────────────┐
│   editing   │ draftConfig updated
│             │ draftVersion++
│             │ (publishedConfig unchanged)
└──────┬──────┘
       │
       │ User deletes event
       ▼
┌─────────────┐
│   deleted   │ status = 'deleted'
│             │ deletedAt = Date.now()
└─────────────┘
```

**Firestore Example**:

```json
{
  "id": "evt_abc123",
  "name": "Summer Festival 2026",
  "status": "active",
  "createdAt": 1735980000000,
  "updatedAt": 1735990000000,
  "deletedAt": null,
  "draftConfig": {
    "schemaVersion": 1,
    "theme": {
      "fontFamily": "Poppins",
      "primaryColor": "#FF6B6B",
      "text": {
        "color": "#1A1A1A",
        "alignment": "center"
      },
      "button": {
        "backgroundColor": "#FF6B6B",
        "textColor": "#FFFFFF",
        "radius": "md"
      },
      "background": {
        "color": "#F5F5F5",
        "image": "https://storage.googleapis.com/...",
        "overlayOpacity": 0.5
      }
    },
    "overlays": {
      "1:1": "https://storage.googleapis.com/square.png",
      "9:16": "https://storage.googleapis.com/portrait.png"
    },
    "sharing": {
      "downloadEnabled": true,
      "copyLinkEnabled": true,
      "socials": {
        "email": false,
        "instagram": true,
        "facebook": true,
        "linkedin": false,
        "twitter": false,
        "tiktok": false,
        "telegram": false
      }
    }
  },
  "publishedConfig": null,
  "draftVersion": 1,
  "publishedVersion": null,
  "publishedAt": null
}
```

---

### ProjectEventConfig (Embedded Object)

**Description**: Guest-facing event configuration. Contains all settings that affect the guest experience (theme, overlays, sharing). Embedded within ProjectEvent as `draftConfig` or `publishedConfig`.

**Fields**:

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `schemaVersion` | number | Yes | `1` | positive integer | Config schema version |
| `theme` | Theme \| null | No | `null` | (see Theme) | Visual theme settings |
| `overlays` | OverlaysConfig \| null | No | `null` | (see OverlaysConfig) | Aspect ratio overlays |
| `sharing` | SharingConfig \| null | No | `null` | (see SharingConfig) | Sharing settings |

**Schema Pattern**:
```typescript
export const projectEventConfigSchema = z.object({
  schemaVersion: z.number().default(1),
  theme: themeSchema.nullable().default(null),
  overlays: overlaysConfigSchema,
  sharing: sharingConfigSchema.nullable().default(null),
}).passthrough() // Allow unknown fields for future evolution
```

---

### Theme (Embedded Object)

**Description**: Visual theme configuration. Embedded within ProjectEventConfig. Uses existing `themeSchema` from `@/shared/theming/schemas/theme.schemas.ts`.

**Fields**: (See existing theme.schemas.ts)

- `fontFamily`: string | null
- `primaryColor`: string (hex color)
- `text`: ThemeText { color, alignment }
- `button`: ThemeButton { backgroundColor, textColor, radius }
- `background`: ThemeBackground { color, image, overlayOpacity }

**Reference**: `apps/clementine-app/src/shared/theming/schemas/theme.schemas.ts:42-48`

---

### OverlaysConfig (Embedded Object)

**Description**: Overlay image URLs for different aspect ratios. Applied to guest photos based on their orientation.

**Fields**:

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `1:1` | string \| null | No | `null` | URL format | Square overlay image |
| `9:16` | string \| null | No | `null` | URL format | Portrait overlay image |

**Schema Pattern**:
```typescript
export const overlaysConfigSchema = z.object({
  '1:1': z.string().url().nullable().default(null),
  '9:16': z.string().url().nullable().default(null),
}).nullable().default(null)
```

**Note**: Field names use string keys (`'1:1'`, `'9:16'`) because TypeScript object keys cannot start with numbers.

---

### SharingConfig (Embedded Object)

**Description**: Guest sharing preferences. Controls which sharing options are available to guests after generating photos.

**Fields**:

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `downloadEnabled` | boolean | Yes | `true` | boolean | Allow photo download |
| `copyLinkEnabled` | boolean | Yes | `true` | boolean | Allow copy share link |
| `socials` | SocialSharingConfig \| null | No | `null` | (see SocialSharingConfig) | Social media platforms |

**Schema Pattern**:
```typescript
export const sharingConfigSchema = z.object({
  downloadEnabled: z.boolean().default(true),
  copyLinkEnabled: z.boolean().default(true),
  socials: socialSharingConfigSchema.nullable().default(null),
})
```

---

### SocialSharingConfig (Embedded Object)

**Description**: Social media platform enable/disable flags.

**Fields**:

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `email` | boolean | Yes | `false` | boolean | Email sharing enabled |
| `instagram` | boolean | Yes | `false` | boolean | Instagram sharing enabled |
| `facebook` | boolean | Yes | `false` | boolean | Facebook sharing enabled |
| `linkedin` | boolean | Yes | `false` | boolean | LinkedIn sharing enabled |
| `twitter` | boolean | Yes | `false` | boolean | Twitter sharing enabled |
| `tiktok` | boolean | Yes | `false` | boolean | TikTok sharing enabled |
| `telegram` | boolean | Yes | `false` | boolean | Telegram sharing enabled |

**Schema Pattern**:
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

---

## Schema Files

### 1. Project Domain Schema (Existing - Unchanged)

**Path**: `apps/clementine-app/src/domains/project/events/schemas/project-event.schema.ts`

**Purpose**: Lightweight admin view (event list, CRUD operations)

**Fields**: Admin metadata only
- id, name, status, createdAt, updatedAt, deletedAt

**Used By**:
- Event list page
- Event creation
- Event deletion
- Event basic info updates

**Note**: This schema remains unchanged. No modifications needed.

---

### 2. Event Config Schema (New)

**Path**: `apps/clementine-app/src/domains/event/shared/schemas/project-event-config.schema.ts`

**Purpose**: Guest-facing configuration validation

**Fields**: Guest-facing settings only
- schemaVersion, theme, overlays, sharing

**Used By**:
- Event designer (draft config updates)
- Publish workflow (snapshot to publishedConfig)
- Guest experience (read publishedConfig)

**Exports**:
```typescript
export const CURRENT_CONFIG_VERSION = 1
export const overlaysConfigSchema
export const socialSharingConfigSchema
export const sharingConfigSchema
export const projectEventConfigSchema

export type ProjectEventConfig
export type OverlaysConfig
export type SharingConfig
export type SocialSharingConfig
```

---

### 3. Event Full Schema (New)

**Path**: `apps/clementine-app/src/domains/event/shared/schemas/project-event-full.schema.ts`

**Purpose**: Complete event document validation (designer view)

**Fields**: Admin metadata + guest-facing config
- All fields from ProjectEvent entity

**Used By**:
- Event designer route loader
- Event designer UI (read-only display of admin fields, edit config fields)

**Exports**:
```typescript
export const projectEventFullSchema

export type ProjectEventFull
```

---

## Validation Rules

### Schema-Level Validation (Zod)

1. **Required Fields**: All required fields validated at runtime
2. **Type Safety**: Strict TypeScript types from Zod schemas
3. **Format Validation**:
   - URLs: `z.string().url()` (overlays, theme background image)
   - Hex colors: `z.string().regex(COLOR_REGEX)` (theme colors)
   - Timestamps: `z.number().int().positive()` (createdAt, updatedAt, etc.)
4. **Firestore Safety**: Optional fields use `.nullable().default(null)`
5. **Evolution Support**: All schemas use `.passthrough()` for unknown fields

### Business Rules

1. **Lazy Config Initialization**: `draftConfig` created on first edit, not on event creation
2. **Draft Version Numbering**: Starts at 1 (not 0)
3. **Publish Workflow**:
   - `publishedConfig` = snapshot of `draftConfig` at publish time
   - `publishedVersion` = `draftVersion` at publish time
   - `publishedAt` = timestamp of publish
   - `draftVersion` increments on each edit after publish
4. **Soft Delete**: `status = 'deleted'` + `deletedAt` timestamp (event not physically deleted)

---

## Domain Boundaries

### @domains/project/events/ (Admin Domain)

**Responsibilities**:
- Event list (read admin metadata)
- Event creation (admin metadata only)
- Event deletion (soft delete)
- Event name updates

**Firestore Operations**:
- Read: Query `/projects/{projectId}/events` (admin metadata)
- Write: Create event, update name/status/deletedAt

**Schema Used**: `project-event.schema.ts` (lightweight)

---

### @domains/event/ (Designer Domain)

**Responsibilities**:
- Event configuration (draft/published)
- Theme editing (future)
- Overlays management (future)
- Sharing settings (future)
- Publish workflow (future)

**Firestore Operations**:
- Read: Get full event document (admin metadata + config)
- Write: Update draftConfig, publish to publishedConfig

**Schema Used**:
- `project-event-full.schema.ts` (complete view)
- `project-event-config.schema.ts` (config validation)

---

## Migration Strategy

**Phase 1** (This Feature): Schema creation only
- Create new schemas (no migration needed)
- No data writes to config fields (read-only for now)
- Schemas ready for future use

**Phase 2** (Future): Config editing
- Implement lazy initialization (create draftConfig on first edit)
- Update operations for theme, overlays, sharing

**Phase 3** (Future): Publish workflow
- Implement publish (snapshot draftConfig → publishedConfig)
- Version comparison UI
- Rollback support

**No breaking changes**: Schemas are additive. Existing events without config fields will validate correctly (all config fields are nullable with defaults).

---

## Performance Considerations

1. **Embedded Objects**: Config is embedded in event document (single Firestore read)
2. **Selective Reads**: Admin domain reads only admin metadata (lighter payload)
3. **Real-time Updates** (Future): Use Firestore `onSnapshot` for collaborative editing
4. **Indexing**: No special indexes needed (read by event ID, not querying config fields)

---

## Security Considerations

1. **Firestore Rules** (Future):
   - Admin metadata: Only workspace members can write
   - Config fields: Only workspace members can write
   - Published config: Readable by anyone (public guest access)
2. **Validation**: All writes validated server-side with Zod schemas
3. **XSS Prevention**: URL fields validated as proper URLs (overlays, background image)
4. **Type Safety**: Strict TypeScript prevents invalid data structures

---

## Standards Compliance

✅ **Firestore Safety**: All optional fields use `.nullable().default(null)`
✅ **Schema Evolution**: All schemas use `.passthrough()`
✅ **Type Safety**: Zod runtime validation + TypeScript types
✅ **Domain Separation**: Clear bounded contexts (admin vs designer)
✅ **YAGNI**: Lazy config initialization, simple social config
✅ **Performance**: Embedded objects, single document reads

**References**:
- `standards/global/zod-validation.md`
- `standards/backend/firestore.md`
- `standards/global/client-first-architecture.md`
