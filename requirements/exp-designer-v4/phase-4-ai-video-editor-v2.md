# Phase 4: AI Video Editor v2

> Part of [Experience Designer v4 — Outcome Schema Redesign](./brief.md)
>
> Depends on: [Phase 3 — AI Video Backend](./phase-3-ai-video-backend.md)

## Overview

Redesign the AI Video task system and editor UI based on Veo API capabilities. This phase introduces technical task identifiers (decoupled from display labels), replaces the video generation section with the PromptComposer component, constrains duration to fixed values, and marks transform/reimagine as "coming soon."

## Goals

1. Restructure AI Video tasks with stable technical identifiers and flexible display labels
2. Integrate PromptComposer for video generation prompt (with @mentions, model picker, duration picker)
3. Support reference media for applicable tasks (animate only)
4. Constrain duration to fixed selectable values (4, 6, 8 seconds)
5. Disable transform/reimagine tasks (coming soon)

---

## Decision Log

### D1: Technical Task Identifiers vs Display Labels

**Problem**: Task enum values (`animate`, `transform`, `reimagine`) are display-friendly but fragile — renaming UX copy requires schema migration.

**Decision**: Use technical identifiers in schema, map to display labels in UI.

| Technical ID (schema) | Display Label (UI) | Status |
|------------------------|-------------------|--------|
| `image-to-video` | Animate | Active |
| `ref-images-to-video` | Remix | Active |
| `transform` | Transform | Coming soon |
| `reimagine` | Reimagine | Coming soon |

**Rationale**: Technical IDs are stable and self-documenting in backend code. Display labels can be A/B tested, localized, or renamed without data migration. Transform/reimagine keep their current IDs since they're unimplemented — can be renamed when built.

### D2: Two Tasks Instead of One for "Animate"

**Problem**: The Veo API has two mutually exclusive video generation modes that both fall under "animation from a photo":

1. **image-to-video**: `params.image = userPhoto` — photo IS the first frame, Veo animates it faithfully
2. **ref-images-to-video**: `config.referenceImages = [userPhoto, ...]` — photo is creative reference, Veo generates a new video inspired by it

These produce qualitatively different results even with just the user photo and no extra references. Unifying them under one task means the `ref-images-to-video` path (user photo as creative input with zero extra refs) is unreachable.

**Decision**: Split into two separate tasks:

- `image-to-video` ("Animate") — deterministic first frame, no reference media support
- `ref-images-to-video` ("Remix") — creative interpretation, supports up to 2 reference media (user photo always occupies 1 of 3 ASSET slots)

### D3: Reference Media Rules by Task

Based on Veo API constraints — when using `referenceImages`, the `image`, `video`, and `lastFrame` fields are NOT supported. Transform/reimagine use `lastFrame`, so they cannot use `referenceImages`.

| Task | Ref Media Support | Reason |
|------|------------------|--------|
| `image-to-video` | Not supported | Uses `params.image` path — no `referenceImages` field |
| `ref-images-to-video` | Up to 2 images | Uses `config.referenceImages` — user photo fills 1 of 3 ASSET slots |
| `transform` | Not supported | Uses `params.image` + `config.lastFrame` — incompatible with `referenceImages` |
| `reimagine` | Not supported | Uses `params.image` + `config.lastFrame` — incompatible with `referenceImages` |

### D4: Duration as Fixed Values

**Problem**: Current schema allows any number 4-8. Product only wants specific options.

**Decision**: Constrain to fixed set: `4`, `6`, `8` seconds. Schema validates with `z.enum`-style refinement. UI renders as segmented control or select dropdown.

### D5: Stale Ref Media Across Task Switches

**Problem**: Ref media lives in `videoGeneration.refMedia`. When users switch from `ref-images-to-video` to `image-to-video`, the ref media array stays populated (same pattern as `startFrameImageGen`/`endFrameImageGen` — preserved but hidden). Could this cause issues?

**Decision**: No action needed — stale ref media is harmless. Follow the same "scope to active task" principle used for frame generation configs:

