# Data Model: Event Settings - Overlay Configuration

**Feature**: 013-event-settings-overlays
**Date**: 2026-01-05
**Status**: Design Complete

## Overview

This document defines the complete data model for overlay configuration, including two new entities (`MediaAsset`, `OverlayReference`) and one schema update (`OverlaysConfig`). The model follows Firebase Firestore patterns with workspace-scoped subcollections and client-first architecture principles.

---

## Entity 1: MediaAsset

### Purpose
Reusable media asset stored in workspace media library. Overlays, logos, and other uploadable files are stored as MediaAsset documents.

### Firestore Location
**Collection**: `workspaces/{workspaceId}/mediaAssets/{assetId}`
**Auto-generated ID**: Firestore auto-generates document ID (not nanoid)

### Schema Definition

```typescript
// File: apps/clementine-app/src/domains/media-library/schemas/media-asset.schema.ts

import { z } from 'zod'

/**
 * Media Asset Schema
 *
 * Stored in: workspaces/{workspaceId}/mediaAssets/{assetId}
 * Storage path: workspaces/{workspaceId}/media/{fileName}
 *
 * Reusable across all workspace features (events, projects, etc.)
 */
export const mediaAssetSchema = z.object({
  /**
   * Document ID (Firestore auto-generated)
   */
  id: z.string(),

  /**
   * Generated unique file name
   * Format: overlay-{nanoid()}.{ext}
   * Example: overlay-V1StGXR8_Z5jdHi6B-myT.png
   */
  fileName: z.string(),

  /**
   * Full Storage path
   * Format: workspaces/{workspaceId}/media/{fileName}
   * Example: workspaces/ws-abc123/media/overlay-xyz789.png
   */
  filePath: z.string(),

  /**
   * Firebase Storage download URL
   * Full public URL for direct image rendering
   * Example: https://firebasestorage.googleapis.com/v0/b/.../overlay-abc123.png?token=...
   */
  url: z.string().url(),

  /**
   * File size in bytes
   * Max: 5MB (5,242,880 bytes)
   */
  fileSize: z.number().int().positive(),

  /**
   * MIME type
   * Allowed: image/png, image/jpeg, image/jpg, image/webp
   */
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']),

  /**
   * Image width in pixels
   * Extracted client-side before upload
   */
  width: z.number().int().positive(),

  /**
   * Image height in pixels
   * Extracted client-side before upload
   */
  height: z.number().int().positive(),

  /**
   * Upload timestamp (milliseconds since epoch)
   * Example: Date.now()
   */
  uploadedAt: z.number().int().positive(),

  /**
   * User ID who uploaded the asset
   * Reference: users/{userId}
   */
  uploadedBy: z.string(),

  /**
   * Asset type for categorization
   * - overlay: Overlay image for events
   * - logo: Workspace or event logo
   * - other: Miscellaneous media
   */
  type: z.enum(['overlay', 'logo', 'other']),

  /**
   * Soft delete status
   * - active: Asset is available
   * - deleted: Asset is soft-deleted (future cleanup job will remove)
   */
  status: z.enum(['active', 'deleted']).default('active'),
})

export type MediaAsset = z.infer<typeof mediaAssetSchema>
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Firestore auto-generated document ID |
| `fileName` | string | ✅ | Unique file name (e.g., `overlay-abc123.png`) |
| `filePath` | string | ✅ | Full Storage path (e.g., `workspaces/ws-abc/media/overlay-abc.png`) |
| `url` | string | ✅ | Firebase Storage download URL (full public URL) |
| `fileSize` | number | ✅ | File size in bytes (max 5MB) |
| `mimeType` | enum | ✅ | MIME type (`image/png`, `image/jpeg`, `image/jpg`, `image/webp`) |
| `width` | number | ✅ | Image width in pixels |
| `height` | number | ✅ | Image height in pixels |
| `uploadedAt` | number | ✅ | Upload timestamp (milliseconds) |
| `uploadedBy` | string | ✅ | User ID of uploader |
| `type` | enum | ✅ | Asset type (`overlay`, `logo`, `other`) |
| `status` | enum | ✅ | Soft delete status (`active`, `deleted`) |

### Validation Rules

**File Type**:
- ✅ Allowed: PNG, JPG/JPEG, WebP
- ❌ Rejected: SVG, GIF, videos, PDFs, etc.

**File Size**:
- ✅ Max: 5MB (5,242,880 bytes)
- ❌ Rejected: Files > 5MB

**Image Dimensions**:
- ✅ Any dimensions allowed (no aspect ratio enforcement)
- Future: Could add validation or warnings for non-standard aspect ratios

**Status Transitions**:
- `active` → `deleted` (soft delete)
- `deleted` → permanent delete (future background job)

### Example Document

```json
{
  "id": "mJKLdF3sT8rPqWxYz",
  "fileName": "overlay-V1StGXR8_Z5jdHi6B-myT.png",
  "filePath": "workspaces/ws-abc123/media/overlay-V1StGXR8_Z5jdHi6B-myT.png",
  "url": "https://firebasestorage.googleapis.com/v0/b/clementine-prod.appspot.com/o/workspaces%2Fws-abc123%2Fmedia%2Foverlay-V1StGXR8_Z5jdHi6B-myT.png?alt=media&token=xyz789",
  "fileSize": 2458624,
  "mimeType": "image/png",
  "width": 1080,
  "height": 1080,
  "uploadedAt": 1704484800000,
  "uploadedBy": "user-123",
  "type": "overlay",
  "status": "active"
}
```

---

## Entity 2: OverlayReference

### Purpose
Reference to a MediaAsset used as an overlay in event configuration. Stores both the asset ID (for tracking) and the download URL (for fast rendering).

### Embedded In
- `ProjectEvent.draftConfig.overlays['1:1']`
- `ProjectEvent.draftConfig.overlays['9:16']`
- `ProjectEvent.publishedConfig.overlays['1:1']`
- `ProjectEvent.publishedConfig.overlays['9:16']`

### Schema Definition

```typescript
// File: apps/clementine-app/src/domains/event/shared/schemas/project-event-config.schema.ts (UPDATED)

