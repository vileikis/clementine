# Server Actions Contract: Experience Management

**Feature**: 003-experience-schema
**Date**: 2025-11-19
**Version**: 1.0

## Overview

This document defines the Server Actions API contracts for creating and updating experiences using the new discriminated union schema. All Server Actions use the Firebase Admin SDK and implement server-side validation with Zod.

---

## Create Photo Experience

### Function Signature

```typescript
async function createPhotoExperienceAction(
  eventId: string,
  input: CreatePhotoExperienceInput
): Promise<ActionResponse<PhotoExperience>>
```

### Input Schema

```typescript
type CreatePhotoExperienceInput = {
  label: string;  // Required, 1-50 characters, trimmed
  type: "photo";  // Literal type (always "photo" for this action)
};
```

**Zod Validation**:
```typescript
const createPhotoExperienceSchema = z.object({
  label: z.string().trim().min(1, "Experience name is required").max(50),
  type: z.literal("photo"),
});
```

### Response Schema

```typescript
type ActionResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
  };
};

type ErrorCode =
  | "VALIDATION_ERROR"
  | "EVENT_NOT_FOUND"
  | "UNAUTHORIZED"
  | "INTERNAL_ERROR";
```

**Success Response**:
```json
{
  "success": true,
  "data": {
    "id": "exp_abc123",
    "eventId": "evt_xyz789",
    "label": "Summer Photo Booth",
    "type": "photo",
    "enabled": true,
    "hidden": false,
    "config": {
      "countdown": 0,
      "overlayFramePath": null
    },
    "aiConfig": {
      "enabled": false,
      "model": null,
      "prompt": null,
      "referenceImagePaths": null,
      "aspectRatio": "1:1"
    },
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000
  }
}
```

**Error Response** (validation failure):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Experience name is required"
  }
}
```

### Business Logic

1. **Validate Input**: Parse input with `createPhotoExperienceSchema`
2. **Check Event Exists**: Verify `events/{eventId}` document exists
3. **Generate Document ID**: Use Firestore `doc()` to generate unique ID
4. **Initialize Defaults**:
   - `enabled`: `true`
   - `hidden`: `false`
   - `config.countdown`: `0`
   - `config.overlayFramePath`: `null`
   - `aiConfig.enabled`: `false`
   - `aiConfig.model`: `null`
   - `aiConfig.prompt`: `null`
   - `aiConfig.referenceImagePaths`: `null`
   - `aiConfig.aspectRatio`: `"1:1"`
   - `createdAt`: `Date.now()`
   - `updatedAt`: `Date.now()`
5. **Write to Firestore**: Use Admin SDK to write to `/events/{eventId}/experiences/{experienceId}`
6. **Increment Counter**: Atomically increment `Event.experiencesCount` (future optimization)
7. **Revalidate Path**: Call `revalidatePath(/events/${eventId})`
8. **Return Response**: Return created PhotoExperience

### Error Handling

| Error Code | HTTP Equivalent | Trigger |
|------------|-----------------|---------|
| `VALIDATION_ERROR` | 400 Bad Request | Zod validation fails (invalid label) |
| `EVENT_NOT_FOUND` | 404 Not Found | Parent event doesn't exist |
| `UNAUTHORIZED` | 403 Forbidden | User doesn't own event (future auth) |
| `INTERNAL_ERROR` | 500 Internal Server Error | Firestore write fails |

---

## Update Photo Experience

### Function Signature

```typescript
async function updatePhotoExperienceAction(
  eventId: string,
  experienceId: string,
  input: UpdatePhotoExperienceInput
): Promise<ActionResponse<PhotoExperience>>
```

### Input Schema

```typescript
type UpdatePhotoExperienceInput = {
  // Basic fields
  label?: string;                // 1-50 characters
  enabled?: boolean;
  hidden?: boolean;
  previewPath?: string;          // Full public URL
  previewType?: "image" | "gif" | "video";

  // Photo-specific config (partial updates allowed)
  config?: Partial<PhotoConfig>;

  // AI config (partial updates allowed)
  aiConfig?: Partial<AiConfig>;
};

