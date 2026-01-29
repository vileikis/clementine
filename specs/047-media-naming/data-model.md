# Data Model: Media Naming

**Feature**: 047-media-naming
**Date**: 2026-01-29

## Overview

This document defines the data model changes for preserving original media file names. The model separates storage concerns (unique collision-free filenames) from display concerns (user-friendly names).

## Entity Changes

### MediaAsset (Updated)

**Firestore Path**: `workspaces/{workspaceId}/mediaAssets/{id}`

Complete media file document stored in Firestore.

```typescript
interface MediaAsset {
  // Document ID
  id: string

  // Storage identifiers
  fileName: string        // Unique storage filename (e.g., "abc123def456.png")
  filePath: string        // Full storage path (e.g., "workspaces/w1/media/abc123def456.png")
  url: string            // Firebase Storage download URL

  // NEW: Display name
  displayName: string    // Original user filename (e.g., "Beach Sunset.jpg")
                        // Default: "Untitled" for legacy assets

  // File metadata
  fileSize: number       // File size in bytes
  mimeType: ImageMimeType // MIME type (image/png, image/jpeg, etc.)
  width: number          // Image width in pixels
  height: number         // Image height in pixels

  // Tracking
  uploadedAt: number     // Unix timestamp (milliseconds)
  uploadedBy: string     // User ID who uploaded
  type: MediaAssetType   // Asset type (overlay, other, etc.)
  status: MediaAssetStatus // Status (active, archived, deleted)
}
```

**Schema (Zod)**:
```typescript
export const mediaAssetSchema = z.looseObject({
  id: z.string(),
  fileName: z.string(),
  displayName: z.string().default('Untitled'),  // NEW FIELD
  filePath: z.string(),
  url: z.url(),
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

**Changes from Current**:
- **Added**: `displayName: string` field with `.default('Untitled')`
- **Updated**: `fileName` generation (remove "overlay-" prefix)

**Field Details**:

| Field | Type | Required | Default | Description |
| ----- | ---- | -------- | ------- | ----------- |
| `displayName` | `string` | Yes | `"Untitled"` | Original filename from user upload. Used for display in UI. Defaults to "Untitled" for legacy assets. |

### MediaReference (Updated)

Lightweight reference to a MediaAsset used in other documents (project configs, overlays, backgrounds, experience media).

```typescript
interface MediaReference {
  // Asset reference
  mediaAssetId: string   // ID of the referenced MediaAsset document
  url: string           // Direct download URL

  // Storage path (nullable for backward compatibility)
  filePath: string | null // Storage path (null for legacy references)

  // NEW: Display name
  displayName: string    // Human-readable filename for UI display
                        // Default: "Untitled" for legacy references
}
```

**Schema (Zod)**:
```typescript
export const mediaReferenceSchema = z.looseObject({
  mediaAssetId: z.string(),
  url: z.url(),
  filePath: z.string().nullable().default(null),
  displayName: z.string().default('Untitled'),  // NEW FIELD
})
```

**Changes from Current**:
- **Added**: `displayName: string` field with `.default('Untitled')`

**Field Details**:

| Field | Type | Required | Default | Description |
| ----- | ---- | ---- | ------- | ----------- |
| `displayName` | `string` | Yes | `"Untitled"` | Display name for the media asset. Used in UI to show which media is selected. Defaults to "Untitled" for legacy references. |

**Usage Locations**:
- Event overlays: `projectEventConfig.overlays['1:1']`, `projectEventConfig.overlays['9:16']`
- Theme backgrounds: `theme.background.image`
- Welcome screen: `welcomeScreenConfig.heroMedia`
- AI presets: `aiPreset.media`
- Experience media: Various experience step configurations

## Service Changes

### uploadMediaAsset (Updated)

**File**: `apps/clementine-app/src/domains/media-library/services/upload-media-asset.service.ts`

**Current Return Type**:
```typescript
interface UploadMediaAssetResult {
  mediaAssetId: string
  url: string
  filePath: string
}
```

**New Return Type** (MediaReference):
```typescript
interface UploadMediaAssetResult {
  mediaAssetId: string
  url: string
  filePath: string
  displayName: string  // NEW FIELD
}
```

**Changes**:
1. Capture original filename: `const displayName = file.name`
2. Return `displayName` in result object
3. Store `displayName` in MediaAsset document
4. Return type matches MediaReference schema

**Implementation**:
```typescript
export async function uploadMediaAsset({
  file,
  type,
  workspaceId,
  userId,
  onProgress,
}: UploadMediaAssetParams): Promise<UploadMediaAssetResult> {
  // ... validation, dimensions, upload logic

  // NEW: Capture original filename
  const displayName = file.name

  // Create Firestore document with displayName
  const docRef = await addDoc(mediaAssetsRef, {
    fileName,
    displayName,        // NEW FIELD
    filePath,
    url: downloadURL,
    // ... other fields
  } satisfies Omit<MediaAsset, 'id'>)

  // Return MediaReference-compatible object
  return {
    mediaAssetId: docRef.id,
    url: downloadURL,
    filePath,
    displayName,        // NEW FIELD
  }
}
```

### generateFileName (Updated)

**File**: `apps/clementine-app/src/domains/media-library/utils/upload.utils.ts`

**Current Implementation**:
```typescript
export function generateFileName(originalFile: File): string {
  const ext = originalFile.name.split('.').pop() || 'png'
  return `overlay-${nanoid()}.${ext}`
}
```

**New Implementation** (remove "overlay-" prefix):
```typescript
export function generateFileName(originalFile: File): string {
  const ext = originalFile.name.split('.').pop() || 'png'
  return `${nanoid()}.${ext}`
}
```

**Changes**:
- Removed `"overlay-"` prefix
- Storage filename is now just `{nanoid}.{ext}` (e.g., "abc123def456.png")

**Rationale**:
- Prefix was hardcoded and not meaningful (all media went to same path)
- nanoid already provides collision-free uniqueness
- Simpler naming scheme
- displayName field now handles human-readable naming

## Validation Rules

### MediaAsset

**Required fields** (must be provided during upload):
- `fileName` - Generated by system (nanoid + extension)
- `displayName` - Captured from `file.name` during upload
- `filePath` - Generated from workspaceId + fileName
- `url` - Retrieved from Firebase Storage after upload
- `fileSize`, `mimeType`, `width`, `height` - Extracted from file
- `uploadedAt`, `uploadedBy`, `type` - Provided by upload service

**Validation constraints**:
- `fileName` must be unique within workspace storage
- `displayName` can be duplicated (multiple "logo.png" files allowed)
- `fileSize` must be ≤ 5MB (existing constraint)
- `mimeType` must be PNG, JPG, WebP, or GIF (existing constraint)

### MediaReference

**Required fields**:
- `mediaAssetId` - ID of MediaAsset document
- `url` - Download URL
- `filePath` - Storage path (nullable for legacy)
- `displayName` - Display name (defaults to "Untitled")

**Validation constraints**:
- `mediaAssetId` must reference valid MediaAsset document
- `url` must be valid URL format
- `displayName` must be non-empty string (enforced by Zod schema)

## State Transitions

### MediaAsset Status

No changes to status transitions. The `status` field remains:
- `active` - Asset is available for use (default)
- `archived` - Asset is hidden but retained
- `deleted` - Asset is marked for deletion

The `displayName` field has no impact on status transitions.

## Relationships

### MediaAsset → MediaReference

**One-to-Many**: One MediaAsset can be referenced by many MediaReferences

When MediaAsset is created:
1. Upload service returns MediaReference-compatible object
2. Caller stores MediaReference in their document (e.g., project config)
3. MediaReference.mediaAssetId points to MediaAsset.id
4. MediaReference.displayName copied from MediaAsset.displayName

**Example**:
```typescript
// MediaAsset document
{
  id: 'asset-123',
  fileName: 'abc123.png',
  displayName: 'Company Logo.png',
  filePath: 'workspaces/w1/media/abc123.png',
  url: 'https://...',
  // ... other fields
}

