# Phase 1: Schema Redesign + Photo & AI Image (Full Stack)

> Part of [Experience Designer v4 — Outcome Schema Redesign](./brief.md)

## Overview

Refactor the outcome system from a flat, conditional schema to a per-type config architecture. Deliver full-stack support for `photo` and `ai.image` outcome types. This phase replaces all existing outcome functionality with the new schema — same capabilities, new structure.

GIF, Video, and AI Video types are defined in the schema but marked as "coming soon" in the UI and "not implemented" in the backend.

## Goals

1. Replace the current flat `outcomeSchema` with the new per-type config structure
2. Deliver output type picker UI (empty state) and type-specific config forms
3. Update cloud functions to read/write the new schema
4. Migrate existing Firestore documents from old to new format
5. Maintain feature parity — no regressions in photo or AI image workflows

## Deployment

Schema (shared package), editor (frontend), cloud functions (backend), and data migration must deploy together to avoid schema mismatches between frontend and backend.

---

## 1. Schema Changes (`@clementine/shared`)

### 1.1 New Outcome Schema

Replace `packages/shared/src/schemas/experience/outcome.schema.ts` with the new structure.

**Outcome type enum:**

```
OutcomeType = 'photo' | 'gif' | 'video' | 'ai.image' | 'ai.video'
```

**Top-level outcome:**

```
outcome: {
  type: OutcomeType | null

  photo:   PhotoOutcomeConfig   | null
  gif:     GifOutcomeConfig     | null
  video:   VideoOutcomeConfig   | null
  aiImage: AIImageOutcomeConfig | null
  aiVideo: AIVideoOutcomeConfig | null
}
```

All per-type config fields default to `null` (Firestore-safe pattern).

### 1.2 Per-Type Config Schemas (Phase 1 active types)

**PhotoOutcomeConfig:**

```
{
  captureStepId: string
  aspectRatio: ImageAspectRatio      // 1:1 | 3:2 | 2:3 | 9:16
}
```

**AIImageOutcomeConfig:**

```
{
  task: 'text-to-image' | 'image-to-image'
  captureStepId: string | null       // Required for i2i, null for t2i
  aspectRatio: ImageAspectRatio      // 1:1 | 3:2 | 2:3 | 9:16
  prompt: string                     // Template with @{step:...} and @{ref:...} placeholders
  model: AIImageModel
  refMedia: MediaReference[]
}
```

### 1.3 Per-Type Config Schemas (Phase 1 placeholder types)

Define schemas for `gif`, `video`, and `ai.video` as specified in the brief. These are included in the schema for forward compatibility but have no UI forms or backend executors in this phase.

### 1.4 Deprecated Schema Removal

Remove or deprecate:
- `aiEnabled` boolean
- Top-level `captureStepId`
- Top-level `aspectRatio`
- Top-level `imageGeneration`
- `outcomeOptionsSchema` (discriminated union by `kind`)
- `imageOptionsSchema`, `gifOptionsSchema`, `videoOptionsSchema`

### 1.5 Experience Config Schema Update

Update `experienceConfigSchema` in `experience.schema.ts` to use the new `outcomeSchema`.

---

## 2. Data Migration

### 2.1 Migration Script

Create a Firestore migration script in `functions/scripts/migrations/` that reads all experience documents and transforms the outcome field from old to new format.

**Migration mapping:**

| Old State | New `type` | New Config Field |
|-----------|-----------|-----------------|
| `type: 'image'`, `aiEnabled: false` | `'photo'` | `photo: { captureStepId, aspectRatio }` |
| `type: 'image'`, `aiEnabled: true`, `captureStepId: null` | `'ai.image'` | `aiImage: { task: 'text-to-image', captureStepId: null, aspectRatio, prompt, model, refMedia }` |
| `type: 'image'`, `aiEnabled: true`, `captureStepId: <id>` | `'ai.image'` | `aiImage: { task: 'image-to-image', captureStepId, aspectRatio, prompt, model, refMedia }` |
| `type: null` | `null` | All config fields `null` |

Migration must handle both `draft.outcome` and `published.outcome` fields.

### 2.2 Read Compatibility

The new schema should use `z.looseObject()` to tolerate old fields that haven't been cleaned up yet. Parsing old documents through the new schema should not fail — unknown fields are ignored.

---

## 3. Editor Updates (Frontend)

### 3.1 Output Type Picker (Empty State)

When `outcome.type === null`, show a picker with two groups:

**Media**
- Photo (enabled)
- GIF (disabled — "Coming soon")
- Video (disabled — "Coming soon")

**AI Generated**
- AI Image (enabled)
- AI Video (disabled — "Coming soon")

Category grouping is hardcoded in the frontend (not stored in schema).

Selecting a type sets `outcome.type` and initializes the corresponding config with smart defaults (e.g., auto-select the only `capture.photo` step if one exists).

### 3.2 Output Type Switcher

