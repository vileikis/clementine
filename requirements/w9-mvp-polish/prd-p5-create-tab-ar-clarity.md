# PRD P5 — Create Tab UX: Aspect Ratio Clarity

> **Master Plan**: [plan-video-support.md](./plan-video-support.md)
> **Priority**: P5 — UX Polish
> **Area**: App (Frontend)

---

## Objective

Make the Create tab clearly distinguish between **input aspect ratio** (capture/subject photo shape) and **output aspect ratio** (AI generation output shape). Simplify the AR architecture to a two-level model: capture AR + single output AR.

## Why This Matters

Currently the Create tab has UX issues:

1. **Aspect ratio picker is ambiguous** — When the source image picker is auto-selected or hidden, the AR picker appears orphaned. Users don't know if it controls capture shape or output shape.
2. **Hidden elements occupy space** — When there's only one capture step, the picker hides but still takes layout space, making adjacent controls confusing.
3. **AR exists at too many levels** — Outcome-level AR, generation-level AR, and capture-step AR create redundancy and confusion.

---

## Requirements

### 1. Two-Level AR Model

**Input AR** (capture step):
- Owned by the capture step config
- Controls camera crop shape during guest experience
- Displayed in the "Subject Photo" section of the Create tab

**Output AR** (outcome config):
- Single AR field on the per-type outcome config (e.g., `aiImageOutcomeConfig.aspectRatio`)
- All generations within the outcome inherit this AR
- Displayed in the "Output" section of the Create tab

### 2. Remove Generation-Level AR Override

Currently `imageGenerationConfig.aspectRatio` and `videoGenerationConfig.aspectRatio` exist as per-generation overrides with fallback to outcome-level AR.

**Change:**
- Remove `aspectRatio` from `imageGenerationConfigSchema`
- Remove `aspectRatio` from `videoGenerationConfigSchema`
- All generation operations read AR from the parent outcome config
- Backend fallback chain simplified: `outcomeConfig.aspectRatio` (no more `generation.aspectRatio ?? outcome.aspectRatio`)

### 3. Create Tab Layout

Reorganize the Create tab into clearly labeled sections:

```
┌─ Subject Photo ─────────────────────┐
│ Capture Step: [Step 1: Take Photo]  │
│ Capture AR: 1:1  [change]           │
└─────────────────────────────────────┘

┌─ Output ────────────────────────────┐
│ Output AR: [1:1] [9:16] [16:9]     │
│ Model: [Gemini 2.5 Flash]          │
│ Prompt: [...]                       │
└─────────────────────────────────────┘
```

- **Subject Photo section**: Shows selected capture step and its AR. "Change" navigates to step's AR setting (or inline picker).
- **Output section**: Shows output AR prominently at the top, followed by model and prompt config.
- When capture step is auto-selected (only one exists), still show it — just without a dropdown. This prevents the "hidden but occupying space" problem.

### 4. Update Backend Operations

Update `aiImageOutcome` and `aiVideoOutcome` to read AR directly from outcome config instead of the generation-level fallback:

**Before:**
```ts
const effectiveAspectRatio = imageGeneration.aspectRatio ?? aspectRatio
```

**After:**
```ts
const effectiveAspectRatio = aspectRatio // from outcome config
```

### 5. Schema Changes

```ts
// Remove aspectRatio from generation configs
imageGenerationConfigSchema = z.object({
  prompt: z.string().default(''),
  model: aiImageModelSchema.default('gemini-2.5-flash-image'),
  refMedia: z.array(mediaReferenceSchema).default([]),
  // aspectRatio REMOVED — inherited from parent outcome config
})

videoGenerationConfigSchema = z.object({
  prompt: z.string().default(''),
  model: aiVideoModelSchema.default('veo-3.1-fast-generate-001'),
  duration: videoDurationSchema.default(6),
  refMedia: z.array(mediaReferenceSchema).default([]),
  // aspectRatio REMOVED — inherited from parent outcome config
})
```

---

## Out of Scope

- Changing capture step's AR picker UI (just displaying it in Create tab)
- Adding new aspect ratios
- AR preview/visualization

---

## Success Metrics

- Users can distinguish input AR from output AR at a glance
- Zero "what does this aspect ratio control?" confusion
- One AR per outcome config (no generation-level override)
- No hidden-but-space-occupying elements in Create tab
