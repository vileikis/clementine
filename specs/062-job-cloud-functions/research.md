# Research: Job + Cloud Functions

**Branch**: `062-job-cloud-functions` | **Date**: 2026-02-05

## Summary

Research findings for implementing outcome-based job processing. All technical decisions are informed by existing codebase patterns.

---

## 1. Job Snapshot Schema Evolution

### Decision
Update `jobSnapshotSchema` to use `sessionResponses` array and add `outcome` field while maintaining backward compatibility.

### Rationale
- Existing `sessionInputsSnapshotSchema` has separate `answers` and `capturedMedia` arrays
- New `sessionResponseSchema` unifies these into a single `responses` array with typed `data` field
- Using `z.looseObject()` pattern already established for forward compatibility
- Keep `transformNodes` as deprecated field defaulting to `[]`

### Current Schema (job.schema.ts:109-115)
```typescript
export const jobSnapshotSchema = z.looseObject({
  sessionInputs: sessionInputsSnapshotSchema,  // answers + capturedMedia
  transformNodes: transformNodesSnapshotSchema,
  projectContext: projectContextSnapshotSchema,
  experienceVersion: z.number().int().positive(),
})
```

### New Schema
```typescript
export const jobSnapshotSchema = z.looseObject({
  sessionResponses: z.array(sessionResponseSchema),
  outcome: outcomeSchema,
  transformNodes: z.array(transformNodeSchema).default([]), // deprecated
  projectContext: projectContextSnapshotSchema,
  experienceVersion: z.number().int().positive(),
})
```

### Alternatives Considered
1. **Dual-write both formats** - Rejected: Unnecessary complexity, old jobs use looseObject fallback
2. **Migration script** - Rejected: Old jobs can still be read with looseObject, no migration needed

---

## 2. Outcome Dispatcher Pattern

### Decision
Implement registry-based dispatcher in `engine/runOutcome.ts` that routes to type-specific executors.

### Rationale
- Clean separation between routing logic and execution logic
- Easy to add gif/video executors later
- Follows Open/Closed principle
- Matches PRD 3 specification exactly

### Pattern
```typescript
const outcomeRegistry: Record<OutcomeType, OutcomeExecutor | null> = {
  image: imageOutcome,
  gif: null,   // Not implemented
  video: null, // Not implemented
}
```

### Alternatives Considered
1. **Switch statement** - Rejected: Less extensible, harder to test
2. **Dynamic imports** - Rejected: Over-engineering for 3 outcome types

---

## 3. Prompt Resolution Strategy

### Decision
Create `bindings/resolvePromptMentions.ts` that handles both `@{step:stepName}` and `@{ref:displayName}` patterns.

### Rationale
- Existing `ai-image.ts:163-182` resolves by `stepId`, new system uses `stepName`
- New system needs to handle multi-select arrays as comma-separated values
- Capture steps return `MediaReference[]` which must be added to generation request

### Data Type Handling
| Step Type | `data` Type | Resolution |
|-----------|-------------|------------|
| input.scale, input.shortText | `string` | Insert as text |
| input.multiSelect | `MultiSelectOption[]` | Extract `.value` as comma-separated |
| capture.photo | `MediaReference[]` | Add to mediaRefs, insert placeholder |

### Alternatives Considered
1. **Separate functions per type** - Rejected: Single pass is simpler
2. **Template engine** - Rejected: Over-engineering for simple placeholders

---

## 4. Executor Refactoring Strategy

### Decision
Refactor existing atomic operations into `executors/` folder with consistent naming:
- `ai-image.ts` → `executors/aiGenerateImage.ts`
- `overlay.ts` → `executors/applyOverlay.ts`

### Rationale
- Reuse existing working code (Vertex AI integration, FFmpeg overlay)
- Clear separation: executors (atomic) vs outcomes (orchestration)
- Follows PRD 3 recommended file structure
- Enables future executors: `swapBackground.ts`, `aiGenerateVideo.ts`

### Changes to ai-image.ts → aiGenerateImage.ts
1. Rename file and export function
2. Update to accept `SessionResponse[]` instead of `Answer[]` + `CapturedMedia[]`
3. Update prompt resolution to use `stepName` (not `stepId`)
4. Accept `GenerationRequest` interface instead of `AIImageNode`

### Changes to overlay.ts → applyOverlay.ts
1. Move to `executors/` folder
2. Rename export to `applyOverlay()`
3. Update to accept overlay by aspect ratio lookup
4. Simplify interface (remove `applyOverlayIfConfigured` wrapper)

---

## 5. Image Outcome Executor Flow

### Decision
Implement `outcomes/imageOutcome.ts` with passthrough and AI generation modes.

### Rationale
- Follows PRD 3 specification for passthrough vs AI modes
- Orchestrates atomic executors (`aiGenerateImage`, `applyOverlay`)
- Clean separation from low-level AI/FFmpeg operations

### Flow Diagram
```
imageOutcome(ctx) {
  1. Extract captureStepId → sourceMedia (if set)
  2. If !aiEnabled → passthrough mode
     - Apply overlay (if exists)
     - Return captured media
  3. Resolve prompt mentions → resolvedPrompt + mediaRefs
  4. Build generation request
  5. Call AI service
  6. Apply overlay (if exists)
  7. Return output
}
```

