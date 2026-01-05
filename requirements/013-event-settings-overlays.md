# 013: Event Settings - Overlay Configuration

**Status**: Draft
**Created**: 2026-01-05
**Domain**: Events (Event Designer - Settings)
**Depends On**: 012-event-settings-sharing-and-publish.md

## Overview

Enable workspace admins to upload and configure overlay images for events. Overlays are applied to guest photos in the specified aspect ratios (1:1 square, 9:16 portrait).

**Key Features**:
1. Upload overlay images (drag & drop or file picker)
2. Store media assets in workspace-scoped collection
3. Reference overlays in event configuration
4. Remove overlays without deleting files (soft reference removal)

## Goals & Objectives

### Primary Goals
1. ✅ Allow admins to upload overlay images for 1:1 and 9:16 aspect ratios
2. ✅ Store uploaded media in reusable workspace media library
3. ✅ Auto-save overlay references to event draft configuration
4. ✅ Support drag & drop and file picker upload methods

### Success Criteria
- Admins can upload overlay images with visual feedback (progress indicator)
- Overlay references auto-save to `event.draftConfig.overlays`
- Uploaded media assets are reusable across events
- Remove overlay button removes reference only (preserves file for reuse)
- File validation prevents invalid uploads (type, size)

## Domain Structure

### Media Library Domain (NEW)

```
@domains/media-library/
├── components/                         # Future: MediaAssetCard, MediaGrid, etc.
├── containers/                         # Future: MediaLibraryPage
├── hooks/
│   └── useUploadMediaAsset.ts          # ✅ Reusable upload hook (THIS PRD)
├── schemas/
│   └── media-asset.schema.ts           # ✅ MediaAsset schema (THIS PRD)
├── types/
│   └── media.types.ts                  # ✅ Media types (THIS PRD)
└── index.ts
```

**Why a separate domain?**
- Media library is a bounded context with its own data, behavior, and UI
- Reusable across all domains (events, projects, workspace settings, etc.)
- Future home for MediaLibraryPage, picker, and asset management features

---

### Event Settings Domain (Updated)

```
@domains/event/settings/
├── components/
│   ├── SharingOptionCard.tsx           # Existing (012)
│   ├── OverlayFrame.tsx                # Display overlay frame (NEW)
│   └── OverlaySection.tsx              # Overlay upload container (NEW)
├── containers/
│   └── SettingsSharingPage.tsx         # Existing (012)
├── hooks/
│   ├── useUpdateShareOptions.ts        # Existing (012)
│   └── useUpdateOverlays.ts            # Update overlay config (NEW)
└── index.ts
```

**Import from media-library**:
```typescript
// @domains/event/settings/containers/OverlaySection.tsx
import { useUploadMediaAsset } from '@/domains/media-library'
```

---

## Data Model

### 1. MediaAsset Collection

**Location**: `workspaces/{workspaceId}/mediaAssets/{assetId}`

**Schema**: `@domains/media-library/schemas/media-asset.schema.ts`

```typescript
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
  id: z.string(),
  fileName: z.string(),                 // Generated: overlay-abc123.png
  filePath: z.string(),                 // Storage path: workspaces/{id}/media/{fileName}
  url: z.string().url(),                // Firebase Storage download URL
  fileSize: z.number(),                 // Bytes
  mimeType: z.string(),                 // image/png, image/jpeg, image/webp
  width: z.number(),                    // Image width in pixels
  height: z.number(),                   // Image height in pixels
  uploadedAt: z.number(),               // Timestamp
  uploadedBy: z.string(),               // User ID
  type: z.enum(['overlay', 'logo', 'other']),
  status: z.enum(['active', 'deleted']).default('active'),
})

export type MediaAsset = z.infer<typeof mediaAssetSchema>
```

**Key Fields**:
- `url`: Firebase Storage download URL (fast, direct image loading)
- `status`: Soft delete flag (`deleted` assets cleaned up by future background job)
- `type`: Asset category for filtering (`overlay`, `logo`, `other`)

