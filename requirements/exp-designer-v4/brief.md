# Experience Designer v4 — Outcome Schema Redesign

## Context

### Shared Schemas

- `packages/shared/src/schemas/experience/experience.schema.ts` — Experience document schema (contains `draft.outcome` and `published.outcome`)
- `packages/shared/src/schemas/experience/outcome.schema.ts` — Current outcome schema (flat structure being replaced)
- `packages/shared/src/schemas/experience/step.schema.ts` — Step definitions including `capture.photo`
- `packages/shared/src/schemas/media/aspect-ratio.schema.ts` — Canonical aspect ratio definitions (image vs video)
- `packages/shared/src/schemas/media/media-reference.schema.ts` — MediaReference used for ref images and capture output

### Frontend — Experience Designer

- `apps/clementine-app/src/domains/experience/designer/containers/ExperienceCollectPage.tsx` — Collect tab (step list, preview, config panel)
- `apps/clementine-app/src/domains/experience/create/containers/ExperienceCreatePage.tsx` — Create tab (outcome configuration)
- `apps/clementine-app/src/domains/experience/create/components/CreateTabForm/` — Outcome config form (type picker, AI generation toggle, prompt composer, aspect ratio selector, source image selector)

### Backend — Cloud Functions

- `functions/src/tasks/transformPipelineTask.ts` — Cloud Task handler (job lifecycle: pending → running → completed/failed)
- `functions/src/services/transform/engine/runOutcome.ts` — Outcome dispatcher (routes to executor by type)
- `functions/src/services/transform/outcomes/imageOutcome.ts` — Current image executor (handles both AI and passthrough modes)
- `functions/src/services/transform/operations/` — Shared operations (`aiGenerateImage`, `applyOverlay`)

---

## Problem

The current `outcomeSchema` uses a flat structure with `aiEnabled` as a boolean toggle and a single `imageGeneration` config block. This creates several limitations:

1. **Conditional overload** — `aiEnabled`, `captureStepId`, and `imageGeneration` coexist at the same level. The schema cannot express that text-to-image needs no capture step while image-to-image requires one — all enforced at runtime.
2. **No video generation model** — The existing `videoOptionsSchema` has a placeholder `videoPrompt` but no concept of start/end frame composition, multi-stage AI generation, or video model selection.
3. **Single AI config** — Only one `imageGeneration` block exists. AI video use cases require multiple image generation configs (e.g., separate prompts for start frame and end frame).
4. **GIF pipeline undefined** — Placeholder schema exists but no capture or generation path.

## Goal

Design a scalable, maintainable outcome schema that cleanly supports both direct media output and AI-generated media across photo, GIF, and video formats.

---

## Outcome Types

Types use a flat naming convention. Non-AI types have no prefix; AI types use the `ai.` prefix.

| Type | Category | Description |
|------|----------|-------------|
| `photo` | Non-AI | Direct photo output from capture step |
| `gif` | Non-AI | Direct GIF output from capture step |
| `video` | Non-AI | Direct video output from capture step |
| `ai.photo` | AI | AI-generated image (text-to-image or image-to-image) |
| `ai.video` | AI | AI-generated video (configurable start/end frames) |

### Non-AI Use Cases

| Type | Input | Config |
|------|-------|--------|
| **photo** | Subject photo via `capture.photo` step | `captureStepId` + `aspectRatio` |
| **gif** | Subject frames via `capture.gif` step | `captureStepId` + `aspectRatio` |
| **video** | Subject video via `capture.video` step | `captureStepId` + `aspectRatio` |

> **Future extensibility**: Non-AI types may gain optional post-processing config (e.g., background swap: `{ enabled, backgroundImageRef }`). The per-type config structure supports this without schema-level changes.

### AI Photo Use Cases

AI Photo has two tasks, configured within one type:

| Task | Input | Description |
|------|-------|-------------|
| **text-to-image** | No subject image | Generate image purely from text prompt |
| **image-to-image** | Subject photo via `capture.photo` step | Generate image from subject photo + text prompt |

Config: `task` + `captureStepId` (i2i only) + `aspectRatio` + `prompt` + `model` + `refMedia`

### AI Video Use Cases

AI Video is one type with configurable start and end frames:

| Variant | Start Frame | End Frame | Description |
|---------|-------------|-----------|-------------|
| **Image-to-video** | Subject photo (capture) | None | Animate a photo into video |
| **Photo + AI end frame** | Subject photo (capture) | AI-generated image | Video from photo to AI-generated end state |
| **AI start + AI end** | AI-generated image | AI-generated image | Video between two AI-generated frames (both from same subject photo) |