### Overlay Lookup
Current overlay is stored per aspect ratio in `projectContext.overlays`:
```typescript
overlays: { '1:1': OverlayReference, '9:16': OverlayReference }
```

Lookup: `projectContext.overlays?.[imageGeneration.aspectRatio]`

---

## 6. Error Handling Strategy

### Decision
Use non-retryable errors for all validation failures with descriptive messages.

### Rationale
- PRD specifies non-retryable errors for invalid configurations
- Existing `SANITIZED_ERROR_MESSAGES` pattern in job.ts
- Existing `NonRetryableError` class in functions codebase

### Error Categories
| Condition | Error Code | Message |
|-----------|------------|---------|
| No outcome type | `INVALID_INPUT` | "Experience has no outcome configured" |
| Passthrough without capture | `INVALID_INPUT` | "Passthrough mode requires source image" |
| Unimplemented type | `INVALID_INPUT` | "Outcome type 'X' is not implemented" |
| Missing capture media | `PROCESSING_FAILED` | "Capture step has no media" |

---

## 7. Media Loading Strategy

### Decision
Load media from Firebase Storage using `filePath` field, not URL.

### Rationale
- PRD 3 specifies `filePath` for internal processing
- Existing `downloadFromStorage` and `getStoragePathFromMediaReference` utilities
- URLs are for client delivery, filePaths are for server processing

### Existing Utilities
- `functions/src/infra/storage.ts`:
  - `downloadFromStorage(storagePath, localPath)`
  - `getStoragePathFromMediaReference(ref)`
  - `parseStorageUrl(url)` - fallback if filePath missing

---

## 8. Session Update Pattern

### Decision
Update session with `resultMedia` and `jobStatus` after job completion.

### Rationale
- Existing `updateSessionResultMedia` in session repository
- Existing `updateSessionJobStatus` pattern
- Matches PRD 3 specification

### Session Fields
```typescript
session.resultMedia = {
  stepId: 'create',
  assetId: output.assetId,
  url: output.url,
  createdAt: Date.now(),
}
session.jobStatus = 'completed'
```

---

## File Change Summary

### Shared Package

| File | Action | Description |
|------|--------|-------------|
| `packages/shared/src/schemas/job/job.schema.ts` | MODIFY | Add `sessionResponses`, `outcome` to snapshot |

### Functions - Entry Points

| File | Action | Description |
|------|--------|-------------|
| `functions/src/repositories/job.ts` | MODIFY | Update `buildJobSnapshot()` to use responses + outcome |
| `functions/src/callable/startTransformPipeline.ts` | MODIFY | Validate outcome instead of transformNodes |
| `functions/src/tasks/transformPipelineJob.ts` | MODIFY | Call `runOutcome()` instead of `executeTransformPipeline()` |

### Functions - Transform Service (New Structure)

| File | Action | Description |
|------|--------|-------------|
| `services/transform/index.ts` | MODIFY | Update exports for new structure |
| `services/transform/types.ts` | MODIFY | Add `OutcomeContext` interface |
| `services/transform/engine/runOutcome.ts` | CREATE | Outcome dispatcher |
| `services/transform/outcomes/imageOutcome.ts` | CREATE | Image outcome executor (orchestrates executors) |
| `services/transform/executors/index.ts` | MODIFY | Update exports |
| `services/transform/executors/aiGenerateImage.ts` | CREATE | AI image generation (refactored from ai-image.ts) |
| `services/transform/executors/applyOverlay.ts` | CREATE | Overlay application (refactored from overlay.ts) |
| `services/transform/bindings/resolvePromptMentions.ts` | CREATE | Prompt resolution |

### Functions - Transform Service (Deleted)

| File | Action | Description |
|------|--------|-------------|
| `services/transform/pipeline-runner.ts` | DELETE | Replaced by outcome dispatcher |
| `services/transform/overlay.ts` | DELETE | Moved to executors/applyOverlay.ts |
| `services/transform/executors/ai-image.ts` | DELETE | Replaced by aiGenerateImage.ts |

---

## Entry Point Changes

### startTransformPipeline.ts (Callable - Job Creation)

**Current validation (lines 80-86):**
```typescript
const transformNodes = config?.transformNodes ?? []
if (transformNodes.length === 0) {
  throw new HttpsError('not-found', 'Experience has no transform configuration')
}
```

**New validation:**
```typescript
const outcome = config?.outcome
if (!outcome?.type) {
  throw new HttpsError('invalid-argument', 'Experience has no outcome configured')
}
if (!outcome.aiEnabled && !outcome.captureStepId) {
  throw new HttpsError('invalid-argument', 'Passthrough mode requires source image')
}
```

### transformPipelineJob.ts (Cloud Task - Job Execution)

**Current execution (line 73):**
```typescript
const pipelineResult = await executeTransformPipeline(context)
```

**New execution:**
```typescript
const outcomeContext: OutcomeContext = {
  job,
  snapshot: job.snapshot,
  startTime: Date.now(),
  tmpDir: context.tmpDir,
}
const output = await runOutcome(outcomeContext)
```

---

## Dependencies

All dependencies are already available in the codebase:
- `@clementine/shared` - Zod schemas
- `@google/genai` - Vertex AI client
- `firebase-functions/v2` - Cloud Functions
- `firebase-admin` - Firestore, Storage
