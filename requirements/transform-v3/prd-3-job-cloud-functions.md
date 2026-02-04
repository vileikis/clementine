# PRD 3: Job + Cloud Functions

**Epic**: [Outcome-based Create](./epic.md)
**Status**: Draft
**Dependencies**: PRD 1B (Experience Create), PRD 1C (Session Responses)
**Enables**: PRD 4 (Cleanup)

---

## Overview

Update job snapshot schema to capture `createOutcome` and `responses`. Implement outcome dispatcher and image outcome executor in Cloud Functions.

---

## 1. Job Snapshot Schema Update

Update snapshot to use new data structures.

**File**: `packages/shared/src/schemas/job/job.schema.ts`

```ts
import { sessionResponseSchema } from '../session/session-response.schema'
import {
  createOutcomeTypeSchema,
  imageGenerationConfigSchema,
  outcomeOptionsSchema,
} from '../experience/create-outcome.schema'

/**
 * Snapshot of session inputs at job creation
 */
export const sessionInputsSnapshotSchema = z.looseObject({
  /** Unified responses from all steps */
  responses: z.array(sessionResponseSchema),
})

/**
 * Snapshot of create outcome at job creation
 */
export const createOutcomeSnapshotSchema = z.looseObject({
  /** Outcome type (never null in snapshot - validated at job creation) */
  type: createOutcomeTypeSchema,

  /** Source step ID (shared across outcomes) */
  sourceStepId: z.string().nullable(),

  /** AI generation enabled */
  aiEnabled: z.boolean(),

  /** Image generation config */
  imageGeneration: imageGenerationConfigSchema,

  /** Type-specific options */
  options: outcomeOptionsSchema.nullable(),
})

/**
 * Complete job execution snapshot
 */
export const jobSnapshotSchema = z.looseObject({
  /** Session responses at job creation */
  sessionInputs: sessionInputsSnapshotSchema,

  /** @deprecated Always []. Kept for schema compatibility */
  transformNodes: z.array(transformNodeSchema).default([]),

  /** Project context (overlay, etc.) */
  projectContext: projectContextSnapshotSchema,

  /** Experience version at job creation */
  experienceVersion: z.number().int().positive(),

  /** Create outcome configuration */
  createOutcome: createOutcomeSnapshotSchema,
})
```

### Acceptance Criteria

- [ ] AC-1.1: `jobSnapshotSchema` includes `createOutcome`
- [ ] AC-1.2: `createOutcomeSnapshotSchema` includes `sourceStepId`, `aiEnabled`, `imageGeneration`, `options`
- [ ] AC-1.3: `sessionInputsSnapshotSchema` uses `responses` (not answers/capturedMedia)
- [ ] AC-1.4: `transformNodes` always defaults to `[]`

---

## 2. Job Creation Update

Update job creation to snapshot new data.

**Location**: Job creation logic (guest flow completion)

```ts
async function createJob(params: CreateJobParams): Promise<Job> {
  const { session, experience, projectContext } = params

  // Validate create outcome exists
  const create = experience.published?.create
  if (!create?.type) {
    throw new NonRetryableError('Experience has no create outcome configured')
  }

  // Validate passthrough has source
  if (!create.aiEnabled && !create.sourceStepId) {
    throw new NonRetryableError('Passthrough mode requires source image')
  }

  const snapshot: JobSnapshot = {
    sessionInputs: {
      responses: session.responses,
    },
    transformNodes: [], // Always empty
    projectContext: {
      overlays: projectContext.overlays,
      experienceRef: projectContext.experienceRef,
    },
    experienceVersion: experience.publishedVersion!,
    createOutcome: {
      type: create.type,
      sourceStepId: create.sourceStepId,
      aiEnabled: create.aiEnabled,
      imageGeneration: create.imageGeneration,
      options: create.options,
    },
  }

  // Create job document...
}
```

### Acceptance Criteria

- [ ] AC-2.1: Job creation fails if `create.type` is null
- [ ] AC-2.2: Job creation fails if passthrough without sourceStepId
- [ ] AC-2.3: Job snapshot includes full `createOutcome` from published experience
- [ ] AC-2.4: Job snapshot includes `responses` from session
- [ ] AC-2.5: `transformNodes` is always `[]` in snapshot

---

## 3. Outcome Dispatcher

Central dispatcher that routes to outcome-specific executors.

**File**: `functions/src/services/transform/engine/runOutcome.ts`