/**
 * Overlay Reference Schema
 *
 * References a MediaAsset document for use as an overlay
 * Stores both ID (tracking) and URL (fast rendering)
 */
export const overlayReferenceSchema = z.object({
  /**
   * MediaAsset document ID
   * Reference: workspaces/{workspaceId}/mediaAssets/{mediaAssetId}
   */
  mediaAssetId: z.string(),

  /**
   * Firebase Storage download URL
   * Fast rendering without extra Firestore query or getDownloadURL call
   */
  url: z.string().url(),
}).nullable()

export type OverlayReference = z.infer<typeof overlayReferenceSchema>
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mediaAssetId` | string | ✅ | MediaAsset document ID for tracking and future features |
| `url` | string | ✅ | Download URL for instant rendering |

### Why Both Fields?

**`mediaAssetId`**:
- Track which events use which assets
- Enable future features (usage tracking, asset management, bulk operations)
- Update URL if file is moved/renamed (rare but possible)
- Show asset metadata in UI (file size, upload date, dimensions)

**`url`**:
- Fast rendering (no Firestore query or `getDownloadURL` call needed)
- Simpler guest app rendering (direct image URL)
- Firebase auto-refreshes download tokens (URLs remain valid)

### Example Value

```json
{
  "mediaAssetId": "mJKLdF3sT8rPqWxYz",
  "url": "https://firebasestorage.googleapis.com/v0/b/.../overlay-abc123.png?token=xyz789"
}
```

**Null State** (no overlay set):
```json
null
```

---

## Entity 3: OverlaysConfig (Schema Update)

### Purpose
Configuration for overlay images applied to guest photos in different aspect ratios. Embedded in `ProjectEventConfig`.

### Schema Definition

```typescript
// File: apps/clementine-app/src/domains/event/shared/schemas/project-event-config.schema.ts (UPDATED)

/**
 * Overlay images for different aspect ratios
 * Applied to guest photos based on their orientation
 *
 * BEFORE (012): Simple URL strings
 * AFTER (013): OverlayReference objects (mediaAssetId + url)
 */
export const overlaysConfigSchema = z.object({
  /**
   * Square overlay (1:1 aspect ratio)
   * Applied to square-cropped guest photos
   */
  '1:1': overlayReferenceSchema.default(null),

  /**
   * Portrait overlay (9:16 aspect ratio)
   * Applied to portrait-oriented guest photos
   */
  '9:16': overlayReferenceSchema.default(null),
}).nullable().default(null)

export type OverlaysConfig = z.infer<typeof overlaysConfigSchema>
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `1:1` | OverlayReference \| null | ✅ | Square overlay reference (default: null) |
| `9:16` | OverlayReference \| null | ✅ | Portrait overlay reference (default: null) |

### Migration Strategy

**Old Format** (from 012):
```json
{
  "overlays": {
    "1:1": "https://firebasestorage.googleapis.com/.../overlay-abc.png",
    "9:16": null
  }
}
```

**New Format** (013):
```json
{
  "overlays": {
    "1:1": {
      "mediaAssetId": "mJKLdF3sT8rPqWxYz",
      "url": "https://firebasestorage.googleapis.com/.../overlay-abc.png"
    },
    "9:16": null
  }
}
```

