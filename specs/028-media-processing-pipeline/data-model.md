# Data Model: Media Processing Pipeline

**Feature**: Media Processing Pipeline (Stage 1)
**Date**: 2025-12-16

## Overview

This document defines the data model for the media processing pipeline, including Firestore document schemas, type definitions, and data flow patterns.

## Firestore Schema

### Session Document (Modified)

**Collection Path**: `/sessions/{sessionId}`

The Session document is extended with processing-related fields:

```typescript
interface Session {
  // Existing session fields (out of scope for this spec)
  id: string;
  projectId: string;
  eventId: string;
  companyId: string;
  inputAssets: InputAsset[];
  createdAt: Timestamp;

  // New fields for media processing
  processing?: ProcessingState;  // Temporary field, deleted on completion
  outputs?: SessionOutputs;       // Final processed media, persisted
}
```

### ProcessingState (Temporary Field)

Stored in `session.processing` field during active processing, deleted on completion:

```typescript
interface ProcessingState {
  state: 'pending' | 'running' | 'failed';
  currentStep?: string;           // e.g., "downloading", "processing", "uploading"
  startedAt: Timestamp;
  updatedAt: Timestamp;
  attemptNumber: number;          // Current retry attempt (1-3)
  taskId?: string;                // Cloud Task ID for tracking
  error?: {
    code: string;                 // e.g., "DOWNLOAD_FAILED", "FFMPEG_ERROR"
    message: string;
    timestamp: Timestamp;
  };
}
```

**Rationale**: Processing state is temporary and should not pollute the main session document. It's deleted upon completion (success or final failure) to keep session data clean.

### SessionOutputs (Persistent Field)

Stored in `session.outputs` field after successful processing:

```typescript
interface SessionOutputs {
  primaryUrl: string;             // Full public URL to main output (image/gif/video)
  thumbnailUrl: string;           // Full public URL to thumbnail (300px wide JPEG)
  format: 'image' | 'gif' | 'video';
  dimensions: {
    width: number;                // e.g., 1080
    height: number;               // e.g., 1080 or 1920
  };
  sizeBytes: number;              // File size of primary output
  completedAt: Timestamp;
  processingTimeMs: number;       // Total processing duration
}
```

**Rationale**: Outputs are permanent and represent the final deliverable. Full public URLs enable instant rendering without additional auth or API calls.

## Type Definitions

### InputAsset

Represents a single uploaded photo in the session:

```typescript
interface InputAsset {
  url: string;                    // Storage URL: projects/{projectId}/inputs/{filename}
  filename: string;
  mimeType: string;               // e.g., "image/jpeg", "image/png"
  sizeBytes: number;
  uploadedAt: Timestamp;
}
```

**Source**: Existing session schema (already implemented in sessions feature)

### PipelineConfig

Configuration derived from API request parameters:

```typescript
interface PipelineConfig {
  outputFormat: 'image' | 'gif' | 'video';
  aspectRatio: 'square' | 'story';
  outputWidth: number;            // 1080 for both square and story
  outputHeight: number;           // 1080 for square, 1920 for story
  frameDuration: number;          // 0.5 for GIF (seconds per frame)
  fps: number;                    // 5 for video (frames per second)
}
```

**Rationale**: Config is derived at runtime from request params. Hardcoded values for Stage 1 (future stages may support custom dimensions/timing).

### ProcessMediaRequest

API request body validated with Zod:

```typescript
interface ProcessMediaRequest {
  sessionId: string;
  outputFormat: 'image' | 'gif' | 'video';
  aspectRatio: 'square' | 'story';
}
```

**Validation Rules**:
- `sessionId`: Required, non-empty string, must exist in Firestore
- `outputFormat`: Required, one of: "image", "gif", "video"
- `aspectRatio`: Required, one of: "square", "story"

## Data Flow

### 1. Queue Processing (HTTP Endpoint)

```
Client Request (POST /processMedia)
  ↓
Validate request body (Zod)
  ↓
Fetch session from Firestore
  ↓
Check if already processing (session.processing.state === 'running')
  ↓
Mark session as pending (session.processing = {state: 'pending', ...})
  ↓
Queue Cloud Task with payload {sessionId, outputFormat, aspectRatio}
  ↓
Return 200 OK with {taskId, message}
```