---

### 2. Overlay Reference in Event Config

**Schema**: Already defined in `@domains/event/shared/schemas/project-event-config.schema.ts`

**Current structure** (URL only):
```typescript
overlaysConfigSchema = z.object({
  '1:1': z.string().url().nullable().default(null),
  '9:16': z.string().url().nullable().default(null),
}).nullable().default(null)
```

**Updated structure** (Asset ID + URL for better tracking):
```typescript
export const overlayReferenceSchema = z.object({
  mediaAssetId: z.string(),             // Reference to mediaAsset document
  url: z.string().url(),                // Download URL for fast rendering
}).nullable()

export const overlaysConfigSchema = z.object({
  '1:1': overlayReferenceSchema.default(null),
  '9:16': overlayReferenceSchema.default(null),
}).nullable().default(null)

export type OverlayReference = z.infer<typeof overlayReferenceSchema>
export type OverlaysConfig = z.infer<typeof overlaysConfigSchema>
```

**Why both `mediaAssetId` and `url`?**
- `mediaAssetId`: Track which events use which assets, enable future features (usage tracking, asset management)
- `url`: Fast rendering (no need to fetch mediaAsset document or call `getDownloadURL`)

**Example**:
```typescript
{
  overlays: {
    '1:1': {
      mediaAssetId: 'asset-abc123',
      url: 'https://firebasestorage.googleapis.com/v0/b/.../overlay-abc123.png?token=...'
    },
    '9:16': null
  }
}
```

---

## Architecture

### 1. OverlaySection Container

**File**: `@domains/event/settings/containers/OverlaySection.tsx`

**Purpose**: Container component that orchestrates overlay upload and display.

**Responsibilities**:
- Renders two `OverlayFrame` components (1:1 and 9:16)
- Handles upload via `useUploadMediaAsset` hook
- Updates event config via `useUpdateOverlays` hook
- Manages loading states (uploading, updating)
- Shows error messages (file too large, invalid type, etc.)

**Integration**: Imported by `SettingsSharingPage` (or separate settings tab route).

---

### 2. OverlayFrame Component

**File**: `@domains/event/settings/components/OverlayFrame.tsx`

**Purpose**: Display overlay upload/preview frame for a specific aspect ratio.

**Design Specs**:
- **Aspect ratio**: 1:1 (square) or 9:16 (portrait)
- **States**:
  - **Empty**: Dashed border, upload icon, "Drop image or click to upload" text
  - **Uploading**: Progress indicator (0-100%), file name
  - **Uploaded**: Image preview, remove button overlay on hover
- **Upload methods**: Drag & drop or click to open file picker
- **Design system compliance**: Use design tokens (`bg-muted`, `border-border`, etc.)
- **Accessible**: Keyboard navigation, ARIA labels

**Props**:
```typescript
interface OverlayFrameProps {
  aspectRatio: '1:1' | '9:16'
  label: string                         // "Square Overlay (1:1)" or "Portrait Overlay (9:16)"
  overlayRef: OverlayReference | null   // Current overlay reference
  onUpload: (file: File) => void        // Trigger upload
  onRemove: () => void                  // Remove overlay
  isUploading: boolean                  // Show progress indicator
  uploadProgress?: number               // 0-100
}
```

**Key Features**:
- **Display-only**: Upload logic handled by parent (`OverlaySection`)
- **Reusable**: Can be used in other contexts (project settings, etc.)
- **No hard-coded colors**: Uses design tokens per `@standards/frontend/design-system.md`

---

### 3. useUploadMediaAsset Hook

**File**: `@domains/media-library/hooks/useUploadMediaAsset.ts`

**Purpose**: Upload file to Storage and create mediaAsset document.

**Flow**:
1. Validate file (type, size)
2. Generate unique file name: `overlay-{nanoid()}.{ext}`
3. Upload to Storage: `workspaces/{workspaceId}/media/{fileName}`
4. Get download URL
5. Extract image dimensions (width, height)
6. Create mediaAsset document in Firestore
7. Return `{ mediaAssetId, url }`

