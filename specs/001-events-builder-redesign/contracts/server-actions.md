# Server Actions Contracts: Events Builder

**Date**: 2025-11-13
**Branch**: `001-events-builder-redesign`

## Overview

This document defines the Server Actions API contracts for the events builder redesign. All mutations (create, update, delete) use Next.js Server Actions with Firebase Admin SDK. All actions validate input with Zod and return typed responses.

## General Conventions

### Success Response
```typescript
type SuccessResponse<T = void> = {
  success: true;
  data: T;
};
```

### Error Response
```typescript
type ErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};
```

### Combined Response Type
```typescript
type ActionResponse<T = void> = SuccessResponse<T> | ErrorResponse;
```

## Events Actions

### updateEventWelcome

Updates welcome screen configuration for an event.

**File**: `web/src/lib/actions/events.ts`

**Signature**:
```typescript
async function updateEventWelcome(
  eventId: string,
  data: {
    welcomeTitle?: string;
    welcomeDescription?: string;
    welcomeCtaLabel?: string;
    welcomeBackgroundImagePath?: string;
    welcomeBackgroundColorHex?: string;
  }
): Promise<ActionResponse<void>>;
```

**Input Validation** (Zod):
```typescript
const updateEventWelcomeSchema = z.object({
  welcomeTitle: z.string().max(500).optional(),
  welcomeDescription: z.string().max(500).optional(),
  welcomeCtaLabel: z.string().max(50).optional(),
  welcomeBackgroundImagePath: z.string().optional(),
  welcomeBackgroundColorHex: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});
```

**Behavior**:
- Validates `eventId` exists
- Validates `data` with schema
- Updates only provided fields (partial update)
- Sets `updatedAt` timestamp
- Returns success/error response

**Error Codes**:
- `EVENT_NOT_FOUND`: Event with given ID doesn't exist
- `VALIDATION_ERROR`: Input validation failed
- `PERMISSION_DENIED`: User doesn't have access to this event

---

### updateEventEnding

Updates ending screen and share configuration for an event.

**File**: `web/src/lib/actions/events.ts`

**Signature**:
```typescript
async function updateEventEnding(
  eventId: string,
  data: {
    endHeadline?: string;
    endBody?: string;
    endCtaLabel?: string;
    endCtaUrl?: string;
    shareAllowDownload?: boolean;
    shareAllowSystemShare?: boolean;
    shareAllowEmail?: boolean;
    shareSocials?: Array<"instagram" | "tiktok" | "facebook" | "x" | "snapchat" | "whatsapp" | "custom">;
  }
): Promise<ActionResponse<void>>;
```

**Input Validation** (Zod):
```typescript
const shareSocialSchema = z.enum(["instagram", "tiktok", "facebook", "x", "snapchat", "whatsapp", "custom"]);

const updateEventEndingSchema = z.object({
  endHeadline: z.string().max(500).optional(),
  endBody: z.string().max(500).optional(),
  endCtaLabel: z.string().max(50).optional(),
  endCtaUrl: z.string().url().optional(),
  shareAllowDownload: z.boolean().optional(),
  shareAllowSystemShare: z.boolean().optional(),
  shareAllowEmail: z.boolean().optional(),
  shareSocials: z.array(shareSocialSchema).optional(),
});
```

**Behavior**:
- Validates `eventId` exists
- Validates `data` with schema
- Updates only provided fields (partial update)
- Sets `updatedAt` timestamp
- Returns success/error response

**Error Codes**:
- `EVENT_NOT_FOUND`: Event with given ID doesn't exist
- `VALIDATION_ERROR`: Input validation failed
- `PERMISSION_DENIED`: User doesn't have access to this event

---

### updateEventSurveyConfig

Updates survey configuration for an event.

**File**: `web/src/lib/actions/events.ts`

**Signature**:
```typescript
async function updateEventSurveyConfig(
  eventId: string,
  data: {
    surveyEnabled?: boolean;
    surveyRequired?: boolean;
    surveyStepsOrder?: string[];
  }
): Promise<ActionResponse<void>>;
```

