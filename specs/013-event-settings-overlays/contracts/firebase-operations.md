# Firebase Operations Contract: Event Settings - Overlay Configuration

**Feature**: 013-event-settings-overlays
**Date**: 2026-01-05
**Architecture**: Client-First (Firebase Client SDK)

## Overview

This document defines the Firebase operations (Firestore queries, Storage uploads, mutations) used in the overlay configuration feature. Since this is a client-first architecture, there are no REST/GraphQL APIs. Instead, all operations use Firebase client SDKs directly from the browser.

---

## Firestore Operations

### Operation 1: Create MediaAsset Document

**Purpose**: Create a new media asset document after uploading file to Storage

**Collection**: `workspaces/{workspaceId}/mediaAssets`

**Method**: `addDoc` (Firestore client SDK)

**Input Parameters**:
```typescript
interface CreateMediaAssetInput {
  fileName: string              // Generated: overlay-{nanoid()}.{ext}
  filePath: string              // Storage path: workspaces/{id}/media/{fileName}
  url: string                   // Firebase Storage download URL
  fileSize: number              // File size in bytes
  mimeType: string              // MIME type (image/png, image/jpeg, etc.)
  width: number                 // Image width in pixels
  height: number                // Image height in pixels
  uploadedAt: number            // Timestamp (Date.now())
  uploadedBy: string            // Current user ID
  type: 'overlay' | 'logo' | 'other'
  status: 'active' | 'deleted'  // Default: 'active'
}
```

**Operation**:
```typescript
import { collection, addDoc } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'

const mediaAssetsRef = collection(firestore, `workspaces/${workspaceId}/mediaAssets`)

const docRef = await addDoc(mediaAssetsRef, {
  fileName: 'overlay-V1StGXR8_Z5jdHi6B-myT.png',
  filePath: `workspaces/${workspaceId}/media/overlay-V1StGXR8_Z5jdHi6B-myT.png`,
  url: downloadURL,
  fileSize: file.size,
  mimeType: file.type,
  width: 1080,
  height: 1080,
  uploadedAt: Date.now(),
  uploadedBy: currentUser.uid,
  type: 'overlay',
  status: 'active',
})

const mediaAssetId = docRef.id
```

**Output**:
```typescript
interface CreateMediaAssetOutput {
  mediaAssetId: string          // Firestore auto-generated document ID
  url: string                   // Download URL (for immediate use)
}
```

**Security**:
- Firestore rules enforce: only workspace admins can create
- Client-side validation before operation (file type, size)

**Error Handling**:
- `permission-denied`: User is not workspace admin
- `invalid-argument`: Missing required fields or invalid data

---

### Operation 2: Query Workspace Media Assets

**Purpose**: Fetch all active media assets for a workspace (future media library)

**Collection**: `workspaces/{workspaceId}/mediaAssets`

**Method**: `onSnapshot` (Firestore client SDK, real-time)

**Query**:
```typescript
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'

const mediaAssetsRef = collection(firestore, `workspaces/${workspaceId}/mediaAssets`)
const q = query(
  mediaAssetsRef,
  where('status', '==', 'active'),
  orderBy('uploadedAt', 'desc')
)

const unsubscribe = onSnapshot(q, (snapshot) => {
  const assets = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
  setMediaAssets(assets)
})
```

**Output**:
```typescript
interface MediaAsset {
  id: string
  fileName: string
  filePath: string
  url: string
  fileSize: number
  mimeType: string
  width: number
  height: number
  uploadedAt: number
  uploadedBy: string
  type: 'overlay' | 'logo' | 'other'
  status: 'active' | 'deleted'
}

type QueryMediaAssetsOutput = MediaAsset[]
```

**Security**:
- Firestore rules enforce: only workspace members can read

**Error Handling**:
- `permission-denied`: User is not workspace member

---

### Operation 3: Update Event Overlay Configuration

**Purpose**: Update overlay references in event draft configuration

**Collection**: `workspaces/{workspaceId}/projects/{projectId}/events/{eventId}`

**Method**: `updateDoc` (Firestore client SDK)