All variants require a `capture.photo` step as the subject source. The start/end frame sources determine which AI image generation configs are needed.

Config: `captureStepId` + `aspectRatio` + `startFrame` + `endFrame` + `videoGeneration`

---

## Schema Design

### Top-Level Outcome Structure

```
outcome: {
  type: OutcomeType | null          // Active type (null = not configured, show picker)

  // Per-type configs (persisted independently, null = never configured)
  photo:   PhotoOutcomeConfig   | null
  gif:     GifOutcomeConfig     | null
  video:   VideoOutcomeConfig   | null
  aiPhoto: AIPhotoOutcomeConfig | null
  aiVideo: AIVideoOutcomeConfig | null
}
```

**Key design decisions:**
- `type: null` → experience has no outcome configured, UI shows the type picker
- Per-type config persistence: switching types changes `type` but preserves each type's config. Switching back restores previous config without data loss.
- Each type owns its `captureStepId` and `aspectRatio` independently to avoid cross-type compatibility issues (e.g., `photo` uses `capture.photo` step, `video` uses `capture.video` step; image ARs differ from video ARs).

### Naming Conventions

The outcome schema uses a consistent hierarchy:
- **type** — the outcome type: `photo`, `gif`, `video`, `ai.photo`, `ai.video`
- **task** — the specific variant within a type: `text-to-image`, `image-to-image` (used in `ai.photo`)

**Category** is NOT stored in the schema. It is a UI-only grouping concept, hardcoded in the frontend for the outcome type picker (e.g., grouping types under "Media" vs "AI Generated" sections).

### UX Terminology

In code and schemas, we use the term **"outcome"**. In user-facing UI copy, use **"output"**:

| Code concept | UX copy |
|-------------|---------|
| outcome | "output" |
| Remove outcome | "Remove output" |
| Choose outcome type | "Choose output type" |
| outcome type picker | "Output type" |

### Per-Type Config Schemas

#### PhotoOutcomeConfig

```
{
  captureStepId: string              // References a capture.photo step
  aspectRatio: ImageAspectRatio      // 1:1 | 3:2 | 2:3 | 9:16
}
```

#### GifOutcomeConfig

```
{
  captureStepId: string              // References a capture.gif step (future)
  aspectRatio: ImageAspectRatio      // 1:1 | 3:2 | 2:3 | 9:16
}
```

#### VideoOutcomeConfig

```
{
  captureStepId: string              // References a capture.video step (future)
  aspectRatio: VideoAspectRatio      // 9:16 | 1:1
}
```

#### AIPhotoOutcomeConfig

```
{
  task: 'text-to-image' | 'image-to-image'
  captureStepId: string | null       // Required for i2i, null for t2i
  aspectRatio: ImageAspectRatio      // 1:1 | 3:2 | 2:3 | 9:16
  prompt: string                     // Template with @{step:...} and @{ref:...} placeholders
  model: AIImageModel                // e.g., 'gemini-2.5-flash-image'
  refMedia: MediaReference[]         // Reference images for style guidance
}
```

#### AIVideoOutcomeConfig

```
{
  captureStepId: string              // Always required (subject photo source)
  aspectRatio: VideoAspectRatio      // 9:16 | 1:1 — cascades to all sub-generations

  startFrame:
    | { source: 'capture' }                                    // Use subject photo directly
    | { source: 'ai', imageGen: ImageGenerationConfig }        // AI-generate from subject

  endFrame:
    | { source: 'none' }                                       // No end frame (simple i2v)
    | { source: 'ai', imageGen: ImageGenerationConfig }        // AI-generate from subject

  videoGeneration: {
    prompt: string                   // Video generation prompt
    model: AIVideoModel              // Video generation model
    duration: number                 // Duration in seconds
  }
}
```

**Note**: `ImageGenerationConfig` within start/end frames does NOT have its own `aspectRatio` — it inherits from the parent `AIVideoOutcomeConfig.aspectRatio` to ensure dimensional consistency across all generated frames and the final video.

---

## Aspect Ratio Behavior

### Supported Ratios Per Type

| Type | Supported Aspect Ratios |
|------|------------------------|
| `photo`, `gif`, `ai.photo` | `1:1`, `3:2`, `2:3`, `9:16` (ImageAspectRatio) |
| `video`, `ai.video` | `9:16`, `1:1` (VideoAspectRatio) |

