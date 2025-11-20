# API Contracts: Multi-Experience Type Editor

**Feature**: 004-multi-experience-editor
**Date**: 2025-11-20
**Format**: TypeScript function signatures with Zod validation schemas

---

## Overview

This document defines the contracts for:
1. **Repository Functions** - Firestore data access layer
2. **Server Actions** - Next.js Server Actions for mutations
3. **Validation Schemas** - Zod schemas for input validation

All operations follow the **Firebase Architecture Standard** (Constitution Principle VI):
- Writes use Admin SDK via Server Actions
- Reads can use Client SDK for real-time subscriptions or Admin SDK for server-side
- Schemas located in `web/src/features/experiences/lib/schemas.ts`

---

## Repository Functions

Location: `web/src/features/experiences/lib/repository.ts`

### Read Operations

#### `getExperienceById`

Fetch a single experience by ID.

**Signature**:
```typescript
export async function getExperienceById(
  eventId: string,
  experienceId: string
): Promise<Experience | null>
```

**Parameters**:
- `eventId`: Parent event ID
- `experienceId`: Experience ID to fetch

**Returns**:
- `Experience | null`: Discriminated union type or null if not found

**Validation**:
- Result validated against `experienceSchema` (discriminated union)
- Throws if document exists but doesn't match any variant schema

**Example**:
```typescript
const experience = await getExperienceById('evt_123', 'exp_456');
if (experience && experience.type === 'photo') {
  console.log(experience.config.countdown); // TypeScript knows this is PhotoExperience
}
```

---

#### `getExperiencesByEventId`

Fetch all experiences for an event.

**Signature**:
```typescript
export async function getExperiencesByEventId(
  eventId: string
): Promise<Experience[]>
```

**Parameters**:
- `eventId`: Parent event ID

**Returns**:
- `Experience[]`: Array of discriminated union types (Photo, Video, GIF, Wheel, Survey)

**Validation**:
- Each document validated against `experienceSchema`
- Invalid documents logged and skipped (defensive)

**Example**:
```typescript
const experiences = await getExperiencesByEventId('evt_123');
const photoExperiences = experiences.filter(exp => exp.type === 'photo');
const gifExperiences = experiences.filter(exp => exp.type === 'gif');
```

**Note**: Updated in this feature to return `Experience[]` instead of `PhotoExperience[]`.

---

### Write Operations

Write operations are handled by Server Actions (see below). The repository does not expose direct write functions.

---

## Server Actions

Location: `web/src/features/experiences/actions/`

### Response Type

All Server Actions return a standardized response:

```typescript
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code?: string } };
```

---

## Photo Experience Actions

Location: `web/src/features/experiences/actions/photo-create.ts`, `photo-update.ts`

### `createPhotoExperience`

Create a new photo experience.

**Signature**:
```typescript
export async function createPhotoExperience(
  eventId: string,
  data: CreatePhotoExperienceData
): Promise<ActionResponse<PhotoExperience>>
```

**Input Schema** (`createPhotoExperienceSchema`):
```typescript
{
  label: z.string().trim().min(1, "Experience name is required").max(50),
  type: z.literal("photo")
}
```

**Input Type**:
```typescript
type CreatePhotoExperienceData = {
  label: string; // 1-50 characters
  type: "photo";
};
```

**Behavior**:
1. Validate input against `createPhotoExperienceSchema`
2. Create experience document in Firestore with defaults:
   - `enabled: true`
   - `hidden: false`
   - `config: { countdown: 0, overlayFramePath: null }`
   - `aiConfig: { enabled: false, model: null, prompt: null, referenceImagePaths: null, aspectRatio: "1:1" }`
   - `createdAt: Date.now()`
   - `updatedAt: Date.now()`
3. Return created experience

**Example**:
```typescript
const result = await createPhotoExperience('evt_123', {
  label: 'Neon Portrait',
  type: 'photo'
});

if (result.success) {
  console.log(result.data.id); // exp_abc123
}
```

---

### `updatePhotoExperience`

Update an existing photo experience.