**Input Parameters**:
```typescript
interface UpdateOverlaysInput {
  '1:1'?: {
    mediaAssetId: string
    url: string
  } | null
  '9:16'?: {
    mediaAssetId: string
    url: string
  } | null
}
```

**Operation**:
```typescript
import { doc, updateDoc, increment } from 'firebase/firestore'

const eventRef = doc(firestore, `workspaces/${workspaceId}/projects/${projectId}/events/${eventId}`)

await updateDoc(eventRef, {
  'draftConfig.overlays.1:1': {
    mediaAssetId: 'mJKLdF3sT8rPqWxYz',
    url: downloadURL
  },
  draftVersion: increment(1),
  updatedAt: Date.now(),
  updatedBy: currentUser.uid,
})
```

**Alternative (Remove Overlay)**:
```typescript
await updateDoc(eventRef, {
  'draftConfig.overlays.1:1': null,
  draftVersion: increment(1),
  updatedAt: Date.now(),
  updatedBy: currentUser.uid,
})
```

**Output**:
```typescript
interface UpdateOverlaysOutput {
  success: boolean
}
```

**Security**:
- Firestore rules enforce: only workspace admins can update event config

**Error Handling**:
- `permission-denied`: User is not workspace admin
- `not-found`: Event document doesn't exist
- `invalid-argument`: Invalid overlay reference format

---

### Operation 4: Soft Delete MediaAsset

**Purpose**: Mark media asset as deleted without removing file (future feature)

**Collection**: `workspaces/{workspaceId}/mediaAssets/{assetId}`

**Method**: `updateDoc` (Firestore client SDK)

**Operation**:
```typescript
const mediaAssetRef = doc(firestore, `workspaces/${workspaceId}/mediaAssets/${assetId}`)

await updateDoc(mediaAssetRef, {
  status: 'deleted',
})
```

**Output**:
```typescript
interface SoftDeleteMediaAssetOutput {
  success: boolean
}
```

**Security**:
- Firestore rules enforce: only workspace admins can update status

**Error Handling**:
- `permission-denied`: User is not workspace admin
- `not-found`: MediaAsset document doesn't exist

---

## Storage Operations

### Operation 5: Upload File to Firebase Storage

**Purpose**: Upload overlay image file to Firebase Storage with progress tracking

**Storage Path**: `workspaces/{workspaceId}/media/{fileName}`

**Method**: `uploadBytesResumable` (Storage client SDK)

**Input Parameters**:
```typescript
interface UploadFileInput {
  file: File                    // File object from browser
  workspaceId: string           // Workspace ID for path
  fileName: string              // Generated unique file name
  onProgress: (progress: number) => void  // Progress callback (0-100)
}
```

**Operation**:
```typescript
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '@/integrations/firebase/client'

const storageRef = ref(storage, `workspaces/${workspaceId}/media/${fileName}`)
const uploadTask = uploadBytesResumable(storageRef, file)

uploadTask.on('state_changed',
  (snapshot) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
    onProgress(progress)
  },
  (error) => {
    // Handle upload error
    console.error('Upload failed:', error)
  },
  async () => {
    // Upload complete - get download URL
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
    onComplete(downloadURL)
  }
)
```

**Output**:
```typescript
interface UploadFileOutput {
  downloadURL: string           // Firebase Storage public download URL
  filePath: string              // Storage path (for Firestore record)
}
```

**Security**:
- Storage rules enforce: only workspace admins can upload
- Storage rules enforce: max file size 5MB
- Storage rules enforce: allowed MIME types only

**Error Handling**:
- `storage/unauthorized`: User is not workspace admin
- `storage/quota-exceeded`: Storage quota exceeded
- `storage/invalid-content-type`: Invalid file type
- `storage/canceled`: Upload canceled by user

---

## Client-Side Validation

### File Type Validation

**Input**:
```typescript
const file: File
```

**Validation**:
```typescript
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']

function validateFileType(file: File): boolean {
  return ALLOWED_TYPES.includes(file.type)
}
```

**Error Message**: "Only PNG, JPG, and WebP images are supported"

---

### File Size Validation

