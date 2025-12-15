# Data Model: Event Frame Overlay Configuration

**Feature**: 027-output-config
**Date**: 2025-12-15

## Overview

This document defines the data model extensions for frame overlay configuration. The overlay configuration is stored as a nested object on the existing Event document in Firestore.

---

## Entity Definitions

### EventOverlayConfig

Configuration object containing frame overlays for all supported aspect ratios.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| frames | `Record<OverlayAspectRatio, FrameEntry>` | Yes | Map of aspect ratio to frame configuration |

### FrameEntry

Individual frame configuration for one aspect ratio.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| enabled | boolean | Yes | false | Whether the frame overlay is applied to outputs |
| frameUrl | string \| null | No | null | Full public URL to the frame image in Firebase Storage |

### OverlayAspectRatio (Enum)

Supported aspect ratios for frame overlays.

| Value | Display | CSS Aspect | Description |
|-------|---------|------------|-------------|
| `square` | "Square" | `1/1` | 1:1 aspect ratio for square outputs |
| `story` | "Story" | `9/16` | 9:16 aspect ratio for vertical story outputs |

---

## Event Document Extension

The Event document is extended with an optional `overlay` field:

```typescript
interface Event {
  // ...existing fields (id, projectId, companyId, name, etc.)

  overlay?: EventOverlayConfig  // NEW: Frame overlay configuration
}
```

### Firestore Document Structure

```json
{
  "id": "event123",
  "projectId": "project456",
  "companyId": "company789",
  "name": "Summer Festival 2025",
  "theme": { /* Theme object */ },
  "welcome": { /* EventWelcome object */ },
  "extras": { /* EventExtras object */ },

  "overlay": {
    "frames": {
      "square": {
        "enabled": true,
        "frameUrl": "https://storage.googleapis.com/bucket/media/company789/frames/1702648800000-frame-square.png"
      },
      "story": {
        "enabled": false,
        "frameUrl": "https://storage.googleapis.com/bucket/media/company789/frames/1702648800000-frame-story.png"
      }
    }
  },

  "createdAt": 1702648800000,
  "updatedAt": 1702648900000
}
```

---

## Zod Schemas

### FrameEntry Schema

```typescript
export const frameEntrySchema = z.object({
  enabled: z.boolean(),
  frameUrl: z.string().url().nullable(),
})

export type FrameEntry = z.infer<typeof frameEntrySchema>
```

### EventOverlayConfig Schema

```typescript
export const overlayAspectRatioSchema = z.enum(["square", "story"])

export type OverlayAspectRatio = z.infer<typeof overlayAspectRatioSchema>

export const eventOverlayConfigSchema = z.object({
  frames: z.record(overlayAspectRatioSchema, frameEntrySchema),
})

export type EventOverlayConfig = z.infer<typeof eventOverlayConfigSchema>
```

### Update Input Schema

```typescript
export const updateEventOverlayInputSchema = z.object({
  square: z.object({
    enabled: z.boolean().optional(),
    frameUrl: z.string().url().nullable().optional(),
  }).optional(),
  story: z.object({
    enabled: z.boolean().optional(),
    frameUrl: z.string().url().nullable().optional(),
  }).optional(),
})

export type UpdateEventOverlayInput = z.infer<typeof updateEventOverlayInputSchema>
```

---

## State Transitions

### Frame Upload Flow

```
[No Frame] --upload--> [Frame Stored, Disabled]
                              |
                              v
                       --enable--> [Frame Stored, Enabled]
                              |
                              v
                       --disable--> [Frame Stored, Disabled]
                              |
                              v
                       --remove--> [No Frame]
```

### Business Rules

1. **Upload**: Sets `frameUrl` to uploaded image URL, does NOT auto-enable
2. **Enable**: Sets `enabled: true` - only effective if `frameUrl` exists
3. **Disable**: Sets `enabled: false` - preserves `frameUrl`
4. **Remove**: Sets `enabled: false` AND `frameUrl: null`

---

## Validation Rules

### Frame Image Validation (Client-Side Upload)

| Rule | Constraint | Error Message |
|------|------------|---------------|
| File Type | PNG, JPG, JPEG, WebP only | "Invalid file type. Use PNG, JPG, or WebP." |
| File Size | Max 10MB | "File too large. Maximum size is 10MB." |
| Dimensions | Min 100x100px | "Image too small. Minimum 100x100 pixels." |

### Schema Validation (Server-Side)

| Field | Rule | Error Message |
|-------|------|---------------|
| frameUrl | Valid URL format when not null | "Invalid URL format" |
| enabled | Boolean | "Enabled must be a boolean" |
| aspect ratio | Must be "square" or "story" | "Invalid aspect ratio" |

---

## Relationships

```
Event (1) ──contains──> (1) EventOverlayConfig
                              │
                              ├── frames.square: FrameEntry
                              └── frames.story: FrameEntry
```

### Related Entities (No Changes Required)

- **Project**: Parent of Event - no overlay reference needed
- **Experience**: Event experiences unaffected - overlays are event-wide
- **Theme**: Separate concern - theme affects styling, overlay affects output

---

## Migration Strategy

### Backward Compatibility

- `overlay` field is optional on Event
- Existing events without `overlay` field continue to function
- When reading events, normalize missing `overlay` to default values

### Normalization Function

```typescript
function normalizeEventOverlay(data: unknown): EventOverlayConfig {
  if (!data) {
    return DEFAULT_EVENT_OVERLAY
  }
  return eventOverlayConfigSchema.parse(data)
}

export const DEFAULT_EVENT_OVERLAY: EventOverlayConfig = {
  frames: {
    square: { enabled: false, frameUrl: null },
    story: { enabled: false, frameUrl: null },
  },
}
```

---

## Firebase Storage Structure

Frame images are stored in Firebase Storage with the following path pattern:

```
media/{companyId}/frames/{timestamp}-{filename}
```

Example paths:
- `media/company789/frames/1702648800000-summer-frame-square.png`
- `media/company789/frames/1702648900000-summer-frame-story.png`

### Storage Rules (Existing)

Frame uploads use the existing `uploadImage` server action which:
1. Validates file type and size
2. Generates unique filename with timestamp + original name
3. Uploads to Firebase Storage
4. Makes file publicly accessible
5. Returns full public URL for storage in Firestore

---

## Index Requirements

No additional Firestore indexes required - overlay is queried only when fetching the full Event document.
