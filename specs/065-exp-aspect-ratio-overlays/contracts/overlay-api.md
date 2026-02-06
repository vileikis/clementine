# API Contracts: Overlay Management

**Feature**: 065-exp-aspect-ratio-overlays
**Date**: 2026-02-06

## Overview

This document defines the API contracts for overlay management. Clementine uses a **client-first architecture** with Firebase Firestore, so most "API" operations are direct Firestore writes via client SDK, validated by Firestore security rules and Zod schemas.

---

## 1. Overlay Configuration Operations

### 1.1 Update Project Overlays

**Operation**: Partial update of project overlay configuration

**Path**: `workspaces/{workspaceId}/projects/{projectId}`

**Method**: Firestore `updateDoc` with dot notation

**Request Schema**:

```typescript
// Partial update - only specified fields are updated
type UpdateOverlaysRequest = {
  'config.overlays.1:1'?: MediaReference | null
  'config.overlays.3:2'?: MediaReference | null
  'config.overlays.2:3'?: MediaReference | null
  'config.overlays.9:16'?: MediaReference | null
  'config.overlays.default'?: MediaReference | null
}
```

**MediaReference Schema**:

```typescript
type MediaReference = {
  mediaAssetId: string      // Required, non-empty
  url: string               // Required, valid HTTPS URL
  displayName: string       // Required, max 100 chars
  filePath?: string         // Optional, storage path
}
```

**Response**: Firestore write confirmation (void on success)

**Error Cases**:

| Code | Condition |
|------|-----------|
| `permission-denied` | User lacks project write access |
| `invalid-argument` | Schema validation failed |
| `not-found` | Project document doesn't exist |

**Example**:

```typescript
// Upload overlay for 3:2 aspect ratio
await updateDoc(projectRef, {
  'config.overlays.3:2': {
    mediaAssetId: 'abc123',
    url: 'https://storage.googleapis.com/bucket/overlays/...',
    displayName: 'Brand Frame Landscape',
    filePath: 'overlays/project123/3:2/frame.png'
  }
})

// Remove overlay for 2:3 aspect ratio
await updateDoc(projectRef, {
  'config.overlays.2:3': null
})
```

---

### 1.2 Read Project Configuration

**Operation**: Fetch project with overlay configuration

**Path**: `workspaces/{workspaceId}/projects/{projectId}`

**Method**: Firestore `getDoc` or `onSnapshot`

**Response Schema**:

```typescript
type ProjectConfig = {
  overlays: {
    '1:1': MediaReference | null
    '3:2': MediaReference | null
    '2:3': MediaReference | null
    '9:16': MediaReference | null
    'default': MediaReference | null
  } | null
  // ... other config fields
}
```

---

## 2. Media Asset Operations

### 2.1 Upload Overlay Asset

**Operation**: Upload image file to Firebase Storage

**Path**: `overlays/{projectId}/{aspectRatio}/{filename}`

**Method**: Firebase Storage `uploadBytes` or `uploadBytesResumable`

**Constraints**:

| Field | Constraint |
|-------|------------|
| File types | PNG, JPG, WebP |
| Max size | 5 MB |
| Filename | Sanitized, alphanumeric + hyphen/underscore |

**Response**: Upload snapshot with `downloadURL`

---

### 2.2 Create Media Asset Document

**Operation**: Create Firestore record for uploaded media

**Path**: `workspaces/{workspaceId}/mediaAssets/{autoId}`

**Method**: Firestore `addDoc`

**Request Schema**:

```typescript
type CreateMediaAssetRequest = {
  url: string               // Download URL from Storage
  filePath: string          // Storage path
  displayName: string       // User-provided or derived
  type: 'overlay'           // Asset type
  aspectRatio: OverlayKey   // Which slot this is for
  projectId: string         // Associated project
  createdAt: Timestamp      // Server timestamp
  createdBy: string         // User ID
}
```

---

## 3. Job Creation with Overlay Resolution

### 3.1 Start Transform Pipeline (Callable)

**Operation**: Create job with resolved overlay choice

**Location**: `functions/src/callable/startTransformPipeline.ts`

**Callable Name**: `startTransformPipelineV2`

**Request Schema**:

```typescript
type StartTransformPipelineRequest = {
  projectId: string
  sessionId: string
}
```

**Response Schema**:

```typescript
type StartTransformPipelineResponse = {
  success: true
  jobId: string
  message: string
}
```

**Overlay Resolution Flow** (internal):

```typescript
// 1. Fetch project for overlay config
const project = await fetchProject(session.workspaceId, projectId)

// 2. Get experience reference from project
const experienceRef = project?.config?.experiences?.main?.find(
  e => e.experienceId === session.experienceId
)

// 3. Get aspect ratio from outcome config
const aspectRatio = outcome.imageGeneration?.aspectRatio ?? '1:1'

// 4. Resolve overlay choice
const overlayChoice = resolveOverlayChoice(
  project?.config?.overlays,
  experienceRef?.applyOverlay ?? false,
  aspectRatio
)

// 5. Build snapshot with resolved overlay
const snapshot = {
  sessionResponses: [...],
  experienceVersion: experience.version,
  outcome: config.outcome,
  overlayChoice,  // Resolved value, not raw config
  experienceRef,
}
```

### 3.2 Overlay Resolution Function

**Location**: `functions/src/callable/startTransformPipeline.ts` (or separate utils)

**Function Signature**:

```typescript
function resolveOverlayChoice(
  overlays: OverlaysConfig | null,
  applyOverlay: boolean,
  aspectRatio: AspectRatio
): MediaReference | null
```

