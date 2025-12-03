# API Contract: Experience Settings

**Feature Branch**: `001-exp-settings-routes`
**Date**: 2025-12-03

---

## Overview

This document defines the server action contracts for the Experience Settings feature. All mutations use Next.js Server Actions (not REST API routes) following the project's Firebase architecture standards.

---

## Server Actions

### 1. Update Experience Settings

**Action**: `updateExperienceSettingsAction`

**File**: `web/src/features/experiences/actions/experiences.ts`

**Purpose**: Update experience metadata (name, description, preview media)

#### Input Schema

```typescript
const updateExperienceSettingsInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Experience name is required")
    .max(200, "Experience name too long")
    .optional(),
  description: z
    .string()
    .max(1000, "Description too long")
    .nullable()
    .optional(),
  previewMediaUrl: z
    .string()
    .url("Invalid URL format")
    .max(2048, "URL too long")
    .nullable()
    .optional(),
  previewType: z
    .enum(["image", "gif"])
    .nullable()
    .optional(),
});

type UpdateExperienceSettingsInput = z.infer<typeof updateExperienceSettingsInputSchema>;
```

#### Signature

```typescript
export async function updateExperienceSettingsAction(
  experienceId: string,
  input: UpdateExperienceSettingsInput
): Promise<ActionResponse<void>>
```

#### Response

```typescript
// Success
{
  success: true,
  data: undefined
}

// Error
{
  success: false,
  error: {
    code: "PERMISSION_DENIED" | "EXPERIENCE_NOT_FOUND" | "VALIDATION_ERROR" | "INTERNAL_ERROR",
    message: string
  }
}
```

#### Error Codes

| Code | HTTP Equiv | Description |
|------|------------|-------------|
| `PERMISSION_DENIED` | 403 | Not authenticated or not authorized |
| `EXPERIENCE_NOT_FOUND` | 404 | Experience ID does not exist |
| `VALIDATION_ERROR` | 400 | Input failed Zod validation |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

#### Example Usage

```typescript
"use client";

import { updateExperienceSettingsAction } from "@/features/experiences/actions";
import { toast } from "sonner";

async function handleSave(experienceId: string, formData: FormData) {
  const result = await updateExperienceSettingsAction(experienceId, {
    name: formData.get("name") as string,
    description: formData.get("description") as string | null,
    previewMediaUrl: formData.get("previewMediaUrl") as string | null,
    previewType: formData.get("previewType") as "image" | "gif" | null,
  });

  if (result.success) {
    toast.success("Settings saved");
  } else {
    toast.error(result.error.message);
  }
}
```

---

### 2. Upload Experience Preview Media

**Action**: `uploadExperiencePreviewMediaAction`

**File**: `web/src/features/experiences/actions/experiences.ts`

**Purpose**: Upload preview media file to Firebase Storage

#### Input

- `companyId: string` - Company ID for storage path
- `experienceId: string` - Experience ID for storage path
- `file: File` - Image or GIF file

#### Signature

```typescript
export async function uploadExperiencePreviewMediaAction(
  companyId: string,
  experienceId: string,
  file: File
): Promise<ActionResponse<UploadResult>>
```

#### Response

```typescript
interface UploadResult {
  publicUrl: string;       // Full public URL
  previewType: "image" | "gif";  // Detected type
  sizeBytes: number;       // File size
}

// Success
{
  success: true,
  data: {
    publicUrl: "https://storage.googleapis.com/...",
    previewType: "image",
    sizeBytes: 245678
  }
}

// Error
{
  success: false,
  error: {
    code: "PERMISSION_DENIED" | "FILE_TOO_LARGE" | "INVALID_FILE_TYPE" | "UPLOAD_FAILED",
    message: string
  }
}
```

#### Error Codes

| Code | HTTP Equiv | Description |
|------|------------|-------------|
| `PERMISSION_DENIED` | 403 | Not authenticated |
| `FILE_TOO_LARGE` | 413 | File exceeds size limit (5MB image, 10MB GIF) |
| `INVALID_FILE_TYPE` | 415 | File type not supported |
| `UPLOAD_FAILED` | 500 | Firebase Storage upload failed |

#### File Validation

