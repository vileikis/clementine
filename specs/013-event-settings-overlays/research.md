# Research: Event Settings - Overlay Configuration

**Feature**: 013-event-settings-overlays
**Date**: 2026-01-05
**Status**: Research Complete

## Overview

This document consolidates research findings for implementing overlay configuration in event settings. All technical unknowns from the plan's Technical Context have been resolved, and best practices have been identified for each technology choice.

## Research Areas

### 1. Firebase Storage Upload with Progress Tracking

**Question**: How to upload files to Firebase Storage using client SDK with progress tracking?

**Decision**: Use Firebase Storage `uploadBytesResumable` API with progress observer

**Rationale**:
- Firebase Storage provides built-in progress tracking via `uploadBytesResumable`
- Progress updates in real-time (0-100%)
- Handles pause/resume/cancel operations
- Returns download URL after completion
- Client SDK approach (no server function needed)

**Implementation Pattern**:
```typescript
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '@/integrations/firebase/client'

const storageRef = ref(storage, `workspaces/${workspaceId}/media/${fileName}`)
const uploadTask = uploadBytesResumable(storageRef, file)

uploadTask.on('state_changed',
  (snapshot) => {
    // Progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
    onProgress(progress)
  },
  (error) => {
    // Handle upload error
    onError(error)
  },
  async () => {
    // Upload complete - get download URL
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
    onComplete(downloadURL)
  }
)
```

**Alternatives Considered**:
- `uploadBytes` (no progress tracking) - Rejected: poor UX for large files
- Server-side upload via Cloud Function - Rejected: violates client-first architecture
- Third-party upload service (Uploadcare, Cloudinary) - Rejected: unnecessary complexity

**References**:
- Firebase Storage Upload Files: https://firebase.google.com/docs/storage/web/upload-files
- `uploadBytesResumable` API: https://firebase.google.com/docs/reference/js/storage#uploadbytesresumable

---

### 2. Image Dimension Extraction (Width, Height)

**Question**: How to extract image dimensions (width, height) from a File object before upload?

**Decision**: Use `HTMLImageElement` with `FileReader` to read dimensions client-side

**Rationale**:
- Synchronous extraction before upload (no server roundtrip)
- Native browser API (no external dependencies)
- Works for all image formats (PNG, JPG, WebP)
- Lightweight and fast (< 50ms for typical images)

**Implementation Pattern**:
```typescript
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url) // Clean up memory
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}
```

**Alternatives Considered**:
- Extract dimensions server-side after upload - Rejected: extra latency, violates client-first
- Use third-party library (sharp.js, jimp) - Rejected: unnecessary dependency, increases bundle size
- Skip dimension extraction - Rejected: dimensions are useful for future features (aspect ratio validation, thumbnails)

**References**:
- MDN HTMLImageElement: https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement
- MDN URL.createObjectURL: https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL

---

### 3. Drag-and-Drop File Upload (Mobile + Desktop)

**Question**: What is the best practice for drag-and-drop upload that works on mobile and desktop?

**Decision**: Use native HTML5 drag-and-drop API with mobile-friendly fallback (file input click)

**Rationale**:
- Native browser support (no external library needed)
- Works on desktop (drag-and-drop)
- Fallback for mobile (click to open file picker)
- Accessible (keyboard navigation via file input)
- Mobile file picker automatically opens camera option on iOS/Android

**Implementation Pattern**:
```tsx
function OverlayFrame({ onUpload }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onUpload(file)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />
      {/* Upload UI */}
    </div>
  )
}
```

**Key Features**:
- `accept` attribute restricts file picker to images only (UX improvement)
- Hidden file input (visually replaced by drag-and-drop area)
- Click fallback ensures mobile compatibility
- Visual feedback for drag state (`isDragging`)

**Alternatives Considered**:
- `react-dropzone` library - Rejected: adds 10KB+ to bundle, native API is sufficient
- `@dnd-kit` library - Rejected: designed for drag-and-drop reordering, not file uploads
- Progressive Web App file handling - Rejected: out of scope, not supported on all browsers

**Mobile Considerations**:
- Mobile devices don't support drag-and-drop → file input click opens camera/gallery
- `accept="image/*"` attribute triggers camera option on mobile file picker
- Touch-friendly tap targets (minimum 44x44px per mobile-first principle)

**References**:
- MDN Drag and Drop API: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
- MDN File Input: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file
- Mobile file input best practices: https://web.dev/file-handling/

---

### 4. Unique File Naming Strategy

**Question**: How to generate unique file names for uploaded overlays?

**Decision**: Use `nanoid` library with format `overlay-{nanoid()}.{ext}`

**Rationale**:
- Collision-resistant (60% chance of collision after ~10^14 IDs)
- URL-safe characters (no special characters, no encoding needed)
- Short IDs (21 characters by default)
- Lightweight (~130 bytes)
- Already used in codebase (existing dependency)