**Input Validation** (Zod):
```typescript
const updateEventSurveyConfigSchema = z.object({
  surveyEnabled: z.boolean().optional(),
  surveyRequired: z.boolean().optional(),
  surveyStepsOrder: z.array(z.string()).optional(),
});
```

**Behavior**:
- Validates `eventId` exists
- Validates `data` with schema
- If `surveyStepsOrder` provided, validates all stepIds exist in `/events/{eventId}/surveySteps`
- Updates `surveyVersion` (increments by 1) if survey config changes
- Sets `updatedAt` timestamp
- Returns success/error response

**Error Codes**:
- `EVENT_NOT_FOUND`: Event with given ID doesn't exist
- `VALIDATION_ERROR`: Input validation failed
- `INVALID_STEP_ID`: One or more stepIds in `surveyStepsOrder` don't exist
- `PERMISSION_DENIED`: User doesn't have access to this event

---

## Experiences Actions

### createExperience

Creates a new experience for an event.

**File**: `web/src/lib/actions/experiences.ts`

**Signature**:
```typescript
async function createExperience(
  eventId: string,
  data: {
    label: string;
    type: "photo" | "video" | "gif" | "wheel";
    enabled?: boolean;
    aiEnabled?: boolean;
  }
): Promise<ActionResponse<{ id: string }>>;
```

**Input Validation** (Zod):
```typescript
const createExperienceSchema = z.object({
  label: z.string().min(1).max(50),
  type: z.enum(["photo", "video", "gif", "wheel"]),
  enabled: z.boolean().default(true),
  aiEnabled: z.boolean().default(false),
});
```

**Behavior**:
- Validates `eventId` exists
- Validates `data` with schema
- Generates new `experienceId`
- Creates experience document in `/events/{eventId}/experiences/{experienceId}`
- Increments `event.experiencesCount` by 1
- Sets `createdAt` and `updatedAt` timestamps
- Returns `{ success: true, data: { id: experienceId } }`

**Error Codes**:
- `EVENT_NOT_FOUND`: Event with given ID doesn't exist
- `VALIDATION_ERROR`: Input validation failed
- `PERMISSION_DENIED`: User doesn't have access to this event

---

### updateExperience

Updates an existing experience.

**File**: `web/src/lib/actions/experiences.ts`

**Signature**:
```typescript
async function updateExperience(
  eventId: string,
  experienceId: string,
  data: {
    label?: string;
    enabled?: boolean;
    previewPath?: string;
    previewType?: "image" | "gif" | "video";
    allowCamera?: boolean;
    allowLibrary?: boolean;
    maxDurationMs?: number;
    frameCount?: number;
    captureIntervalMs?: number;
    overlayFramePath?: string;
    overlayLogoPath?: string;
    aiEnabled?: boolean;
    aiModel?: string;
    aiPrompt?: string;
    aiReferenceImagePaths?: string[];
  }
): Promise<ActionResponse<void>>;
```

**Input Validation** (Zod):
```typescript
const updateExperienceSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  enabled: z.boolean().optional(),
  previewPath: z.string().optional(),
  previewType: z.enum(["image", "gif", "video"]).optional(),
  allowCamera: z.boolean().optional(),
  allowLibrary: z.boolean().optional(),
  maxDurationMs: z.number().int().positive().max(60000).optional(),
  frameCount: z.number().int().min(2).max(20).optional(),
  captureIntervalMs: z.number().int().positive().optional(),
  overlayFramePath: z.string().optional(),
  overlayLogoPath: z.string().optional(),
  aiEnabled: z.boolean().optional(),
  aiModel: z.string().optional(),
  aiPrompt: z.string().max(600).optional(),
  aiReferenceImagePaths: z.array(z.string()).optional(),
});
```

**Behavior**:
- Validates `eventId` and `experienceId` exist
- Validates `data` with schema
- Updates only provided fields (partial update)
- Sets `updatedAt` timestamp
- Returns success/error response

**Error Codes**:
- `EVENT_NOT_FOUND`: Event with given ID doesn't exist
- `EXPERIENCE_NOT_FOUND`: Experience with given ID doesn't exist
- `VALIDATION_ERROR`: Input validation failed
- `PERMISSION_DENIED`: User doesn't have access to this event

---

### deleteExperience

