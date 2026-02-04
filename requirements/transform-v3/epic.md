# EPIC: Outcome-based Create (Nodes removed from customer UX)

## Goal

Replace user-authored `transformNodes` with a **Create tab** where admins pick an **Outcome** and fill a small set of parameters. Guest runtime and Cloud Functions operate on **responses** only. `transformNodes` become deprecated (kept only for backward compatibility, ignored by runtime).

## Non-goals (lock these or you'll spiral)

- No advanced mode.
- No template DSL in Firestore for MVP.
- No migration of existing prelaunch data.
- No fallback logic for old sessions (abandon them).

---

# PRD Phase 1 — Data model groundwork (Experience + Session + Job)

## 1.1 Experience config: add `create` and stop using transformNodes

### Minimal schema delta

Keep `steps` as-is (Collect). Add `create`. Keep `transformNodes` field but treat as deprecated.

**New `create` schema** — reuse existing AI Image node config shape.

### Create outcome types (MVP)

- `image` (implemented)
- `gif`, `video` (allowed in enum but may be disabled until implemented)

### Zod additions

**File**: `packages/shared/src/schemas/experience/create-outcome.schema.ts`

```ts
import { z } from 'zod'
import {
  aiImageModelSchema,
  aiImageAspectRatioSchema,
} from './nodes/ai-image-node.schema'
import { mediaReferenceSchema } from '../media/media-reference.schema'

export const createOutcomeTypeSchema = z.enum(['image', 'gif', 'video'])

export const createImageOutcomeParamsSchema = z.object({
  // Optional: allow prompt-only generation
  sourceStepId: z.string().nullable().default(null),

  prompt: z.string().default(''),
  model: aiImageModelSchema.default('gemini-2.5-flash-image'),
  aspectRatio: aiImageAspectRatioSchema.default('1:1'),

  // 0..N reference images (MediaReference with displayName for @{ref:...} mentions)
  refMedia: z.array(mediaReferenceSchema).default([]),
})

export const createOutcomeSchema = z.object({
  type: createOutcomeTypeSchema.nullable().default(null),
  // Start with image-only params; later discriminate by type.
  image: createImageOutcomeParamsSchema.nullable().default(null),
})

export type CreateOutcomeType = z.infer<typeof createOutcomeTypeSchema>
export type CreateImageOutcomeParams = z.infer<typeof createImageOutcomeParamsSchema>
export type CreateOutcome = z.infer<typeof createOutcomeSchema>
```

Then update `experienceConfigSchema`:

**File**: `packages/shared/src/schemas/experience/experience.schema.ts`

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

### Acceptance criteria

- [ ] AC-1.1.1: Experiences can be published with Create outcome configured.
- [ ] AC-1.1.2: `published.transformNodes` is set to `[]` automatically on publish.
- [ ] AC-1.1.3: Experiences without `create.type` fail publish with clear error.

---

## 1.2 Media displayName validation

Add validation to media display names to ensure they're safe for mention parsing.

**File**: `packages/shared/src/schemas/media/media-reference.schema.ts`

```ts
/**
 * Media display name schema
 * Validation ensures names are safe for @{ref:displayName} mention parsing.
 * Prevents characters that would break mention syntax (}, :, {).
 */
export const mediaDisplayNameSchema = z
  .string()
  .trim()
  .min(1, 'Display name is required')
  .max(100, 'Display name must be 100 characters or less')
  .regex(
    /^[a-zA-Z0-9 \-_.]+$/,
    'Display name can only contain letters, numbers, spaces, hyphens, underscores, and periods'
  )
  .default('Untitled')

export const mediaReferenceSchema = z.looseObject({
  mediaAssetId: z.string(),
  url: z.url(),
  filePath: z.string().nullable().default(null),
  displayName: mediaDisplayNameSchema, // Updated with validation
})
```

**Note**: Apply validation to new media only. Existing media grandfathered.

### Acceptance criteria

- [ ] AC-1.2.1: New media uploads require valid displayName (no `}`, `:`, `{` characters).
- [ ] AC-1.2.2: Existing media with invalid displayName still parses (backward compatible).

---

## 1.3 Session: replace `answers[]` + `capturedMedia[]` with `responses[]`

Unified array of response objects. Includes `stepName` for direct prompt mention resolution.

### Response schema

**File**: `packages/shared/src/schemas/session/session.schema.ts`

