# Server Actions API Contract

**Feature**: 001-simplify-ai-prompts
**Date**: 2025-11-11
**Purpose**: Define Next.js Server Actions for scene and session management

## Overview

Clementine uses Next.js Server Actions for all mutations (Constitution standard: `backend/api.md`). Server Actions provide:
- Type-safe RPC from client to server
- Automatic serialization/deserialization
- Built-in CSRF protection
- Server-side validation with Zod

---

## Scene Management Actions

### `createScene(eventId: string, data: CreateSceneInput)`

Create a new scene for an event with custom AI prompt.

**File**: `web/src/app/actions/scenes.ts`

**Input**:
```typescript
interface CreateSceneInput {
  label: string;                  // Scene display name (e.g., "Superhero Transform")
  mode: CaptureMode;              // "photo" | "video" | "gif" | "boomerang"
  prompt: string | null;          // Custom AI prompt (max 600 chars) or null for passthrough
  referenceImage?: File;          // Optional reference image (≤10MB, PNG/JPEG/WebP)
  flags: {
    customTextTool: boolean;      // Enable text overlay tool
    stickersTool: boolean;        // Enable stickers tool
  };
}
```

**Output**:
```typescript
interface CreateSceneOutput {
  success: boolean;
  sceneId?: string;               // Generated scene ID
  error?: string;                 // Validation or processing error
}
```

**Validation**:
- `label`: Required, 1-100 characters
- `mode`: Must be one of: "photo", "video", "gif", "boomerang"
- `prompt`: Optional, max 600 characters (null allowed for passthrough)
- `referenceImage`: Optional, max 10MB, types: image/png, image/jpeg, image/webp

**Example Usage**:
```typescript
// Client component
const formData = new FormData();
formData.append("label", "Vintage Movie Star");
formData.append("mode", "photo");
formData.append("prompt", "Transform into a 1920s silent film star");
formData.append("referenceImage", file); // Optional

const result = await createScene(eventId, formData);
```

**Errors**:
- `400`: Invalid input (Zod validation failure)
- `404`: Event not found
- `500`: Firestore or Storage error

---

### `updateScene(eventId: string, sceneId: string, data: UpdateSceneInput)`

Update an existing scene's configuration.

**File**: `web/src/app/actions/scenes.ts`

**Input**:
```typescript
interface UpdateSceneInput {
  label?: string;                 // Optional: Update scene name
  prompt?: string | null;         // Optional: Update AI prompt
  referenceImage?: File;          // Optional: Replace reference image
  flags?: {
    customTextTool?: boolean;
    stickersTool?: boolean;
  };
}
```

**Output**:
```typescript
interface UpdateSceneOutput {
  success: boolean;
  error?: string;
}
```

**Validation**: Same as `createScene` for provided fields

**Behavior**:
- Only provided fields are updated (partial update)
- Setting `prompt` to `null` enables passthrough mode
- Uploading new `referenceImage` replaces existing one

**Example Usage**:
```typescript
// Update only the prompt
await updateScene(eventId, sceneId, {
  prompt: "New custom prompt text"
});

// Enable passthrough mode
await updateScene(eventId, sceneId, {
  prompt: null
});
```

---

## Session Management Actions

### `triggerTransformAction(eventId: string, sessionId: string)`

Trigger AI transformation or passthrough copy for a captured session.

**File**: `web/src/app/actions/sessions.ts`

**Input**:
```typescript
interface TriggerTransformInput {
  eventId: string;
  sessionId: string;
}
```

**Output**:
```typescript
interface TriggerTransformOutput {
  success: boolean;
  resultImagePath?: string;       // Storage path to result image
  error?: string;                 // Error message if transformation fails
}
```

**Behavior**:

1. **Fetch scene configuration**:
   ```typescript
   const scene = await getCurrentScene(eventId);
   ```

2. **Passthrough mode** (prompt empty/null):
   ```typescript
   if (!scene.prompt || scene.prompt.trim() === "") {
     // Copy input image to result location
     const resultImagePath = await copyImageToResult(
       session.inputImagePath,
       `events/${eventId}/sessions/${sessionId}/result.jpg`
     );

     // Mark session as ready
     await updateSessionState(eventId, sessionId, "ready", {
       resultImagePath,
     });

     return { success: true, resultImagePath };
   }
   ```

3. **AI transformation mode** (prompt non-empty):
   ```typescript
   // Generate signed URLs for AI provider
   const inputUrl = await getSignedUrl(session.inputImagePath, 3600);
   const referenceUrl = scene.referenceImagePath
     ? await getSignedUrl(scene.referenceImagePath, 3600)
     : undefined;

   // Call AI provider
   const resultBuffer = await transformWithAI({
     prompt: scene.prompt,              // Direct from scene (no template)
     inputImageUrl: inputUrl,
     referenceImageUrl: referenceUrl,
     brandColor: event.brandColor,
   });

   // Upload result and mark session as ready
   const resultImagePath = await uploadResultImage(eventId, sessionId, resultBuffer);
   await updateSessionState(eventId, sessionId, "ready", { resultImagePath });

   return { success: true, resultImagePath };
   ```

**State Transitions**:
- `captured` → `transforming` → `ready` (success)
- `captured` → `transforming` → `error` (failure)

**Retry Logic**:
- Max 3 attempts for transient failures
- Exponential backoff (2s, 4s, 8s)
- No retry for timeout or validation errors

**Timeout**:
- 60 seconds max (existing behavior)
- Passthrough typically completes in < 5 seconds

**Example Usage**:
```typescript
// Guest flow: After photo capture
const result = await triggerTransformAction(eventId, sessionId);

if (result.success) {
  // Show result image
  const resultUrl = await getSignedUrl(result.resultImagePath);
  showResult(resultUrl);
} else {
  // Show error message
  showError(result.error);
}
```