**Key Features**:
- Progress tracking (0-100%)
- Validation (file type, size)
- Error handling (upload failed, network error)
- **Reusable across entire app** (events, projects, workspace settings, etc.)

**Usage**:
```typescript
// Can be used from any domain
import { useUploadMediaAsset } from '@/domains/media-library'
```

**Example**:
```typescript
const uploadAsset = useUploadMediaAsset(workspaceId)

const handleUpload = async (file: File) => {
  const { mediaAssetId, url } = await uploadAsset.mutateAsync({
    file,
    type: 'overlay',
  })

  // Then update event config
  await updateOverlays.mutateAsync({
    '1:1': { mediaAssetId, url }
  })
}
```

---

### 4. useUpdateOverlays Hook

**File**: `@domains/event/settings/hooks/useUpdateOverlays.ts`

**Purpose**: Update overlay references in event draft configuration.

**Key Features**:
- Validates against `overlaysConfigSchema`
- Simple field replacement (no deep merge needed)
- Uses shared helper `updateEventConfigField`
- Increments `draftVersion`
- Invalidates query to trigger re-render

**Usage**:
```typescript
const updateOverlays = useUpdateOverlays(projectId, eventId)

// Update 1:1 overlay
await updateOverlays.mutateAsync({
  '1:1': { mediaAssetId: 'asset-123', url: 'https://...' }
})

// Remove 9:16 overlay
await updateOverlays.mutateAsync({
  '9:16': null
})
```

**Implementation**:
```typescript
// Can use shared helper (simple field replacement)
const validated = overlaysConfigSchema.parse(overlays)
return await updateEventConfigField(projectId, eventId, 'overlays', validated)
```

---

## Upload Flow

### Complete Flow

1. **User selects file** (drag & drop or file picker)
2. **Client-side validation**:
   - File type: PNG, JPG/JPEG, WebP
   - File size: ≤ 5MB
   - Show error if validation fails
3. **Upload to Storage** (`useUploadMediaAsset`):
   - Generate file name: `overlay-abc123.png`
   - Upload to: `workspaces/{workspaceId}/media/{fileName}`
   - Track progress: 0% → 100%
   - Get download URL
4. **Extract image metadata**:
   - Read image dimensions (width, height)
5. **Create Firestore document**:
   - Collection: `workspaces/{workspaceId}/mediaAssets`
   - Document: Auto-generated ID
   - Data: `{ fileName, filePath, url, fileSize, mimeType, width, height, uploadedAt, uploadedBy, type: 'overlay', status: 'active' }`
6. **Update event config** (`useUpdateOverlays`):
   - Update `event.draftConfig.overlays['1:1']` with `{ mediaAssetId, url }`
   - Increment `draftVersion`
7. **UI updates**:
   - Show image preview in `OverlayFrame`
   - Top bar shows "New changes" badge
   - Publish button enables

### Error Handling

**Validation errors** (before upload):
- File too large (> 5MB): Toast error "File must be under 5MB"
- Invalid type: Toast error "Only PNG, JPG, and WebP images are supported"

**Upload errors** (during upload):
- Network error: Toast error "Upload failed. Check your connection."
- Permission denied: Toast error "You don't have permission to upload"

**Config update errors** (after upload):
- Event not found: Toast error "Event not found"
- Permission denied: Toast error "You don't have permission to edit this event"

**Important**: If upload succeeds but config update fails, media asset remains in Firestore (valid for retry or future use).

---

## Validation Rules

### File Type Validation

**Allowed**:
- `image/png`
- `image/jpeg`
- `image/jpg`
- `image/webp`

**Not allowed** (out of scope for now):
- `image/svg+xml` (SVG)
- `image/gif` (GIF)
- `video/*` (videos - future consideration)

### File Size Validation

**Max size**: 5MB (5,242,880 bytes)

**Rationale**:
- High-res PNG overlays: 1-3MB typical
- 5MB max accommodates 4K resolution overlays
- Prevents storage abuse