```ts
import { mediaReferenceSchema } from '../media/media-reference.schema'

/**
 * Session Response Schema
 *
 * Unified shape for both input answers and capture media.
 * Uses stepType from experienceStepTypeSchema directly - no separate kind enum.
 */
export const sessionResponseSchema = z.object({
  /** Step that produced this response */
  stepId: z.string(),

  /** Step name for direct @{step:stepName} prompt resolution */
  stepName: z.string(),

  /** Step type (e.g., 'input.scale', 'capture.photo') - determines response structure */
  stepType: z.string(),

  /**
   * Analytics-friendly primitive value:
   * - string: text inputs, yes/no ("yes"/"no"), scale ("1"-"5")
   * - string[]: multi-select inputs
   * - null: capture steps (value is in media field)
   */
  value: z
    .union([z.string(), z.array(z.string())])
    .nullable()
    .default(null),

  /**
   * Optional structured context for AI prompt fragments, option objects, etc.
   * - Multi-select: MultiSelectOption[] (full option objects with promptFragment/promptMedia)
   * - Other steps: any step-specific structured data
   */
  context: z.unknown().nullable().default(null),

  /**
   * Media reference for capture steps.
   * Uses full MediaReference shape (includes filePath for CF processing).
   */
  media: mediaReferenceSchema.nullable().default(null),

  /** Response creation timestamp (Unix ms) */
  createdAt: z.number(),

  /** Last update timestamp (Unix ms) */
  updatedAt: z.number(),
})

export type SessionResponse = z.infer<typeof sessionResponseSchema>
```

Then in session schema:

```ts
export const sessionSchema = z.looseObject({
  // ... existing fields ...

  /**
   * ACCUMULATED DATA
   */

  /** @deprecated Use responses instead */
  answers: z.array(answerSchema).default([]),

  /** @deprecated Use responses instead */
  capturedMedia: z.array(capturedMediaSchema).default([]),

  /** Unified responses from all steps (input + capture) */
  responses: z.array(sessionResponseSchema).default([]),

  // ... rest of schema ...
})
```

### Guest runtime changes

When saving a response:

```ts
// Input step response
const response = {
  stepId: step.id,
  stepName: step.name,  // From step definition
  stepType: step.type,
  value: userInput,
  context: stepContext,  // Optional structured data
  media: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

// Capture step response
const response = {
  stepId: step.id,
  stepName: step.name,  // From step definition
  stepType: step.type,
  value: null,
  context: null,
  media: {
    mediaAssetId: asset.id,
    url: asset.url,
    filePath: asset.filePath,  // Full storage path for CF
    displayName: step.name,    // Or custom display name
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
}
```

### Acceptance criteria

- [ ] AC-1.3.1: Guest flow writes only `responses` (not `answers`/`capturedMedia`).
- [ ] AC-1.3.2: Preview flow uses `responses` (same codepath as guest).
- [ ] AC-1.3.3: Every response includes `stepName` for prompt resolution.
- [ ] AC-1.3.4: Capture responses include full `MediaReference` with `filePath`.

---

## 1.4 Job snapshot: snapshot create outcome + responses (not transformNodes)

### Replace snapshot parts

- `sessionInputs: { answers, capturedMedia }` → `sessionInputs: { responses }`
- `transformNodes` → keep but always set to `[]`
- Add `createOutcome` snapshot (copied from experience published)

**File**: `packages/shared/src/schemas/job/job.schema.ts`

```ts
import { sessionResponseSchema } from '../session/session.schema'
import { createOutcomeTypeSchema, createImageOutcomeParamsSchema } from '../experience/create-outcome.schema'

/**
 * Snapshot of session inputs at job creation
 */
export const sessionInputsSnapshotSchema = z.looseObject({
  responses: z.array(sessionResponseSchema),
})

/**
 * Snapshot of create outcome at job creation
 */
export const createOutcomeSnapshotSchema = z.looseObject({
  type: createOutcomeTypeSchema,
  image: createImageOutcomeParamsSchema.nullable().default(null),
})

/**
 * Complete job execution snapshot
 */
export const jobSnapshotSchema = z.looseObject({
  sessionInputs: sessionInputsSnapshotSchema,

  // deprecated: kept for schema compatibility, always []
  transformNodes: z.array(transformNodeSchema).default([]),

  projectContext: projectContextSnapshotSchema,
  experienceVersion: z.number().int().positive(),

  // NEW: outcome configuration for execution
  createOutcome: createOutcomeSnapshotSchema,
})
```

### Acceptance criteria

- [ ] AC-1.4.1: Every new job contains `snapshot.createOutcome`.
- [ ] AC-1.4.2: Every new job contains `snapshot.sessionInputs.responses`.
- [ ] AC-1.4.3: CF can execute a job without reading experience doc again.

---

# PRD Phase 2 — Admin UX: Collect + Create (no nodes)

## Create tab UX rules (MVP)

1. Admin picks outcome: `Image` (GIF/Video can be disabled visually until implemented)

2. Form fields for `Image`:
   - **Prompt** (required) - Lexical editor with @{step:...} and @{ref:...} mention support
   - **Reference images** (0..N) - Media picker, saved as `MediaReference[]`
   - **Model** (required) - Dropdown from `aiImageModelSchema` values
   - **Aspect ratio** (required) - Dropdown from `aiImageAspectRatioSchema` values
   - **Source image step** (optional):
     - Dropdown of capture steps from Collect tab
     - Helper text: "Optional. If not set, image is generated from prompt only."

3. Publish button validates:
   - prompt non-empty
   - if sourceStepId selected, ensure it points to an existing capture step id

### Acceptance criteria