**Implementation Pattern**:
```typescript
import { nanoid } from 'nanoid'

function generateFileName(originalFile: File): string {
  const ext = originalFile.name.split('.').pop() || 'png'
  return `overlay-${nanoid()}.${ext}`
}

// Example output: overlay-V1StGXR8_Z5jdHi6B-myT.png
```

**Alternatives Considered**:
- UUID v4 - Rejected: longer IDs (36 characters), contains hyphens
- Timestamp + random - Rejected: less collision-resistant, predictable
- Original file name - Rejected: special characters, name conflicts, security risk (path traversal)
- Hash of file content (SHA-256) - Rejected: same file = same hash (no uniqueness per upload)

**References**:
- nanoid GitHub: https://github.com/ai/nanoid
- nanoid documentation: https://zelark.github.io/nano-id-cc/

---

### 5. File Validation (Type, Size)

**Question**: What validation is needed for uploaded overlay images?

**Decision**: Client-side validation for UX, Firestore/Storage rules for security

**Client-Side Validation** (UX only):
- **File type**: Check MIME type against whitelist (`image/png`, `image/jpeg`, `image/jpg`, `image/webp`)
- **File size**: Check size ≤ 5MB (5,242,880 bytes)
- **Show toast error** if validation fails

**Server-Side Validation** (Security):
- Firebase Storage rules enforce size and type (see Storage Rules section)

**Implementation Pattern**:
```typescript
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only PNG, JPG, and WebP images are supported' }
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File must be under 5MB' }
  }
  return { valid: true }
}
```

**Rationale**:
- Client-side validation provides instant feedback (better UX)
- Server-side validation (Storage rules) prevents malicious uploads
- Defense-in-depth approach (client + server validation)

**References**:
- Firebase Storage Security: https://firebase.google.com/docs/storage/security
- File validation best practices: https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload

---

### 6. Firestore Subcollection Pattern

**Question**: Should media assets be stored as subcollection or top-level collection?

**Decision**: Use subcollection `workspaces/{workspaceId}/mediaAssets/{assetId}`

**Rationale**:
- **Data locality**: All workspace data together (easier queries, better data organization)
- **Security rules**: Workspace context in path (simpler rules)
- **Scalability**: Subcollections support up to 1M documents per parent (sufficient for workspace media)
- **Multi-tenancy**: Natural isolation between workspaces
- **Cleanup**: Deleting workspace can cascade delete subcollections

**Implementation Pattern**:
```typescript
import { collection, addDoc } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'

const mediaAssetsRef = collection(firestore, `workspaces/${workspaceId}/mediaAssets`)

const docRef = await addDoc(mediaAssetsRef, {
  fileName: 'overlay-abc123.png',
  filePath: `workspaces/${workspaceId}/media/overlay-abc123.png`,
  url: downloadURL,
  fileSize: file.size,
  mimeType: file.type,
  width: 1080,
  height: 1080,
  uploadedAt: Date.now(),
  uploadedBy: userId,
  type: 'overlay',
  status: 'active',
})
```

**Alternatives Considered**:
- Top-level collection `mediaAssets/{assetId}` with `workspaceId` field - Rejected: requires composite index, harder security rules
- Store in workspace document (embedded array) - Rejected: document size limit (1MB), not queryable
- Store in Firebase Storage metadata only - Rejected: Firestore provides better query capabilities

**References**:
- Firestore Data Model: https://firebase.google.com/docs/firestore/data-model
- Firestore Subcollections: https://firebase.google.com/docs/firestore/data-model#subcollections

---

### 7. TanStack Query Integration

**Question**: How to integrate upload logic with TanStack Query for state management?

**Decision**: Use `useMutation` hook for upload, query invalidation for cache updates

**Rationale**:
- TanStack Query handles loading/error states automatically
- Mutation pattern fits upload workflow (optimistic updates optional)
- Query invalidation ensures UI re-renders after upload
- Centralized error handling via mutation callbacks

**Implementation Pattern**:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

function useUploadMediaAsset(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, type }: { file: File; type: 'overlay' | 'logo' | 'other' }) => {
      // 1. Validate file
      // 2. Generate unique file name
      // 3. Upload to Storage with progress tracking
      // 4. Get download URL
      // 5. Extract image dimensions
      // 6. Create Firestore document
      return { mediaAssetId, url }
    },
    onSuccess: () => {
      // Invalidate queries to trigger re-fetch
      queryClient.invalidateQueries({ queryKey: ['mediaAssets', workspaceId] })
    },
    onError: (error) => {
      // Error handling (toast notification, Sentry logging)
      console.error('Upload failed:', error)
    },
  })
}
```

**References**:
- TanStack Query Mutations: https://tanstack.com/query/latest/docs/framework/react/guides/mutations
- TanStack Query Invalidation: https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations

---

### 8. Auto-Save Pattern for Event Config

**Question**: Should overlay config updates be debounced or immediate?

**Decision**: Immediate auto-save (no debouncing) for overlay reference updates

**Rationale**:
- Upload is already a slow operation (1-30 seconds)
- Config update is cheap (single Firestore write)
- Debouncing adds unnecessary complexity for infrequent updates
- User expectation: upload completes → config saved (not delayed)

**Implementation Pattern**:
```typescript
// After upload completes, immediately update event config
const { mutateAsync: uploadAsset } = useUploadMediaAsset(workspaceId)
const { mutateAsync: updateOverlays } = useUpdateOverlays(projectId, eventId)