### 2. Execute Processing (Cloud Task Handler)

```
Cloud Task triggered
  ↓
Extract payload {sessionId, outputFormat, aspectRatio}
  ↓
Fetch session from Firestore
  ↓
Mark session as running (session.processing.state = 'running')
  ↓
Download inputAssets to /tmp
  ↓
Determine output type (single image vs GIF vs video)
  ↓
Execute FFmpeg processing (scale, crop, pad, encode)
  ↓
Generate thumbnail from first frame
  ↓
Upload output and thumbnail to Storage
  ↓
Update session with outputs {primaryUrl, thumbnailUrl, format, dimensions, ...}
  ↓
Delete session.processing field (cleanup temp state)
  ↓
Delete /tmp files
```

### 3. Error Handling

```
Error occurs during processing
  ↓
Log error with sessionId and context
  ↓
Update session.processing with error details
  ↓
If attemptNumber < 3:
  Cloud Tasks retries automatically (30s min backoff)
Else:
  Mark session.processing.state = 'failed' (permanent failure)
  ↓
Delete /tmp files (cleanup)
```

## Storage Paths

### Input Assets (Existing)

```
projects/{projectId}/inputs/{timestamp}-{filename}
```

Example: `projects/proj-abc123/inputs/1702745600000-photo1.jpg`

### Output Results (New)

```
projects/{projectId}/results/{sessionId}-output.{ext}
projects/{projectId}/results/{sessionId}-thumb.jpg
```

Examples:
- `projects/proj-abc123/results/sess-xyz789-output.jpg` (single image)
- `projects/proj-abc123/results/sess-xyz789-output.gif` (GIF)
- `projects/proj-abc123/results/sess-xyz789-output.mp4` (video)
- `projects/proj-abc123/results/sess-xyz789-thumb.jpg` (thumbnail)

**Rationale**: Session ID in filename ensures uniqueness and easy debugging. Extension reflects output format.

## Validation Rules

### Request Validation (Zod Schema)

```typescript
import { z } from 'zod';

export const processMediaRequestSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  outputFormat: z.enum(['image', 'gif', 'video']),
  aspectRatio: z.enum(['square', 'story']),
});

export type ProcessMediaRequest = z.infer<typeof processMediaRequestSchema>;
```

### Business Logic Validation

1. **Session Existence**: sessionId must exist in Firestore before processing
2. **Processing State**: session must NOT be in "running" state (prevent duplicates)
3. **Input Assets**: session.inputAssets must contain at least 1 item
4. **File Access**: All inputAssets URLs must be accessible from Cloud Functions

## State Transitions

```
[No processing state]
  ↓ (POST /processMedia)
pending
  ↓ (Cloud Task starts)
running
  ↓ (Processing completes)
[No processing state] + outputs populated

OR

running
  ↓ (Error occurs, retry available)
pending (attemptNumber++)
  ↓ (Cloud Task retries)
running

OR

running
  ↓ (Error occurs, no retries left)
failed (permanent)
```

## Performance Considerations

1. **Firestore Reads**: 2 reads per processing job (initial fetch + task handler fetch)
2. **Firestore Writes**: 4-5 writes per job (pending state, running state, progress updates, final outputs, cleanup)
3. **Storage Downloads**: N downloads (1 per input asset)
4. **Storage Uploads**: 2 uploads (output + thumbnail)
5. **Temp Storage**: Max ~200MB in /tmp for 4x 50MB input images

## Future Extensions (Out of Scope for Stage 1)

- AI transformation outputs (Stage 2+): Additional fields in SessionOutputs for AI-processed versions
- Background removal (Stage 2+): Separate URL field for background-removed version
- Overlay application (Stage 2+): Overlay config in PipelineConfig
- Custom dimensions: Allow arbitrary width/height beyond square/story presets
- Progress updates: Real-time progress percentage in ProcessingState
- Batch processing: Process multiple sessions in one task
