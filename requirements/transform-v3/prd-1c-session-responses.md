# PRD 1C: Session Responses + Guest Runtime

**Epic**: [Outcome-based Create](./epic.md)
**Status**: Draft
**Dependencies**: PRD 1A (Schema Foundations)
**Enables**: PRD 3 (Job + CF)

---

## Overview

Update session schema to use unified `responses[]` array and modify guest runtime to write responses instead of separate `answers[]` and `capturedMedia[]`.

### Key Design Decisions

- **No separate `media` field** - capture media stored in `context` as `MediaReference[]`
- **Captures always use array** - even single photo/video uses `[MediaReference]` for consistency
- **`value` is null for captures** - no analytical use case for asset IDs as primitive values
- **`@{step:...}` works for all steps** - inputs and captures both referenceable in prompts

### Context Shape by Step Type

| Step Type | `value` | `context` |
|-----------|---------|-----------|
| `input.shortText` | `"user text"` | `null` |
| `input.longText` | `"user text"` | `null` |
| `input.scale` | `"1"` to `"5"` | `null` |
| `input.yesNo` | `"yes"` or `"no"` | `null` |
| `input.multiSelect` | `["opt1", "opt2"]` | `MultiSelectOption[]` |
| `capture.photo` | `null` | `MediaReference[]` (1 item) |
| `capture.gif` | `null` | `MediaReference[]` (4 items) |
| `capture.video` | `null` | `MediaReference[]` (1 item) |

---

## 1. Session Schema Update

Add `responses` field, deprecate `answers` and `capturedMedia`.

**File**: `packages/shared/src/schemas/session/session.schema.ts`

```ts
import { sessionResponseSchema } from './session-response.schema'

export const sessionSchema = z.looseObject({
  // ... existing identity, context, mode, state fields ...

  /**
   * ACCUMULATED DATA
   */

  /** @deprecated Use responses instead */
  answers: z.array(answerSchema).default([]),

  /** @deprecated Use responses instead */
  capturedMedia: z.array(capturedMediaSchema).default([]),

  /** Unified responses from all steps (input + capture) */
  responses: z.array(sessionResponseSchema).default([]),

  /** Final result media from transform/capture */
  resultMedia: sessionResultMediaSchema.nullable().default(null),

  // ... rest of existing fields ...
})
```

### Acceptance Criteria

- [ ] AC-1.1: `sessionSchema` includes `responses` field
- [ ] AC-1.2: `answers` and `capturedMedia` fields marked `@deprecated` but still exist (backward compatible)
- [ ] AC-1.3: Default `responses` is empty array
- [ ] AC-1.4: JSDoc comments reference cleanup in PRD 4

---

## 2. Runtime Store Update

Update Zustand store to manage responses instead of separate answers/capturedMedia.

**File**: `apps/clementine-app/src/domains/experience/runtime/stores/experienceRuntimeStore.ts`

### State Changes

```ts
interface ExperienceRuntimeState {
  // ... existing fields ...

  /** @deprecated Use responses instead */
  answers: Answer[]
  /** @deprecated Use responses instead */
  capturedMedia: CapturedMedia[]

  /** Unified responses from all steps */
  responses: SessionResponse[]
}

interface ExperienceRuntimeActions {
  // ... existing actions ...

  /** @deprecated Use setResponse instead */
  setAnswer: (stepId: string, stepType: string, value: AnswerValue, context?: unknown) => void
  /** @deprecated Use setResponse instead */
  setCapturedMedia: (stepId: string, assetId: string, url: string) => void

  /** Set a response for a step (unified for input and capture) */
  setResponse: (response: SessionResponse) => void
}
```

### Implementation

```ts
setResponse: (response) => {
  set((state) => {
    const existingIndex = state.responses.findIndex(r => r.stepId === response.stepId)
    const newResponses = existingIndex >= 0
      ? state.responses.map((r, i) => i === existingIndex ? response : r)
      : [...state.responses, response]

    return { responses: newResponses }
  })
}
```

### Acceptance Criteria

- [ ] AC-2.1: Store has `responses` state field
- [ ] AC-2.2: `setResponse()` action adds/updates response by `stepId`
- [ ] AC-2.3: Old `setAnswer()` and `setCapturedMedia()` still exist (for gradual migration)

---

## 3. Runtime Hook Update