### Aspect Ratio Validation

**Validation level**: **Loose** (no strict enforcement)

**Rationale**:
- Trust admins to upload correct aspect ratios
- Avoid UX friction (rejecting valid images)
- Can add validation later if needed

**Future enhancement**: Show warning if aspect ratio doesn't match expected ratio (1:1 or 9:16).

---

## Storage & Security

### Storage Path

**Location**: `workspaces/{workspaceId}/media/{fileName}`

**File naming**: `overlay-{nanoid()}.{ext}`

**Example**: `workspaces/ws-abc123/media/overlay-xyz789.png`

### Firestore Collection

**Location**: `workspaces/{workspaceId}/mediaAssets/{assetId}`

**Subcollection rationale**:
- Natural hierarchy (media belongs to workspace)
- Simpler security rules (workspace context)
- Data locality (all workspace data together)
- Easier workspace deletion (cleanup subcollections)

### Security Rules

**Firestore Rules**:
```javascript
match /workspaces/{workspaceId}/mediaAssets/{assetId} {
  // Any workspace member can read media assets
  allow read: if isMember(workspaceId);

  // Only admins can create/update media assets
  allow create, update: if isAdmin(workspaceId);

  // Only admins can soft delete (status: 'deleted')
  allow update: if isAdmin(workspaceId) &&
                   request.resource.data.status == 'deleted';
}
```

**Storage Rules**:
```javascript
match /workspaces/{workspaceId}/media/{fileName} {
  // Any workspace member can read files
  allow read: if isMember(workspaceId);

  // Only admins can upload files
  allow create: if isAdmin(workspaceId) &&
                   request.resource.size <= 5 * 1024 * 1024 &&  // 5MB max
                   request.resource.contentType.matches('image/(png|jpeg|jpg|webp)');
}
```

**Note**: Guest users need read access to overlay images. Security rules should allow public read for published event overlays (future PRD will address guest access).

---

## Implementation Phases

### Phase 1: Media Library Domain Setup
- Create `@domains/media-library/` domain structure
- Create `media-asset.schema.ts` in media-library domain
- Create `media.types.ts` for shared types
- Update Firestore security rules

### Phase 2: Overlay Schema Update
- Update `overlaysConfigSchema` to include `mediaAssetId` + `url`
- Add Zod validation for overlay references

### Phase 3: Upload Infrastructure
- Create `useUploadMediaAsset` hook in media-library domain
- Implement file validation (type, size)
- Implement Storage upload with progress tracking
- Create Firestore document after upload
- Add error handling

### Phase 4: Overlay Configuration Hook
- Create `useUpdateOverlays` hook in event/settings domain
- Use shared helper `updateEventConfigField`
- Add query invalidation
- Add Sentry error reporting

### Phase 5: UI Components
- Create `OverlayFrame` component (display-only)
- Implement drag & drop upload area
- Implement file picker fallback
- Add progress indicator (0-100%)
- Add image preview
- Add remove button (hover overlay)
- Follow design system standards

### Phase 6: OverlaySection Container
- Create container component in event/settings domain
- Import `useUploadMediaAsset` from media-library domain
- Integrate `useUpdateOverlays` hook
- Handle upload → config update flow
- Add loading states and error messages

### Phase 7: Integration & Testing
- Add OverlaySection to settings tab route
- Test upload flow end-to-end
- Test drag & drop and file picker
- Test validation (file type, size)
- Test remove overlay functionality
- Verify security rules

---

## Acceptance Criteria

### Upload Functionality
- [ ] User can upload overlay image via drag & drop
- [ ] User can upload overlay image via file picker
- [ ] Upload shows progress indicator (0-100%)
- [ ] Upload creates mediaAsset document in Firestore
- [ ] Upload creates file in Storage at correct path
- [ ] File name is generated uniquely (`overlay-{nanoid()}.{ext}`)

