# Contract: AI Video Pipeline

**Feature Branch**: `074-ai-video-backend`
**Date**: 2026-02-20

## Overview

This feature is entirely backend (Cloud Functions). There are no new API endpoints or callable functions. The changes hook into the existing transform pipeline through:
1. The `startTransformPipeline` callable (already exists — add `ai.video` support)
2. The outcome dispatcher registry (already exists — register `aiVideoOutcome`)
3. The `transformPipelineTask` Cloud Task handler (already exists — extend for progress)

---

## Contract 1: `startTransformPipeline` (Existing Callable — Extended)

### Change: Accept `ai.video` outcome type

**Before**: `IMPLEMENTED_OUTCOME_TYPES = Set(['photo', 'ai.image'])`
**After**: `IMPLEMENTED_OUTCOME_TYPES = Set(['photo', 'ai.image', 'ai.video'])`

**Additional validation for `ai.video`**:
- `outcome.aiVideo` must be non-null (same pattern as `ai.image` → `outcome.aiImage`)
- `getOutcomeAspectRatio` extended to read `outcome.aiVideo.aspectRatio`

**No change to request/response schema** — clients already send `outcome.type: 'ai.video'` from Phase 2 editor.

---

## Contract 2: Outcome Dispatcher Registry (Internal)

### Change: Register `aiVideoOutcome` executor

**Before**: `'ai.video': null`
**After**: `'ai.video': aiVideoOutcome`

**Executor signature** (unchanged interface):
```
aiVideoOutcome(ctx: OutcomeContext) => Promise<JobOutput>
```

---

## Contract 3: `aiGenerateVideo` Operation (New)

### Input

```
GenerateVideoRequest {
  prompt: string              // Video generation prompt (non-empty)
  model: AIVideoModel         // Veo model identifier
  aspectRatio: VideoAspectRatio
  duration: 4 | 6 | 8        // Seconds
  startFrame: string          // Absolute path to local image file
  endFrame?: string           // Absolute path to local image file (optional)
}
```

### Output

```
GeneratedVideo {
  outputPath: string          // Absolute path to generated .mp4 in tmpDir
  mimeType: 'video/mp4'
  sizeBytes: number
  duration: number            // Actual duration
  dimensions: { width: number, height: number }
}
```

### Error conditions

| Condition | Behavior |
|-----------|----------|
| Veo API returns error | Throw with error message |
| RAI filtering removes all videos | Throw `"Video was filtered by safety policy"` |
| Polling timeout (> 5 min) | Throw `"Video generation timed out"` |
| Empty `generatedVideos` array | Throw `"No video generated"` |

---

## Contract 4: `uploadOutput` (Existing — Extended)

### Change: Accept optional format, dimensions, extension

**Before**:
```
uploadOutput({ outputPath, projectId, sessionId, tmpDir })
```

**After**:
```
uploadOutput({ outputPath, projectId, sessionId, tmpDir, format?, dimensions?, extension? })
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| format | `'image' \| 'video'` | `'image'` | Output format in JobOutput |
| dimensions | `{ width, height }` | `{ 1024, 1024 }` | Actual dimensions |
| extension | `string` | `'jpg'` | File extension for storage path |

Existing callers are unaffected (all params optional with defaults).

---

## Contract 5: `OutcomeContext` (Existing — Extended)

### Change: Add optional `reportProgress` callback

```
OutcomeContext {
  job: Job
  snapshot: JobSnapshot
  startTime: number
  tmpDir: string
  reportProgress?: (progress: JobProgress) => Promise<void>  // NEW
}
```

The callback is created by `transformPipelineTask` and calls `updateJobProgress` internally. Existing executors (photo, aiImage) ignore it.

---

## Unchanged Contracts

- **Job creation request/response**: No schema changes
- **Job Firestore document**: No schema changes (already supports `format: 'video'`)
- **Client polling**: Guests poll job status the same way (no client changes needed)
- **Session result media**: Updated by `finalizeJobSuccess` as before
