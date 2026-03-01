# Data Model: AI Video Advanced Controls

**Feature**: 086-video-advanced-controls
**Date**: 2026-02-28

## Entity Changes

### VideoGenerationConfig (Extended)

**Location**: `packages/shared/src/schemas/experience/experience-config.schema.ts`

**Current fields** (unchanged):

| Field       | Type                  | Default                          | Description                        |
| ----------- | --------------------- | -------------------------------- | ---------------------------------- |
| prompt      | `string`              | `''`                             | Generation prompt text             |
| model       | `AIVideoModel`        | `'veo-3.1-fast-generate-001'`   | Veo model identifier               |
| duration    | `4 \| 6 \| 8`        | `6`                              | Duration in seconds                |
| aspectRatio | `VideoAspectRatio \| null` | `null`                      | Output aspect ratio (inherits if null) |
| refMedia    | `MediaReference[]`    | `[]`                             | Reference images for remix task    |

**New fields**:

| Field          | Type                             | Default    | Description                                           |
| -------------- | -------------------------------- | ---------- | ----------------------------------------------------- |
| resolution     | `'720p' \| '1080p' \| '4k'`     | `'1080p'`  | Output video resolution                               |
| negativePrompt | `string`                         | `''`       | Elements to avoid in generation (max 500 chars)       |
| sound          | `boolean`                        | `false`    | Enable AI-generated audio                             |
| enhance        | `boolean`                        | `false`    | Enable prompt enhancement / quality boost             |

### New Type: VideoResolution

**Location**: `packages/shared/src/schemas/experience/experience-config.schema.ts`

```
VideoResolution = '720p' | '1080p' | '4k'
```

Enum values match the Veo API `config.resolution` parameter.

## Validation Rules

| Rule                                      | Enforcement          |
| ----------------------------------------- | -------------------- |
| `resolution` must be a valid enum value   | Zod schema (shared)  |
| `negativePrompt` max 500 characters       | Zod schema (shared) + frontend UI |
| `sound` must be boolean                   | Zod schema (shared)  |
| `enhance` must be boolean                 | Zod schema (shared)  |
| Resolution must be valid for selected model | Frontend UI only (filter options) |

## Model-Resolution Constraint Map

| Model                              | Allowed Resolutions       |
| ---------------------------------- | ------------------------- |
| `veo-3.1-generate-001` (Standard)  | `720p`, `1080p`, `4k`    |
| `veo-3.1-fast-generate-001` (Fast) | `720p`, `1080p`           |

This constraint is enforced in the frontend by filtering resolution options based on the selected model. The backend does not enforce this constraint — it passes the resolution to the Veo API, which will reject invalid combinations.

## State Transitions

No new state transitions. The advanced controls are simple configuration values persisted at save time and read at job execution time. The existing experience publish → job snapshot → backend execution flow remains unchanged.

## Backward Compatibility

All new fields have Zod `.default()` values that match the current implicit behavior:
- Existing Firestore documents without these fields parse cleanly
- No data migration required
- New defaults produce identical Veo API behavior to current implementation

## Relationships

```
AIVideoConfig
└── videoGeneration: VideoGenerationConfig
    ├── prompt: string
    ├── model: AIVideoModel
    ├── duration: VideoDuration
    ├── aspectRatio: VideoAspectRatio | null
    ├── refMedia: MediaReference[]
    ├── resolution: VideoResolution          ← NEW
    ├── negativePrompt: string               ← NEW
    ├── sound: boolean                       ← NEW
    └── enhance: boolean                     ← NEW
```

The `VideoGenerationConfig` nests inside `AIVideoConfig`, which nests inside `snapshotConfigSchema.aiVideo`. The full path from job snapshot to any new field is: `snapshot.config.aiVideo.videoGeneration.<field>`.
