# Server Actions Contract: Experiences

**Date**: 2025-11-25
**Feature**: 002-experiences-refactor

## Overview

All experience mutations use Next.js Server Actions with Firebase Admin SDK. Client reads use Firebase Client SDK for real-time subscriptions.

**Existing Actions to Modify** (in `web/src/features/experiences/actions/`):
- `photo-create.ts` - Create photo experience
- `photo-update.ts` - Update photo experience
- `gif-create.ts` - Create GIF experience
- `gif-update.ts` - Update GIF experience
- `photo-media.ts` - Media upload/management
- `shared.ts` - Shared utilities (delete, etc.)

## Actions

### createPhotoExperience / createGifExperience

Creates a new experience document in `/experiences` collection. (Existing type-specific actions)

**Files**: `photo-create.ts`, `gif-create.ts`

**Changes Required**:
- Replace `eventId` parameter with `companyId` + optional `eventId`
- Replace `label` field with `name`
- Initialize `eventIds: eventId ? [eventId] : []`
- Use `aiPhotoConfig` instead of `aiConfig`

**New Input Schema**:
```typescript
interface CreateExperienceInput {
  companyId: string;        // NEW - company ownership
  eventId?: string;         // Optional - auto-attach to this event
  name: string;             // RENAMED from label
  type: 'photo' | 'gif';    // Type-specific per action file
}
```

**New Behavior**:
1. Validate user has access to `companyId`
2. Generate new document ID
3. Create experience with:
   - `companyId` from input
   - `eventIds: eventId ? [eventId] : []`
   - `name` instead of `label`
   - `aiPhotoConfig` instead of `aiConfig`
   - `enabled: false`
   - `createdAt` and `updatedAt` timestamps
4. Return created experience

---

### updatePhotoExperience / updateGifExperience

Updates an existing experience document. (Existing type-specific actions)

**Files**: `photo-update.ts`, `gif-update.ts`

**Changes Required**:
- Update field names: `label` → `name`, `aiConfig` → `aiPhotoConfig`
- Update validation to use new schema
- Validate against `companyId` for authorization

**New Input Schema**:
```typescript
interface UpdateExperienceInput {
  name?: string;                           // RENAMED from label
  enabled?: boolean;
  previewType?: 'image' | 'gif' | 'video';
  previewMediaUrl?: string | null;         // RENAMED from previewPath
  captureConfig?: Partial<CaptureConfig>;  // RENAMED from config
  aiPhotoConfig?: Partial<AiPhotoConfig>;  // RENAMED from aiConfig
}
```

**New Behavior**:
1. Validate experience exists
2. Validate user has access to experience's `companyId` (not eventId)
3. Merge updates with existing data
4. Update `updatedAt` timestamp
5. Return updated experience

---

### deleteExperience

Deletes an experience and cleans up associated storage assets. (Likely in `shared.ts`)

**File**: `shared.ts`

**Changes Required**:
- Update authorization to check `companyId` instead of `eventId`
- Update storage cleanup to use new field names (`previewMediaUrl`, `aiPhotoConfig.referenceImageUrls`)
- No event document updates needed (experiences track their own event relationships)

**New Behavior**:
1. Validate experience exists
2. Validate user has access to experience's `companyId`
3. Delete storage assets:
   - `previewMediaUrl` if present
   - `aiPhotoConfig.referenceImageUrls` if present
4. Delete Firestore document from `/experiences/{experienceId}`
5. Return success

---

### attachExperienceToEvent (NEW)

Adds an event ID to the experience's `eventIds` array. This is a **new action** to support the many-to-many relationship.

**File**: Create new or add to `shared.ts`

**Signature**:
```typescript
async function attachExperienceToEvent(
  experienceId: string,
  eventId: string
): Promise<ActionResult<Experience>>
```

**Behavior**:
1. Validate experience exists
2. Validate user has access to experience's `companyId`
3. Validate user has access to target event
4. Add `eventId` to `eventIds` array (if not already present)
5. Update `updatedAt` timestamp
6. Return updated experience

---

### detachExperienceFromEvent (NEW)

Removes an event ID from the experience's `eventIds` array. This is a **new action**.

**File**: Create new or add to `shared.ts`

**Signature**:
```typescript
async function detachExperienceFromEvent(
  experienceId: string,
  eventId: string
): Promise<ActionResult<Experience>>
```

**Behavior**:
1. Validate experience exists
2. Validate user has access to experience's `companyId`
3. Remove `eventId` from `eventIds` array
4. Update `updatedAt` timestamp
5. Return updated experience

---

## Repository Functions (Client SDK)

### getExperiencesByEventId

Fetches all experiences for a specific event.

**Signature**:
```typescript
function getExperiencesByEventId(
  eventId: string
): Promise<Experience[]>
```

**Query**:
```typescript
query(
  collection(db, 'experiences'),
  where('eventIds', 'array-contains', eventId)
)
```

---

### subscribeToExperiencesByEventId

Real-time subscription to experiences for an event.

**Signature**:
```typescript
function subscribeToExperiencesByEventId(
  eventId: string,
  onData: (experiences: Experience[]) => void,
  onError: (error: Error) => void
): () => void  // Returns unsubscribe function
```

**Query**:
```typescript
onSnapshot(
  query(
    collection(db, 'experiences'),
    where('eventIds', 'array-contains', eventId)
  ),
  (snapshot) => onData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
  onError
)
```

---

### getExperienceById

Fetches a single experience by ID.

**Signature**:
```typescript
function getExperienceById(
  experienceId: string
): Promise<Experience | null>
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | User lacks access to company or event |
| `NOT_FOUND` | Experience does not exist |
| `VALIDATION_ERROR` | Input data fails schema validation |
| `STORAGE_ERROR` | Failed to delete storage assets |
| `FIRESTORE_ERROR` | Firestore operation failed |

## Types Reference

```typescript
interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CaptureConfig {
  countdown: number;
  cameraFacing: 'front' | 'back' | 'both';
  overlayUrl?: string | null;
  minDuration?: number;
  maxDuration?: number;
  frameCount?: number;
}

interface AiPhotoConfig {
  enabled: boolean;
  model?: string | null;
  prompt?: string | null;
  referenceImageUrls?: string[] | null;
  aspectRatio?: AspectRatio;
}

interface AiVideoConfig {
  enabled: boolean;
  model?: string | null;
  prompt?: string | null;
  referenceImageUrls?: string[] | null;
  aspectRatio?: AspectRatio;
  duration?: number | null;
  fps?: number | null;
}

type AspectRatio = '1:1' | '3:4' | '4:5' | '9:16' | '16:9';
```