Expose `setResponse` through the runtime hook.

**File**: `apps/clementine-app/src/domains/experience/runtime/hooks/useRuntime.ts`

### API Changes

```ts
interface RuntimeAPI {
  // ... existing methods ...

  /** Set a response for a step */
  setResponse: (params: SetResponseParams) => void

  /** Get response for a step */
  getResponse: (stepId: string) => SessionResponse | undefined

  /** Get all responses */
  getResponses: () => SessionResponse[]
}

interface SetResponseParams {
  step: ExperienceStep
  value?: AnswerValue
  context?: unknown  // MultiSelectOption[] for multi-select, MediaReference[] for captures
}
```

### Implementation

```ts
const setResponse = useCallback((params: SetResponseParams) => {
  const { step, value = null, context = null } = params
  const now = Date.now()

  const response: SessionResponse = {
    stepId: step.id,
    stepName: step.name,  // From step definition
    stepType: step.type,
    value,
    context,  // MultiSelectOption[] for multi-select, MediaReference[] for captures
    createdAt: now,
    updatedAt: now,
  }

  store.setResponse(response)
}, [store])
```

### Acceptance Criteria

- [ ] AC-3.1: `setResponse()` available from `useRuntime()`
- [ ] AC-3.2: `stepName` automatically populated from step definition
- [ ] AC-3.3: Timestamps (`createdAt`, `updatedAt`) auto-set
- [ ] AC-3.4: No `media` parameter - captures pass `MediaReference[]` via `context`

---

## 4. Firestore Sync Update

Update sync logic to write `responses` to Firestore.

**File**: `apps/clementine-app/src/domains/experience/runtime/containers/ExperienceRuntime.tsx`

### Changes

```ts
const syncToFirestore = useCallback(async () => {
  if (!sessionId) return

  const state = runtime.getState()

  await updateProgress({
    sessionId,
    projectId,
    // Write responses instead of answers/capturedMedia
    responses: state.responses,
  })
}, [sessionId, projectId, runtime, updateProgress])
```

**File**: `apps/clementine-app/src/domains/session/shared/hooks/useUpdateSessionProgress.ts`

### Input Schema Update

```ts
export const updateSessionProgressInputSchema = z.object({
  sessionId: z.string(),
  projectId: z.string(),
  // Add responses
  responses: z.array(sessionResponseSchema).optional(),
  // Keep old fields for migration period (optional)
  answers: z.array(answerSchema).optional(),
  capturedMedia: z.array(capturedMediaSchema).optional(),
})
```

### Mutation Update

```ts
// In mutation function
if (responses) {
  updates.responses = responses
}
// Don't write answers/capturedMedia anymore
```

### Acceptance Criteria

- [ ] AC-4.1: `responses` written to Firestore session document
- [ ] AC-4.2: Old `answers`/`capturedMedia` fields NOT written for new sessions
- [ ] AC-4.3: Firestore transaction succeeds with responses array

---

## 5. Guest Component Updates

Update guest components to use `setResponse`.

**File**: `apps/clementine-app/src/domains/guest/components/GuestRuntimeContent.tsx`

### Input Step Handler

```ts
const handleAnswer = useCallback((value: AnswerValue, context?: unknown) => {
  if (!currentStep) return

  runtime.setResponse({
    step: currentStep,
    value,
    context,
  })
}, [currentStep, runtime])
```

### Capture Step Handler

```ts
const handleCapture = useCallback((assets: MediaAsset | MediaAsset[]) => {
  if (!currentStep) return

  // Normalize to array (photo/video = 1 item, gif = 4 items)
  const assetArray = Array.isArray(assets) ? assets : [assets]

  // Build MediaReference[] for context
  const mediaRefs: MediaReference[] = assetArray.map((asset, index) => ({
    mediaAssetId: asset.id,
    url: asset.url,
    filePath: asset.filePath,  // Include for CF processing
    displayName: assetArray.length > 1
      ? `${currentStep.name} ${index + 1}`
      : currentStep.name,
  }))

  runtime.setResponse({
    step: currentStep,
    context: mediaRefs,  // MediaReference[] - always array
  })
}, [currentStep, runtime])
```

### Acceptance Criteria