// MediaReference in project config
{
  mediaAssetId: 'asset-123',
  url: 'https://...',
  filePath: 'workspaces/w1/media/abc123.png',
  displayName: 'Company Logo.png'
}
```

**Consistency**:
- displayName is duplicated in MediaReference (denormalized)
- If MediaAsset.displayName changes, existing MediaReferences are NOT updated
- This is intentional - references are snapshots of state at creation time

## Migration Strategy

### Backward Compatibility

**No database migration required** - schemas handle legacy data automatically:

**Legacy MediaAsset** (without displayName):
```typescript
// Existing Firestore document
{
  id: '123',
  fileName: 'overlay-abc.png',
  // no displayName field
  filePath: '...',
  url: '...',
  // ... other fields
}

// After Zod parsing
{
  id: '123',
  fileName: 'overlay-abc.png',
  displayName: 'Untitled',  // ✅ Added by .default()
  filePath: '...',
  url: '...',
  // ... other fields
}
```

**Legacy MediaReference** (without displayName):
```typescript
// Existing reference in project config
{
  mediaAssetId: 'abc',
  url: '...',
  filePath: '...'
  // no displayName field
}

// After Zod parsing
{
  mediaAssetId: 'abc',
  url: '...',
  filePath: '...',
  displayName: 'Untitled'  // ✅ Added by .default()
}
```

### New Uploads

All new uploads will include displayName:

```typescript
// Upload service captures file.name
const displayName = file.name  // "Beach Sunset.jpg"

// MediaAsset document
{
  id: '456',
  fileName: 'xyz789.jpg',
  displayName: 'Beach Sunset.jpg',  // ✅ Original filename
  // ... other fields
}

// Returned MediaReference
{
  mediaAssetId: '456',
  url: '...',
  filePath: '...',
  displayName: 'Beach Sunset.jpg'  // ✅ Included in reference
}
```

## Summary

### Changes Required

1. **Schema Updates** (2 files):
   - `packages/shared/src/schemas/media/media-asset.schema.ts`: Add `displayName` field
   - `packages/shared/src/schemas/media/media-reference.schema.ts`: Add `displayName` field

2. **Service Updates** (1 file):
   - `apps/clementine-app/src/domains/media-library/services/upload-media-asset.service.ts`:
     - Capture `displayName = file.name`
     - Include in Firestore document
     - Return in result object

3. **Utility Updates** (1 file):
   - `apps/clementine-app/src/domains/media-library/utils/upload.utils.ts`:
     - Remove "overlay-" prefix from `generateFileName`

4. **Type Updates** (1 file):
   - `apps/clementine-app/src/domains/media-library/hooks/useUploadMediaAsset.ts`:
     - Update return type to include `displayName`

### Zero Breaking Changes

- ✅ Legacy documents work without migration (default to "Untitled")
- ✅ Existing code continues to work (displayName is additive)
- ✅ No API contract changes (service still returns same fields + one new)
- ✅ No UI changes required (displayName available but not mandatory to use immediately)
