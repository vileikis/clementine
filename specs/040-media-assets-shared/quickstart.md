# Quickstart: Media Assets Shared Schema

**Feature**: 040-media-assets-shared
**Date**: 2026-01-26

## Overview

This feature centralizes media asset schemas in `@clementine/shared` and provides a unified `mediaReferenceSchema` for all media references across the codebase.

## Importing Schemas

### From App or Functions

```typescript
import {
  // Full document schema
  mediaAssetSchema,
  type MediaAsset,

  // Reference schema (for embedding in other documents)
  mediaReferenceSchema,
  type MediaReference,

  // Enums
  imageMimeTypeSchema,
  type ImageMimeType,
  mediaAssetTypeSchema,
  type MediaAssetType,
  mediaAssetStatusSchema,
  type MediaAssetStatus,
} from '@clementine/shared'
```

### Backward Compatible Imports

```typescript
// These still work for backward compatibility
import {
  mediaReferenceSchema,  // Re-exported from theme/
  type MediaReference,
} from '@clementine/shared'
```

## Creating a Media Reference

### Client-Side (After Upload)

```typescript
import { type MediaReference } from '@clementine/shared'

// Create reference with filePath for new uploads
const mediaRef: MediaReference = {
  mediaAssetId: docRef.id,
  url: downloadURL,
  filePath: `workspaces/${workspaceId}/media/${fileName}`,
}
```

### Server-Side (Cloud Functions)

```typescript
import { type MediaReference } from '@clementine/shared'
import { storage } from './infra/firebase-admin'

async function downloadMedia(ref: MediaReference): Promise<void> {
  if (ref.filePath) {
    // New documents: use filePath directly
    const file = storage.bucket().file(ref.filePath)
    await file.download({ destination: localPath })
  } else {
    // Legacy documents: parse URL
    const storagePath = parseStorageUrl(ref.url)
    const file = storage.bucket().file(storagePath)
    await file.download({ destination: localPath })
  }
}
```

## Validating Data

### Parse and Validate

```typescript
import { mediaAssetSchema, mediaReferenceSchema } from '@clementine/shared'

// Validate a media asset document
const result = mediaAssetSchema.safeParse(firestoreData)
if (!result.success) {
  console.error('Invalid media asset:', result.error)
}

// Validate a media reference
const refResult = mediaReferenceSchema.safeParse(referenceData)
if (refResult.success) {
  const ref = refResult.data
  // ref.filePath is typed as string | null
}
```

### Infer Types

```typescript
import { z } from 'zod'
import { mediaAssetSchema } from '@clementine/shared'

// Get type from schema
type MediaAsset = z.infer<typeof mediaAssetSchema>
```

## Using the Upload Service

### Service Function

```typescript
import { uploadMediaAsset } from '@/domains/media-library/services'

const result = await uploadMediaAsset({
  file: selectedFile,
  type: 'overlay',
  workspaceId: 'ws-123',
  userId: 'user-456',
  onProgress: (progress) => console.log(`${progress}%`),
})

console.log(result)
// { mediaAssetId: 'abc123', url: 'https://...', filePath: 'workspaces/...' }
```

### React Hook

```typescript
import { useUploadMediaAsset } from '@/domains/media-library/hooks'

function MediaUploader() {
  const upload = useUploadMediaAsset(workspaceId, userId)

  const handleUpload = async (file: File) => {
    const result = await upload.mutateAsync({
      file,
      type: 'overlay',
      onProgress: setProgress,
    })
    console.log('Uploaded:', result.mediaAssetId)
  }

  return (
    <button
      onClick={() => handleUpload(file)}
      disabled={upload.isPending}
    >
      {upload.isPending ? 'Uploading...' : 'Upload'}
    </button>
  )
}
```

## Schema Structure

### MediaAsset (Full Document)

```typescript
{
  id: string                    // Firestore document ID
  fileName: string              // e.g., "overlay-V1StGXR8.png"
  filePath: string              // e.g., "workspaces/ws-123/media/..."
  url: string                   // Firebase Storage download URL
  fileSize: number              // Bytes
  mimeType: ImageMimeType       // "image/png" | "image/jpeg" | ...
  width: number                 // Pixels
  height: number                // Pixels
  uploadedAt: number            // Unix timestamp (ms)
  uploadedBy: string            // User ID
  type: MediaAssetType          // "overlay" | "logo" | "other"
  status: MediaAssetStatus      // "active" | "deleted"
}
```

### MediaReference (Embedded Reference)

```typescript
{
  mediaAssetId: string          // Reference to MediaAsset.id
  url: string                   // For client-side rendering
  filePath: string | null       // For server-side storage access
}
```

## File Locations

| Schema | Location |
|--------|----------|
| `mediaAssetSchema` | `packages/shared/src/schemas/media/media-asset.schema.ts` |
| `mediaReferenceSchema` | `packages/shared/src/schemas/media/media-reference.schema.ts` |
| `imageMimeTypeSchema` | `packages/shared/src/schemas/media/image-mime-type.schema.ts` |
| `mediaAssetTypeSchema` | `packages/shared/src/schemas/media/media-asset-type.schema.ts` |

## Common Patterns

### Nullable Media Reference (Optional Field)

```typescript
// In a parent schema
export const parentSchema = z.object({
  // Optional media reference
  media: mediaReferenceSchema.nullable().default(null),
})
```

### Checking for filePath Before Use

```typescript
function getStoragePath(ref: MediaReference): string {
  if (ref.filePath) {
    return ref.filePath
  }
  // Fallback for legacy documents
  return parseStorageUrl(ref.url)
}
```