**Migration Plan**:
- ✅ Zod schema uses `.looseObject()` for backward compatibility
- ✅ New uploads create new format (OverlayReference)
- ✅ Old URLs remain valid (read-only, deprecated)
- ❌ No migration script needed (lazy migration on update)

### Example Values

**Empty State** (no overlays):
```json
{
  "overlays": {
    "1:1": null,
    "9:16": null
  }
}
```

**One Overlay Set**:
```json
{
  "overlays": {
    "1:1": {
      "mediaAssetId": "mJKLdF3sT8rPqWxYz",
      "url": "https://firebasestorage.googleapis.com/.../overlay-abc.png?token=xyz"
    },
    "9:16": null
  }
}
```

**Both Overlays Set**:
```json
{
  "overlays": {
    "1:1": {
      "mediaAssetId": "mJKLdF3sT8rPqWxYz",
      "url": "https://firebasestorage.googleapis.com/.../square.png?token=123"
    },
    "9:16": {
      "mediaAssetId": "nOPqrS4tU9wXyZaBc",
      "url": "https://firebasestorage.googleapis.com/.../portrait.png?token=456"
    }
  }
}
```

---

## Entity Relationships

### Diagram

```
Workspace
    |
    ├── MediaAssets (subcollection)
    │   ├── MediaAsset (document)
    │   ├── MediaAsset (document)
    │   └── ...
    │
    └── Projects (subcollection)
        └── Project (document)
            └── Events (subcollection)
                └── ProjectEvent (document)
                    ├── draftConfig
                    │   └── overlays
                    │       ├── '1:1' → OverlayReference → MediaAsset
                    │       └── '9:16' → OverlayReference → MediaAsset
                    └── publishedConfig
                        └── overlays
                            ├── '1:1' → OverlayReference → MediaAsset
                            └── '9:16' → OverlayReference → MediaAsset
```

### Relationships

1. **Workspace → MediaAssets** (1:N)
   - One workspace has many media assets
   - Subcollection: `workspaces/{workspaceId}/mediaAssets`

2. **ProjectEvent → MediaAsset** (N:1 via OverlayReference)
   - One event can reference multiple media assets (max 2: 1:1 and 9:16)
   - One media asset can be used by multiple events (reusable)
   - Reference stored in `draftConfig.overlays` and `publishedConfig.overlays`

3. **User → MediaAsset** (1:N)
   - One user can upload many media assets
   - Tracked via `uploadedBy` field

### Referential Integrity

**Question**: What happens if a MediaAsset is deleted while still referenced by an event?

**Answer**: Soft delete pattern prevents hard deletion
- Removing overlay from event sets `overlays['1:1']` to `null` (does NOT delete MediaAsset)
- MediaAsset status changes to `deleted` (soft delete)
- Event overlay reference remains valid (URL still works)
- Future background job can clean up unused soft-deleted assets

