# Data Model: Monorepo Foundation

**Feature**: 027-monorepo-foundation
**Date**: 2025-12-15

## Overview

This feature establishes shared Zod schemas and derived TypeScript types for the media processing pipeline. These schemas will be used by both the web application and Firebase functions to ensure type consistency and runtime validation across the monorepo.

**Pattern**: Zod schemas are the single source of truth. Types are derived using `z.infer<>`.

## Schema Definitions

### InputAsset

Represents a single input file (image or video) submitted by a guest for processing.

```typescript
import { z } from "zod"

export const inputAssetSchema = z.object({
  url: z.string().url(),                      // Firebase Storage public URL
  type: z.enum(["image", "video"]),
})

export type InputAsset = z.infer<typeof inputAssetSchema>
```

**Validation Rules**:
- `url`: Must be a valid URL (HTTPS enforced at application level)
- `type`: Must be either "image" or "video"

**Note**: Array position determines order - no explicit `order` field needed.

---

### ProcessingError

Captures error details when media processing fails.

```typescript
export const processingErrorSchema = z.object({
  message: z.string().min(1),                 // Human-readable error description
  code: z.string().min(1),                    // Machine-readable error code
  step: z.string().min(1),                    // Processing step where error occurred
  isRetryable: z.boolean(),                   // Whether the operation can be retried
  timestamp: z.number().int().positive(),     // Unix timestamp (ms)
})

export type ProcessingError = z.infer<typeof processingErrorSchema>
```

**Error Codes** (planned):
- `UPLOAD_FAILED` - File upload to storage failed
- `TRANSFORM_FAILED` - AI transformation failed
- `TIMEOUT` - Processing exceeded time limit
- `INVALID_INPUT` - Input file is corrupted or unsupported

---

### ProcessingState

Tracks the current state of media processing for a session.

```typescript
export const processingStateSchema = z.object({
  state: z.enum(["pending", "running", "completed", "failed"]),
  currentStep: z.string().min(1),             // Current processing step name
  startedAt: z.number().int().positive(),     // Unix timestamp (ms)
  updatedAt: z.number().int().positive(),     // Unix timestamp (ms)
  attemptNumber: z.number().int().min(1),     // Current attempt (1-indexed)
  taskId: z.string().min(1),                  // External task ID (e.g., n8n workflow ID)
  error: processingErrorSchema.optional(),    // Present only when state is "failed"
})

export type ProcessingState = z.infer<typeof processingStateSchema>
```

**State Transitions**:
```
pending → running → completed
              ↓
           failed
```

---

### SessionOutputs

Represents the final processed media output from a completed session.

```typescript
export const sessionOutputsSchema = z.object({
  primaryUrl: z.string().url(),               // Main output file URL
  thumbnailUrl: z.string().url(),             // Thumbnail/preview URL
  format: z.enum(["gif", "mp4", "webm", "image"]),
  dimensions: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  sizeBytes: z.number().int().positive(),     // File size in bytes
  completedAt: z.number().int().positive(),   // Unix timestamp (ms)
  processingTimeMs: z.number().int().nonnegative(), // Total processing duration
})

export type SessionOutputs = z.infer<typeof sessionOutputsSchema>
```

---

### Session (Processing Extension)

Extension fields for the existing Session schema to support media processing pipeline.

```typescript
/**
 * Processing-specific fields to extend the base Session from guest.schemas.ts
 * These fields are added when a session enters the processing pipeline.
 */
export const sessionProcessingSchema = z.object({
  inputAssets: z.array(inputAssetSchema).min(1),
  processing: processingStateSchema.optional(),
  outputs: sessionOutputsSchema.optional(),
})

export type SessionProcessing = z.infer<typeof sessionProcessingSchema>
```

**Integration with existing Session**:
- Base `Session` schema exists in `web/src/features/guest/schemas/guest.schemas.ts`
- Processing fields extend the base session when media processing begins
- Both web and functions import from `@clementine/shared`

**Validation Rules**:
- `inputAssets`: Must have at least 1 asset
- `processing`: Present when session has started processing
- `outputs`: Present only when `processing.state` is "completed"

## Package Structure

```typescript
// packages/shared/src/schemas/index.ts
export {
  inputAssetSchema,
  type InputAsset,
  processingErrorSchema,
  type ProcessingError,
  processingStateSchema,
  type ProcessingState,
  sessionOutputsSchema,
  type SessionOutputs,
  sessionProcessingSchema,
  type SessionProcessing,
} from "./session.schemas"
```

## Entity Relationship Diagram

```
┌─────────────────────┐
│   Session (base)    │  ← from guest.schemas.ts
├─────────────────────┤
│ id                  │
│ projectId           │───────────► Project (existing)
│ guestId             │───────────► Guest (existing)
│ eventId             │───────────► Event (existing)
│ experienceId        │───────────► Experience (existing)
│ state               │
│ currentStepIndex    │
│ data                │
│ createdAt           │
│ updatedAt           │
└─────────┬───────────┘
          │
          │ extended by (processing pipeline)
          ▼
┌─────────────────────┐
│ SessionProcessing   │  ← from @clementine/shared
├─────────────────────┤
│ inputAssets[]       │
│ processing?         │
│ outputs?            │
└─────────┬───────────┘
          │
          │ contains
          ▼
┌─────────────────┐
│ InputAsset[]    │
├─────────────────┤
│ url             │
│ type            │
└─────────────────┘

┌─────────────────┐
│ ProcessingState?│
├─────────────────┤
│ state           │
│ currentStep     │
│ startedAt       │
│ updatedAt       │
│ attemptNumber   │
│ taskId          │
│ error?          │────────► ProcessingError
└─────────────────┘

┌─────────────────┐
│ SessionOutputs? │
├─────────────────┤
│ primaryUrl      │
│ thumbnailUrl    │
│ format          │
│ dimensions      │
│ sizeBytes       │
│ completedAt     │
│ processingTimeMs│
└─────────────────┘
```

## Notes

- **Zod is the source of truth**: All types are derived from Zod schemas using `z.infer<>`
- **Timestamps as numbers**: Using Unix timestamps (ms) for Firestore compatibility
- **Extends existing Session**: Processing fields extend the base session schema from guest feature
- **Shared across monorepo**: Both web and functions import schemas from `@clementine/shared`
