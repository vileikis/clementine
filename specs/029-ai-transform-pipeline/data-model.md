# Data Model: AI Transform Pipeline

**Phase 1 Output** | **Generated**: 2025-12-18

## Overview

This document defines the data entities and schemas for AI transformation in the media processing pipeline. The feature extends existing schemas and introduces new AI-specific types.

## Entities

### 1. ProcessMediaRequest (Extended)

**Purpose**: HTTP request payload for processMedia Cloud Function endpoint

**Location**: `functions/src/lib/schemas/media-pipeline.schema.ts`

**Schema** (Zod):
```typescript
export const processMediaRequestSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  outputFormat: z.enum(['image', 'gif', 'video']),
  aspectRatio: z.enum(['square', 'story']),
  overlay: z.boolean().optional().default(false),
  aiTransform: z.boolean().optional().default(false), // NEW FIELD
});

export type ProcessMediaRequest = z.infer<typeof processMediaRequestSchema>;
```

**Fields**:
- `sessionId` (string, required) - Session document ID in Firestore
- `outputFormat` (enum, required) - Desired output format: 'image', 'gif', 'video'
- `aspectRatio` (enum, required) - Output dimensions: 'square' (1:1), 'story' (9:16)
- `overlay` (boolean, optional, default: false) - Apply overlay frame to output
- `aiTransform` (boolean, optional, default: false) - **NEW**: Apply AI transformation before processing

**Validation Rules**:
- `sessionId` must be non-empty string
- `aiTransform` is optional and defaults to false if omitted
- All other validations remain unchanged

**Relationships**:
- References session document in Firestore `/sessions/{sessionId}`
- Passed to processMediaJob Cloud Task handler

---

### 2. PipelineOptions (Extended)

**Purpose**: Internal pipeline configuration passed to processing functions

**Location**: `functions/src/lib/schemas/media-pipeline.schema.ts`

**Schema** (Zod):
```typescript
export const pipelineOptionsSchema = z.object({
  aspectRatio: z.enum(['square', 'story']),
  overlay: z.boolean().optional().default(false),
  aiTransform: z.boolean().optional().default(false), // NEW FIELD
});

export type PipelineOptions = z.infer<typeof pipelineOptionsSchema>;
```

**Fields**:
- `aspectRatio` (enum, required) - Output dimensions
- `overlay` (boolean, optional, default: false) - Apply overlay
- `aiTransform` (boolean, optional, default: false) - **NEW**: Apply AI transformation

**Usage**:
- Created in `processMediaJob.ts` from request payload
- Passed to `processSingleImage()`, `processGIF()`, etc.

---

### 3. ProcessingState (Extended)

**Purpose**: Session document processing state enum

**Location**: `@clementine/shared` package (imported by functions)

**Current Values**: `'pending' | 'initializing' | 'downloading' | 'processing' | 'uploading' | 'completed' | 'failed'`

**New Value**: Add `'ai-transform'` to the union

**Schema** (TypeScript):
```typescript
export type ProcessingState =
  | 'pending'
  | 'initializing'
  | 'downloading'
  | 'ai-transform'    // NEW STATE
  | 'processing'
  | 'uploading'
  | 'completed'
  | 'failed';
```

**State Transition Flow** (single image with AI transform):
```
pending → initializing → downloading → ai-transform → processing → uploading → completed
                                                                            ↓
                                                                         failed
```

**State Transition Flow** (single image without AI transform):
```
pending → initializing → downloading → processing → uploading → completed
                                                              ↓
                                                           failed
```

---

### 4. AiTransformConfig (New)

**Purpose**: Configuration for AI image transformation

**Location**: `functions/src/services/ai/providers/types.ts`

**Schema** (TypeScript):
```typescript
export interface AiTransformConfig {
  provider: 'google';                // AI provider identifier
  model: string;                     // Model name (e.g., 'gemini-3-pro-image-preview')
  prompt: string;                    // Transformation prompt text
  referenceImages: string[];         // Firebase Storage paths (NOT URLs)
  temperature?: number;              // Optional: Model temperature (0-1)
  maxOutputTokens?: number;          // Optional: Max tokens for response
}
```

**Fields**:
- `provider` (string, required) - Currently only 'google' supported
- `model` (string, required) - Gemini model name
- `prompt` (string, required) - Transformation instructions for AI
- `referenceImages` (string[], required) - Array of Firebase Storage paths
- `temperature` (number, optional) - Controls randomness (0 = deterministic, 1 = creative)
- `maxOutputTokens` (number, optional) - Response length limit

**Validation Rules**:
- `referenceImages` must contain valid Storage paths matching pattern `media/{companyId}/ai-reference/{filename}`
- `model` must be supported Gemini model name
- `prompt` must be non-empty string

**Example** (Mocked Config):
```typescript
const MOCKED_AI_CONFIG: AiTransformConfig = {
  provider: 'google',
  model: 'gemini-3-pro-image-preview',
  prompt: 'Transform this person into a hobbit from Lord of the Rings. Apply fantasy costume, hairy feet, and whimsical background. Maintain facial features and pose.',
  referenceImages: [
    'media/company-test-001/ai-reference/hobbit-costume.jpg',
    'media/company-test-001/ai-reference/black-magic-wand.jpg'
  ],
  temperature: 0.7
};
```

---

### 5. AiProvider Interface (New)

**Purpose**: Contract for AI transformation service implementations

**Location**: `functions/src/services/ai/providers/types.ts`

