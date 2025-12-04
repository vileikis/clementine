# Data Model: AI Transform Step Playground

**Feature**: 019-ai-transform-playground
**Date**: 2024-12-04

## Overview

This feature does not introduce new persistent data models. It operates on existing entities and uses ephemeral data during the test workflow.

## Existing Entities Used

### Step (ai-transform type)

**Collection**: `/experiences/{experienceId}/steps/{stepId}`

The server action reads step configuration from Firestore. Only steps with `type: 'ai-transform'` are valid for playground testing.

```typescript
interface StepAiTransform {
  id: string;
  experienceId: string;
  type: 'ai-transform';
  title: string | null;
  description: string | null;
  mediaUrl: string | null;
  mediaType: 'image' | 'gif' | 'video' | 'lottie' | null;
  ctaLabel: string | null;
  config: AiTransformConfig;
  createdAt: number;
  updatedAt: number;
}

interface AiTransformConfig {
  model: string | null;           // AI model identifier
  prompt: string | null;          // Transformation prompt (max 1000 chars)
  variables: AiTransformVariable[]; // Variable mappings (IGNORED in playground)
  outputType: 'image' | 'video' | 'gif'; // Output format (IGNORED in playground)
  aspectRatio: string;            // Output aspect ratio (e.g., '1:1', '16:9')
  referenceImageUrls: string[];   // Reference images for style (max 5)
}
```

**Fields Used by Playground**:
- `config.model` → AI model selection
- `config.prompt` → Transformation instructions
- `config.aspectRatio` → Output dimensions
- `config.referenceImageUrls` → Style reference images

**Fields Ignored by Playground**:
- `config.variables` → No variable substitution in test mode
- `config.outputType` → Always produces static image

## Ephemeral Data

### Test Image (Input)

Temporary image uploaded by user for testing. Not persisted to any database.

**Storage**: Firebase Storage `playground-temp/input-{timestamp}.{ext}`

**Lifecycle**:
1. User uploads image in browser
2. Converted to base64 data URL client-side
3. Sent to server action
4. Uploaded to temp storage with signed URL (15-min expiry)
5. Passed to AI client
6. Auto-cleaned by storage lifecycle rules

**Validation**:
- File types: JPEG, PNG, WebP only
- Max size: 10MB
- Format: base64 data URL (`data:image/{type};base64,...`)

### Generated Result (Output)

AI-generated transformed image. Returned to client but not persisted.

**Format**: base64 data URL (`data:image/jpeg;base64,...`)

**Lifecycle**:
1. AI client returns Buffer
2. Server action converts to base64
3. Returned to client in response
4. Displayed in browser
5. Discarded when dialog closes or page navigates

## Zod Schemas

### Input Schema

```typescript
// Location: web/src/features/steps/schemas/step-playground.schemas.ts

const stepPlaygroundInputSchema = z.object({
  stepId: z.string().min(1, 'Step ID is required'),
  testImageBase64: z
    .string()
    .min(1, 'Test image is required')
    .refine(
      (val) => val.startsWith('data:image/'),
      'Test image must be a valid image data URL'
    ),
});

type StepPlaygroundInput = z.infer<typeof stepPlaygroundInputSchema>;
```

### Output Schema

```typescript
const stepPlaygroundOutputSchema = z.object({
  resultImageBase64: z.string(),
  generationTimeMs: z.number().optional(),
});

type StepPlaygroundOutput = z.infer<typeof stepPlaygroundOutputSchema>;
```

## State Machine

The playground UI uses a local state machine (not persisted):

```
┌─────────┐  upload   ┌─────────┐  generate  ┌────────────┐
│  idle   │ ────────> │  ready  │ ─────────> │ generating │
└─────────┘           └─────────┘            └────────────┘
     ▲                     ▲                       │
     │                     │                       │
     │ clear               │ retry                 │ success/error
     │                     │                       ▼
     │                     │                ┌────────────┐
     └─────────────────────┴─────────────── │  result    │
                                            │  /error    │
                                            └────────────┘
```

**States**:
- `idle` - Initial state, waiting for image upload
- `ready` - Image uploaded, waiting for generate click
- `generating` - AI processing in progress
- `result` - Generation successful, showing result
- `error` - Generation failed, showing error with retry option

## No Schema Migrations

This feature requires no database schema changes:
- Reads existing step documents (no writes)
- All test data is ephemeral
- No new collections or fields introduced