| Layer | Behavior |
|-------|----------|
| **Frontend (editor)** | PromptComposer hides ref media strip entirely for `image-to-video`. Data persists invisibly. If user switches back to `ref-images-to-video`, their ref media reappears. |
| **Backend (executor)** | Routes by `task` field, not by data shape. `image-to-video` uses `params.image` path and never reads `refMedia`. Stale data is ignored. |
| **Validation** | Only validates fields relevant to the active task. `refMedia` is not validated for `image-to-video` — no "hidden field has errors" UX issues. |
| **Job snapshot** | Full `aiVideo` config is captured. Executor reads `task` and uses only what's relevant. Stale ref media in snapshot is dead weight but harmless. |

**Principle**: Backend and validation scope to the active task. Ignore fields that don't apply. This is consistent with how frame generation configs already work.

### D6: PromptComposer for Video Generation

**Problem**: Current `VideoGenerationSection` is a basic textarea + model dropdown + number input. It lacks @mention support and reference media handling.

**Decision**: Replace `VideoGenerationSection` with `PromptComposer` for the video generation prompt. PromptComposer already supports:
- @mention for referencing input steps
- Model picker (will use `AI_VIDEO_MODELS`)
- Reference media strip (enable/disable per task)

Additional integration:
- Add duration picker to the PromptComposer control row (or as adjacent control)
- Hide aspect ratio in PromptComposer (controlled at outcome level)
- Set `maxRefMedia` to 2 for `ref-images-to-video`, disable entirely for other tasks

---

## Schema Changes

### 1. Task Enum

**Before:**
```
aiVideoTaskSchema = z.enum(['animate', 'transform', 'reimagine'])
```

**After:**
```
aiVideoTaskSchema = z.enum([
  'image-to-video',
  'ref-images-to-video',
  'transform',
  'reimagine',
])
```

### 2. Duration

**Before:**
```
duration: z.number().min(4).max(8).default(5)
```

**After:**
```
duration: z.union([z.literal(4), z.literal(6), z.literal(8)]).default(6)
```

### 3. Video Generation Config — Add refMedia

**Before:**
```
videoGenerationConfigSchema = z.object({
  prompt: z.string().default(''),
  model: aiVideoModelSchema.default('veo-3.1-fast-generate-001'),
  duration: z.number().min(4).max(8).default(5),
  aspectRatio: videoAspectRatioSchema.nullable().default(null),
})
```

**After:**
```
videoGenerationConfigSchema = z.object({
  prompt: z.string().default(''),
  model: aiVideoModelSchema.default('veo-3.1-fast-generate-001'),
  duration: videoDurationSchema.default(6),
  aspectRatio: videoAspectRatioSchema.nullable().default(null),
  refMedia: z.array(mediaReferenceSchema).default([]),
})
```

### 4. AI Video Outcome Config — Default Task

Update default task from `'animate'` to `'image-to-video'`:

```
aiVideoOutcomeConfigSchema = z.object({
  task: aiVideoTaskSchema.default('image-to-video'),
  // ... rest unchanged
})
```

---

## Frontend Changes

### 1. AIVideoTaskSelector

Update task options with display labels, descriptions, and "coming soon" state:

```typescript
const TASK_OPTIONS = [
  {
    value: 'image-to-video',
    label: 'Animate',
    description: 'Bring a photo to life as video',
  },
  {
    value: 'ref-images-to-video',
    label: 'Remix',
    description: 'Create a new video using photo and reference images as creative input',
  },
  {
    value: 'transform',
    label: 'Transform',
    description: 'Photo transitions into an AI-generated version',
    comingSoon: true,
  },
  {
    value: 'reimagine',
    label: 'Reimagine',
    description: 'Video between two AI-generated frames',
    comingSoon: true,
  },
]
```

Coming soon tasks are visible but not selectable (disabled + badge).

### 2. Replace VideoGenerationSection with PromptComposer

Remove the current `VideoGenerationSection` component. Use `PromptComposer` instead, configured for video generation:

- **Prompt**: `videoGeneration.prompt` with @mention support for input steps
- **Model**: `videoGeneration.model` using `AI_VIDEO_MODELS` options
- **Aspect ratio**: hidden (`hideAspectRatio={true}`) — controlled at outcome level
- **Reference media**: enabled only for `ref-images-to-video` task (max 2)
- **Duration**: added as a control (segmented control or select) either inside ControlRow or as adjacent field

