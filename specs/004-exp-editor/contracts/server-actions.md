# Server Actions Contract: Experience Editor & AI Playground

**Feature**: 004-exp-editor
**Date**: 2025-11-25

## Overview

This feature uses Next.js Server Actions for backend operations. All actions follow the existing `ActionResponse` pattern from the experiences module.

## Response Types

```typescript
type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };
```

## Actions

### 1. updatePhotoExperience (Existing)

**Location**: `web/src/features/experiences/actions/photo-update.ts`

**Purpose**: Update experience configuration including AI settings

**Input**:
```typescript
{
  experienceId: string;
  data: {
    name?: string;
    enabled?: boolean;
    aiPhotoConfig?: {
      enabled?: boolean;
      model?: string | null;
      prompt?: string | null;
      aspectRatio?: "1:1" | "3:4" | "4:5" | "9:16" | "16:9";
      referenceImageUrls?: string[] | null;
    };
  };
}
```

**Output**: `ActionResponse<PhotoExperience>`

**Error Codes**:
- `PERMISSION_DENIED`: Not authenticated
- `EXPERIENCE_NOT_FOUND`: Invalid experienceId
- `VALIDATION_ERROR`: Invalid input data

---

### 2. generatePlaygroundPreview (NEW)

**Location**: `web/src/features/experiences/actions/playground-generate.ts`

**Purpose**: Generate AI-transformed preview for testing

**Input**:
```typescript
{
  experienceId: string;
  testImageBase64: string;  // Base64-encoded image
  testImageMimeType: "image/jpeg" | "image/png" | "image/webp";
}
```

**Output**:
```typescript
ActionResponse<{
  resultImageBase64: string;  // Base64-encoded result
  resultMimeType: string;
  generationTimeMs: number;
}>
```

**Error Codes**:
- `PERMISSION_DENIED`: Not authenticated
- `EXPERIENCE_NOT_FOUND`: Invalid experienceId
- `AI_CONFIG_MISSING`: Experience has no AI config or prompt
- `GENERATION_FAILED`: AI provider error
- `GENERATION_TIMEOUT`: Took longer than 60s
- `INVALID_IMAGE`: Image validation failed

**Implementation Notes**:
1. Validate authentication
2. Fetch experience
3. Validate experience has aiPhotoConfig with prompt
4. Upload test image to temp Firebase Storage
5. Call `getAIClient().generateImage()` with:
   - `prompt`: experience.aiPhotoConfig.prompt
   - `inputImageUrl`: temp storage URL
6. Return result as Base64
7. Clean up temp storage

---

### 3. deleteExperience (Existing)

**Location**: `web/src/features/experiences/actions/shared.ts`

**Purpose**: Delete an experience (header delete button)

**Input**:
```typescript
{
  experienceId: string;
}
```

**Output**: `ActionResponse<void>`

**Error Codes**:
- `PERMISSION_DENIED`: Not authenticated
- `EXPERIENCE_NOT_FOUND`: Invalid experienceId

---

## Data Fetching (Server Components)

### getExperience

**Location**: `web/src/features/experiences/repositories/experiences.repository.ts`

**Signature**: `getExperience(experienceId: string): Promise<Experience | null>`

### getEvent

**Location**: `web/src/features/events/repositories/events.repository.ts`

**Signature**: `getEvent(eventId: string): Promise<Event | null>`

---

## Client-Side Hooks

### useExperience (if needed)

For real-time updates, consider using Client SDK `onSnapshot` subscription:

```typescript
// Optional - only if real-time updates needed
function useExperience(experienceId: string) {
  // Subscribe to experience doc changes
  // Return { experience, loading, error }
}
```

**Note**: For this feature, real-time updates may not be necessary since the user is actively editing. Standard server-side fetching with revalidation should suffice.