**Input**:
```typescript
const file: File
```

**Validation**:
```typescript
const MAX_SIZE = 5 * 1024 * 1024  // 5MB

function validateFileSize(file: File): boolean {
  return file.size <= MAX_SIZE
}
```

**Error Message**: "File must be under 5MB"

---

### Image Dimension Extraction

**Input**:
```typescript
const file: File
```

**Extraction**:
```typescript
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
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

**Output**:
```typescript
{ width: 1080, height: 1080 }
```

---

## Complete Upload Flow

### End-to-End Operation

```typescript
async function uploadOverlayAndUpdateConfig(
  file: File,
  workspaceId: string,
  projectId: string,
  eventId: string,
  aspectRatio: '1:1' | '9:16'
) {
  // 1. Client-side validation
  if (!validateFileType(file)) {
    throw new Error('Only PNG, JPG, and WebP images are supported')
  }
  if (!validateFileSize(file)) {
    throw new Error('File must be under 5MB')
  }

  // 2. Extract image dimensions
  const { width, height } = await getImageDimensions(file)

  // 3. Generate unique file name
  const fileName = `overlay-${nanoid()}.${file.name.split('.').pop()}`

  // 4. Upload to Storage with progress tracking
  const downloadURL = await uploadToStorage(file, workspaceId, fileName, onProgress)

  // 5. Create MediaAsset document in Firestore
  const mediaAssetId = await createMediaAsset({
    fileName,
    filePath: `workspaces/${workspaceId}/media/${fileName}`,
    url: downloadURL,
    fileSize: file.size,
    mimeType: file.type,
    width,
    height,
    uploadedAt: Date.now(),
    uploadedBy: currentUser.uid,
    type: 'overlay',
    status: 'active',
  })

  // 6. Update event config with overlay reference
  await updateEventOverlays(projectId, eventId, {
    [aspectRatio]: {
      mediaAssetId,
      url: downloadURL
    }
  })

  return { mediaAssetId, url: downloadURL }
}
```

---

## Error Handling Matrix

| Operation | Error Code | Cause | User Message |
|-----------|------------|-------|--------------|
| Upload to Storage | `storage/unauthorized` | User not admin | "You don't have permission to upload" |
| Upload to Storage | `storage/quota-exceeded` | Storage quota exceeded | "Storage quota exceeded. Contact support." |
| Upload to Storage | `storage/invalid-content-type` | Invalid file type | "Only PNG, JPG, and WebP images are supported" |
| Upload to Storage | `storage/canceled` | User canceled | "Upload canceled" |
| Create MediaAsset | `permission-denied` | User not admin | "You don't have permission to upload" |
| Create MediaAsset | `invalid-argument` | Missing fields | "Invalid file data" |
| Update Event Config | `permission-denied` | User not admin | "You don't have permission to edit this event" |
| Update Event Config | `not-found` | Event not found | "Event not found" |
| Query Media Assets | `permission-denied` | User not member | "Access denied" |

---

## Rate Limits & Performance

### Upload Performance
- **File size limit**: 5MB (typical upload time: 1-30 seconds on 4G)
- **Progress updates**: Every ~100ms (smooth progress bar)
- **Parallel uploads**: Not supported (upload one at a time)

### Query Performance
- **MediaAssets query**: Firestore index on `uploadedAt` (auto-created)
- **Real-time updates**: `onSnapshot` for live media library (future)
- **Cache**: TanStack Query caches media assets locally (reduces Firestore reads)

### Write Performance
- **Event config update**: Single document write (< 100ms typical)
- **Debouncing**: Not needed (upload is slow, config update is fast)

---

## Conclusion

This contract defines all Firebase operations for overlay configuration. Key points:
1. **Client-first architecture**: All operations use Firebase client SDKs
2. **No REST/GraphQL APIs**: Direct Firebase integration
3. **Security**: Enforced via Firestore/Storage rules, not application code
4. **Real-time**: `onSnapshot` for live updates (media library future feature)
5. **Validation**: Client-side for UX, server-side (rules) for security

**Next**: quickstart.md for developer onboarding