Deletes an experience from an event.

**File**: `web/src/lib/actions/experiences.ts`

**Signature**:
```typescript
async function deleteExperience(
  eventId: string,
  experienceId: string
): Promise<ActionResponse<void>>;
```

**Behavior**:
- Validates `eventId` and `experienceId` exist
- Deletes experience document from `/events/{eventId}/experiences/{experienceId}`
- Deletes all related experience items from `/events/{eventId}/experienceItems` where `experienceId` matches
- Decrements `event.experiencesCount` by 1
- Returns success/error response

**Error Codes**:
- `EVENT_NOT_FOUND`: Event with given ID doesn't exist
- `EXPERIENCE_NOT_FOUND`: Experience with given ID doesn't exist
- `CANNOT_DELETE_LAST_EXPERIENCE`: Events must have at least one experience
- `PERMISSION_DENIED`: User doesn't have access to this event

---

## Survey Steps Actions

### createSurveyStep

Creates a new survey step for an event.

**File**: `web/src/lib/actions/survey.ts`

**Signature**:
```typescript
async function createSurveyStep(
  eventId: string,
  data: {
    type: "short_text" | "long_text" | "multiple_choice" | "opinion_scale" | "email" | "statement";
    title?: string;
    description?: string;
    placeholder?: string;
    options?: string[];
    allowMultiple?: boolean;
    scaleMin?: number;
    scaleMax?: number;
    required?: boolean;
  }
): Promise<ActionResponse<{ id: string }>>;
```

**Input Validation** (Zod):
```typescript
const surveyStepTypeSchema = z.enum(["short_text", "long_text", "multiple_choice", "opinion_scale", "email", "statement"]);

const createSurveyStepSchema = z.object({
  type: surveyStepTypeSchema,
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  placeholder: z.string().max(100).optional(),
  options: z.array(z.string().max(100)).min(1).optional(),
  allowMultiple: z.boolean().optional(),
  scaleMin: z.number().int().optional(),
  scaleMax: z.number().int().optional(),
  required: z.boolean().default(false),
}).refine(
  (data) => data.type !== "multiple_choice" || (data.options && data.options.length > 0),
  { message: "options required for multiple_choice type" }
).refine(
  (data) => data.type !== "opinion_scale" || (data.scaleMin !== undefined && data.scaleMax !== undefined && data.scaleMin < data.scaleMax),
  { message: "scaleMin and scaleMax required and scaleMin < scaleMax for opinion_scale type" }
);
```

**Behavior**:
- Validates `eventId` exists
- Validates `data` with schema
- Generates new `stepId`
- Creates survey step document in `/events/{eventId}/surveySteps/{stepId}`
- Appends `stepId` to `event.surveyStepsOrder` array
- Increments `event.surveyStepsCount` by 1
- Increments `event.surveyVersion` by 1
- Sets `createdAt` and `updatedAt` timestamps
- Returns `{ success: true, data: { id: stepId } }`

**Error Codes**:
- `EVENT_NOT_FOUND`: Event with given ID doesn't exist
- `VALIDATION_ERROR`: Input validation failed
- `PERMISSION_DENIED`: User doesn't have access to this event

---

### updateSurveyStep

Updates an existing survey step.

**File**: `web/src/lib/actions/survey.ts`

**Signature**:
```typescript
async function updateSurveyStep(
  eventId: string,
  stepId: string,
  data: {
    title?: string;
    description?: string;
    placeholder?: string;
    options?: string[];
    allowMultiple?: boolean;
    scaleMin?: number;
    scaleMax?: number;
    required?: boolean;
  }
): Promise<ActionResponse<void>>;
```

**Input Validation** (Zod):
```typescript
const updateSurveyStepSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  placeholder: z.string().max(100).optional(),
  options: z.array(z.string().max(100)).min(1).optional(),
  allowMultiple: z.boolean().optional(),
  scaleMin: z.number().int().optional(),
  scaleMax: z.number().int().optional(),
  required: z.boolean().optional(),
});
```

**Behavior**:
- Validates `eventId` and `stepId` exist
- Validates `data` with schema
- Updates only provided fields (partial update)
- Increments `event.surveyVersion` by 1
- Sets `updatedAt` timestamp
- Returns success/error response

