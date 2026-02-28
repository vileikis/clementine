# Research: AI Video Advanced Controls

**Feature**: 086-video-advanced-controls
**Date**: 2026-02-28

## 1. Veo API Parameter Support

### Decision: All four advanced controls map directly to existing Veo API parameters

**Rationale**: The `@google/genai` SDK (v1.38.0) `GenerateVideosConfig` interface already includes all four parameters needed. No custom backend logic is required beyond passing them through.

**Mapping**:

| Feature Control | Veo API Parameter     | Type      | Notes                                      |
| --------------- | --------------------- | --------- | ------------------------------------------ |
| Resolution      | `config.resolution`   | `string`  | Values: `'720p'`, `'1080p'`, `'4k'`       |
| Negative Prompt | `config.negativePrompt` | `string` | Free-text, max 500 chars (app-enforced)    |
| Sound           | `config.generateAudio`  | `boolean` | `true` enables AI-generated audio          |
| Enhance         | `config.enhancePrompt`  | `boolean` | `true` enables prompt rewriting/enhancement |

**Alternatives considered**:
- Custom post-processing for enhance (rejected — Veo has native `enhancePrompt`)
- FFmpeg audio overlay for sound (rejected — Veo has native `generateAudio`)
- Resolution via model selection (rejected — both models support resolution param; user confirmed they are independent controls)

### Model-Resolution Constraints

| Model                            | Supported Resolutions   |
| -------------------------------- | ----------------------- |
| `veo-3.1-generate-001` (Standard) | 720p, 1080p, 4K        |
| `veo-3.1-fast-generate-001` (Fast) | 720p, 1080p            |

Source: Google Vertex AI Veo 3.1 documentation + user confirmation.

## 2. Schema Extension Strategy

### Decision: Extend `videoGenerationConfigSchema` with four new optional fields

**Rationale**: The `VideoGenerationConfig` is the single source of truth for video generation parameters. Adding fields here ensures they propagate through the existing data flow: schema → frontend form → experience config (Firestore) → job snapshot → backend outcome → Veo API.

**Current schema fields**: `prompt`, `model`, `duration`, `aspectRatio`, `refMedia`

**New fields**:
- `resolution`: `z.enum(['720p', '1080p', '4k']).default('1080p')`
- `negativePrompt`: `z.string().default('')`
- `sound`: `z.boolean().default(false)`
- `enhance`: `z.boolean().default(false)`

**Alternatives considered**:
- Separate `AdvancedVideoConfig` schema (rejected — unnecessary indirection; the existing config is flat and small)
- Nullable fields instead of defaults (rejected — defaults simplify frontend form state and backward compatibility)

## 3. Frontend UI Pattern

### Decision: Resolution, Sound, Enhance inline in ControlRow; Negative Prompt below PromptComposer

**Rationale**: Resolution, Sound, and Enhance are generation parameters that naturally belong alongside model and duration in the ControlRow. The existing modality system (`ModalitySupports`) already has `sound` and `enhance` flags — just flip them to `true`. Add `resolution` as a new flag. Negative Prompt is a text input that doesn't fit in the compact ControlRow; it's rendered as a standalone textarea below the PromptComposer in AIVideoConfigForm.

**Key patterns leveraged**:
- `ModalitySupports` interface already has `negativePrompt`, `sound`, `enhance` flags (all `false` for video)
- `ControlRow` renders controls conditionally based on modality supports
- `ModalityControlValues` carries values/callbacks for controls rendered in ControlRow

**Approach**:
1. Add `resolution: boolean` to `ModalitySupports`
2. Set `sound: true`, `enhance: true`, `resolution: true` on `VIDEO_MODALITY`
3. Extend `ControlRow` to render resolution select, sound toggle, enhance toggle
4. Add negative prompt textarea directly in `AIVideoConfigForm` below `PromptComposer`

**Alternatives considered**:
- Separate collapsible "Advanced" section for all 4 controls (rejected — user preference to keep generation controls inline in ControlRow)
- New `AdvancedVideoControls` wrapper component (rejected — unnecessary abstraction; ControlRow already handles conditional rendering via modality flags)

## 4. Model-Resolution Coupling in Frontend

### Decision: Resolution options filtered dynamically based on selected model

**Rationale**: The model picker already exists in ControlRow and propagates changes via `onModelChange`. The resolution selector needs to react to model changes by filtering available options. When a model switch would invalidate the current resolution (e.g., 4K → fast model), auto-downgrade to 1080p with an inline notice.

**Implementation approach**:
- Define a `MODEL_RESOLUTION_MAP` constant mapping each model to its supported resolutions
- Resolution selector reads current model from form state and filters options
- `onModelChange` handler checks if current resolution is still valid; if not, resets to 1080p

## 5. Backend Passthrough

### Decision: Extend `buildVeoParams` to include new config fields

**Rationale**: The `buildVeoParams` function in `aiGenerateVideo.ts` constructs the `GenerateVideosParameters` object. The four new fields map directly to `GenerateVideosConfig` properties. The change is purely additive — add fields to `baseConfig`.

**Current `baseConfig`**:
```
aspectRatio, durationSeconds, personGeneration, numberOfVideos, outputGcsUri
```

**Extended `baseConfig`**:
```
+ resolution, negativePrompt, generateAudio, enhancePrompt
```

Only non-default values need to be included (omit `negativePrompt` if empty, `generateAudio`/`enhancePrompt` if false, `resolution` always included).

## 6. Backward Compatibility

### Decision: New fields use defaults that match current behavior

**Rationale**: Existing experience configs in Firestore will not have the new fields. Zod's `.default()` ensures parsing produces valid defaults:
- `resolution: '1080p'` — matches current implicit behavior
- `negativePrompt: ''` — no change from current (no negative prompt)
- `sound: false` — matches current (silent videos)
- `enhance: false` — matches current (no enhancement)

No data migration is needed. Existing configs parse cleanly with the extended schema.
