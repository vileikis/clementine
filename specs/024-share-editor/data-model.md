# Data Model: Share Screen Editor

**Feature**: 024-share-editor
**Date**: 2026-01-13

## Entities

### ShareConfig (NEW)

Event-scoped configuration for share screen presentation and call-to-action.

| Field | Type | Nullable | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `title` | `string` | ✅ Yes | `null` | Max 100 chars (write) | Share screen title text |
| `description` | `string` | ✅ Yes | `null` | Max 500 chars (write) | Share screen description text |
| `cta` | `CtaConfig` | ✅ Yes | `null` | See CtaConfig | Call-to-action button configuration |

**Firestore Path**: `projects/{projectId}/events/{eventId}` → `draftConfig.share`

**Notes**:
- When `title` is `null`, title area is hidden in share screen
- When `description` is `null`, description area is hidden in share screen
- When `cta` is `null` or `cta.label` is `null`, CTA button is hidden

### CtaConfig (NEW)

Configuration for the call-to-action button on the share screen.

| Field | Type | Nullable | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `label` | `string` | ✅ Yes | `null` | Max 50 chars (write) | Button text label |
| `url` | `string` | ✅ Yes | `null` | Valid URL format | Destination URL when clicked |

**Business Rules**:
- If `label` is provided, `url` is required (validation error otherwise)
- If `label` is `null`/empty, CTA button is hidden regardless of `url` value
- URL must be valid format (http/https protocol)

### ShareOptionsConfig (RENAMED from SharingConfig)

Boolean toggles for available sharing platforms. Renamed from `sharing` to `shareOptions` (FR-017).

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `download` | `boolean` | `true` | Enable download button |
| `copyLink` | `boolean` | `true` | Enable copy link button |
| `email` | `boolean` | `false` | Enable email sharing |
| `instagram` | `boolean` | `false` | Enable Instagram sharing |
| `facebook` | `boolean` | `false` | Enable Facebook sharing |
| `linkedin` | `boolean` | `false` | Enable LinkedIn sharing |
| `twitter` | `boolean` | `false` | Enable Twitter sharing |
| `tiktok` | `boolean` | `false` | Enable TikTok sharing |
| `telegram` | `boolean` | `false` | Enable Telegram sharing |

**Firestore Path**: `projects/{projectId}/events/{eventId}` → `draftConfig.shareOptions`

**Notes**:
- Renamed from `sharing` to `shareOptions` for clarity (FR-017)
- Editable in both Share tab (with live preview) and Settings tab
- Uses existing `useUpdateShareOptions` hook (updated field prefix)
- No data migration - handle missing `shareOptions` field with defaults

## Schema Definitions (Zod)

### CtaConfig Schema

```typescript
// Location: domains/event/shared/schemas/project-event-config.schema.ts

export const ctaConfigSchema = z.object({
  /**
   * Button text label
   * When null, CTA button is hidden
   */
  label: z.string().nullable().default(null),

  /**
   * Destination URL when button is clicked
   * Required when label is provided
   */
  url: z.string().url().nullable().default(null),
})

export type CtaConfig = z.infer<typeof ctaConfigSchema>
```

### ShareConfig Schema

```typescript
// Location: domains/event/shared/schemas/project-event-config.schema.ts

export const shareConfigSchema = z.object({
  /**
   * Share screen title text
   * When null, title area is hidden
   */
  title: z.string().nullable().default(null),

  /**
   * Share screen description text
   * When null, description area is hidden
   */
  description: z.string().nullable().default(null),

  /**
   * Call-to-action button configuration
   * When null or label is null, CTA button is hidden
   */
  cta: ctaConfigSchema.nullable().default(null),
})

export type ShareConfig = z.infer<typeof shareConfigSchema>
```

### Write Validation Schema

```typescript
// Location: domains/event/share/schemas/update-share.schema.ts

import { z } from 'zod'

/**
 * Write validation schema with length limits
 * Used by mutation hook before Firestore update
 */
export const updateShareSchema = z.object({
  title: z.string().max(100, 'Title must be 100 characters or less').nullable(),
  description: z.string().max(500, 'Description must be 500 characters or less').nullable(),
  cta: z.object({
    label: z.string().max(50, 'CTA label must be 50 characters or less').nullable(),
    url: z.string().url('Please enter a valid URL').nullable(),
  }).nullable()
    .refine(
      (data) => !data?.label || data?.url,
      { message: 'URL is required when CTA label is provided', path: ['url'] }
    ),
})

export type UpdateShareInput = z.infer<typeof updateShareSchema>
```

## Updated ProjectEventConfig Schema

```typescript
// Location: domains/event/shared/schemas/project-event-config.schema.ts

export const projectEventConfigSchema = z.looseObject({
  schemaVersion: z.number().default(CURRENT_CONFIG_VERSION),
  theme: themeSchema.nullable().default(null),
  overlays: overlaysConfigSchema,
  welcome: welcomeConfigSchema.nullable().default(null),

  // RENAMED: Platform toggles (was 'sharing')
  shareOptions: shareOptionsConfigSchema.nullable().default(null),

  // NEW: Share screen content configuration
  share: shareConfigSchema.nullable().default(null),
})
```

## Firestore Document Structure

```json
{
  "projects/{projectId}/events/{eventId}": {
    "id": "event-123",
    "name": "My Event",
    "draftVersion": 5,
    "publishedVersion": 4,
    "draftConfig": {
      "schemaVersion": 1,
      "theme": { /* ... */ },
      "overlays": { /* ... */ },
      "welcome": { /* ... */ },
      "shareOptions": {
        "download": true,
        "copyLink": true,
        "email": false,
        "instagram": true,
        "facebook": false,
        "linkedin": false,
        "twitter": false,
        "tiktok": false,
        "telegram": false
      },
      "share": {
        "title": "Your masterpiece is ready!",
        "description": "Download or share your AI-transformed photo",
        "cta": {
          "label": "Visit our website",
          "url": "https://example.com"
        }
      }
    },
    "publishedConfig": { /* ... */ },
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

## Relationships

```
ProjectEvent (1)
└── draftConfig (1)
    ├── theme (1)
    ├── overlays (1)
    ├── welcome (1)
    ├── shareOptions (1)  ← Platform toggles (RENAMED from 'sharing')
    └── share (1)         ← Content/presentation (NEW)
        └── cta (1)
```

## State Transitions

### CTA Button Visibility State Machine

```
┌──────────────────────┐
│   CTA Hidden         │  (label is null/empty)
│   [Initial State]    │
└──────────┬───────────┘
           │ Enter label text
           ▼
┌──────────────────────┐
│   CTA Visible        │
│   (URL may be        │
│    missing - error)  │
└──────────┬───────────┘
           │ Enter valid URL
           ▼
┌──────────────────────┐
│   CTA Complete       │
│   (Ready for use)    │
└──────────────────────┘
```

### Title/Description Visibility

Simple boolean visibility:
- `null` → Hidden
- Non-empty string → Visible

## Migration Strategy

**No migration required**. New `share` field uses Zod defaults:
- Existing events: `event?.draftConfig?.share` returns `undefined`
- Application code: `?? DEFAULT_SHARE` provides fallback
- Zod parsing: `.default(null)` handles missing field

## Default Values

```typescript
// Location: domains/event/share/constants/defaults.ts

export const DEFAULT_SHARE: ShareConfig = {
  title: null,
  description: null,
  cta: null,
}

export const DEFAULT_CTA: CtaConfig = {
  label: null,
  url: null,
}
```