const handleUpload = async (file: File, aspectRatio: '1:1' | '9:16') => {
  try {
    // 1. Upload asset
    const { mediaAssetId, url } = await uploadAsset({ file, type: 'overlay' })

    // 2. Update event config (immediate)
    await updateOverlays({
      [aspectRatio]: { mediaAssetId, url }
    })

    // Success toast
  } catch (error) {
    // Error toast
  }
}
```

**Alternatives Considered**:
- Debounce with 500ms delay - Rejected: unnecessary complexity, poor UX (user waits for upload + debounce)
- Optimistic update - Rejected: upload can fail, optimistic update would need rollback
- Manual save button - Rejected: adds friction, violates auto-save pattern established in 012

**References**:
- Auto-save UX patterns: https://ux.stackexchange.com/questions/61743/should-auto-save-be-immediate

---

## Technology Stack Summary

| Technology | Version | Purpose | Decision |
|------------|---------|---------|----------|
| Firebase Storage | 12.5.0 | File upload with progress | `uploadBytesResumable` API |
| Firebase Firestore | 12.5.0 | Media asset metadata | Subcollection pattern |
| TanStack Query | 5.66.5 | State management | `useMutation` for uploads |
| nanoid | (existing) | Unique file naming | `overlay-{nanoid()}.{ext}` |
| Zod | 4.1.12 | Schema validation | `mediaAssetSchema`, `overlayReferenceSchema` |
| Native Drag-and-Drop | Browser API | File upload UI | HTML5 API with mobile fallback |
| HTMLImageElement | Browser API | Extract dimensions | `createObjectURL` + `naturalWidth/Height` |

---

## Security Considerations

### Firestore Security Rules

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

### Storage Security Rules

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

**Rationale**:
- Permissions enforced at Firebase level (not application code)
- Defense-in-depth: client validation + server rules
- Guest users (future feature) will need read-only access to published event overlays

---

## Performance Considerations

### Upload Performance
- **File size limit**: 5MB ensures reasonable upload times (< 30 seconds on 4G)
- **Progress tracking**: Visual feedback prevents perceived slowness
- **Client-side validation**: Instant feedback (< 50ms) before upload starts

### Query Performance
- **Download URL storage**: No `getDownloadURL` call needed for rendering
- **Subcollection queries**: Efficient with workspace context (no global scan)
- **Query invalidation**: Only invalidates mediaAssets query, not entire app cache

### Bundle Size
- **nanoid**: ~130 bytes (minimal impact)
- **No external upload libraries**: Saves 10-50KB (native APIs only)
- **Tree-shaking friendly**: Hooks and schemas are tree-shakeable

---

## Accessibility Considerations

### Keyboard Navigation
- File input is keyboard accessible (Tab to focus, Enter to open)
- Remove button is keyboard accessible (Tab to focus, Enter to remove)

### Screen Reader Support
- File input has `aria-label` ("Upload overlay image")
- Drag-and-drop area has descriptive text ("Drop image or click to upload")
- Upload progress announced via live region (`aria-live="polite"`)

### Visual Feedback
- Focus states for all interactive elements
- Visual distinction between empty, uploading, and uploaded states
- Error messages displayed prominently (toast + inline)

---

## Testing Strategy

### Unit Tests
- ✅ File validation (type, size)
- ✅ Unique file name generation
- ✅ Zod schema validation (mediaAssetSchema, overlayReferenceSchema)

### Component Tests
- ✅ `OverlayFrame` component (empty, uploading, uploaded states)
- ✅ Drag-and-drop interaction
- ✅ File input click interaction
- ✅ Remove overlay interaction

### Integration Tests
- ✅ Upload → config update flow
- ✅ Error handling (upload failure, validation failure)
- ✅ Query invalidation after upload

### Manual Testing
- ✅ Test on real mobile device (iOS Safari, Android Chrome)
- ✅ Test with different file sizes (1KB, 1MB, 5MB, 10MB)
- ✅ Test with different file types (PNG, JPG, WebP, SVG, GIF)
- ✅ Test drag-and-drop on desktop
- ✅ Test file picker on mobile (camera option)

---

## Conclusion

All technical unknowns have been resolved. The implementation will use:
1. **Firebase Storage** with `uploadBytesResumable` for progress tracking
2. **HTMLImageElement** for client-side dimension extraction
3. **Native HTML5 drag-and-drop** API with mobile fallback
4. **nanoid** for unique file naming
5. **TanStack Query** `useMutation` for state management
6. **Immediate auto-save** for event config updates
7. **Firestore subcollection** pattern for workspace-scoped media assets

**Next Phase**: Phase 1 - Design (data-model.md, contracts/, quickstart.md)
