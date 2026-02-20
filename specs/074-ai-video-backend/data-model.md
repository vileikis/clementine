# Data Model: AI Video Backend

**Feature Branch**: `074-ai-video-backend`
**Date**: 2026-02-20

## Schema Changes

### 1. `videoAspectRatioSchema` (Update)

**Location**: `packages/shared/src/schemas/experience/outcome.schema.ts`

**Current**:
```
'9:16' | '1:1'
```

**Updated**:
```
'16:9' | '9:16'
```

**Rationale**: Veo only supports `16:9` and `9:16`. Replace `1:1` (unsupported) with `16:9` (landscape). No existing production configs use this schema yet.

---

### 2. `videoGenerationConfigSchema` — Duration Field (Update)

**Location**: `packages/shared/src/schemas/experience/outcome.schema.ts`

**Current**:
```
duration: z.number().min(1).max(60).default(5)
```

**Updated**:
```
duration: z.enum([4, 6, 8]).default(8)
```

Or if keeping as number:
```
duration: z.union([z.literal(4), z.literal(6), z.literal(8)]).default(8)
```

**Rationale**: Veo 3.1 models only accept 4, 6, or 8 second durations. Default changed from 5 (invalid) to 8 (Veo default).

---

### 3. `OutcomeContext` Type (Extension)

**Location**: `functions/src/services/transform/types.ts`

**Current fields**: `job`, `snapshot`, `startTime`, `tmpDir`

**Added field**:
```
reportProgress?: (progress: JobProgress) => Promise<void>
```

**Rationale**: Video jobs have multi-stage progress. Optional callback preserves backward compatibility — existing executors ignore it.

---

### 4. `uploadOutput` Parameters (Extension)

**Location**: `functions/src/services/transform/operations/uploadOutput.ts`

**Added optional params to `UploadOutputParams`**:
```
format?: 'image' | 'video'        // default: 'image'
dimensions?: { width: number; height: number }  // default: { 1024, 1024 }
extension?: string                 // default: 'jpg'
```

**Rationale**: Allow video output to specify `format: 'video'`, actual dimensions from ffprobe, and `'mp4'` extension without breaking existing callers.

---

## Existing Entities (No Changes Needed)

### `AIVideoOutcomeConfig`
Already defined in shared package. Fields: `task`, `captureStepId`, `aspectRatio`, `startFrameImageGen`, `endFrameImageGen`, `videoGeneration`. No changes required.

### `JobOutput`
Already supports `format: 'video'` in the schema (`z.enum(['image', 'gif', 'video'])`). No changes required.

### `JobProgress`
Already defined: `{ currentStep: string, percentage: number, message: string | null }`. No changes required.

### `JobError`
Already supports all needed error codes (`INVALID_INPUT`, `PROCESSING_FAILED`, `AI_MODEL_ERROR`). No changes required.

---

## New Entities

### `GenerateVideoRequest` (Internal Type)

Input to the `aiGenerateVideo` operation:

```
{
  prompt: string              // Video generation prompt
  model: AIVideoModel         // 'veo-3.1-generate-001' | 'veo-3.1-fast-generate-001'
  aspectRatio: VideoAspectRatio  // '16:9' | '9:16'
  duration: 4 | 6 | 8        // Duration in seconds
  startFrame: string          // Local file path to start frame image
  endFrame?: string           // Optional local file path to end frame image
}
```

### `GeneratedVideo` (Internal Type)

Output from the `aiGenerateVideo` operation:

```
{
  outputPath: string          // Local file path to generated video
  mimeType: string            // 'video/mp4'
  sizeBytes: number           // File size in bytes
  duration: number            // Actual duration in seconds
  dimensions: { width: number; height: number }  // From ffprobe
}
```

---

## State Transitions

### AI Video Job Lifecycle

```
pending → running → completed
                  → failed
```

Same as existing job lifecycle. No new states needed.

### Progress Stages (by task)

**animate**:
```
Starting (10%) → Generating video (20-80%) → Uploading (80-90%) → Finalizing (90-100%)
```

**transform**:
```
Starting (10%) → Generating end frame (20-40%) → Generating video (40-80%) → Uploading (80-90%) → Finalizing (90-100%)
```

**reimagine**:
```
Starting (10%) → Generating frames (20-40%) → Generating video (40-80%) → Uploading (80-90%) → Finalizing (90-100%)
```