**Algorithm**:

```
1. If applyOverlay is false → return null
2. If overlays is null → return null
3. If overlays[aspectRatio] exists → return it
4. If overlays['default'] exists → return it
5. Return null
```

**Return Values**:

| Condition | Return |
|-----------|--------|
| Experience has applyOverlay=false | null |
| Exact match found | MediaReference for aspect ratio |
| Fallback to default | MediaReference for default |
| No overlay available | null |

---

## 4. Zod Schema Contracts

### 4.1 Aspect Ratio Schema

```typescript
// packages/shared/src/schemas/media/aspect-ratio.schema.ts

import { z } from 'zod'

// Canonical aspect ratios
export const aspectRatioSchema = z.enum(['1:1', '3:2', '2:3', '9:16'])

// Overlay keys (includes default fallback)
export const overlayKeySchema = z.enum(['1:1', '3:2', '2:3', '9:16', 'default'])

// Media-type subsets
export const imageAspectRatioSchema = aspectRatioSchema
export const videoAspectRatioSchema = z.enum(['9:16', '1:1'])

// Type exports
export type AspectRatio = z.infer<typeof aspectRatioSchema>
export type OverlayKey = z.infer<typeof overlayKeySchema>
export type ImageAspectRatio = z.infer<typeof imageAspectRatioSchema>
export type VideoAspectRatio = z.infer<typeof videoAspectRatioSchema>
```

### 4.2 Overlays Config Schema

```typescript
// packages/shared/src/schemas/project/project-config.schema.ts

import { z } from 'zod'
import { mediaReferenceSchema } from '../media/media-reference.schema'

export const overlayReferenceSchema = mediaReferenceSchema

export const overlaysConfigSchema = z.object({
  '1:1': overlayReferenceSchema.nullable().default(null),
  '3:2': overlayReferenceSchema.nullable().default(null),
  '2:3': overlayReferenceSchema.nullable().default(null),
  '9:16': overlayReferenceSchema.nullable().default(null),
  'default': overlayReferenceSchema.nullable().default(null),
}).nullable().default(null)

export type OverlaysConfig = z.infer<typeof overlaysConfigSchema>
```

### 4.3 Job Snapshot Schema (Flattened)

```typescript
// packages/shared/src/schemas/job/job.schema.ts

import { z } from 'zod'
import { overlayReferenceSchema } from '../project/project-config.schema'
import { mainExperienceReferenceSchema } from '../project/experiences.schema'
import { sessionResponseSchema } from '../session/session-response.schema'
import { outcomeSchema } from '../experience/outcome.schema'

export const jobSnapshotSchema = z.object({
  /** Session responses at job creation */
  sessionResponses: z.array(sessionResponseSchema).default([]),

  /** Experience version at time of job creation */
  experienceVersion: z.number().int().positive(),

  /** Outcome configuration */
  outcome: outcomeSchema.nullable().default(null),

  /** Resolved overlay to apply (null = no overlay) */
  overlayChoice: overlayReferenceSchema.nullable().default(null),

  /** Experience reference for audit trail */
  experienceRef: mainExperienceReferenceSchema.nullable().default(null),
})

export type JobSnapshot = z.infer<typeof jobSnapshotSchema>
```

---

## 5. Backend Transform Usage

### 5.1 Apply Overlay in Image Outcome

**Location**: `functions/src/services/transform/outcomes/imageOutcome.ts`

**Usage**:

```typescript
// Simplified: use pre-resolved overlayChoice
const overlay = job.snapshot.overlayChoice

if (overlay) {
  logger.info('Applying overlay', { displayName: overlay.displayName })
  outputPath = await applyOverlay(outputPath, overlay, tmpDir)
} else {
  logger.info('No overlay to apply')
}
```

### 5.2 Apply Overlay Function

**Location**: `functions/src/services/transform/operations/applyOverlay.ts`

**Function Signature**:

```typescript
export async function applyOverlay(
  inputPath: string,
  overlay: MediaReference,
  tmpDir: string
): Promise<string>
```

**Note**: `getOverlayForAspectRatio()` helper removed - resolution now happens at job creation.

---

## 6. Firestore Security Rules

### 6.1 Project Overlay Updates

```javascript
// firestore.rules (relevant excerpt)

match /workspaces/{workspaceId}/projects/{projectId} {
  allow update: if isAuthenticated()
    && hasWorkspaceAccess(workspaceId, 'write')
    && validateProjectUpdate(request.resource.data);

  function validateProjectUpdate(data) {
    return !('config' in data)
      || !('overlays' in data.config)
      || isValidOverlaysConfig(data.config.overlays);
  }

  function isValidOverlaysConfig(overlays) {
    return overlays == null
      || (overlays is map
          && overlays.keys().hasOnly(['1:1', '3:2', '2:3', '9:16', 'default']));
  }
}
```

---

## 7. Error Handling

### Standard Error Response

```typescript
type OperationError = {
  code: string           // Firebase error code
  message: string        // Human-readable message
  details?: unknown      // Additional context
}
```

### Common Error Codes

| Code | HTTP Equiv | Description |
|------|------------|-------------|
| `permission-denied` | 403 | User lacks required access |
| `not-found` | 404 | Resource doesn't exist |
| `invalid-argument` | 400 | Request validation failed |
| `failed-precondition` | 412 | Operation prerequisites not met |
| `resource-exhausted` | 429 | Rate limit exceeded |
| `internal` | 500 | Unexpected server error |