**Errors**:
- `404`: Session or scene not found
- `400`: No input image for session
- `500`: AI transformation failed
- `504`: Transformation timeout (> 60s)

---

## AI Provider Interface

### `AIClient.generateImage(params: TransformParams)`

Interface for AI transformation providers (Google AI, n8n, mock).

**File**: `web/src/lib/ai/client.ts`

**Input**:
```typescript
interface TransformParams {
  prompt: string;                 // Direct from scene.prompt (no template expansion)
  inputImageUrl: string;          // Signed URL to input image
  referenceImageUrl?: string;     // Optional signed URL to reference image
  brandColor?: string;            // Optional hex color (e.g., "#FF5733")
}
```

**Output**:
```typescript
Promise<Buffer>                   // Transformed image bytes (JPEG)
```

**Provider Implementations**:

#### Google AI Provider
```typescript
// web/src/lib/ai/providers/google-ai.ts
async generateImage(params: TransformParams): Promise<Buffer> {
  const response = await genAI.models.generateContent({
    prompt: params.prompt,        // Use prompt directly
    imageUrl: params.inputImageUrl,
    styleImageUrl: params.referenceImageUrl,
  });

  return response.imageBuffer;
}
```

#### n8n Webhook Provider
```typescript
// web/src/lib/ai/providers/n8n-webhook.ts
async generateImage(params: TransformParams): Promise<Buffer> {
  const response = await fetch(this.webhookUrl, {
    method: "POST",
    body: JSON.stringify({
      prompt: params.prompt,      // Use prompt directly
      inputImageUrl: params.inputImageUrl,
      referenceImageUrl: params.referenceImageUrl,
      brandColor: params.brandColor,
    }),
  });

  return Buffer.from(await response.arrayBuffer());
}
```

#### Mock Provider
```typescript
// web/src/lib/ai/providers/mock.ts
async generateImage(params: TransformParams): Promise<Buffer> {
  console.log("[Mock AI]", params.prompt);

  // Return placeholder image
  return generatePlaceholderImage();
}
```

**Removed**: `buildPromptForEffect` function (no template expansion)

---

## Storage Operations

### `copyImageToResult(inputPath: string, resultPath: string)`

Copy input image to result location for passthrough mode.

**File**: `web/src/lib/storage/upload.ts` (NEW FUNCTION)

**Input**:
```typescript
interface CopyImageInput {
  inputPath: string;              // e.g., "events/evt_123/sessions/sess_456/input.jpg"
  resultPath: string;             // e.g., "events/evt_123/sessions/sess_456/result.jpg"
}
```

**Output**:
```typescript
Promise<string>                   // Result image path
```

**Implementation**:
```typescript
import { ref, getBytes, uploadBytes } from "firebase/storage";

export async function copyImageToResult(
  inputPath: string,
  resultPath: string
): Promise<string> {
  const storage = getStorage();
  const inputRef = ref(storage, inputPath);
  const resultRef = ref(storage, resultPath);

  // Copy image bytes
  const bytes = await getBytes(inputRef);
  await uploadBytes(resultRef, bytes);

  return resultPath;
}
```

**Performance**: Typically completes in < 5 seconds (success criteria SC-003)

---

## Validation Schemas

### Scene Validation

**File**: `web/src/lib/schemas/firestore.ts`

```typescript
import { z } from "zod";

export const SceneSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(100),
  mode: z.enum(["photo", "video", "gif", "boomerang"]),

  prompt: z.string()
    .max(600, "Prompt must be 600 characters or less")
    .nullable(),

  referenceImagePath: z.string().optional(),

  flags: z.object({
    customTextTool: z.boolean(),
    stickersTool: z.boolean(),
  }),

  status: z.enum(["active", "deprecated"]),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

// Partial schema for updates
export const UpdateSceneSchema = SceneSchema.partial().omit({
  id: true,
  createdAt: true,
});
```

### Reference Image Validation

```typescript
export const ReferenceImageSchema = z.object({
  file: z.instanceof(File)
    .refine(
      file => file.size <= 10 * 1024 * 1024,
      "File must be less than 10MB"
    )
    .refine(
      file => ["image/png", "image/jpeg", "image/webp"].includes(file.type),
      "File must be PNG, JPEG, or WebP"
    ),
});
```

---

## Error Handling

### Validation Errors

```typescript
try {
  const validated = SceneSchema.parse(input);
} catch (error) {
  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: error.errors.map(e => e.message).join(", "),
    };
  }
}
```

### AI Transformation Errors

```typescript
try {
  const resultBuffer = await aiClient.generateImage(params);
} catch (error) {
  // Mark session as error
  await updateSessionState(eventId, sessionId, "error", {
    error: error.message,
  });

  throw error;
}
```

---

## Revalidation

**Next.js Cache Revalidation**:

```typescript
import { revalidatePath } from "next/cache";

// After scene update
await updateScene(eventId, sceneId, data);
revalidatePath(`/events/${eventId}/scene`);

// After session transform
await triggerTransformAction(eventId, sessionId);
revalidatePath(`/join/${eventId}`);
```

---

## Summary of Changes

| Action | Change Type | Description |
|--------|-------------|-------------|
| `createScene` | Updated | Remove `effect` parameter, add `prompt` validation |
| `updateScene` | Updated | Remove `effect` parameter, add `prompt` validation |
| `triggerTransformAction` | Updated | Add passthrough mode logic (empty prompt) |
| `AIClient.generateImage` | Updated | Remove `effect` parameter, use `prompt` directly |
| `copyImageToResult` | New | Storage copy function for passthrough mode |

All contracts maintain backwards compatibility for existing sessions. New scenes created after this feature will not have `effect` or `defaultPrompt` fields.
