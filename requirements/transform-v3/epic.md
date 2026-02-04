Good — now it’s tight enough to turn into an “epic with phased PRDs” without drifting back into node-hell.

You’ve answered every missing decision. The only one that needed sharpening was **sourceStepId optional** — and your reasoning is valid (prompt-only generation). So we’ll encode that explicitly.

Below is **one Epic**, broken into **PRD phases** (each phase shippable). I’ll also include the **schema deltas** you need (minimal changes, reuse your existing AI Image config types, keep transformNodes as dead weight).

---

# EPIC: Outcome-based Create (Nodes removed from customer UX)

## Goal

Replace user-authored `transformNodes` with a **Create tab** where admins pick an **Outcome** and fill a small set of parameters. Guest runtime and Cloud Functions operate on **responses** only. `transformNodes` become deprecated (kept only for backward compatibility, ignored by runtime).

## Non-goals (lock these or you’ll spiral)

- No advanced mode.
- No template DSL in Firestore for MVP.
- No migration of existing prelaunch data.

---

# PRD Phase 1 — Data model groundwork (Experience + Session + Job)

## 1. Experience config: add `create` and stop using transformNodes

### Minimal schema delta

Keep `steps` as-is (Collect). Add `create`. Keep `transformNodes` field but treat as deprecated.

**New `create` schema** — reuse your existing AI Image node config shape as much as possible.

### Create outcome types (MVP)

- `image` (implemented)
- `gif`, `video` (allowed in enum but may be disabled until implemented)

### Recommended Zod additions

```ts
import { z } from 'zod'
import {
  aiImageModelSchema,
  aiImageAspectRatioSchema,
} from './transform/nodes/ai-image.schema' // wherever it lives
import { mediaReferenceSchema } from '../media/media-reference.schema'

export const createOutcomeTypeSchema = z.enum(['image', 'gif', 'video'])

export const createImageOutcomeParamsSchema = z.object({
  // Optional: allow prompt-only generation
  sourceStepId: z.string().nullable().default(null),

  prompt: z.string().default(''),
  model: aiImageModelSchema.default('gemini-2.5-flash-image'),
  aspectRatio: aiImageAspectRatioSchema.default('1:1'),

  // 0..N reference images (your MediaReference type)
  refMedia: z.array(mediaReferenceSchema).default([]),
})

export const createOutcomeSchema = z.object({
  type: createOutcomeTypeSchema.nullable().default(null),
  // Start with image-only params; later discriminate by type.
  image: createImageOutcomeParamsSchema.nullable().default(null),
})
```

Then update `experienceConfigSchema`:

```ts
export const experienceConfigSchema = z.looseObject({
  steps: z.array(experienceStepSchema).default([]),

  // deprecated, kept for compatibility
  transformNodes: z.array(transformNodeSchema).default([]),

  // NEW
  create: createOutcomeSchema.default({ type: null, image: null }),
})
```

### Publish-time validation (critical)

At publish time:

- `create.type` must be non-null
- If `type === 'image'` then `create.image` must exist and `prompt` must not be empty
- `sourceStepId` may be null (prompt-only generation)

**Acceptance criteria**

- Experiences can be published with Create outcome configured.
- `published.transformNodes` is set to `[]` automatically on publish (your decision).
- Existing experiences without `create` should fail publish until configured (fine prelaunch).

---

## 2. Session: replace `answers[]` + `capturedMedia[]` with `responses[]`

You’ve chosen: **array of response objects**. Good.

### Response schema (MVP)

It must support both input answers and capture media in one shape.

```ts
export const responseKindSchema = z.enum([
  'text',
  'multi',
  'scale',
  'yesno',
  'media',
])

export const sessionResponseSchema = z.object({
  stepId: z.string(),
  stepType: z.string(),

  kind: responseKindSchema,

  // Analytics-friendly primitive
  value: z
    .union([z.string(), z.array(z.string())])
    .nullable()
    .default(null),

  // Optional structured context for AI prompt fragments, option objects, etc.
  context: z.unknown().nullable().default(null),

  // For media capture (or future derived assets)
  media: mediaReferenceSchema.nullable().default(null),

  createdAt: z.number(),
  updatedAt: z.number(),
})
```

Then in session:

- remove (or ignore) `answers` and `capturedMedia`
- add `responses: sessionResponseSchema[]`

**Acceptance criteria**

- Guest flow writes only `responses`.
- CF reads only `responses`.
- Preview flow also uses `responses` (don’t keep two codepaths).

---

## 3. Job snapshot: snapshot create outcome + responses (not transformNodes)

Your current job snapshot is already built for reproducibility — great. You’ll update it, not redesign it.

