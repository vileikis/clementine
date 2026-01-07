# Data Model: Themed Primitives

**Feature**: 016-themed-primitives | **Date**: 2026-01-07

## Overview

This document defines the data model changes required for the themed primitives feature, specifically the `MediaReference` schema and updated `ThemeBackground` type.

## Entities

### MediaReference (NEW)

A reusable schema for referencing MediaAsset documents. Stores both the document ID (for tracking/management) and the URL (for fast rendering).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `mediaAssetId` | `string` | Required | MediaAsset document ID from `workspaces/{workspaceId}/mediaAssets/{id}` |
| `url` | `string` | Required, URL format | Firebase Storage download URL for fast rendering |

**Zod Schema**:
```typescript
export const mediaReferenceSchema = z.object({
  mediaAssetId: z.string(),
  url: z.string().url(),
})

export type MediaReference = z.infer<typeof mediaReferenceSchema>
```

**Usage Locations**:
- `theme.background.image` (this PRD)
- `overlaysConfig['1:1']` and `overlaysConfig['9:16']` (existing)
- `welcomeConfig.media` (future)

---

### ThemeBackground (MODIFIED)

Updated to use `MediaReference` instead of plain URL string for the `image` field.

**Before**:
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `color` | `string` | `'#FFFFFF'` | Hex color (6-digit format) |
| `image` | `string \| null` | `null` | URL string |
| `overlayOpacity` | `number` | `0.3` | 0-1 decimal |

**After**:
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `color` | `string` | `'#FFFFFF'` | Hex color (6-digit format) |
| `image` | `MediaReference \| null` | `null` | MediaReference object with ID and URL |
| `overlayOpacity` | `number` | `0.3` | 0-1 decimal |

**Zod Schema (with migration preprocess)**:
```typescript
// Normalizes legacy string URLs to MediaReference
function normalizeBackgroundImage(
  image: unknown
): MediaReference | null {
  if (image === null || image === undefined) return null
  if (typeof image === 'string') {
    // Legacy string URL - convert to MediaReference
    return { mediaAssetId: '', url: image }
  }
  if (typeof image === 'object' && image !== null) {
    return image as MediaReference
  }
  return null
}

export const themeBackgroundSchema = z.object({
  color: z
    .string()
    .regex(COLOR_REGEX, 'Invalid hex color format')
    .default('#FFFFFF'),
  image: z.preprocess(
    normalizeBackgroundImage,
    mediaReferenceSchema.nullable()
  ).default(null),
  overlayOpacity: z.number().min(0).max(1).default(0.3),
})
```

---

### Theme (UNCHANGED - structural)

The top-level Theme type remains the same structure, only the nested `background.image` field changes.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `fontFamily` | `string \| null` | `null` | Font family name |
| `primaryColor` | `string` | `'#3B82F6'` | Primary accent color (hex) |
| `text` | `ThemeText` | `{color: '#1E1E1E', alignment: 'center'}` | Text configuration |
| `button` | `ThemeButton` | `{backgroundColor: null, textColor: '#FFFFFF', radius: 'rounded'}` | Button configuration |
| `background` | `ThemeBackground` | `{color: '#FFFFFF', image: null, overlayOpacity: 0.3}` | Background configuration |

---

## State Transitions

This feature doesn't introduce new state machines, but the `background.image` field can transition between states:

```
null → MediaReference (upload)
MediaReference → null (remove)
MediaReference → MediaReference (replace)
string → MediaReference (migration - read-time normalization)
```

---

## Validation Rules

### MediaReference Validation
- `mediaAssetId`: Non-empty string (empty string allowed for legacy migration)
- `url`: Valid URL format (Zod `.url()` validator)

### ThemeBackground Validation (Existing)
- `color`: 6-digit hex format (`/^#[0-9A-Fa-f]{6}$/`)
- `overlayOpacity`: Number between 0 and 1 inclusive

---

## Migration Strategy

### Read-Time Normalization

Legacy `background.image` values (plain URL strings) are automatically converted to `MediaReference` objects when parsed through the schema:

1. **Input**: `{ image: "https://storage.googleapis.com/..." }`
2. **Preprocess**: Detects string type, converts to `{ mediaAssetId: '', url: "https://..." }`
3. **Output**: Valid `MediaReference` with empty `mediaAssetId`

### Write-Time Behavior

All new writes will use the full `MediaReference` structure:

```typescript
await updateTheme({
  background: {
    image: {
      mediaAssetId: 'abc123',
      url: 'https://storage.googleapis.com/...'
    }
  }
})
```

### Optional Batch Migration Script

A batch migration script can be created to:
1. Query all events with `background.image` as string
2. Convert to `MediaReference` format (with empty `mediaAssetId` for legacy)
3. Update documents in batches of 500

This is **not required** for the feature to work but cleans up legacy data.

---

## TypeScript Types

### Exported Types

```typescript
// From @/shared/theming
export type MediaReference = z.infer<typeof mediaReferenceSchema>
export type ThemeBackground = z.infer<typeof themeBackgroundSchema>
export type Theme = z.infer<typeof themeSchema>
```

### Component Prop Types (Internal)

```typescript
// ThemedText props
interface ThemedTextProps {
  children: React.ReactNode
  variant?: 'heading' | 'body' | 'small'
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div'
  align?: 'left' | 'center' | 'right' | 'inherit'
  className?: string
  theme?: Theme // Optional override
}

// ThemedButton props
interface ThemedButtonProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
  theme?: Theme // Optional override
}
```

---

## Firestore Document Structure

### Event Document (draftConfig.theme)

```json
{
  "draftConfig": {
    "theme": {
      "fontFamily": "Inter",
      "primaryColor": "#3B82F6",
      "text": {
        "color": "#1E1E1E",
        "alignment": "center"
      },
      "button": {
        "backgroundColor": null,
        "textColor": "#FFFFFF",
        "radius": "rounded"
      },
      "background": {
        "color": "#FFFFFF",
        "image": {
          "mediaAssetId": "abc123",
          "url": "https://storage.googleapis.com/bucket/path/image.jpg"
        },
        "overlayOpacity": 0.3
      }
    }
  }
}
```

### Legacy Document (before migration)

```json
{
  "draftConfig": {
    "theme": {
      "background": {
        "color": "#FFFFFF",
        "image": "https://storage.googleapis.com/bucket/path/image.jpg",
        "overlayOpacity": 0.3
      }
    }
  }
}
```

Both formats are supported via read-time normalization.

---

## Relationships

```
┌─────────────────┐     ┌─────────────────┐
│  Event Document │     │  MediaAsset     │
│  (Firestore)    │     │  Document       │
├─────────────────┤     ├─────────────────┤
│ draftConfig     │     │ id              │
│   .theme        │     │ url             │
│     .background │────▶│ type            │
│       .image    │     │ workspaceId     │
│         .mediaAssetId │ createdAt       │
│         .url    │     └─────────────────┘
└─────────────────┘

MediaReference acts as a denormalized reference:
- mediaAssetId: Points to MediaAsset document for management
- url: Cached URL for instant rendering without lookup
```

---

## Backward Compatibility

| Scenario | Behavior |
|----------|----------|
| New event created | Uses full `MediaReference` structure |
| Legacy event read | String URL normalized to `MediaReference` at read-time |
| Legacy event updated | Entire theme replaced with new structure |
| Export/import | Schema handles both formats transparently |