```ts
import { imageOutcome } from '../outcomes/imageOutcome'
// Future: import { gifOutcome } from '../outcomes/gifOutcome'
// Future: import { videoOutcome } from '../outcomes/videoOutcome'

interface OutcomeContext {
  job: Job
  snapshot: JobSnapshot
  startTime: number
}

type OutcomeExecutor = (ctx: OutcomeContext) => Promise<JobOutput>

const outcomeRegistry: Record<CreateOutcomeType, OutcomeExecutor | null> = {
  image: imageOutcome,
  gif: null,   // Not implemented
  video: null, // Not implemented
}

export async function runOutcome(ctx: OutcomeContext): Promise<JobOutput> {
  const { type } = ctx.snapshot.createOutcome

  const executor = outcomeRegistry[type]

  if (!executor) {
    throw new NonRetryableError(`Outcome type '${type}' is not implemented`)
  }

  return executor(ctx)
}
```

### Acceptance Criteria

- [ ] AC-3.1: Dispatcher reads `createOutcome.type` from snapshot
- [ ] AC-3.2: Routes to correct outcome executor
- [ ] AC-3.3: Throws non-retryable error for unimplemented types
- [ ] AC-3.4: Never reads `transformNodes`

---

## 4. Prompt Resolution

Resolve `@{step:...}` and `@{ref:...}` mentions in prompts.

**File**: `functions/src/services/transform/bindings/resolvePromptMentions.ts`

```ts
import { SessionResponse, MediaReference } from '@clementine/shared'

interface ResolvedPrompt {
  text: string
  mediaRefs: MediaReference[]  // Media to include in generation request
}

export function resolvePromptMentions(
  prompt: string,
  responses: SessionResponse[],
  refMedia: MediaReference[]
): ResolvedPrompt {
  const mediaRefs: MediaReference[] = []

  // Step mentions: @{step:stepName}
  let resolved = prompt.replace(
    /@\{step:([^}]+)\}/g,
    (match, stepName) => {
      const response = responses.find(r => r.stepName === stepName)
      if (!response) {
        console.warn(`Step mention not found: ${stepName}`)
        return match  // Keep original if not found
      }

      // Input step: return text value
      if (response.value !== null) {
        return Array.isArray(response.value)
          ? response.value.join(', ')
          : response.value
      }

      // Capture step: add to media refs, return placeholder
      if (response.media) {
        mediaRefs.push(response.media)
        return `[IMAGE: ${response.stepName}]`
      }

      return match
    }
  )

  // Media mentions: @{ref:displayName}
  resolved = resolved.replace(
    /@\{ref:([^}]+)\}/g,
    (match, displayName) => {
      const media = refMedia.find(m => m.displayName === displayName)
      if (!media) {
        console.warn(`Media mention not found: ${displayName}`)
        return match
      }
      mediaRefs.push(media)
      return `[IMAGE: ${displayName}]`
    }
  )

  return { text: resolved, mediaRefs }
}
```

### Acceptance Criteria

- [ ] AC-4.1: `@{step:stepName}` resolved from responses by stepName
- [ ] AC-4.2: Input step values inserted as text
- [ ] AC-4.3: Capture step media added to mediaRefs
- [ ] AC-4.4: `@{ref:displayName}` resolved from refMedia by displayName
- [ ] AC-4.5: Unresolved mentions logged as warnings, kept in text

---

## 5. Image Outcome Executor

Execute image generation outcome.

**File**: `functions/src/services/transform/outcomes/imageOutcome.ts`

```ts
import { resolvePromptMentions } from '../bindings/resolvePromptMentions'
import { aiGenerateImage } from '../executors/aiGenerateImage'
import { applyOverlay } from '../executors/applyOverlay'

export async function imageOutcome(ctx: OutcomeContext): Promise<JobOutput> {
  const { snapshot, startTime } = ctx
  const { createOutcome, sessionInputs, projectContext } = snapshot
  const { sourceStepId, aiEnabled, imageGeneration } = createOutcome

  // 1. Resolve source media (if specified)
  let sourceMedia: MediaReference | null = null
  if (sourceStepId) {
    const sourceResponse = sessionInputs.responses.find(
      r => r.stepId === sourceStepId
    )
    if (!sourceResponse?.media) {
      throw new NonRetryableError(
        `Source step ${sourceStepId} has no media`
      )
    }
    sourceMedia = sourceResponse.media
  }

  // 2. Passthrough mode (no AI)
  if (!aiEnabled) {
    if (!sourceMedia) {
      throw new NonRetryableError('Passthrough requires source media')
    }

    // Just apply overlay if exists
    const overlay = projectContext.overlays?.[imageGeneration.aspectRatio]
    const finalImage = overlay
      ? await applyOverlay(sourceMedia, overlay)
      : sourceMedia

    return {
      assetId: finalImage.mediaAssetId,
      url: finalImage.url,
      format: 'image',
      dimensions: await getImageDimensions(finalImage),
      sizeBytes: await getFileSize(finalImage),
      thumbnailUrl: null,
      processingTimeMs: Date.now() - startTime,
    }
  }

  // 3. AI generation mode
  const { text: resolvedPrompt, mediaRefs } = resolvePromptMentions(
    imageGeneration.prompt,
    sessionInputs.responses,
    imageGeneration.refMedia
  )

  // 4. Build generation request
  const generationRequest = {
    prompt: resolvedPrompt,
    model: imageGeneration.model,
    aspectRatio: imageGeneration.aspectRatio,
    sourceMedia,           // For image-to-image (optional)
    referenceMedia: mediaRefs,  // Style/content references
  }

  // 5. Generate image
  const generatedImage = await aiGenerateImage(generationRequest)

  // 6. Apply overlay (if exists for aspect ratio)
  const overlay = projectContext.overlays?.[imageGeneration.aspectRatio]
  const finalImage = overlay
    ? await applyOverlay(generatedImage, overlay)
    : generatedImage

  // 7. Return output
  return {
    assetId: finalImage.assetId,
    url: finalImage.url,
    format: 'image',
    dimensions: finalImage.dimensions,
    sizeBytes: finalImage.sizeBytes,
    thumbnailUrl: finalImage.thumbnailUrl,
    processingTimeMs: Date.now() - startTime,
  }
}
```