- [ ] AC-5.1: Input steps call `setResponse` with `value` and optional `context`
- [ ] AC-5.2: Capture steps call `setResponse` with `context` as `MediaReference[]`
- [ ] AC-5.3: `filePath` included in each MediaReference for CF processing
- [ ] AC-5.4: Both preview and guest flows use same codepath
- [ ] AC-5.5: Photo/video captures pass single-item array, GIF passes 4-item array

---

## 6. Response Shape Examples

### Input Step Response (text)

```ts
{
  stepId: "uuid-123",
  stepName: "Favorite Color",
  stepType: "input.shortText",
  value: "Blue",
  context: null,
  createdAt: 1706745600000,
  updatedAt: 1706745600000,
}
```

### Input Step Response (multi-select)

```ts
{
  stepId: "uuid-456",
  stepName: "Pet Choice",
  stepType: "input.multiSelect",
  value: ["cat", "dog"],
  context: [
    { value: "cat", promptFragment: "a cute cat", promptMedia: null },
    { value: "dog", promptFragment: "a friendly dog", promptMedia: null },
  ],
  createdAt: 1706745600000,
  updatedAt: 1706745600000,
}
```

### Capture Step Response (photo)

```ts
{
  stepId: "uuid-789",
  stepName: "Your Photo",
  stepType: "capture.photo",
  value: null,
  context: [{
    mediaAssetId: "asset-abc",
    url: "https://storage.../photo.jpg",
    filePath: "projects/proj-1/sessions/sess-1/captures/photo.jpg",
    displayName: "Your Photo",
  }],
  createdAt: 1706745600000,
  updatedAt: 1706745600000,
}
```

### Capture Step Response (gif - 4 frames)

```ts
{
  stepId: "uuid-012",
  stepName: "Your GIF",
  stepType: "capture.gif",
  value: null,
  context: [
    {
      mediaAssetId: "asset-1",
      url: "https://storage.../frame1.jpg",
      filePath: "projects/proj-1/sessions/sess-1/captures/frame1.jpg",
      displayName: "Your GIF 1",
    },
    {
      mediaAssetId: "asset-2",
      url: "https://storage.../frame2.jpg",
      filePath: "projects/proj-1/sessions/sess-1/captures/frame2.jpg",
      displayName: "Your GIF 2",
    },
    {
      mediaAssetId: "asset-3",
      url: "https://storage.../frame3.jpg",
      filePath: "projects/proj-1/sessions/sess-1/captures/frame3.jpg",
      displayName: "Your GIF 3",
    },
    {
      mediaAssetId: "asset-4",
      url: "https://storage.../frame4.jpg",
      filePath: "projects/proj-1/sessions/sess-1/captures/frame4.jpg",
      displayName: "Your GIF 4",
    },
  ],
  createdAt: 1706745600000,
  updatedAt: 1706745600000,
}
```

---

## Files Changed

| File | Action |
|------|--------|
| `packages/shared/src/schemas/session/session.schema.ts` | MODIFY |
| `apps/clementine-app/src/domains/experience/runtime/stores/experienceRuntimeStore.ts` | MODIFY |
| `apps/clementine-app/src/domains/experience/runtime/hooks/useRuntime.ts` | MODIFY |
| `apps/clementine-app/src/domains/experience/runtime/containers/ExperienceRuntime.tsx` | MODIFY |
| `apps/clementine-app/src/domains/session/shared/hooks/useUpdateSessionProgress.ts` | MODIFY |
| `apps/clementine-app/src/domains/session/shared/types/session-api.types.ts` | MODIFY |
| `apps/clementine-app/src/domains/guest/components/GuestRuntimeContent.tsx` | MODIFY |

---

## Testing

- [ ] Unit tests for `setResponse` store action
- [ ] Unit tests for response shape validation
- [ ] Integration test: input step writes response to Firestore
- [ ] Integration test: capture step writes response with `MediaReference[]` in context
- [ ] Integration test: `filePath` included in each MediaReference
- [ ] Integration test: response includes stepName from step definition
- [ ] Integration test: GIF capture writes 4-item `MediaReference[]` in context
- [ ] E2E test: complete guest flow writes all responses correctly

---

## Cleanup Notes

The deprecated `answers[]` and `capturedMedia[]` fields should be removed in PRD 4 (Cleanup) after:
1. All runtime code uses `responses[]`
2. Cloud Functions read from `responses[]`
3. Analytics/reporting migrated to query `responses[]`

See PRD 4 for cleanup tasks.