**Error Codes**:
- `EVENT_NOT_FOUND`: Event with given ID doesn't exist
- `SURVEY_STEP_NOT_FOUND`: Survey step with given ID doesn't exist
- `VALIDATION_ERROR`: Input validation failed
- `PERMISSION_DENIED`: User doesn't have access to this event

---

### deleteSurveyStep

Deletes a survey step from an event.

**File**: `web/src/lib/actions/survey.ts`

**Signature**:
```typescript
async function deleteSurveyStep(
  eventId: string,
  stepId: string
): Promise<ActionResponse<void>>;
```

**Behavior**:
- Validates `eventId` and `stepId` exist
- Deletes survey step document from `/events/{eventId}/surveySteps/{stepId}`
- Removes `stepId` from `event.surveyStepsOrder` array
- Decrements `event.surveyStepsCount` by 1
- Increments `event.surveyVersion` by 1
- Returns success/error response

**Error Codes**:
- `EVENT_NOT_FOUND`: Event with given ID doesn't exist
- `SURVEY_STEP_NOT_FOUND`: Survey step with given ID doesn't exist
- `PERMISSION_DENIED`: User doesn't have access to this event

---

## Storage Actions (Images/Media)

### uploadImage

Uploads an image to Firebase Storage and returns the storage path.

**File**: `web/src/lib/actions/storage.ts`

**Signature**:
```typescript
async function uploadImage(
  file: File,
  destination: "welcome" | "experience-preview" | "experience-overlay" | "ai-reference"
): Promise<ActionResponse<{ path: string; url: string }>>;
```

**Input Validation**:
- File type must be `image/png`, `image/jpeg`, or `image/webp`
- File size must be ≤ 10MB

**Behavior**:
- Validates file type and size
- Generates unique filename (UUID + extension)
- Uploads to Firebase Storage at `/images/{destination}/{filename}`
- Returns storage path and public URL
- Returns `{ success: true, data: { path: string, url: string } }`

**Error Codes**:
- `INVALID_FILE_TYPE`: File is not an allowed image format
- `FILE_TOO_LARGE`: File exceeds 10MB size limit
- `UPLOAD_FAILED`: Firebase Storage upload failed
- `PERMISSION_DENIED`: User doesn't have permission to upload

---

## Example Usage

### Creating an Experience

```typescript
import { createExperience } from "@/lib/actions/experiences";

async function handleCreateExperience(eventId: string) {
  const result = await createExperience(eventId, {
    label: "Neon Portrait",
    type: "photo",
    enabled: true,
    aiEnabled: true,
  });

  if (result.success) {
    console.log("Experience created:", result.data.id);
    // Redirect to experience editor
  } else {
    console.error(result.error.code, result.error.message);
    // Show error to user
  }
}
```

### Updating Welcome Screen

```typescript
import { updateEventWelcome } from "@/lib/actions/events";

async function handleUpdateWelcome(eventId: string) {
  const result = await updateEventWelcome(eventId, {
    welcomeTitle: "Welcome to the Party!",
    welcomeDescription: "Take an AI-powered photo and share it with your friends.",
    welcomeCtaLabel: "Get Started",
    welcomeBackgroundColorHex: "#FF5733",
  });

  if (result.success) {
    console.log("Welcome screen updated");
  } else {
    console.error(result.error.code, result.error.message);
  }
}
```

### Reordering Survey Steps

```typescript
import { updateEventSurveyConfig } from "@/lib/actions/events";

async function handleReorderSurveySteps(eventId: string, newOrder: string[]) {
  const result = await updateEventSurveyConfig(eventId, {
    surveyStepsOrder: newOrder,
  });

  if (result.success) {
    console.log("Survey steps reordered");
  } else {
    console.error(result.error.code, result.error.message);
  }
}
```

## Summary

All Server Actions follow the same pattern:
1. Accept strongly-typed input parameters
2. Validate input with Zod schemas
3. Perform Firebase Admin SDK operations
4. Return `ActionResponse<T>` with success/error status
5. Use consistent error codes across all actions

This contract enables type-safe builder UI implementation with clear expectations for request/response shapes.
