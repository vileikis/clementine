# Phase 2: AI Video Editor

> Part of [Experience Designer v4 — Outcome Schema Redesign](./brief.md)
>
> Depends on: [Phase 1 — Schema Redesign + Photo & AI Image](./phase-1-schema-photo-ai-photo.md)

## Overview

Add AI Video configuration UI to the experience designer. This phase enables admins to fully configure `ai.video` outcomes with all three tasks (animate, transform, reimagine). The backend executor is not implemented — AI Video jobs will fail gracefully with "not implemented" until Phase 3.

## Goals

1. Enable admins to configure AI Video outcomes in the Create tab
2. Support all three AI Video tasks with appropriate config forms
3. Maintain type switching and config persistence for ai.video alongside existing types

## Prerequisites

- Phase 1 complete: new outcome schema deployed, output type picker in place
- `ai.video` slot exists in outcome schema (defined in Phase 1, config is `null`)
- `ai.video: null` in the backend dispatcher (returns "not implemented")

---

## 1. Output Type Picker Update

Enable the "AI Video" option in the output type picker. Remove "coming soon" badge. The picker now has 3 enabled types: Photo, AI Image, AI Video. GIF and Video remain "coming soon".

---

## 2. AI Video Config Form

When `outcome.type === 'ai.video'`, show the AI Video configuration form.

### 2.1 Task Picker

Top-level selector for the AI Video task:

| Task | Label | Description |
|------|-------|-------------|
| `animate` | Animate | Bring a photo to life as video |
| `transform` | Transform | Photo transitions into an AI-generated version |
| `reimagine` | Reimagine | Video between two AI-generated frames |

Selecting a task shows/hides the relevant image generation config sections. Switching tasks preserves config where possible (e.g., switching from `transform` to `reimagine` keeps `endFrameImageGen` intact and adds `startFrameImageGen`).

### 2.2 Shared Fields (All Tasks)

These fields are visible regardless of task:

- **Source step selector** — pick a `capture.photo` step (always required for ai.video)
- **Aspect ratio selector** — VideoAspectRatio options (`9:16`, `1:1`)
- **Video generation config:**
  - Prompt — text input for video generation prompt
  - Model — AIVideoModel selector (enum TBD, placeholder with single option is acceptable)
  - Duration — numeric input in seconds

Aspect ratio cascades to the referenced capture step's config.

### 2.3 Animate Task

No additional fields beyond shared fields. The subject photo is used directly as the video source frame.

### 2.4 Transform Task

Additional fields:

- **End frame image generation** (`endFrameImageGen`):
  - Prompt — text input with `@{step:...}` and `@{ref:...}` mention support
  - Model — AIImageModel selector
  - Reference media — upload/manage reference images

The end frame image will be AI-generated from the subject photo using this config. Aspect ratio is inherited from the parent AI Video config (not editable per-frame).

### 2.5 Reimagine Task

Additional fields:

- **Start frame image generation** (`startFrameImageGen`):
  - Prompt — text input with mention support
  - Model — AIImageModel selector
  - Reference media — upload/manage reference images

- **End frame image generation** (`endFrameImageGen`):
  - Prompt — text input with mention support
  - Model — AIImageModel selector
  - Reference media — upload/manage reference images

Both frames are AI-generated from the same subject photo. Each has independent prompt, model, and reference media config. Aspect ratio inherited from parent.

---

## 3. Config Persistence

AI Video config follows the same per-type persistence pattern established in Phase 1:

- Switching from `ai.video` to another type preserves `aiVideo` config
- Switching back restores it
- Switching tasks within `ai.video` preserves frame generation configs where applicable:
  - `animate` → `transform`: `endFrameImageGen` initialized if null
  - `transform` → `reimagine`: `endFrameImageGen` preserved, `startFrameImageGen` initialized if null
  - `reimagine` → `transform`: `startFrameImageGen` preserved (hidden but not cleared)
  - `reimagine` → `animate`: both frame configs preserved (hidden but not cleared)

### 3.1 Smart Defaults

When AI Video is selected for the first time:
- Auto-select the only `capture.photo` step if one exists
- Default task: `animate` (simplest — no image generation config needed)
- Default aspect ratio: `9:16`
- Default video duration: `5` seconds

---

## 4. Autosave

Same debounced autosave pattern as existing config forms. All AI Video config changes save to `outcome.aiVideo` in the experience document.

---

## 5. Backend Behavior (No Changes)

The backend dispatcher already has `'ai.video': null` from Phase 1. If a guest somehow triggers an AI Video job (e.g., via published experience), the dispatcher returns an "Outcome type 'ai.video' is not implemented" error. This is expected and handled gracefully.

No backend changes in this phase.

---

## 6. AIVideoModel Placeholder

Define `AIVideoModel` enum in `@clementine/shared` if not already defined. Acceptable to start with a single placeholder value (e.g., the video generation model that will be integrated in Phase 3). This unblocks the editor UI without requiring the backend integration.

---

## Acceptance Criteria

### Type Picker
- [ ] AI Video enabled in output type picker (no longer "coming soon")
- [ ] Selecting AI Video sets `outcome.type = 'ai.video'` and shows config form

### Task Picker
- [ ] All three tasks displayed: Animate, Transform, Reimagine
- [ ] Selecting a task shows/hides relevant config sections
- [ ] Task switching preserves frame generation configs

### Config Forms
- [ ] Animate: source step + aspect ratio + video generation config
- [ ] Transform: above + end frame image generation config
- [ ] Reimagine: above + start frame + end frame image generation configs
- [ ] Aspect ratio limited to VideoAspectRatio (9:16, 1:1)
- [ ] Aspect ratio cascades to capture step
- [ ] Prompt inputs support `@{step:...}` and `@{ref:...}` mentions
- [ ] Reference media upload works for frame generation configs

### Persistence
- [ ] Switching away from ai.video and back preserves config
- [ ] Switching tasks preserves frame generation configs
- [ ] Smart defaults applied on first selection
- [ ] Autosave works for all config changes

### No Regressions
- [ ] Photo and AI Image outcomes still work end-to-end
- [ ] Type switching between all enabled types works correctly