**Schema** (TypeScript):
```typescript
export interface AiProvider {
  /**
   * Transform an image using AI
   *
   * @param inputBuffer - Input image as buffer (JPEG/PNG)
   * @param config - AI transformation configuration
   * @returns Transformed image as buffer (JPEG)
   * @throws {AiTransformError} If transformation fails
   */
  transformImage(
    inputBuffer: Buffer,
    config: AiTransformConfig
  ): Promise<Buffer>;
}
```

**Methods**:
- `transformImage` - Accepts input image buffer + config, returns transformed image buffer
  - Input format: JPEG or PNG
  - Output format: JPEG
  - Throws `AiTransformError` on failure

**Implementations**:
- `GoogleGeminiProvider` - Google Gemini-based transformation

---

### 6. AiTransformError (New)

**Purpose**: Typed error for AI transformation failures

**Location**: `functions/src/services/ai/providers/types.ts`

**Schema** (TypeScript):
```typescript
export class AiTransformError extends Error {
  constructor(
    message: string,
    public code: AiTransformErrorCode,
    public cause?: Error
  ) {
    super(message);
    this.name = 'AiTransformError';
  }
}

export type AiTransformErrorCode =
  | 'API_ERROR'                 // Gemini API failure
  | 'INVALID_CONFIG'            // Config validation failed
  | 'REFERENCE_IMAGE_NOT_FOUND' // Reference image missing
  | 'INVALID_INPUT_IMAGE'       // Input buffer corrupt/invalid
  | 'TIMEOUT';                  // Transformation exceeded timeout
```

**Fields**:
- `message` (string) - Human-readable error description
- `code` (AiTransformErrorCode) - Machine-readable error type
- `cause` (Error, optional) - Original error for debugging

**Usage**:
```typescript
throw new AiTransformError(
  'Failed to download reference image',
  'REFERENCE_IMAGE_NOT_FOUND',
  originalError
);
```

---

### 7. Session Document (No Schema Changes)

**Purpose**: Firestore session document

**Location**: `/sessions/{sessionId}` (Firestore collection)

**Relevant Fields**:
- `processing.state` (ProcessingState) - Updated to 'ai-transform' during AI transformation
- `processing.errorCode` (string) - Set to 'AI_TRANSFORM_FAILED', 'REFERENCE_IMAGE_NOT_FOUND', etc. on failure
- `processing.errorMessage` (string) - Set to error details on failure

**Note**: No schema changes to session document itself. Processing state is updated via existing `updateProcessingStep()` and `markSessionFailed()` functions.

---

## Relationships

```
ProcessMediaRequest
    ↓ (validated)
PipelineOptions
    ↓ (passed to)
processSingleImage() / processGIF()
    ↓ (if aiTransform: true)
AiTransformService
    ↓ (uses)
AiProvider (GoogleGeminiProvider)
    ↓ (loads)
AiTransformConfig + Reference Images
    ↓ (updates)
Session.processing.state = 'ai-transform'
```

## State Transitions

### Success Path (Single Image with AI Transform)
1. Request received: `aiTransform: true`, `outputFormat: 'image'`
2. Session state: `pending` → `initializing` → `downloading`
3. Download input image from Storage
4. Session state: `ai-transform`
5. Load reference images, call Gemini API, receive transformed image
6. Session state: `processing`
7. FFmpeg scale/crop (and overlay if requested)
8. Session state: `uploading`
9. Upload output to Storage
10. Session state: `completed`

### Skip Path (GIF/Video with AI Transform)
1. Request received: `aiTransform: true`, `outputFormat: 'gif'`
2. Log warning: "AI transform not supported for GIF format"
3. Continue with standard GIF pipeline (no AI transform applied)
4. Session state: `pending` → `initializing` → `downloading` → `processing` → `uploading` → `completed`

### Error Path (AI Transform Fails)
1. Request received: `aiTransform: true`, `outputFormat: 'image'`
2. Session state: `pending` → `initializing` → `downloading` → `ai-transform`
3. AI transformation fails (e.g., Gemini API error)
4. Catch error, mark session failed:
   - `processing.state` = `failed`
   - `processing.errorCode` = `AI_TRANSFORM_FAILED`
   - `processing.errorMessage` = error details
5. Re-throw error to Cloud Tasks (retry mechanism)

## Storage Paths

### Reference Images
- Pattern: `media/{companyId}/ai-reference/{filename}`
- Example: `media/company-test-001/ai-reference/hobbit-costume.jpg`
- Validation: Must exist before AI transformation begins

### Output Images (No Changes)
- Pattern: `media/{companyId}/outputs/{sessionId}/{timestamp}-{type}.{ext}`
- Example: `media/company-test-001/outputs/session-123/1703001234567-output.jpg`

## Validation Summary

| Entity | Validation Layer | Rules |
|--------|------------------|-------|
| ProcessMediaRequest | Zod schema | `aiTransform` optional boolean |
| PipelineOptions | Zod schema | `aiTransform` optional boolean |
| AiTransformConfig | Runtime checks | referenceImages paths valid, model supported |
| Reference Images | Storage existence | File must exist at path before AI call |
| Input Image Buffer | Buffer validation | Non-empty buffer, valid image format |

## Migration Notes

**Breaking Changes**: None. All changes are additive.

**Backward Compatibility**:
- Existing requests without `aiTransform` field work unchanged (defaults to false)
- Existing pipeline functions continue to work (AI transform is opt-in)
- Session schema unchanged (only processing state values extended)

**Database Migrations**: None required (additive changes only)
