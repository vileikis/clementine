# Data Model: Event Theme Editor

**Feature**: 015-event-theme-editor
**Date**: 2026-01-07

## Overview

The theme editor modifies the `theme` property within `event.draftConfig`. No new collections or documents are created. This document describes the existing data model and validation rules.

---

## Primary Entity: Theme

### Location in Firestore

```
events/{eventId}/draftConfig.theme
```

### TypeScript Interface

```typescript
interface Theme {
  /** Font family for text (CSS font-family value) */
  fontFamily: string | null

  /** Primary brand color (hex format) */
  primaryColor: string

  /** Text styling configuration */
  text: {
    /** Text color (hex format) */
    color: string
    /** Text alignment */
    alignment: 'left' | 'center' | 'right'
  }

  /** Button styling configuration */
  button: {
    /** Button background color (hex format, null for transparent) */
    backgroundColor: string | null
    /** Button text color (hex format) */
    textColor: string
    /** Button border radius */
    radius: 'none' | 'sm' | 'md' | 'full'
  }

  /** Background styling configuration */
  background: {
    /** Background color (hex format) */
    color: string
    /** Background image URL (null for no image) */
    image: string | null
    /** Overlay opacity (0.0 - 1.0) */
    overlayOpacity: number
  }
}
```

### Zod Schema

Located at: `@/shared/theming/schemas/theme.schemas.ts`

```typescript
import { z } from 'zod'

export const COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/

const hexColorSchema = z.string().regex(COLOR_REGEX, 'Invalid hex color format')

export const themeTextSchema = z.object({
  color: hexColorSchema,
  alignment: z.enum(['left', 'center', 'right']),
})

export const themeButtonSchema = z.object({
  backgroundColor: hexColorSchema.nullable(),
  textColor: hexColorSchema,
  radius: z.enum(['none', 'sm', 'md', 'full']),
})

export const themeBackgroundSchema = z.object({
  color: hexColorSchema,
  image: z.string().url().nullable(),
  overlayOpacity: z.number().min(0).max(1),
})

export const themeSchema = z.object({
  fontFamily: z.string().nullable(),
  primaryColor: hexColorSchema,
  text: themeTextSchema,
  button: themeButtonSchema,
  background: themeBackgroundSchema,
})

// For partial updates (all fields optional)
export const updateThemeSchema = themeSchema.deepPartial()

export type Theme = z.infer<typeof themeSchema>
export type UpdateTheme = z.infer<typeof updateThemeSchema>
```

---

## Field Specifications

### fontFamily

| Property | Value |
|----------|-------|
| Type | `string \| null` |
| Default | `null` (system default) |
| Validation | Any valid CSS font-family string |
| Example | `"Arial, sans-serif"` |

### primaryColor

| Property | Value |
|----------|-------|
| Type | `string` |
| Format | Hex color (#RRGGBB) |
| Validation | Must match `/^#[0-9A-Fa-f]{6}$/` |
| Example | `"#3B82F6"` |

### text.color

| Property | Value |
|----------|-------|
| Type | `string` |
| Format | Hex color (#RRGGBB) |
| Validation | Must match `/^#[0-9A-Fa-f]{6}$/` |
| Example | `"#FFFFFF"` |

### text.alignment

| Property | Value |
|----------|-------|
| Type | `enum` |
| Values | `'left'`, `'center'`, `'right'` |
| Default | `'center'` |

### button.backgroundColor

| Property | Value |
|----------|-------|
| Type | `string \| null` |
| Format | Hex color (#RRGGBB) or null |
| Validation | Must match `/^#[0-9A-Fa-f]{6}$/` or be null |
| Note | `null` means transparent/use primaryColor |
| Example | `"#3B82F6"` or `null` |

### button.textColor

| Property | Value |
|----------|-------|
| Type | `string` |
| Format | Hex color (#RRGGBB) |
| Validation | Must match `/^#[0-9A-Fa-f]{6}$/` |
| Example | `"#FFFFFF"` |

### button.radius

| Property | Value |
|----------|-------|
| Type | `enum` |
| Values | `'none'`, `'sm'`, `'md'`, `'full'` |
| Default | `'md'` |
| CSS mapping | `none: 0`, `sm: 4px`, `md: 8px`, `full: 9999px` |

### background.color

| Property | Value |
|----------|-------|
| Type | `string` |
| Format | Hex color (#RRGGBB) |
| Validation | Must match `/^#[0-9A-Fa-f]{6}$/` |
| Example | `"#1E1E1E"` |

### background.image

| Property | Value |
|----------|-------|
| Type | `string \| null` |
| Format | Full URL or null |
| Validation | Must be valid URL or null |
| Note | Full public URL stored (not relative path) |
| Example | `"https://storage.googleapis.com/..."` or `null` |

### background.overlayOpacity

| Property | Value |
|----------|-------|
| Type | `number` |
| Range | 0.0 - 1.0 |
| Default | `0.5` |
| Display | Shown as 0-100% in UI |
| Example | `0.75` (displays as 75%) |

---

## Default Theme

```typescript
export const defaultTheme: Theme = {
  fontFamily: null,
  primaryColor: '#3B82F6',
  text: {
    color: '#FFFFFF',
    alignment: 'center',
  },
  button: {
    backgroundColor: null,
    textColor: '#FFFFFF',
    radius: 'md',
  },
  background: {
    color: '#1E1E1E',
    image: null,
    overlayOpacity: 0.5,
  },
}
```

---

## Related Entities

### MediaAsset (for background images)

When a background image is uploaded, a MediaAsset document is created:

**Location**: `workspaces/{workspaceId}/mediaAssets/{mediaAssetId}`

**Relevant fields**:
```typescript
interface MediaAsset {
  id: string
  fileName: string
  filePath: string
  url: string           // Stored in theme.background.image
  fileSize: number
  mimeType: string
  width: number
  height: number
  uploadedAt: Timestamp
  uploadedBy: string
  type: 'background' | 'logo' | 'photo' | 'video'
  status: 'active' | 'deleted'
}
```

The `url` from MediaAsset is stored in `theme.background.image`.

---

## Update Operations

### Partial Updates

Theme updates use dot notation for partial updates:

```typescript
// Example: Update only text color
await updateEventConfigField(projectId, eventId, {
  'theme.text.color': '#FF0000',
})

// Example: Update multiple fields
await updateEventConfigField(projectId, eventId, {
  'theme.primaryColor': '#3B82F6',
  'theme.button.radius': 'full',
})
```

### Validation Flow

1. Form values collected via React Hook Form
2. Validated against `updateThemeSchema` (partial)
3. Changed fields extracted via `getChangedFields()`
4. Converted to dot notation via `prefixKeys()`
5. Persisted via `updateEventConfigField()`

---

## State Transitions

The theme has no explicit state machine. However, the event's publish workflow involves:

1. **Draft**: `draftConfig.theme` is modified by editor
2. **Publish**: `draftConfig` is copied to `publishedConfig`
3. **Guest View**: Uses `publishedConfig.theme` for rendering

The theme editor only modifies `draftConfig.theme`. Publishing is handled separately.

---

## Firestore Security Rules

The theme is part of the event document. Existing rules apply:

```javascript
match /events/{eventId} {
  // Read: Allowed for workspace members
  allow read: if isWorkspaceMember(resource.data.workspaceId);

  // Write: Denied - must go through server functions
  allow write: if false;
}
```

All theme updates go through the existing `updateEventConfigField` action which uses the Admin SDK.