**Signature**:
```typescript
export async function updatePhotoExperience(
  eventId: string,
  experienceId: string,
  data: UpdatePhotoExperienceData
): Promise<ActionResponse<PhotoExperience>>
```

**Input Schema** (`updatePhotoExperienceSchema`):
```typescript
z.object({
  label: z.string().min(1).max(50).optional(),
  enabled: z.boolean().optional(),
  hidden: z.boolean().optional(),
  previewPath: z.string().url().optional(),
  previewType: z.enum(["image", "gif", "video"]).optional(),
  config: z.object({
    countdown: z.number().int().min(0).max(10).optional(),
    overlayFramePath: z.string().url().nullable().optional(),
  }).partial().optional(),
  aiConfig: z.object({
    enabled: z.boolean().optional(),
    model: z.string().nullable().optional(),
    prompt: z.string().max(600).nullable().optional(),
    referenceImagePaths: z.array(z.string().url()).max(5).nullable().optional(),
    aspectRatio: z.enum(["1:1", "3:4", "4:5", "9:16", "16:9"]).optional(),
  }).partial().optional(),
}).strict()
```

**Input Type**:
```typescript
type UpdatePhotoExperienceData = {
  label?: string;
  enabled?: boolean;
  hidden?: boolean;
  previewPath?: string;
  previewType?: "image" | "gif" | "video";
  config?: {
    countdown?: number;
    overlayFramePath?: string | null;
  };
  aiConfig?: {
    enabled?: boolean;
    model?: string | null;
    prompt?: string | null;
    referenceImagePaths?: string[] | null;
    aspectRatio?: "1:1" | "3:4" | "4:5" | "9:16" | "16:9";
  };
};
```

**Behavior**:
1. Validate input against `updatePhotoExperienceSchema`
2. Update experience document in Firestore (merge nested objects)
3. Set `updatedAt: Date.now()`
4. Fetch and return updated experience

**Example**:
```typescript
const result = await updatePhotoExperience('evt_123', 'exp_456', {
  label: 'Updated Label',
  config: {
    countdown: 5
  },
  aiConfig: {
    enabled: true,
    prompt: 'Cyberpunk neon style'
  }
});

if (result.success) {
  console.log(result.data.config.countdown); // 5
}
```

---

## GIF Experience Actions (New)

Location: `web/src/features/experiences/actions/gif-create.ts`, `gif-update.ts`

### `createGifExperience`

Create a new GIF experience.

**Signature**:
```typescript
export async function createGifExperience(
  eventId: string,
  data: CreateGifExperienceData
): Promise<ActionResponse<GifExperience>>
```

**Input Schema** (`createGifExperienceSchema` - NEW):
```typescript
z.object({
  label: z.string().trim().min(1, "Experience name is required").max(50),
  type: z.literal("gif")
})
```

**Input Type**:
```typescript
type CreateGifExperienceData = {
  label: string; // 1-50 characters
  type: "gif";
};
```

**Behavior**:
1. Validate input against `createGifExperienceSchema`
2. Create experience document in Firestore with defaults:
   - `enabled: true`
   - `hidden: false`
   - `config: { frameCount: 5, intervalMs: 500, loopCount: 0, countdown: 3 }`
   - `aiConfig: { enabled: false, model: null, prompt: null, referenceImagePaths: null, aspectRatio: "1:1" }`
   - `createdAt: Date.now()`
   - `updatedAt: Date.now()`
3. Return created experience

**Example**:
```typescript
const result = await createGifExperience('evt_123', {
  label: 'Animated Selfie',
  type: 'gif'
});

if (result.success) {
  console.log(result.data.config.frameCount); // 5
}
```

---

### `updateGifExperience`

Update an existing GIF experience.

**Signature**:
```typescript
export async function updateGifExperience(
  eventId: string,
  experienceId: string,
  data: UpdateGifExperienceData
): Promise<ActionResponse<GifExperience>>
```

