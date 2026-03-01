# Contract: Veo API Parameter Extension

**Feature**: 086-video-advanced-controls
**Date**: 2026-02-28

## Overview

This contract defines how the four new advanced control values flow from the frontend schema through to the Veo API `GenerateVideosConfig`. There are no new API endpoints — this feature extends the existing video generation pipeline by adding parameters to the `buildVeoParams` function.

## Schema Contract

### VideoGenerationConfig (Shared Package)

```typescript
// packages/shared/src/schemas/experience/experience-config.schema.ts

export const videoResolutionSchema = z.enum(['720p', '1080p', '4k'])
export type VideoResolution = z.infer<typeof videoResolutionSchema>

export const videoGenerationConfigSchema = z.object({
  // Existing fields (unchanged)
  prompt: z.string().default(''),
  model: aiVideoModelSchema.default('veo-3.1-fast-generate-001'),
  duration: videoDurationSchema.default(6),
  aspectRatio: videoAspectRatioSchema.nullable().default(null),
  refMedia: z.array(mediaReferenceSchema).default([]),
  // New fields
  resolution: videoResolutionSchema.default('1080p'),
  negativePrompt: z.string().max(500).default(''),
  sound: z.boolean().default(false),
  enhance: z.boolean().default(false),
})
```

### GenerateVideoRequest (Backend)

```typescript
// functions/src/services/transform/operations/aiGenerateVideo.ts

export interface GenerateVideoRequest {
  // Existing fields (unchanged)
  prompt: string
  model: AIVideoModel
  aspectRatio: VideoAspectRatio
  duration: number
  sourceMedia: MediaReference
  lastFrameMedia?: MediaReference
  referenceMedia?: MediaReference[]
  // New fields
  resolution: VideoResolution
  negativePrompt: string
  sound: boolean
  enhance: boolean
}
```

## Veo API Mapping

### buildVeoParams baseConfig Extension

```typescript
// Current baseConfig
const baseConfig = {
  aspectRatio,
  durationSeconds: duration,
  personGeneration: 'allow_adult' as const,
  numberOfVideos: 1,
  outputGcsUri,
}

// Extended baseConfig
const baseConfig = {
  aspectRatio,
  durationSeconds: duration,
  personGeneration: 'allow_adult' as const,
  numberOfVideos: 1,
  outputGcsUri,
  resolution: request.resolution,
  ...(request.negativePrompt ? { negativePrompt: request.negativePrompt } : {}),
  ...(request.sound ? { generateAudio: true } : {}),
  ...(request.enhance ? { enhancePrompt: true } : {}),
}
```

### Field Mapping Table

| Schema Field     | Veo Config Field   | Condition                     |
| ---------------- | ------------------ | ----------------------------- |
| `resolution`     | `resolution`       | Always included               |
| `negativePrompt` | `negativePrompt`   | Only if non-empty string      |
| `sound`          | `generateAudio`    | Only if `true`                |
| `enhance`        | `enhancePrompt`    | Only if `true`                |

## Data Flow

```
Frontend Form State
  → VideoGenerationConfig (Zod-validated)
    → Experience Config (Firestore document)
      → Job Snapshot (at guest submission time)
        → aiVideoOutcome reads snapshot.config.aiVideo.videoGeneration
          → GenerateVideoRequest (adds resolution, negativePrompt, sound, enhance)
            → buildVeoParams maps to GenerateVideosConfig
              → client.models.generateVideos(veoParams)
```

## Backward Compatibility

- Existing Firestore documents without new fields → Zod defaults fill them in
- Existing `GenerateVideoRequest` callers → new fields are required (update call sites)
- Veo API → omitting optional params (negativePrompt, generateAudio, enhancePrompt) produces current behavior
