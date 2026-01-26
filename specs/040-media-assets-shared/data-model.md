# Data Model: Media Assets Shared Schema

**Feature**: 040-media-assets-shared
**Date**: 2026-01-26

## Entities

### MediaAsset

Complete media file document stored in Firestore.

**Firestore Path**: `workspaces/{workspaceId}/mediaAssets/{id}`
**Storage Path**: `workspaces/{workspaceId}/media/{fileName}`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | - | Firestore document ID |
| `fileName` | string | Yes | - | Generated unique filename (e.g., `overlay-V1StGXR8.png`) |
| `filePath` | string | Yes | - | Full storage path (e.g., `workspaces/ws-123/media/overlay-xyz.png`) |
| `url` | string (URL) | Yes | - | Firebase Storage download URL |
| `fileSize` | number | Yes | - | File size in bytes |
| `mimeType` | ImageMimeType | Yes | - | MIME type (image/png, image/jpeg, etc.) |
| `width` | number | Yes | - | Image width in pixels |
| `height` | number | Yes | - | Image height in pixels |
| `uploadedAt` | number | Yes | - | Upload timestamp (Unix ms) |
| `uploadedBy` | string | Yes | - | User ID who uploaded |
| `type` | MediaAssetType | Yes | - | Asset category (overlay, logo, other) |
| `status` | MediaAssetStatus | Yes | `'active'` | Lifecycle status (active, deleted) |

**Schema Definition**:
```typescript
export const mediaAssetSchema = z.looseObject({
  id: z.string(),
  fileName: z.string(),
  filePath: z.string(),
  url: z.string().url(),
  fileSize: z.number().int().positive(),
  mimeType: imageMimeTypeSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  uploadedAt: z.number().int().positive(),
  uploadedBy: z.string(),
  type: mediaAssetTypeSchema,
  status: mediaAssetStatusSchema.default('active'),
})
```

---

### MediaReference

Lightweight reference to a MediaAsset used in other documents.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `mediaAssetId` | string | Yes | - | MediaAsset document ID |
| `url` | string (URL) | Yes | - | Download URL for client rendering |
| `filePath` | string \| null | No | `null` | Storage path for server access |

**Schema Definition**:
```typescript
export const mediaReferenceSchema = z.looseObject({
  mediaAssetId: z.string(),
  url: z.string().url(),
  filePath: z.string().nullable().default(null),
})
```

**Usage Contexts**:
- Theme background images
- Event overlay images (1:1 and 9:16 aspect ratios)
- Experience thumbnail/cover images
- Info step media assets
- Welcome screen media

---

### ImageMimeType (Enum)

Allowed image MIME types for upload validation.

| Value | Description |
|-------|-------------|
| `image/png` | PNG image |
| `image/jpeg` | JPEG image |
| `image/jpg` | JPEG image (alternate) |
| `image/webp` | WebP image |
| `image/gif` | GIF image |

**Schema Definition**:
```typescript
export const imageMimeTypeSchema = z.enum([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
])
```

---

### MediaAssetType (Enum)

Asset categorization for media library organization.

| Value | Description |
|-------|-------------|
| `overlay` | Overlay image for events |
| `logo` | Workspace or event logo |
| `other` | Miscellaneous media |

**Schema Definition**:
```typescript
export const mediaAssetTypeSchema = z.enum(['overlay', 'logo', 'other'])
```

---

### MediaAssetStatus (Enum)

Lifecycle status for soft delete support.

| Value | Description |
|-------|-------------|
| `active` | Asset is available for use |
| `deleted` | Asset is soft-deleted (pending cleanup) |

**Schema Definition**:
```typescript
export const mediaAssetStatusSchema = z.enum(['active', 'deleted'])
```

---

## Relationships

```
┌─────────────────┐
│    Workspace    │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│   MediaAsset    │◄─────────────────────────────────────────┐
└────────┬────────┘                                          │
         │                                                   │
         │ Referenced by (MediaReference)                    │
         │                                                   │
         ├──────────►┌─────────────────┐                     │
         │           │     Theme       │ background.image    │
         │           └─────────────────┘                     │
         │                                                   │
         ├──────────►┌─────────────────┐                     │
         │           │  ProjectEvent   │ overlays['1:1']     │
         │           │   Config        │ overlays['9:16']    │
         │           │                 │ welcome.media       │
         │           └─────────────────┘                     │
         │                                                   │
         └──────────►┌─────────────────┐                     │
                     │   Experience    │ media               │
                     │                 │ steps[].config.media│
                     └─────────────────┘                     │
```

## Backward Compatibility

### Existing Documents Without filePath

```typescript
// Old document (pre-migration)
{
  mediaAssetId: "abc123",
  url: "https://firebasestorage.googleapis.com/..."
}

// Parsed with new schema → filePath defaults to null
{
  mediaAssetId: "abc123",
  url: "https://firebasestorage.googleapis.com/...",
  filePath: null
}
```

### New Documents With filePath

```typescript
// New document (post-migration)
{
  mediaAssetId: "xyz789",
  url: "https://firebasestorage.googleapis.com/...",
  filePath: "workspaces/ws-123/media/overlay-xyz789.png"
}
```

## Type Aliases (Backward Compatibility)

For backward compatibility with existing code:

```typescript
// Type aliases for semantic clarity
export type OverlayReference = MediaReference | null
export type ExperienceMedia = MediaReference | null
export type ExperienceMediaAsset = MediaReference | null

// Schema aliases
export const overlayReferenceSchema = mediaReferenceSchema.nullable()
export const experienceMediaSchema = mediaReferenceSchema.nullable()
export const experienceMediaAssetSchema = mediaReferenceSchema.nullable()
```

## Validation Rules

| Rule | Schema Implementation |
|------|----------------------|
| URL must be valid | `z.string().url()` |
| File size must be positive | `z.number().int().positive()` |
| Dimensions must be positive | `z.number().int().positive()` |
| MIME type must be allowed | `imageMimeTypeSchema` enum |
| Status defaults to active | `.default('active')` |
| filePath defaults to null | `.nullable().default(null)` |
