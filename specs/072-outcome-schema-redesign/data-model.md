# Data Model: Outcome Schema Redesign — Photo & AI Image

**Branch**: `072-outcome-schema-redesign` | **Date**: 2026-02-19

## Entity Diagram

```
ExperienceConfig
├── steps: ExperienceStep[]
└── outcome: Outcome | null
     ├── type: OutcomeType | null
     ├── photo: PhotoOutcomeConfig | null
     ├── gif: GifOutcomeConfig | null
     ├── video: VideoOutcomeConfig | null
     ├── aiImage: AIImageOutcomeConfig | null
     └── aiVideo: AIVideoOutcomeConfig | null

JobSnapshot
├── sessionResponses: SessionResponse[]
├── experienceVersion: number
├── outcome: Outcome | null          ← frozen copy from experience
└── overlayChoice: MediaReference | null
```

## Entities

### OutcomeType (enum)

```
'photo' | 'gif' | 'video' | 'ai.image' | 'ai.video'
```

Replaces old `'image' | 'gif' | 'video'` enum. The `ai.` prefix distinguishes AI-generated types from capture-based types.

### Outcome (top-level)

| Field | Type | Default | Nullable | Notes |
|-------|------|---------|----------|-------|
| `type` | `OutcomeType` | — | `null` | Active output type. null = not configured. |
| `photo` | `PhotoOutcomeConfig` | — | `null` | Config for photo type. null = never configured. |
| `gif` | `GifOutcomeConfig` | — | `null` | Config for gif type. Placeholder — Phase 1. |
| `video` | `VideoOutcomeConfig` | — | `null` | Config for video type. Placeholder — Phase 1. |
| `aiImage` | `AIImageOutcomeConfig` | — | `null` | Config for ai.image type. |
| `aiVideo` | `AIVideoOutcomeConfig` | — | `null` | Config for ai.video type. Placeholder — Phase 1. |

**Invariants**:
- Only one `type` is active at a time.
- Per-type configs persist independently — switching types does NOT clear other configs.
- Setting `type` to `null` (remove output) preserves all configs.

### PhotoOutcomeConfig

| Field | Type | Default | Nullable | Validation |
|-------|------|---------|----------|------------|
| `captureStepId` | `string` | — | No | Must reference a `capture.photo` step |
| `aspectRatio` | `ImageAspectRatio` | `'1:1'` | No | `'1:1' \| '3:2' \| '2:3' \| '9:16'` |

### AIImageOutcomeConfig

| Field | Type | Default | Nullable | Validation |
|-------|------|---------|----------|------------|
| `task` | `string` | `'text-to-image'` | No | `'text-to-image' \| 'image-to-image'` |
| `captureStepId` | `string` | — | `null` | Required when task = `image-to-image`. Must reference a `capture.photo` step. |
| `aspectRatio` | `ImageAspectRatio` | `'1:1'` | No | `'1:1' \| '3:2' \| '2:3' \| '9:16'` |
| `prompt` | `string` | `''` | No | Template with `@{step:...}` and `@{ref:...}` placeholders |
| `model` | `AIImageModel` | `'gemini-2.5-flash-image'` | No | `'gemini-2.5-flash-image' \| 'gemini-3-pro-image-preview'` |
| `refMedia` | `MediaReference[]` | `[]` | No | Max 5 items. Each has unique displayName. |

### GifOutcomeConfig (Phase 1 placeholder)

| Field | Type | Default | Nullable | Validation |
|-------|------|---------|----------|------------|
| `captureStepId` | `string` | — | No | Must reference a `capture.photo` step |
| `aspectRatio` | `ImageAspectRatio` | `'1:1'` | No | `'1:1' \| '3:2' \| '2:3' \| '9:16'` |

### VideoOutcomeConfig (Phase 1 placeholder)

| Field | Type | Default | Nullable | Validation |
|-------|------|---------|----------|------------|
| `captureStepId` | `string` | — | No | Must reference a `capture.photo` step |
| `aspectRatio` | `ImageAspectRatio` | `'1:1'` | No | `'1:1' \| '3:2' \| '2:3' \| '9:16'` |

### AIVideoOutcomeConfig (Phase 1 placeholder)

| Field | Type | Default | Nullable | Validation |
|-------|------|---------|----------|------------|
| `task` | `string` | `'animate'` | No | `'animate' \| 'transform' \| 'reimagine'` |
| `captureStepId` | `string` | — | No | Must reference a capture step |
| `aspectRatio` | `VideoAspectRatio` | `'9:16'` | No | `'9:16' \| '1:1'` |
| `startFrameImageGen` | `ImageGenerationConfig` | — | `null` | Required for `reimagine` task |
| `endFrameImageGen` | `ImageGenerationConfig` | — | `null` | Required for `transform` and `reimagine` tasks |
| `videoGeneration` | `VideoGenerationConfig` | — | No | Prompt, model, duration for video gen |

### Supporting Types (unchanged)

- **ImageAspectRatio**: `'1:1' | '3:2' | '2:3' | '9:16'` — no changes
- **VideoAspectRatio**: `'9:16' | '1:1'` — no changes
- **AIImageModel**: `'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview'` — no changes
- **MediaReference**: `{ mediaAssetId, url, filePath, displayName }` — no changes

## Migration Mapping

| Old State | New `type` | New Config |
|-----------|-----------|------------|
| `type: 'image'`, `aiEnabled: false` | `'photo'` | `photo: { captureStepId, aspectRatio }` |
| `type: 'image'`, `aiEnabled: true`, `captureStepId: null` | `'ai.image'` | `aiImage: { task: 'text-to-image', captureStepId: null, aspectRatio, prompt, model, refMedia }` |
| `type: 'image'`, `aiEnabled: true`, `captureStepId: <id>` | `'ai.image'` | `aiImage: { task: 'image-to-image', captureStepId, aspectRatio, prompt, model, refMedia }` |
| `type: null` | `null` | All config fields remain `null` |
| `type: 'gif'` | `'gif'` | `gif: { captureStepId, aspectRatio }` (if fields exist) |
| `type: 'video'` | `'video'` | `video: { captureStepId, aspectRatio }` (if fields exist) |

## Deprecated Fields (to remove)

| Field | Replacement |
|-------|-------------|
| `aiEnabled` | Encoded in `type` (`'photo'` vs `'ai.image'`) |
| Top-level `captureStepId` | `photo.captureStepId` or `aiImage.captureStepId` |
| Top-level `aspectRatio` | Per-type config `aspectRatio` |
| `imageGeneration` (nested object) | Fields flattened into `AIImageOutcomeConfig` |
| `options` (discriminated union) | Replaced by per-type config fields |
| `outcomeOptionsSchema` | Removed |
| `imageOptionsSchema` | Removed |
| `gifOptionsSchema` | Removed |
| `videoOptionsSchema` | Removed |