**Input Schema** (`updateGifExperienceSchema` - NEW):
```typescript
z.object({
  label: z.string().min(1).max(50).optional(),
  enabled: z.boolean().optional(),
  hidden: z.boolean().optional(),
  previewPath: z.string().url().optional(),
  previewType: z.enum(["image", "gif", "video"]).optional(),
  config: z.object({
    frameCount: z.number().int().min(3).max(10).optional(),
    intervalMs: z.number().int().min(100).max(1000).optional(),
    loopCount: z.number().int().min(0).optional(),
    countdown: z.number().int().min(0).max(10).optional(),
  }).partial().optional(),
  aiConfig: z.object({
    enabled: z.boolean().optional(),
    model: z.string().nullable().optional(),
    prompt: z.string().max(600).nullable().optional(),
    referenceImagePaths: z.array(z.string().url()).max(5).nullable().optional(),
    aspectRatio: z.enum(["1:1", "3:4", "4:5", "9:16", "16:9"]).optional(),
  }).partial().optional(),
}).strict()
```

**Input Type**:
```typescript
type UpdateGifExperienceData = {
  label?: string;
  enabled?: boolean;
  hidden?: boolean;
  previewPath?: string;
  previewType?: "image" | "gif" | "video";
  config?: {
    frameCount?: number; // 3-10
    intervalMs?: number; // 100-1000
    loopCount?: number;  // 0+
    countdown?: number;  // 0-10
  };
  aiConfig?: {
    enabled?: boolean;
    model?: string | null;
    prompt?: string | null;
    referenceImagePaths?: string[] | null;
    aspectRatio?: "1:1" | "3:4" | "4:5" | "9:16" | "16:9";
  };
};
```

**Behavior**:
1. Validate input against `updateGifExperienceSchema`
2. Update experience document in Firestore (merge nested objects)
3. Set `updatedAt: Date.now()`
4. Fetch and return updated experience

**Example**:
```typescript
const result = await updateGifExperience('evt_123', 'exp_789', {
  config: {
    frameCount: 8,
    intervalMs: 300,
    loopCount: 3
  }
});

if (result.success) {
  console.log(result.data.config.frameCount); // 8
}
```

---

## Shared Actions

Location: `web/src/features/experiences/actions/shared.ts`

### `deleteExperience`

Delete any experience type (works for all types).

**Signature**:
```typescript
export async function deleteExperience(
  eventId: string,
  experienceId: string
): Promise<ActionResponse<void>>
```

**Parameters**:
- `eventId`: Parent event ID
- `experienceId`: Experience ID to delete

**Returns**:
- `ActionResponse<void>`: Success/error response (no data on success)

**Behavior**:
1. Delete experience document from Firestore
2. Return success/error response

**Example**:
```typescript
const result = await deleteExperience('evt_123', 'exp_456');
if (result.success) {
  console.log('Experience deleted');
}
```

**Note**: Already exists, works for all experience types (type-agnostic).

---

### `uploadPreviewMedia`

Upload preview media for any experience type.

**Signature**:
```typescript
export async function uploadPreviewMedia(
  eventId: string,
  experienceId: string,
  file: File,
  fileType: PreviewType
): Promise<ActionResponse<PreviewMediaResult>>
```

**Parameters**:
- `eventId`: Parent event ID
- `experienceId`: Experience ID
- `file`: File object from form input
- `fileType`: "image" | "gif" | "video"

**Returns**:
- `PreviewMediaResult`:
  ```typescript
  {
    publicUrl: string;
    fileType: PreviewType;
    sizeBytes: number;
  }
  ```

**Behavior**:
1. Validate file type and size (max 10MB)
2. Upload to Firebase Storage at `experiences/{eventId}/{experienceId}/preview/{filename}`
3. Get public URL
4. Update experience document with `previewPath` and `previewType`
5. Return upload result

**Example**:
```typescript
const result = await uploadPreviewMedia('evt_123', 'exp_456', file, 'image');
if (result.success) {
  console.log(result.data.publicUrl); // https://storage.googleapis.com/...
}
```

**Note**: Already exists in `photo-media.ts`, works for all experience types.

---

## Validation Schemas

Location: `web/src/features/experiences/lib/schemas.ts`

### Existing Schemas (No Changes)