- [ ] AC-2.1: Admin cannot see/edit transformNodes anywhere.
- [ ] AC-2.2: Publishing always produces `published.create` and `published.transformNodes: []`.
- [ ] AC-2.3: Prompt editor supports @{step:stepName} mentions for input/capture steps.
- [ ] AC-2.4: Prompt editor supports @{ref:displayName} mentions for reference media.

---

# PRD Phase 3 — Runtime: Dispatcher + local executors (image outcome only)

## Dispatcher contract (Cloud Function)

Input: Job doc
Exec: `runOutcome(job.snapshot.createOutcome.type, ctx)`

### Prompt resolution

Before calling AI, resolve all mentions in the prompt:

```ts
function resolvePromptMentions(
  prompt: string,
  responses: SessionResponse[],
  refMedia: MediaReference[]
): string {
  // Step mentions: @{step:stepName}
  let resolved = prompt.replace(
    /@\{step:([^}]+)\}/g,
    (match, stepName) => {
      const response = responses.find(r => r.stepName === stepName)
      if (!response) return match  // Keep original if not found

      // Input step: return value
      if (response.value !== null) {
        return Array.isArray(response.value)
          ? response.value.join(', ')
          : response.value
      }

      // Capture step: return media placeholder
      if (response.media) {
        return `<media:${response.media.filePath}>`
      }

      return match
    }
  )

  // Media mentions: @{ref:displayName}
  resolved = resolved.replace(
    /@\{ref:([^}]+)\}/g,
    (match, displayName) => {
      const media = refMedia.find(m => m.displayName === displayName)
      if (media) {
        return `<media:${media.filePath}>`
      }
      return match
    }
  )

  return resolved
}
```

### `image` outcome execution (MVP)

1. **Resolve `sourceMedia`**:
   - If `sourceStepId` is set:
     - find response where `response.stepId === sourceStepId`
     - require `response.media != null`
   - Else: `sourceMedia = null` (prompt-only)

2. **Resolve prompt mentions** using `stepName` and `displayName`

3. **Build AI generation request**:
   - resolved prompt
   - model
   - aspectRatio
   - refMedia[] (0..N) - using `filePath` not `url`
   - plus `sourceMedia` if present

4. **Call `ai.image.generate(...)`**

5. **Apply overlay** from `projectContext.overlays[aspectRatio]` if exists
   - No experience toggle
   - If missing for aspect ratio, skip

6. **Write**:
   - `job.output` (format=image etc.)
   - `session.resultMedia`

### Acceptance criteria

- [ ] AC-3.1: CF never reads transformNodes.
- [ ] AC-3.2: Prompt-only generation works.
- [ ] AC-3.3: Image-from-capture works.
- [ ] AC-3.4: Overlay auto-applied when project has overlay for output aspect ratio.
- [ ] AC-3.5: Pipeline succeeds when no overlay exists.
- [ ] AC-3.6: @{step:stepName} mentions resolved correctly from responses.
- [ ] AC-3.7: @{ref:displayName} mentions resolved correctly from refMedia.
- [ ] AC-3.8: CF uses `filePath` (not `url`) for media processing.

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

### Acceptance criteria

- [ ] AC-4.1: No silent fallbacks to transformNodes.
- [ ] AC-4.2: Clear, actionable errors for invalid configurations.
- [ ] AC-4.3: Old sessions with `answers`/`capturedMedia` are abandoned (no migration).

---

# Summary of schema changes

| Schema | Change |
|--------|--------|
| `mediaReferenceSchema` | Add `displayName` validation (safe for mention parsing) |
| `experienceConfigSchema` | Add `create: createOutcomeSchema` |
| `sessionSchema` | Add `responses[]`, deprecate `answers[]` + `capturedMedia[]` |
| `sessionResponseSchema` | NEW - unified response with `stepName`, `media: MediaReference` |
| `jobSnapshotSchema` | Add `createOutcome`, replace `sessionInputs` with responses |
| `projectContextSnapshotSchema` | No change (overlays already per-aspect-ratio) |

---

# What you changed compared to your old transformNodes world

- **Execution definition moved from Experience.transformNodes → Job.snapshot.createOutcome**
- **User-facing configuration moved from nodes → Create params**
- **Runtime inputs moved from answers/capturedMedia → responses with stepName**
- **Overlay ownership moved fully into Project (per aspect ratio)**
- **Media references include filePath for CF processing**
- **Prompt resolution uses stepName/displayName for direct lookup**

---

# Appendix

### Recommended Cloud Functions structure

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
    resolvePromptMentions.ts
    resolveSessionInputs.ts
```

### Prompt mention resolution flow

```
Prompt: "Create a @{step:Pet Choice} with the style of @{ref:style-image.jpg}"
         ↓
Session responses: [{ stepName: "Pet Choice", value: "cat" }]
Reference media: [{ displayName: "style-image.jpg", filePath: "..." }]
         ↓
Resolved: "Create a cat with the style of <media:projects/.../style-image.jpg>"
```

### Related documents

- [055-lexical-prompt-editor spec](../specs/055-lexical-prompt-editor/spec.md)
- [Session schema](../packages/shared/src/schemas/session/session.schema.ts)
- [Media reference schema](../packages/shared/src/schemas/media/media-reference.schema.ts)