### Cascading to Capture Step

When the user changes `aspectRatio` in the outcome config, it also updates the referenced capture step's aspect ratio. This is a UX convenience so the user doesn't need to navigate to the Collect tab to match dimensions.

The outcome editor's "source step selector" widget includes an inline aspect ratio control that writes to both:
1. The outcome type config's `aspectRatio`
2. The referenced capture step's `aspectRatio` in `draft.steps[]`

---

## UX Flow

### Empty State (type = null)

User sees a picker screen with two groups:

**Media**
- Photo
- GIF
- Video

**AI Generated**
- AI Photo
- AI Video

> Implementation note: GIF, Video, and AI Video may show as "coming soon" initially.

### Type Selected

User sees the config form for the selected type:
- Type switcher at the top (ability to change type)
- Type-specific configuration fields
- "Remove" action to clear back to `type: null` (UX copy TBD, see Naming Conventions)

### Switching Types

- Changing `type` swaps the visible config panel
- Previous type's config is preserved in its respective field
- If switching to a type that was never configured (field is null), UI shows default/empty state for that type
- Smart defaults: when a type is first selected, auto-detect compatible capture steps and pre-fill if unambiguous (e.g., only one `capture.photo` step exists)

---

## Migration from Current Schema

The current outcome schema:

```
outcome: {
  type: 'image' | 'gif' | 'video' | null
  aspectRatio: AspectRatio
  captureStepId: string | null
  aiEnabled: boolean
  imageGeneration: ImageGenerationConfig
  options: OutcomeOptions | null
}
```

Maps to the new schema as follows:

| Current State | New Type | New Config |
|---------------|----------|------------|
| `type: 'image'`, `aiEnabled: false` | `photo` | `photo: { captureStepId, aspectRatio }` |
| `type: 'image'`, `aiEnabled: true`, `captureStepId: null` | `ai.photo` | `aiPhoto: { task: 'text-to-image', ... }` |
| `type: 'image'`, `aiEnabled: true`, `captureStepId: <id>` | `ai.photo` | `aiPhoto: { task: 'image-to-image', ... }` |
| `type: null` | `null` | All configs null |

> `type: 'gif'` and `type: 'video'` were never fully implemented in v3, so no migration needed for those.

---

## Backend Impact

### runOutcome Dispatcher

The `outcomeRegistry` in `runOutcome.ts` changes from keying on `OutcomeType` (`image`/`gif`/`video`) to keying on the new outcome types:

```
outcomeRegistry: {
  'photo':    photoOutcome,      // Renamed from imageOutcome (passthrough path)
  'gif':      null,              // Future
  'video':    null,              // Future
  'ai.photo': aiPhotoOutcome,    // Renamed from imageOutcome (AI path)
  'ai.video': aiVideoOutcome,    // New
}
```

### Existing imageOutcome Split

The current `imageOutcome.ts` handles both AI and passthrough modes. This splits into:
- **photoOutcome** — passthrough only (download capture → apply overlay → upload)
- **aiPhotoOutcome** — AI generation (resolve prompt → generate → apply overlay → upload)

### New aiVideoOutcome

New executor that orchestrates:
1. Download subject photo
2. Generate start frame (if `source: 'ai'`)
3. Generate end frame (if `source: 'ai'`)
4. Run video generation with resolved frames
5. Upload output

### Job Snapshot

The job snapshot already captures the full outcome config. The new per-type structure means the snapshot contains the active type's config as resolved at job creation time. No structural change needed — just the shape of `snapshot.outcome` changes.

---

## Scope Boundaries

### In Scope

- New outcome schema with per-type configs
- Outcome type picker UI (empty state)
- Type-specific config forms
- Type switching with config persistence
- Aspect ratio cascading to capture step
- Migration path from current schema
- Backend dispatcher updates

### Out of Scope

- `capture.gif` and `capture.video` step types (future)
- Background swap for non-AI types (future, schema extensible)
- GIF and Video outcome implementation (schema defined, executor deferred)
- AI Video executor implementation (schema defined, executor deferred)

---

## Open Questions

1. **AI Photo task switching**: When user switches from `image-to-image` to `text-to-image`, should `captureStepId` be cleared or preserved (in case they switch back)?
2. **AI Video model schema**: What video generation models will be supported? Need to define `AIVideoModel` enum.
3. **Overlay behavior**: Does overlay application change per outcome type, or does the current overlay system (resolved at job creation, applied post-generation) work for all types?
