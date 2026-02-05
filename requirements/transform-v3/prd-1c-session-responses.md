# PRD 1C: Session Responses + Guest Runtime

**Epic**: [Outcome-based Create](./epic.md)
**Status**: ✅ Complete
**Dependencies**: PRD 1A (Schema Foundations)
**Enables**: PRD 3 (Job + CF)

---

## Overview

Update session schema to use unified `responses[]` array and modify guest runtime to write responses instead of separate `answers[]` and `capturedMedia[]`.

### Key Design Decisions

- **Unified `data` field** - replaces separate `value`/`context` for better type safety
- **No separate `media` field** - capture media stored in `data` as `MediaReference[]`
- **Captures always use array** - even single photo/video uses `[MediaReference]` for consistency
- **`@{step:...}` works for all steps** - inputs and captures both referenceable in prompts
- **Deprecated fields not written** - new sessions only write to `responses[]`, not `answers[]`/`capturedMedia[]`

### Data Shape by Step Type

| Step Type | `data` |
|-----------|--------|
| `input.shortText` | `"user text"` (string) |
| `input.longText` | `"user text"` (string) |
| `input.scale` | `"1"` to `"5"` (string) |
| `input.yesNo` | `"yes"` or `"no"` (string) |
| `input.multiSelect` | `MultiSelectOption[]` |
| `capture.photo` | `MediaReference[]` (1 item) |
| `capture.gif` | `MediaReference[]` (4 items) |
| `capture.video` | `MediaReference[]` (1 item) |

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

- [x] AC-1.1: `sessionSchema` includes `responses` field
- [x] AC-1.2: `answers` and `capturedMedia` fields marked `@deprecated` but still exist (backward compatible)
- [x] AC-1.3: Default `responses` is empty array
- [x] AC-1.4: JSDoc comments reference cleanup in PRD 4

---

## 2. Runtime Store Update

Update Zustand store to manage responses instead of separate answers/capturedMedia.

**File**: `apps/clementine-app/src/domains/experience/runtime/stores/experienceRuntimeStore.ts`

### State Changes

```ts
interface ExperienceRuntimeState {
  // ... existing fields ...

  /** Unified responses from all steps */
  responses: SessionResponse[]
}

interface ExperienceRuntimeActions {
  // ... existing actions ...

  /** Set a response for a step (unified for input and capture) */
  setResponse: (response: SessionResponse) => void

  /** Get response for a specific step */
  getResponse: (stepId: string) => SessionResponse | undefined

  /** Get all responses */
  getResponses: () => SessionResponse[]
}
```

### Implementation

```ts
setResponse: (response) => {
  set((state) => {
    const existingIndex = state.responses.findIndex(r => r.stepId === response.stepId)
    const now = Date.now()
    const newResponses = existingIndex >= 0
      ? state.responses.map((r, i) =>
          i === existingIndex
            ? {
                ...response,
                // Preserve original createdAt from existing response
                createdAt: r.createdAt,
                updatedAt: now,
              }
            : r,
        )
      : [...state.responses, { ...response, updatedAt: now }]

    return { responses: newResponses }
  })
}
```

### Acceptance Criteria

- [x] AC-2.1: Store has `responses` state field
- [x] AC-2.2: `setResponse()` action adds/updates response by `stepId`
- [x] AC-2.3: Deprecated fields removed - new sessions only write to `responses[]`

---

## 3. Runtime Hook Update

Expose `setResponse` through the runtime hook.

**File**: `apps/clementine-app/src/domains/experience/runtime/hooks/useRuntime.ts`

### API Changes

```ts
interface RuntimeAPI {
  // ... existing methods ...

  /** Set a response for a step (unified format) */
  setStepResponse: (step: ExperienceStep, data: SessionResponseData | null) => void

  /** Get response for a step */
  getResponse: (stepId: string) => SessionResponse | undefined

  /** Get all responses */
  getResponses: () => SessionResponse[]
}

// SessionResponseData is a union type:
type SessionResponseData =
  | string                    // Simple inputs (scale, yesNo, shortText, longText)
  | MultiSelectOption[]       // Multi-select input
  | MediaReference[]          // Capture steps (photo, video, gif)
```

### Implementation

```ts
/**
 * Build a SessionResponse from step and data.
 */
function buildSessionResponse(
  step: ExperienceStep,
  data: SessionResponseData | null,
  existingCreatedAt?: number,
): SessionResponse {
  const now = Date.now()
  return {
    stepId: step.id,
    stepName: step.name,
    stepType: step.type,
    data,
    createdAt: existingCreatedAt ?? now,
    updatedAt: now,
  }
}

const setStepResponse = useCallback(
  (step: ExperienceStep, data: SessionResponseData | null) => {
    const existingResponse = store.getResponse(step.id)
    const response = buildSessionResponse(step, data, existingResponse?.createdAt)
    store.setResponse(response)
  },
  [store],
)
```

### Acceptance Criteria

- [x] AC-3.1: `setStepResponse()` available from `useRuntime()`
- [x] AC-3.2: `stepName` automatically populated from step definition
- [x] AC-3.3: Timestamps (`createdAt`, `updatedAt`) auto-set, `createdAt` preserved on updates
- [x] AC-3.4: Unified `data` parameter accepts `string | MultiSelectOption[] | MediaReference[]`

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

- [x] AC-4.1: `responses` written to Firestore session document
- [x] AC-4.2: Old `answers`/`capturedMedia` fields NOT written for new sessions
- [x] AC-4.3: Firestore transaction succeeds with responses array

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

- [x] AC-5.1: Input steps call `setStepResponse` with `data` as string
- [x] AC-5.2: Multi-select steps call `setStepResponse` with `data` as `MultiSelectOption[]`
- [x] AC-5.3: Capture steps call `setStepResponse` with `data` as `MediaReference[]`
- [x] AC-5.4: Both preview and guest flows use same codepath
- [x] AC-5.5: Photo/video captures pass single-item array, GIF passes 4-item array

---

## 6. Response Shape Examples

### Input Step Response (text)

```ts
{
  stepId: "uuid-123",
  stepName: "Favorite Color",
  stepType: "input.shortText",
  data: "Blue",
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
  data: [
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
  data: [{
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
  data: [
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