### Acceptance Criteria

- [ ] AC-5.1: Passthrough mode works (aiEnabled=false, just overlay)
- [ ] AC-5.2: Prompt-only generation works (aiEnabled=true, sourceStepId=null)
- [ ] AC-5.3: Image-to-image works (aiEnabled=true, sourceStepId set)
- [ ] AC-5.4: Prompt mentions resolved before generation
- [ ] AC-5.5: Reference media passed to AI generator
- [ ] AC-5.6: Overlay applied when exists for aspect ratio
- [ ] AC-5.7: Succeeds when no overlay exists

---

## 6. AI Image Generation

Update AI generation to use file paths.

**File**: `functions/src/services/transform/executors/aiGenerateImage.ts`

```ts
interface GenerationRequest {
  prompt: string
  model: AIImageModel
  aspectRatio: AIImageAspectRatio
  sourceMedia: MediaReference | null
  referenceMedia: MediaReference[]
}

export async function aiGenerateImage(
  request: GenerationRequest
): Promise<GeneratedImage> {
  const { prompt, model, aspectRatio, sourceMedia, referenceMedia } = request

  // Load media from storage using filePath (not URL)
  const sourceBuffer = sourceMedia?.filePath
    ? await loadMediaFromStorage(sourceMedia.filePath)
    : null

  const refBuffers = await Promise.all(
    referenceMedia
      .filter(m => m.filePath)
      .map(m => loadMediaFromStorage(m.filePath!))
  )

  // Call AI API...
}
```

### Acceptance Criteria

- [ ] AC-6.1: Media loaded from storage using `filePath`
- [ ] AC-6.2: Does not use `url` for media loading (internal processing)
- [ ] AC-6.3: Handles missing filePath gracefully

---

## 7. Session Result Update

Write result to session after job completion.

```ts
// After successful job completion
await updateSession(sessionId, {
  resultMedia: {
    stepId: 'create',  // Or use outcome type
    assetId: output.assetId,
    url: output.url,
    createdAt: Date.now(),
  },
  jobStatus: 'completed',
})
```

### Acceptance Criteria

- [ ] AC-7.1: `session.resultMedia` updated on job success
- [ ] AC-7.2: `session.jobStatus` updated to reflect job state

---

## Recommended File Structure

```bash
functions/src/services/transform/
├── engine/
│   └── runOutcome.ts           # Outcome dispatcher
├── outcomes/
│   ├── imageOutcome.ts         # Image outcome executor
│   ├── gifOutcome.ts           # (stub) GIF outcome
│   └── videoOutcome.ts         # (stub) Video outcome
├── executors/
│   ├── aiGenerateImage.ts      # AI image generation
│   └── applyOverlay.ts         # Overlay application
└── bindings/
    ├── resolvePromptMentions.ts  # Prompt resolution
    └── resolveSessionInputs.ts   # (if needed)
```

---

## Files Changed

| File | Action |
|------|--------|
| `packages/shared/src/schemas/job/job.schema.ts` | MODIFY |
| Job creation logic | MODIFY |
| `functions/src/services/transform/engine/runOutcome.ts` | CREATE |
| `functions/src/services/transform/outcomes/imageOutcome.ts` | CREATE |
| `functions/src/services/transform/bindings/resolvePromptMentions.ts` | CREATE |
| Existing AI generation executor | MODIFY |
| Existing overlay executor | MODIFY (minor) |

---

## Testing

- [ ] Unit tests for `resolvePromptMentions()`
- [ ] Unit tests for `runOutcome()` dispatcher
- [ ] Integration test: passthrough mode (no AI)
- [ ] Integration test: image outcome with prompt-only
- [ ] Integration test: image outcome with source image
- [ ] Integration test: image outcome with reference media
- [ ] Integration test: overlay application
- [ ] Integration test: job completion updates session