type PhotoConfig = {
  countdown: number;             // 0-10 seconds, 0 = disabled
  overlayFramePath: string | null;  // Full public URL, null = no overlay
};

type AiConfig = {
  enabled: boolean;
  model: string | null;          // AI model identifier, null = no model
  prompt: string | null;         // Max 600 characters, null = no prompt
  referenceImagePaths: string[] | null;  // Max 5 URLs, null = no references
  aspectRatio: "1:1" | "3:4" | "4:5" | "9:16" | "16:9";
};
```

**Zod Validation**:
```typescript
const updatePhotoExperienceSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  enabled: z.boolean().optional(),
  hidden: z.boolean().optional(),
  previewPath: z.string().url().optional(),
  previewType: z.enum(["image", "gif", "video"]).optional(),
  config: z.object({
    countdown: z.number().int().min(0).max(10),
    overlayFramePath: z.string().url().nullable(),
  }).partial().optional(),
  aiConfig: z.object({
    enabled: z.boolean(),
    model: z.string().nullable(),
    prompt: z.string().max(600).nullable(),
    referenceImagePaths: z.array(z.string().url()).max(5).nullable(),
    aspectRatio: z.enum(["1:1", "3:4", "4:5", "9:16", "16:9"]),
  }).partial().optional(),
}).strict();
```

### Response Schema

Same as Create Photo Experience (ActionResponse<PhotoExperience>)

**Success Response**:
```json
{
  "success": true,
  "data": {
    "id": "exp_abc123",
    "eventId": "evt_xyz789",
    "label": "Updated Photo Booth",
    "type": "photo",
    "enabled": true,
    "hidden": false,
    "config": {
      "countdown": 5,
      "overlayFramePath": "https://storage.googleapis.com/bucket/frames/new.png"
    },
    "aiConfig": {
      "enabled": true,
      "model": "flux-schnell",
      "prompt": "Transform to vintage style",
      "aspectRatio": "1:1"
    },
    "createdAt": 1700000000000,
    "updatedAt": 1700010000000
  }
}
```

### Business Logic

1. **Validate Input**: Parse input with `updatePhotoExperienceSchema`
2. **Fetch Existing Document**: Read from `/events/{eventId}/experiences/{experienceId}`
3. **Check Existence**: Return `EXPERIENCE_NOT_FOUND` if document doesn't exist
4. **Migrate Legacy Data** (if needed):
   - If document has flat fields (`countdownEnabled`, `aiEnabled`, etc.), call `migratePhotoExperience()`
   - Convert to new schema structure before applying updates
5. **Merge Updates**:
   - Apply partial updates to `config` and `aiConfig`
   - Preserve fields not included in input
   - Update `updatedAt` timestamp
6. **Validate Merged Result**: Ensure final document passes `photoExperienceSchema`
7. **Write to Firestore**: Use Admin SDK to update document
8. **Revalidate Path**: Call `revalidatePath(/events/${eventId}/experiences/${experienceId})`
9. **Return Response**: Return updated PhotoExperience

### Error Handling

| Error Code | HTTP Equivalent | Trigger |
|------------|-----------------|---------|
| `VALIDATION_ERROR` | 400 Bad Request | Zod validation fails (invalid countdown range) |
| `EXPERIENCE_NOT_FOUND` | 404 Not Found | Experience document doesn't exist |
| `UNAUTHORIZED` | 403 Forbidden | User doesn't own experience (future auth) |
| `MIGRATION_ERROR` | 500 Internal Server Error | Legacy data migration fails validation |
| `INTERNAL_ERROR` | 500 Internal Server Error | Firestore update fails |

---

## Delete Photo Experience

### Function Signature

```typescript
async function deletePhotoExperienceAction(
  eventId: string,
  experienceId: string
): Promise<ActionResponse<void>>
```

### Input

No body input. Event ID and experience ID passed as parameters.

### Response Schema

```typescript
type ActionResponse<void> = {
  success: true;
} | {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
  };
};
```

**Success Response**:
```json
{
  "success": true
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "EXPERIENCE_NOT_FOUND",
    "message": "Experience not found"
  }
}
```

### Business Logic

1. **Check Existence**: Verify document exists at `/events/{eventId}/experiences/{experienceId}`
2. **Delete Document**: Use Admin SDK to delete document
3. **Decrement Counter**: Atomically decrement `Event.experiencesCount` (future optimization)
4. **Revalidate Path**: Call `revalidatePath(/events/${eventId})`
5. **Return Response**: Return success

### Error Handling

| Error Code | HTTP Equivalent | Trigger |
|------------|-----------------|---------|
| `EXPERIENCE_NOT_FOUND` | 404 Not Found | Experience document doesn't exist |
| `UNAUTHORIZED` | 403 Forbidden | User doesn't own experience (future auth) |
| `INTERNAL_ERROR` | 500 Internal Server Error | Firestore delete fails |

---

## Upload Preview Media

### Function Signature

```typescript
async function uploadPreviewMediaAction(
  eventId: string,
  experienceId: string,
  file: File
): Promise<ActionResponse<UploadResult>>
```

### Input Schema

```typescript
type UploadPreviewMediaInput = {
  file: File;  // Image, GIF, or video file
};

