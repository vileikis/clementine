# Data Model: Experience Cover Image

**Feature Branch**: `039-experience-media`
**Date**: 2026-01-22

## Overview

This feature uses existing data models - no new schemas or fields are required. The Experience document already has `name` and `media` fields, and the MediaAsset collection already exists for storing uploaded files.

## Entities

### Experience Document (Existing)

**Location**: `/workspaces/{workspaceId}/experiences/{experienceId}`
**Schema**: `packages/shared/src/schemas/experience/experience.schema.ts`

```typescript
// Fields relevant to this feature
{
  id: string,                    // Firestore document ID
  name: string,                  // Experience name (editable via dialog)
  media: ExperienceMedia | null, // Cover image (editable via dialog)
  updatedAt: number,             // Last update timestamp (Unix ms)
  // ... other fields unchanged
}
```

### ExperienceMedia Type (Existing)

**Schema**: `experienceMediaSchema` in `experience.schema.ts`

```typescript
type ExperienceMedia = {
  mediaAssetId: string,  // Reference to MediaAsset document
  url: string,           // Public download URL for immediate rendering
} | null
```

**Validation Rules**:
- `mediaAssetId`: Non-empty string, must reference valid MediaAsset
- `url`: Valid URL format

### MediaAsset Document (Existing)

**Location**: `/workspaces/{workspaceId}/mediaAssets/{assetId}`
**Schema**: `apps/.../media-library/schemas/media-asset.schema.ts`

```typescript
{
  id: string,                                    // Firestore document ID
  fileName: string,                              // Generated unique filename
  filePath: string,                              // Storage path: workspaces/{wsId}/media/{fileName}
  url: string,                                   // Firebase Storage download URL
  fileSize: number,                              // File size in bytes
  mimeType: 'image/png' | 'image/jpeg' | 'image/jpg' | 'image/webp',
  width: number,                                 // Image width in pixels
  height: number,                                // Image height in pixels
  uploadedAt: number,                            // Upload timestamp (Unix ms)
  uploadedBy: string,                            // User ID who uploaded
  type: 'overlay' | 'logo' | 'other',           // Asset type ('other' for cover images)
  status: 'active' | 'deleted',                  // Soft delete support
}
```

## Relationships

```
┌─────────────────────┐         ┌─────────────────────┐
│     Experience      │         │     MediaAsset      │
├─────────────────────┤         ├─────────────────────┤
│ id                  │         │ id                  │
│ name                │         │ fileName            │
│ media ──────────────┼────────▶│ url                 │
│   mediaAssetId      │         │ fileSize            │
│   url (denormalized)│         │ mimeType            │
│ ...                 │         │ ...                 │
└─────────────────────┘         └─────────────────────┘
```

**Key Design Decision**: The `url` is stored both in Experience.media and MediaAsset. This denormalization enables instant rendering without needing to fetch the MediaAsset document.

## Data Flow

### Dialog Open Flow

1. User clicks ExperienceIdentityBadge in TopNavBar
2. Dialog opens with current `experience.name` and `experience.media` values
3. Local form state initialized from props

### Upload Flow (Preview Only)

1. **File Selection** → Client validates type/size
2. **Storage Upload** → File uploaded to `workspaces/{wsId}/media/{fileName}`
3. **MediaAsset Creation** → Document created in `/workspaces/{wsId}/mediaAssets/`
4. **Local State Update** → `media` state updated with `{ mediaAssetId, url }`
5. **Preview Display** → MediaPickerField shows uploaded image

### Save Flow

1. **User Clicks Save** → Form validation runs
2. **Experience Update** → `name` and `media` written to Experience document via `useUpdateExperience`
3. **Cache Invalidation** → TanStack Query caches invalidated
4. **Dialog Closes** → Success toast shown

### Cancel Flow

1. **User Clicks Cancel** → Dialog closes
2. **No Firestore Changes** → Experience document unchanged
3. **Orphan Media** → Uploaded media exists in Storage but not linked (acceptable)

## Update Payload

When Save is clicked, `useUpdateExperience` is called with:

```typescript
{
  workspaceId: string,
  experienceId: string,
  name: string,              // Trimmed, validated 1-100 chars
  media: {                   // Or null if removed
    mediaAssetId: string,
    url: string,
  } | null,
}
```

## Constraints

| Constraint | Value | Enforced By |
|------------|-------|-------------|
| Name length | 1-100 characters | Form validation + Zod schema |
| Max file size | 5MB | Client-side validation |
| Allowed types | PNG, JPEG, WebP | Client-side validation |
| URL format | Valid URL | Zod schema |
| mediaAssetId | Non-empty string | Zod schema |

## No New Fields Required

This feature operates entirely on existing schema fields:
- ✅ `Experience.name` - Already exists, editable
- ✅ `Experience.media` - Already exists, nullable
- ✅ `MediaAsset` collection - Already exists for workspace media
- ✅ All display components - Already consume `experience.name` and `experience.media?.url`