### Validation
- [ ] Files over 5MB are rejected with clear error message
- [ ] Non-image files are rejected (SVG, GIF, videos, etc.)
- [ ] Only PNG, JPG/JPEG, WebP are accepted
- [ ] Image dimensions (width, height) are extracted and stored

### Event Configuration
- [ ] Overlay reference auto-saves to `event.draftConfig.overlays`
- [ ] Reference includes both `mediaAssetId` and `url`
- [ ] `draftVersion` increments on update
- [ ] Top bar shows "New changes" badge after upload

### UI Components
- [ ] `OverlayFrame` displays empty state with upload prompt
- [ ] `OverlayFrame` displays uploading state with progress
- [ ] `OverlayFrame` displays image preview after upload
- [ ] Remove button appears on hover over uploaded image
- [ ] All components follow design system (use design tokens)
- [ ] Accessible (keyboard navigation, ARIA labels)

### Overlay Removal
- [ ] Remove button removes overlay reference from event config
- [ ] Remove sets overlay to `null` in `event.draftConfig.overlays`
- [ ] Remove does NOT delete mediaAsset document
- [ ] Remove does NOT delete file from Storage
- [ ] UI updates immediately after removal

### Security
- [ ] Only workspace admins can upload media assets
- [ ] All workspace members can read media assets
- [ ] Firestore rules enforce upload permissions
- [ ] Storage rules enforce file size and type validation

### Code Quality
- [ ] Follows DDD principles (media-library domain owns media schemas and hooks)
- [ ] `useUploadMediaAsset` is reusable across entire app
- [ ] Event domain imports from media-library domain
- [ ] Follows mutation hook patterns (transaction, invalidation, error reporting)
- [ ] TypeScript strict mode passes
- [ ] No hard-coded colors (uses design tokens)
- [ ] Accessible components

---

## Out of Scope

- ❌ **Media library picker**: Upload only (no picking from existing assets)
- ❌ **Image editing**: No cropping, resizing, filters (upload as-is)
- ❌ **Aspect ratio enforcement**: No strict validation (trust admins)
- ❌ **Multiple overlays per aspect ratio**: Only one overlay per ratio (1:1, 9:16)
- ❌ **Overlay preview in guest flow**: Settings only, no guest preview
- ❌ **Background removal**: No automatic background transparency
- ❌ **Video overlays**: Image overlays only (videos future consideration)
- ❌ **SVG overlays**: Only raster images (PNG, JPG, WebP)
- ❌ **GIF overlays**: Static images only
- ❌ **Batch upload**: Upload one file at a time
- ❌ **Cleanup job**: Soft-deleted assets remain (future background job)

---

## Future Considerations

### Media Library Features

The `media-library` domain is ready to grow with these future features:

**MediaLibraryPage**:
- Browse all workspace media assets
- Grid view with thumbnails
- Filter by type (`overlay`, `logo`, `other`)
- Search by file name
- Sort by upload date, file size, etc.
- Bulk operations (delete, tag, etc.)

**Media Picker Modal**:
- Browse existing workspace media assets
- Reuse overlays across multiple events
- Select from library instead of uploading new
- Filter and search within picker

**Asset Management**:
- View asset details (dimensions, size, upload date, etc.)
- See which events/projects use each asset
- Bulk upload (multiple files at once)
- Tags and categories
- Storage quota tracking

**Additional Hooks** (in media-library domain):
- `useMediaAssets(workspaceId)` - Query all workspace media
- `useDeleteMediaAsset(workspaceId)` - Soft delete assets
- `useMediaAssetsByType(workspaceId, type)` - Filter by type

### Image Editing
- Crop to aspect ratio
- Resize for optimal file size
- Apply filters or adjustments
- Background removal (transparency)

### Advanced Overlays
- Video overlays (animated overlays)
- SVG overlays (vector graphics)
- Multiple overlays per aspect ratio (layered overlays)
- Overlay positioning (top-left, center, etc.)

### Cleanup & Optimization
- Auto-cleanup of unused assets (background job)
- Storage quota management per workspace
- Image optimization (automatic compression)
- CDN integration for faster delivery