type UploadResult = {
  publicUrl: string;      // Full public URL to uploaded file
  fileType: "image" | "gif" | "video";
  sizeBytes: number;
};
```

**Validation**:
- File size: Max 10MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `video/mp4`, `video/quicktime`
- File extension: `.jpg`, `.jpeg`, `.png`, `.gif`, `.mp4`, `.mov`

### Response Schema

**Success Response**:
```json
{
  "success": true,
  "data": {
    "publicUrl": "https://storage.googleapis.com/bucket/images/preview/abc123.jpg",
    "fileType": "image",
    "sizeBytes": 245678
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "File size exceeds 10MB limit"
  }
}
```

### Business Logic

1. **Validate File**: Check size, MIME type, and extension
2. **Generate Filename**: Use UUID + original extension
3. **Determine File Type**: Map MIME type to `"image" | "gif" | "video"`
4. **Upload to Storage**: Upload to `/images/preview/{eventId}/{filename}` using Admin SDK
5. **Make Public**: Call `file.makePublic()` to generate permanent public URL
6. **Generate Public URL**: `https://storage.googleapis.com/${bucketName}/${path}`
7. **Return Response**: Return `UploadResult` with public URL

### Error Handling

| Error Code | HTTP Equivalent | Trigger |
|------------|-----------------|---------|
| `VALIDATION_ERROR` | 400 Bad Request | File too large, invalid type |
| `UPLOAD_FAILED` | 500 Internal Server Error | Firebase Storage upload fails |
| `INTERNAL_ERROR` | 500 Internal Server Error | Unexpected error |

---

## Upload Overlay Frame

### Function Signature

```typescript
async function uploadOverlayFrameAction(
  eventId: string,
  experienceId: string,
  file: File
): Promise<ActionResponse<UploadResult>>
```

### Input Schema

Same as Upload Preview Media, but:
- Only image files allowed (no GIF, no video)
- Allowed MIME types: `image/png` (recommended for transparency), `image/jpeg`
- Max size: 5MB (smaller than preview media)

### Response Schema

Same as Upload Preview Media

### Business Logic

Same as Upload Preview Media, but upload path is `/images/frames/{eventId}/{filename}`

---

## Common Types

### ActionResponse

```typescript
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ActionError };

type ActionError = {
  code: ErrorCode;
  message: string;
};

type ErrorCode =
  | "VALIDATION_ERROR"
  | "EVENT_NOT_FOUND"
  | "EXPERIENCE_NOT_FOUND"
  | "UNAUTHORIZED"
  | "UPLOAD_FAILED"
  | "MIGRATION_ERROR"
  | "INTERNAL_ERROR";
```

### PhotoExperience (Full Type)