**Design Decision**: No cascading deletes, no foreign key constraints (Firestore doesn't support them)

---

## State Transitions

### MediaAsset Lifecycle

```
[Created] → [Active] → [Deleted] → [Permanent Delete]
   ↓           ↓            ↓              ↓
Upload    In Use      Soft Delete    Background Job
Complete  by Events   (Manual)       (Future)
```

**States**:
- **Created**: Upload completes, Firestore document created, status = `active`
- **Active**: MediaAsset is available for use in events
- **Deleted**: Admin soft-deletes asset (status = `deleted`), file remains in Storage
- **Permanent Delete**: Future background job removes file from Storage and Firestore

**Transitions**:
- `active` → `deleted`: Admin removes asset (soft delete)
- `deleted` → permanent delete: Background job cleanup (future feature)

### OverlayReference Lifecycle

```
[Empty] → [Set] → [Removed] → [Re-set]
   ↓       ↓         ↓           ↓
  null  Reference   null      New Reference
```

**States**:
- **Empty**: No overlay set (`overlays['1:1'] = null`)
- **Set**: Overlay reference assigned (`overlays['1:1'] = { mediaAssetId, url }`)
- **Removed**: Overlay reference removed (`overlays['1:1'] = null`)
- **Re-set**: Different overlay assigned (`overlays['1:1'] = { newMediaAssetId, newUrl }`)

**Transitions**:
- `null` → `OverlayReference`: Upload completes, config updated
- `OverlayReference` → `null`: Remove button clicked
- `OverlayReference` → `DifferentOverlayReference`: Upload new overlay (replaces old)

---

## Queries

### Query 1: List All Workspace Media Assets

**Purpose**: Fetch all media assets for a workspace (future media library page)

**Query**:
```typescript
import { collection, query, where, orderBy } from 'firebase/firestore'

const mediaAssetsRef = collection(firestore, `workspaces/${workspaceId}/mediaAssets`)
const q = query(
  mediaAssetsRef,
  where('status', '==', 'active'),
  orderBy('uploadedAt', 'desc')
)
```

**Index Required**: Firestore auto-creates index for single-field queries (no custom index needed)

**Use Case**: Media library page (future feature)

---

### Query 2: Get Single MediaAsset by ID

**Purpose**: Fetch metadata for a specific media asset (rare, usually use cached URL)

**Query**:
```typescript
import { doc, getDoc } from 'firebase/firestore'

const mediaAssetRef = doc(firestore, `workspaces/${workspaceId}/mediaAssets/${assetId}`)
const snapshot = await getDoc(mediaAssetRef)
const mediaAsset = snapshot.data()
```

**Use Case**: Debugging, asset details modal (future)

---

### Query 3: Filter Media Assets by Type

**Purpose**: Fetch only overlays, logos, or other asset types (future feature)

**Query**:
```typescript
const q = query(
  mediaAssetsRef,
  where('type', '==', 'overlay'),
  where('status', '==', 'active'),
  orderBy('uploadedAt', 'desc')
)
```

**Index Required**: Composite index on (`type`, `status`, `uploadedAt`)
- Create via Firebase Console or `firestore.indexes.json`

**Use Case**: Media picker filtered by type (future)

---

## Indexes

### Required Firestore Indexes

**Index 1**: Single-field index on `uploadedAt` (auto-created by Firestore)
- Used for: Ordering media assets by upload date

**Index 2**: Composite index on `type`, `status`, `uploadedAt` (manual creation required)
- Used for: Filtering by type + status + ordering by date
- Create in `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "mediaAssets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "uploadedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## Security Rules

### Firestore Rules

```javascript
// File: firestore.rules (monorepo root)

// Helper functions (existing)
function isMember(workspaceId) {
  return request.auth != null &&
         exists(/databases/$(database)/documents/workspaces/$(workspaceId)/members/$(request.auth.uid));
}

function isAdmin(workspaceId) {
  return request.auth != null &&
         get(/databases/$(database)/documents/workspaces/$(workspaceId)/members/$(request.auth.uid)).data.role == 'admin';
}

// MediaAsset rules (NEW)
match /workspaces/{workspaceId}/mediaAssets/{assetId} {
  // Any workspace member can read media assets
  allow read: if isMember(workspaceId);

  // Only admins can create media assets
  allow create: if isAdmin(workspaceId) &&
                   request.resource.data.keys().hasAll([
                     'fileName', 'filePath', 'url', 'fileSize', 'mimeType',
                     'width', 'height', 'uploadedAt', 'uploadedBy', 'type', 'status'
                   ]) &&
                   request.resource.data.status == 'active' &&
                   request.resource.data.fileSize <= 5 * 1024 * 1024 &&  // 5MB max
                   request.resource.data.mimeType in ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

  // Only admins can update (soft delete)
  allow update: if isAdmin(workspaceId) &&
                   request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status']) &&
                   request.resource.data.status == 'deleted';
}
```

### Storage Rules

```javascript
// File: storage.rules (monorepo root)

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper function (existing)
    function isMember(workspaceId) {
      return request.auth != null &&
             firestore.exists(/databases/(default)/documents/workspaces/$(workspaceId)/members/$(request.auth.uid));
    }

    function isAdmin(workspaceId) {
      return request.auth != null &&
             firestore.get(/databases/(default)/documents/workspaces/$(workspaceId)/members/$(request.auth.uid)).data.role == 'admin';
    }

    // Media files rules (NEW)
    match /workspaces/{workspaceId}/media/{fileName} {
      // Any workspace member can read files
      allow read: if isMember(workspaceId);

      // Only admins can upload files
      allow create: if isAdmin(workspaceId) &&
                       request.resource.size <= 5 * 1024 * 1024 &&  // 5MB max
                       request.resource.contentType.matches('image/(png|jpeg|jpg|webp)');

      // No updates or deletes (files are immutable)
      allow update, delete: if false;
    }
  }
}
```

---

## Conclusion

The data model is complete and ready for implementation. Key decisions:
1. **MediaAsset** as reusable subcollection (workspace-scoped)
2. **OverlayReference** with both ID and URL (tracking + performance)
3. **OverlaysConfig** schema update (backward compatible)
4. **Soft delete** pattern (no hard deletes, future cleanup job)
5. **Client-first architecture** (Firebase client SDK for all operations)

**Next Phase**: Phase 1 continued - API contracts (if needed) and quickstart.md