### 3. Reference Media Behavior

| Task | PromptComposer ref media props |
|------|-------------------------------|
| `image-to-video` | Hidden entirely — no add button, no strip |
| `ref-images-to-video` | Enabled, `maxRefMedia=2`, images only |
| `transform` | Hidden entirely |
| `reimagine` | Hidden entirely |

### 4. Duration Picker

Render as segmented control or select with fixed options:

```typescript
const DURATION_OPTIONS = [
  { value: 4, label: '4s' },
  { value: 6, label: '6s' },
  { value: 8, label: '8s' },
]
```

### 5. Conditional Sections

After PromptComposer integration, the AI Video config form renders:

**For `image-to-video`:**
1. Task selector
2. Source image + aspect ratio
3. PromptComposer (prompt, model, duration — no ref media)

**For `ref-images-to-video`:**
1. Task selector
2. Source image + aspect ratio
3. PromptComposer (prompt, model, duration, ref media up to 2)

**For `transform` (coming soon):**
Not selectable.

**For `reimagine` (coming soon):**
Not selectable.

---

## Backend Changes

### 1. Update aiVideoOutcome Executor

The executor's param composition logic changes based on task:

```
image-to-video:
  params.image = userPhoto
  params.prompt = resolvedPrompt
  params.config.durationSeconds = duration
  params.config.aspectRatio = aspectRatio

ref-images-to-video:
  params.prompt = resolvedPrompt
  params.config.referenceImages = [
    { image: userPhoto, referenceType: 'ASSET' },
    ...refMedia.map(ref => ({ image: ref, referenceType: 'ASSET' }))
  ]
  params.config.durationSeconds = duration
  params.config.aspectRatio = aspectRatio

transform (future):
  params.image = userPhoto
  params.config.lastFrame = endFrameImage
  params.prompt = resolvedPrompt

reimagine (future):
  params.image = startFrameImage
  params.config.lastFrame = endFrameImage
  params.prompt = resolvedPrompt
```

Note: for `ref-images-to-video`, the `image` field is NOT set (mutually exclusive with `referenceImages`).

### 2. Prompt Resolution

Video generation prompts now support @mentions (step references). Use existing `resolvePromptMentions` to resolve before passing to Veo API.

---

## Migration

### Data Migration

Existing `ai.video` outcomes with `task: 'animate'` need migration to `task: 'image-to-video'`. This can be handled via:

1. **Lazy migration**: Parse-time transform in Zod schema (`.transform()` on task field)
2. **One-time script**: Firestore migration script

Recommended: lazy migration since ai.video is new and has minimal production data.

---

## Acceptance Criteria

### Schema
- [ ] `aiVideoTaskSchema` updated with new technical identifiers
- [ ] `videoDurationSchema` constrains to 4, 6, 8
- [ ] `videoGenerationConfigSchema` includes `refMedia` field
- [ ] Default task is `'image-to-video'`

### Task Selector
- [ ] Displays 4 tasks with display labels (Animate, Remix, Transform, Reimagine)
- [ ] Transform and Reimagine show "coming soon" badge and are not selectable
- [ ] Selecting a task updates config correctly

### PromptComposer Integration
- [ ] Video generation prompt uses PromptComposer with @mention support
- [ ] Model picker shows AI_VIDEO_MODELS options
- [ ] Duration picker shows fixed options (4s, 6s, 8s)
- [ ] Aspect ratio hidden (controlled at outcome level)

### Reference Media
- [ ] `image-to-video`: ref media hidden entirely
- [ ] `ref-images-to-video`: ref media enabled, max 2 images
- [ ] Upload and removal work correctly
- [ ] Ref media persisted in `videoGeneration.refMedia`

### Backend
- [ ] `image-to-video` maps to `params.image` path
- [ ] `ref-images-to-video` maps to `config.referenceImages` path
- [ ] Prompt @mentions resolved before API call
- [ ] Ref media images fetched and included in API call

### No Regressions
- [ ] Photo and AI Image outcomes still work end-to-end
- [ ] Type switching preserves ai.video config
- [ ] Autosave works for all video config changes