```typescript
const PREVIEW_MEDIA_CONSTRAINTS = {
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    types: ["image/jpeg", "image/png", "image/webp"],
  },
  gif: {
    maxSize: 10 * 1024 * 1024, // 10MB
    types: ["image/gif"],
  },
};
```

---

### 3. Delete Experience Preview Media

**Action**: `deleteExperiencePreviewMediaAction`

**File**: `web/src/features/experiences/actions/experiences.ts`

**Purpose**: Remove preview media from experience (sets fields to null)

#### Signature

```typescript
export async function deleteExperiencePreviewMediaAction(
  experienceId: string
): Promise<ActionResponse<void>>
```

#### Response

```typescript
// Success
{
  success: true,
  data: undefined
}

// Error
{
  success: false,
  error: {
    code: "PERMISSION_DENIED" | "EXPERIENCE_NOT_FOUND" | "INTERNAL_ERROR",
    message: string
  }
}
```

#### Behavior

1. Sets `previewMediaUrl` to `null`
2. Sets `previewType` to `null`
3. Updates `updatedAt` timestamp
4. (Optional) Deletes file from Firebase Storage

---

## Data Flow

### Settings Update Flow

```
┌──────────────┐     ┌────────────────────────┐     ┌──────────────────┐
│ Settings UI  │ ──► │ updateExperienceSettings │ ──► │   Firestore      │
│   (Client)   │     │       Action (Server)    │     │  /experiences/   │
└──────────────┘     └────────────────────────┘     └──────────────────┘
       │                       │                            │
       │                       ▼                            │
       │              ┌─────────────────┐                   │
       │              │  Zod Validation  │                  │
       │              └─────────────────┘                   │
       │                       │                            │
       │                       ▼                            │
       │              ┌─────────────────┐                   │
       │              │   Admin SDK     │ ─────────────────►│
       │              │    (Write)      │                   │
       │              └─────────────────┘                   │
       │                                                    │
       ▼                                                    ▼
┌──────────────┐                                    ┌──────────────────┐
│ Toast        │                                    │ Real-time update │
│ Notification │                                    │  (onSnapshot)    │
└──────────────┘                                    └──────────────────┘
```

### Media Upload Flow

```
┌──────────────┐     ┌────────────────────────┐     ┌──────────────────┐
│ File Input   │ ──► │ uploadExperiencePreview │ ──► │ Firebase Storage │
│   (Client)   │     │    MediaAction (Server) │     │   media/...      │
└──────────────┘     └────────────────────────┘     └──────────────────┘
       │                       │                            │
       │                       ▼                            │
       │              ┌─────────────────┐                   │
       │              │  File Validation │                  │
       │              │ (type, size)     │                  │
       │              └─────────────────┘                   │
       │                       │                            │
       │                       ▼                            │
       │              ┌─────────────────┐                   │
       │              │   Make Public   │ ─────────────────►│
       │              └─────────────────┘                   │
       │                       │                            │
       │                       ▼                            │
       │              ┌─────────────────┐                   │
       │◄─────────────│  Return URL     │                   │
       │              └─────────────────┘                   │
       │                                                    │
       ▼                                                    │
┌──────────────┐                                            │
│ Settings Form│ ── save ──► updateExperienceSettingsAction │
│  (with URL)  │                                            │
└──────────────┘                                            │
```

---

## Repository Layer

### Experience Repository Updates

**File**: `web/src/features/experiences/repositories/experiences.repository.ts`

Add or extend:

```typescript
export async function updateExperience(
  experienceId: string,
  data: Partial<Experience>
): Promise<void> {
  const docRef = firestore.collection("experiences").doc(experienceId);
  await docRef.update({
    ...data,
    updatedAt: Date.now(),
  });
}
```

The repository already supports partial updates. No new methods required.

---

## Constants

**File**: `web/src/features/experiences/constants.ts`

```typescript
export const EXPERIENCE_CONSTRAINTS = {
  NAME_LENGTH: { min: 1, max: 200 },
  DESCRIPTION_LENGTH: { max: 1000 },
  MAX_STEPS: 50,
  PREVIEW_MEDIA: {
    IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
    GIF_MAX_SIZE: 10 * 1024 * 1024,  // 10MB
    SUPPORTED_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
} as const;
```