See [data-model.md](../data-model.md) for complete PhotoExperience type definition.

---

## Client Usage Examples

### Create Photo Experience

```typescript
"use client";

import { createPhotoExperienceAction } from "@/features/experiences/actions/create-experience";

async function handleCreateExperience(eventId: string, label: string) {
  const result = await createPhotoExperienceAction(eventId, {
    label,
    type: "photo",
  });

  if (result.success) {
    console.log("Created:", result.data);
    router.push(`/events/${eventId}/experiences/${result.data.id}`);
  } else {
    toast.error(result.error.message);
  }
}
```

### Update Photo Experience

```typescript
"use client";

import { updatePhotoExperienceAction } from "@/features/experiences/actions/update-experience";

async function handleUpdateCountdown(eventId: string, experienceId: string, countdown: number) {
  const result = await updatePhotoExperienceAction(eventId, experienceId, {
    config: { countdown },
  });

  if (result.success) {
    toast.success("Countdown updated");
  } else {
    toast.error(result.error.message);
  }
}
```

### Upload Preview Media

```typescript
"use client";

import { uploadPreviewMediaAction } from "@/features/experiences/actions/upload-preview";

async function handleUploadPreview(
  eventId: string,
  experienceId: string,
  file: File
) {
  const uploadResult = await uploadPreviewMediaAction(eventId, experienceId, file);

  if (!uploadResult.success) {
    toast.error(uploadResult.error.message);
    return;
  }

  // Update experience with preview URL
  const updateResult = await updatePhotoExperienceAction(eventId, experienceId, {
    previewPath: uploadResult.data.publicUrl,
    previewType: uploadResult.data.fileType,
  });

  if (updateResult.success) {
    toast.success("Preview image uploaded");
  }
}
```

---

## Testing Contract

### Unit Test Coverage

Each Server Action must have unit tests covering:

1. **Success Path**: Valid input returns success response
2. **Validation Errors**: Invalid input returns `VALIDATION_ERROR`
3. **Not Found Errors**: Non-existent IDs return `*_NOT_FOUND`
4. **Migration Path**: Legacy data is migrated correctly (update action only)
5. **Partial Updates**: Only specified fields are updated (update action only)
6. **Edge Cases**: Empty strings, extreme values, malformed URLs

### Example Test (Jest)

```typescript
import { updatePhotoExperienceAction } from "./update-experience";
import { db } from "@/lib/firebase/admin";

jest.mock("@/lib/firebase/admin");

describe("updatePhotoExperienceAction", () => {
  it("should update countdown in config", async () => {
    const mockDoc = {
      id: "exp_123",
      type: "photo",
      config: { countdown: 0 },
      aiConfig: { enabled: false, aspectRatio: "1:1" },
      // ... other fields
    };

    (db.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: true, data: () => mockDoc }),
        update: jest.fn().mockResolvedValue(undefined),
      }),
    });

    const result = await updatePhotoExperienceAction("evt_1", "exp_123", {
      config: { countdown: 5 },
    });

    expect(result.success).toBe(true);
    expect(result.data.config.countdown).toBe(5);
  });
});
```

---

## Security Considerations

### Current (POC Phase)

- **Authentication**: Not implemented (all Server Actions are public)
- **Authorization**: Not implemented (any user can modify any experience)
- **Rate Limiting**: Not implemented
- **Input Sanitization**: Zod validation only (sufficient for POC)

### Future (MVP/Production)

- **Authentication**: Verify `request.auth.uid` from Firebase Auth
- **Authorization**: Check user owns parent event before mutations
- **Rate Limiting**: Apply per-user limits on creation/upload actions
- **Input Sanitization**: Add XSS protection for prompt fields
- **Audit Logging**: Log all mutations with user ID and timestamp

---

## References

- **Data Model**: [data-model.md](../data-model.md)
- **Feature Spec**: [spec.md](../spec.md)
- **Firebase Standards**: `/standards/backend/firebase.md`
- **Error Handling Standards**: `/standards/global/error-handling.md`