### Replace snapshot parts

- `sessionInputs: { answers, capturedMedia }` → `sessionInputs: { responses }`
- `transformNodes` → either remove OR keep but set to `[]` always
- Add `createOutcome` snapshot (copied from experience published)

Example:

```ts
export const sessionInputsSnapshotSchema = z.looseObject({
  responses: z.array(sessionResponseSchema),
})

export const createOutcomeSnapshotSchema = z.looseObject({
  type: createOutcomeTypeSchema,
  image: createImageOutcomeParamsSchema.nullable().default(null),
})

export const jobSnapshotSchema = z.looseObject({
  sessionInputs: sessionInputsSnapshotSchema,

  // optional: keep for backwards compatibility but always []
  transformNodes: z.array(transformNodeSchema).default([]),

  projectContext: projectContextSnapshotSchema,
  experienceVersion: z.number().int().positive(),

  // NEW
  createOutcome: createOutcomeSnapshotSchema,
})
```

**Acceptance criteria**

- Every new job contains `snapshot.createOutcome` and `snapshot.sessionInputs.responses`.
- CF can execute a job without reading experience doc again.

---

# PRD Phase 2 — Admin UX: Collect + Create (no nodes)

## Create tab UX rules (MVP)

1. Admin picks outcome: `Image` (GIF/Video can be disabled visually until implemented)

2. Form fields for `Image`:
   - Prompt (required)
   - Reference images (0..N) — uses your existing media picker (saved as `MediaReference[]`)
   - Model (required)
   - Aspect ratio (required)
   - Source image step (optional):
     - Dropdown of capture steps from Collect tab
     - Helper text: “Optional. If not set, image is generated from prompt only.”

3. Publish button validates:
   - prompt non-empty
   - if sourceStepId selected, ensure it points to an existing capture step id

**Acceptance criteria**

- Admin cannot see/edit transformNodes anywhere.
- Publishing always produces `published.create` and `published.transformNodes: []`.

---

# PRD Phase 3 — Runtime: Dispatcher + local executors (image outcome only)

## Dispatcher contract (Cloud Function)

Input: Job doc
Exec: `runOutcome(job.snapshot.createOutcome.type, ctx)`

### `image` outcome execution (MVP)

- Resolve `sourceMedia`:
  - If `sourceStepId` is set:
    - find response where `response.stepId === sourceStepId`
    - require `response.media != null`

  - Else: `sourceMedia = null` (prompt-only)

- Build AI generation request:
  - prompt
  - model
  - aspectRatio
  - refMedia[] (0..N)
  - plus `sourceMedia` if present (always included per your rule)

- Call `ai.image.generate(...)`
- Apply overlay from **projectContext.overlay** if exists
  - no experience toggle
  - if missing, skip

- Write:
  - `job.output` (format=image etc.)
  - `session.resultMedia`

**Acceptance criteria**

- CF never reads transformNodes.
- Prompt-only generation works.
- Image-from-capture works.
- Overlay auto-applied when project has overlay, and pipeline succeeds when it doesn’t.

---

# PRD Phase 4 — Cleanup & guardrails

## Remove dead complexity from product surface

- Hide Generate/nodes UI entirely
- Remove any code paths that assume `answers`/`capturedMedia`

## Safety checks

- Job creation fails early if:
  - experience.published is null (guest sessions must use published)
  - create outcome missing / invalid

- Outcome type not implemented → job fails with clear non-retryable error

**Acceptance criteria**

- No silent fallbacks to transformNodes.
- Clear, actionable errors.

---

# What you changed compared to your old transformNodes world (the real “decision lock”)

- **Execution definition moved from Experience.transformNodes → Job.snapshot.createOutcome**
- **User-facing configuration moved from nodes → Create params**
- **Runtime inputs moved from answers/capturedMedia → responses**
- **Overlay ownership moved fully into Project**

That’s the spine.

---

# Appendix

### The simplest “local pipeline registry” structure (recommended)

In code (Cloud Functions):

```bash
services/transform/
  engine/
    runOutcome.ts
  outcomes/
    imageOutcome.ts
    gifOutcome.ts
    videoOutcome.ts
  executors/
    aiGenerateImage.ts
    applyOverlay.ts
  bindings/
    resolveSessionInputs.ts

```

runOutcome.ts (dispatcher)

reads session snapshot (outcomeType + config)

calls outcomes[ outcomeType ](ctx)

imageOutcome.ts

resolves sourceAssetId from session responses (capture step)

loads project overlay id

calls AI generator executor

calls overlay executor

writes session result

This keeps everything explicit and debug-friendly.