- `photoExperienceSchema`: Full photo experience schema
- `gifExperienceSchema`: Full GIF experience schema
- `videoExperienceSchema`: Full video experience schema (future)
- `wheelExperienceSchema`: Full wheel experience schema (future)
- `surveyExperienceSchema`: Full survey experience schema (future)
- `experienceSchema`: Discriminated union of all types
- `createPhotoExperienceSchema`: Photo creation input
- `updatePhotoExperienceSchema`: Photo update input

### New Schemas (This Feature)

**`createGifExperienceSchema`**:
```typescript
export const createGifExperienceSchema = z.object({
  label: z.string().trim().min(1, "Experience name is required").max(50),
  type: z.literal("gif")
});

export type CreateGifExperienceData = z.infer<typeof createGifExperienceSchema>;
```

**`updateGifExperienceSchema`**:
```typescript
export const updateGifExperienceSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  enabled: z.boolean().optional(),
  hidden: z.boolean().optional(),
  previewPath: z.string().url().optional(),
  previewType: previewTypeSchema.optional(),
  config: gifConfigSchema.partial().optional(),
  aiConfig: aiConfigSchema.partial().optional(),
}).strict();

export type UpdateGifExperienceData = z.infer<typeof updateGifExperienceSchema>;
```

---

## Error Handling

All Server Actions follow this error handling pattern:

```typescript
try {
  // Validate input with Zod
  const validated = schema.parse(data);

  // Perform operation
  const result = await operation(validated);

  // Return success
  return { success: true, data: result };
} catch (error) {
  // Zod validation error
  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: {
        message: error.errors[0].message,
        code: 'VALIDATION_ERROR'
      }
    };
  }

  // Firestore error
  if (error instanceof FirebaseError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code
      }
    };
  }

  // Unknown error
  return {
    success: false,
    error: {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'INTERNAL_ERROR'
    }
  };
}
```

---

## Usage Examples

### Creating and Editing a Photo Experience

```typescript
// Create
const createResult = await createPhotoExperience('evt_123', {
  label: 'Neon Portrait',
  type: 'photo'
});

if (createResult.success) {
  const photoExp = createResult.data;

  // Update configuration
  const updateResult = await updatePhotoExperience('evt_123', photoExp.id, {
    config: {
      countdown: 3,
      overlayFramePath: 'https://storage.googleapis.com/.../frame.png'
    },
    aiConfig: {
      enabled: true,
      model: 'nanobanana',
      prompt: 'Cyberpunk neon style',
      aspectRatio: '1:1'
    }
  });

  if (updateResult.success) {
    console.log('Photo experience configured!');
  }
}
```

### Creating and Editing a GIF Experience

```typescript
// Create
const createResult = await createGifExperience('evt_123', {
  label: 'Animated Selfie',
  type: 'gif'
});

if (createResult.success) {
  const gifExp = createResult.data;

  // Update configuration
  const updateResult = await updateGifExperience('evt_123', gifExp.id, {
    config: {
      frameCount: 8,
      intervalMs: 300,
      loopCount: 0,
      countdown: 5
    },
    aiConfig: {
      enabled: true,
      prompt: 'Retro 80s style',
      aspectRatio: '1:1'
    }
  });

  if (updateResult.success) {
    console.log('GIF experience configured!');
  }
}
```

### Loading and Displaying All Experiences

```typescript
const experiences = await getExperiencesByEventId('evt_123');

experiences.forEach(exp => {
  console.log(`${exp.label} (${exp.type})`);

  // Type narrowing with switch
  switch (exp.type) {
    case 'photo':
      console.log(`  Countdown: ${exp.config.countdown}s`);
      break;
    case 'gif':
      console.log(`  Frames: ${exp.config.frameCount}`);
      break;
    // ... other types
  }
});
```

---

## Summary

This feature adds:
- **2 new Server Actions**: `createGifExperience`, `updateGifExperience`
- **2 new Zod schemas**: `createGifExperienceSchema`, `updateGifExperienceSchema`
- **1 updated repository function**: `getExperiencesByEventId` returns `Experience[]` instead of `PhotoExperience[]`

All actions follow Firebase Architecture Standards (Constitution Principle VI) with Admin SDK writes and Zod validation.