When a type is selected, show a type switcher at the top of the config form. Changing types:
- Updates `outcome.type`
- Swaps the visible config form
- Preserves previous type's config in its field

### 3.3 Photo Config Form

Fields:
- **Source step selector** — pick a `capture.photo` step
- **Aspect ratio selector** — ImageAspectRatio options (1:1, 3:2, 2:3, 9:16)

Aspect ratio cascades to the referenced capture step's config (writes to `draft.steps[]`).

### 3.4 AI Image Config Form

Fields:
- **Task selector** — toggle between `text-to-image` and `image-to-image`
- **Source step selector** — pick a `capture.photo` step (visible only for `image-to-image`)
- **Aspect ratio selector** — ImageAspectRatio options
- **Prompt composer** — text input with `@{step:...}` and `@{ref:...}` mention support
- **Model selector** — AIImageModel options
- **Reference media** — upload/manage reference images

Aspect ratio cascades to capture step (when task is `image-to-image`).

### 3.5 Remove Output Action

"Remove output" button clears `outcome.type` to `null`. Per-type configs are NOT cleared — they persist for potential re-selection. Returns to the type picker.

### 3.6 Autosave

Maintain existing autosave pattern: debounced saves on form changes. Same approach as current CreateTabForm.

### 3.7 UX Terminology

All user-facing copy uses "output" instead of "outcome" (see brief for mapping table).

---

## 4. Backend Updates (Cloud Functions)

### 4.1 Update `startTransformPipeline`

Update the callable function to read the new outcome schema:
- Read `outcome.type` to determine which per-type config to use
- Validate the active type's config (not the entire outcome object)
- Build job snapshot with the active type's config
- Validation: reject `type: null`, reject types without executors (`gif`, `video`, `ai.video`)

### 4.2 Split `imageOutcome` into Two Executors

**`photoOutcome`** (new file: `functions/src/services/transform/outcomes/photoOutcome.ts`)
- Passthrough mode only
- Flow: download captured media → apply overlay (if configured) → upload output
- Reads from `PhotoOutcomeConfig`

**`aiImageOutcome`** (new file: `functions/src/services/transform/outcomes/aiImageOutcome.ts`)
- AI generation mode
- Flow: resolve prompt mentions → generate image via AI → apply overlay → upload output
- Reads from `AIImageOutcomeConfig`
- Handles both `text-to-image` (no source media) and `image-to-image` (source from capture step) based on `task` field

### 4.3 Update `runOutcome` Dispatcher

Update the outcome registry:

```
outcomeRegistry: {
  'photo':    photoOutcome,
  'gif':      null,
  'video':    null,
  'ai.image': aiImageOutcome,
  'ai.video': null,
}
```

### 4.4 Remove Old `imageOutcome`

Delete `functions/src/services/transform/outcomes/imageOutcome.ts` after the split is complete.

### 4.5 Shared Operations

`aiGenerateImage` and `applyOverlay` in `functions/src/services/transform/operations/` remain unchanged. They are used by the new executors without modification.

---

## 5. Job Snapshot

The job snapshot shape changes to reflect the new outcome structure. The snapshot should contain:
- `outcome.type` — the active type at job creation
- The active type's config (resolved from the experience document)
- Session responses, overlay choice (unchanged)

Existing completed/failed jobs with old snapshot format are historical records and do not need migration.

---

## Acceptance Criteria

### Schema
- [ ] New `outcomeSchema` with per-type configs defined in `@clementine/shared`
- [ ] All 5 type configs defined (photo, gif, video, aiImage, aiVideo)
- [ ] Old schema fields removed or deprecated
- [ ] Shared package builds and passes type checking

### Migration
- [ ] Migration script handles all 4 old→new mapping cases
- [ ] Migration handles both `draft.outcome` and `published.outcome`
- [ ] Migration is idempotent (safe to re-run)

### Editor
- [ ] Empty state shows output type picker with correct grouping
- [ ] Photo config form: source step selector + aspect ratio
- [ ] AI Image config form: task selector, source step (i2i), aspect ratio, prompt, model, ref media
- [ ] Type switching preserves per-type config
- [ ] Aspect ratio cascades to capture step
- [ ] Remove output action returns to picker (configs preserved)
- [ ] GIF, Video, AI Video shown as "coming soon"
- [ ] Autosave works for all form changes

### Backend
- [ ] `startTransformPipeline` reads new schema correctly
- [ ] `photoOutcome` executor handles passthrough flow
- [ ] `aiImageOutcome` executor handles text-to-image and image-to-image
- [ ] `runOutcome` dispatcher routes to correct executor
- [ ] GIF, Video, AI Video return "not implemented" error
- [ ] Existing overlay system works with new executors

### End-to-End
- [ ] Admin can configure a `photo` outcome and guest receives passthrough result
- [ ] Admin can configure an `ai.image` (text-to-image) outcome and guest receives AI-generated result
- [ ] Admin can configure an `ai.image` (image-to-image) outcome and guest receives AI-generated result
- [ ] No regressions from current functionality