### Additional Aspect Ratios
- 4:3 (landscape)
- 16:9 (widescreen)
- 3:4 (portrait)
- Custom aspect ratios

---

## Key Design Decisions

### 1. Subcollection vs Top-Level Collection
**Decision**: Store mediaAssets as subcollection `workspaces/{id}/mediaAssets`

**Rationale**:
- Natural hierarchy (media belongs to workspace)
- Simpler security rules (workspace path context)
- Data locality (all workspace data together)
- Easier workspace deletion
- Better multi-tenancy isolation

### 2. Media Library as Separate Domain
**Decision**: Create `media-library` domain now (not `shared/media/` or `workspace/media/`)

**Rationale**:
- Media library is a bounded context (has data, behavior, UI)
- Future-proof for MediaLibraryPage and picker features
- Reusable across all domains (events, projects, workspace settings)
- Clean imports: `import { useUploadMediaAsset } from '@/domains/media-library'`
- Scalable (room for filters, search, management features)

---

### 3. Store Download URL vs Path
**Decision**: Store download URL in overlay reference (not just Storage path)

**Rationale**:
- Faster image loading (no extra `getDownloadURL` call)
- Simpler guest app rendering (direct image URL)
- Firebase auto-refreshes download tokens
- Best practice for public/semi-public assets

---

### 4. Asset ID + URL Reference
**Decision**: Store both `mediaAssetId` and `url` in overlay reference

**Rationale**:
- Fast rendering (use URL directly)
- Future features (usage tracking, asset management)
- Update URL if file is moved/renamed
- Show asset metadata in UI (file size, upload date)

---

### 5. Separate Upload & Config Update
**Decision**: Upload file + create mediaAsset (transaction 1), then update event config (transaction 2)

**Rationale**:
- Reusable upload logic across app
- MediaAsset is valid even if config update fails
- Cleaner separation of concerns
- Easier to retry config update

---

### 6. Soft Delete Only
**Decision**: Remove overlay removes reference only (sets to `null`), doesn't delete file

**Rationale**:
- MediaAsset is reusable across events
- Prevents accidental data loss
- Future cleanup job can remove unused assets
- Admin can manually delete if needed

---

### 7. Loose Aspect Ratio Validation
**Decision**: Don't enforce strict aspect ratio matching (1:1 must be square, etc.)

**Rationale**:
- Trust workspace admins to upload correct ratios
- Reduces UX friction (no rejected uploads)
- Can add validation later if abuse occurs
- Simple for MVP

---

### 8. Generated File Names
**Decision**: Generate unique file names (`overlay-{nanoid()}.{ext}`) instead of preserving original names

**Rationale**:
- No file name conflicts
- Consistent naming across workspace
- Simpler Storage management
- No special character handling

---

### 9. Progress Indicator
**Decision**: Show simple progress indicator (0-100%) during upload

**Rationale**:
- Visual feedback for users (especially large files)
- Firebase Storage provides progress events
- Improves UX (user knows upload is happening)
- Simple implementation

---

## References

- **Parent PRD**: `requirements/012-event-settings-sharing-and-publish.md`
- **Overlay reference**: Legacy implementation at `/web/src/features/events/components/overlay/OverlaySection.tsx`
- **Media Library Domain**: `@domains/media-library/`
- **Media Asset Schema**: `@domains/media-library/schemas/media-asset.schema.ts`
- **Upload Hook**: `@domains/media-library/hooks/useUploadMediaAsset.ts`
- **Design System**: `@standards/frontend/design-system.md`
- **Shared Helper**: `@domains/event/shared/lib/updateEventConfigField.ts`
- **Event Config Schema**: `@domains/event/shared/schemas/project-event-config.schema.ts`
- **Standards**:
  - `@standards/global/zod-validation.md`
  - `@standards/global/project-structure.md`
  - `@standards/global/client-first-architecture.md`
  - `@standards/frontend/design-system.md`
