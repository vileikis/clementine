# Research: Transform Cleanup & Guardrails

**Feature Branch**: `063-transform-cleanup`
**Date**: 2026-02-06

## Executive Summary

Research confirms that the outcome-based architecture is **already implemented** and the transform nodes system has been **deprecated but not fully removed**. The cleanup work is primarily about:

1. Removing dead code and references (not removing active UI)
2. Adding guardrails/validation to prevent fallback to deprecated paths
3. Updating documentation and adding deprecation markers

**Key Finding**: There is NO "Generate" tab or Transform Nodes UI to remove - these have already been replaced with the "Create" tab using the outcome system.

---

## 1. Transform Nodes UI - Current State

### Decision: No UI Removal Required

**Rationale**: The Generate tab and Transform Nodes UI have **already been removed** and replaced with the outcome-based "Create" tab.

**Evidence**:

1. **Experience Editor Navigation** (`apps/clementine-app/src/domains/experience/designer/containers/ExperienceDesignerLayout.tsx`):
   - Only 2 tabs exist: "Collect" and "Create"
   - No "Generate" tab present

2. **No Node Editor Components**: The codebase has no:
   - Node type selector
   - Node configuration forms
   - Node preview components
   - Visual node/flow builder

3. **Create Tab is Outcome-Based** (`apps/clementine-app/src/domains/experience/create/`):
   - `OutcomeTypeSelector.tsx` - Selects outcome type (image/gif/video)
   - `SourceImageSelector.tsx` - Selects capture step for source media
   - `AIGenerationToggle.tsx` - Enables/disables AI
   - `PromptComposer/` - Rich text prompt editor

### Files with Deprecated Transform References (to clean up)

| File | Reference | Action |
|------|-----------|--------|
| `domains/experience/shared/utils/hasTransformConfig.ts` | Deprecated functions | Remove file or add deprecation warnings |
| `domains/experience/shared/hooks/useCreateExperience.ts` | `transformNodes: []` initialization | Remove line |
| `domains/experience/designer/hooks/usePublishExperience.ts` | `transformNodes: emptyTransformNodes` | Remove lines 244-249 |
| `domains/experience/transform/` | Entire directory | Evaluate for removal |

### URL Redirect Requirement

- **Current Route**: `/workspace/:workspaceSlug/experiences/:experienceId/create`
- **No `/generate` route exists** to redirect
- **Action**: Verify no external links point to `/generate` URLs

---

## 2. Session Data Handling - Current State

### Decision: Frontend Already Uses `responses[]` Only

**Rationale**: The frontend runtime store and hooks already use `responses[]` exclusively for new data. Deprecated fields exist only for backward compatibility parsing.

**Evidence**:

1. **Runtime Store** (`experienceRuntimeStore.ts`):
   - State: `responses: SessionResponse[]` (no `answers` or `capturedMedia`)
   - Actions: `setResponse()`, `getResponse()`, `getResponses()`
   - `initFromSession()`: Reads `session.responses` with fallback to `session.answers` (needs removal)

2. **Runtime Hook** (`useRuntime.ts`):
   - Public API: `setStepResponse()`, `getResponse()`, `getResponses()`
   - No `setAnswer()` or `setMedia()` exposed

3. **Firestore Sync** (`ExperienceRuntime.tsx`):
   - Writes: `{ responses: store.responses }` only
   - No writes to `answers` or `capturedMedia`

### Frontend Changes Required

| Location | Current State | Required Change |
|----------|---------------|-----------------|
| `experienceRuntimeStore.ts:initFromSession()` | Falls back to `answers` | Remove fallback |
| `useUpdateSessionProgress.ts` | Accepts deprecated fields | Remove deprecated params |

### Cloud Functions - Current State

1. **Job Creation** (`functions/src/repositories/job.ts`):
   - `buildJobSnapshot()` reads `session.responses` only

2. **Outcome Execution** (`functions/src/services/transform/outcomes/imageOutcome.ts`):
   - Reads `snapshot.sessionResponses` (from job snapshot)
   - `getSourceMediaFromResponses()` extracts from `response.data as MediaReference[]`

3. **Prompt Resolution** (`functions/src/services/transform/bindings/resolvePromptMentions.ts`):
   - Iterates over `responses[]` to resolve mentions

**No CF code reads `answers` or `capturedMedia` for execution.**

---

## 3. Transform Node Execution - Current State

### Decision: Already Replaced with Outcome System

**Rationale**: The transform pipeline has been replaced with `runOutcome()`. No node executor registry or pipeline exists.

**Evidence**:

1. **Outcome Registry** (`functions/src/services/transform/engine/runOutcome.ts`):
   ```typescript
   const outcomeRegistry: Record<OutcomeType, OutcomeExecutor | null> = {
     image: imageOutcome,
     gif: null,      // Not implemented
     video: null,    // Not implemented
   }
   ```

2. **Execution Entry Point**: `runOutcome()` is the only execution dispatcher

3. **Job Task Handler** (`functions/src/tasks/transformPipelineJob.ts`):
   - Calls `runOutcome(outcomeContext)` directly
   - No reference to transform nodes or pipeline

4. **Snapshot Structure**: Uses `snapshot.outcome` (not `transformNodes`)

### No Transform Pipeline Removal Required

The old node-based system has been fully replaced. What remains:

| Component | Status | Action |
|-----------|--------|--------|
| Transform node schemas | Exist in shared | Keep for parsing old data |
| `useStartTransformPipeline` hook | Used for job triggering | Rename consideration |

---

## 4. Job Creation Validation - Current State

### Decision: Validation Exists But Needs Enhancement

**Current Validation** (`functions/src/callable/startTransformPipeline.ts`):

| Check | Error Type | Message |
|-------|------------|---------|
| Auth required | `HttpsError('unauthenticated')` | "Must be authenticated..." |
| Request schema | `HttpsError('invalid-argument')` | Zod validation |
| Session exists | `HttpsError('not-found')` | "Session not found" |
| No active job | `HttpsError('already-exists')` | "A job is already in progress..." |
| Experience exists | `HttpsError('not-found')` | "Experience not found" |
| Outcome configured | `HttpsError('invalid-argument')` | "Experience has no outcome configured" |
| Passthrough source | `HttpsError('invalid-argument')` | "Passthrough mode requires source image" |

### Missing Validation (Per PRD)

| Check | Status | Required Message |
|-------|--------|------------------|
| `experience.published` is null | **NOT CHECKED** | "experience is not published" |
| Session has no `responses` | **NOT CHECKED** | "session has no responses" |
| Outcome type not implemented | Checked in `runOutcome()` | Move to creation time |

---

## 5. Runtime Guardrails - Current State

### Decision: Outcome Executor Has Partial Validation

**Current Validation** (`imageOutcome.ts`):

| Check | Status | Error |
|-------|--------|-------|
| Outcome config exists | ✅ | `Error('Outcome configuration is required')` |
| Output path generated | ✅ | `Error('No output path generated')` |
| AI mode has config | ✅ | `Error('Image generation config is required for AI mode')` |
| Passthrough has source | ✅ | Detailed error with captureStepId |

**Missing Validation** (Per PRD):

| Check | Status | Required |
|-------|--------|----------|
| Empty prompt (AI enabled) | **NOT CHECKED** | "Image outcome has empty prompt" |
| Capture step not found | Logs warning, returns null | Should throw error |
| Capture step has no media | Returns null | Should throw error |

---

## 6. Error Handling Patterns

### Current Error Types

| Class | Location | Usage |
|-------|----------|-------|
| `HttpsError` | Firebase | Client-facing callable errors |
| `OutcomeError` | `runOutcome.ts` | Non-retryable outcome errors |
| `AiTransformError` | Gemini provider | AI-specific errors |
| `FFmpegError` | FFmpeg core | Media processing errors |
| `createSanitizedError()` | `job.ts` | Database-safe error objects |

### Error Pattern: All Non-Retryable

- Cloud Task has `maxAttempts: 0`
- All job errors have `isRetryable: false`
- Per spec: All errors are terminal

---

## 7. Schema Field Removal

### Decision: Remove Deprecated Fields from Schemas

**Rationale**: Both schemas use `z.looseObject()` which ignores unknown fields during parsing. Old Firestore documents with deprecated fields will still parse successfully - those fields are simply not mapped to TypeScript types.

**No data migration needed.**

### Session Schema (`packages/shared/src/schemas/session/session.schema.ts`)

| Field | Action | Impact |
|-------|--------|--------|
| `answers` | **REMOVE** | Old docs still parse via looseObject |
| `capturedMedia` | **REMOVE** | Old docs still parse via looseObject |
| `answerSchema` | **REMOVE** | No longer referenced |
| `answerValueSchema` | **REMOVE** | No longer referenced |
| `capturedMediaSchema` | **REMOVE** | No longer referenced |
| `Answer` type export | **REMOVE** | No longer needed |
| `AnswerValue` type export | **REMOVE** | No longer needed |
| `CapturedMedia` type export | **REMOVE** | No longer needed |

### Experience Schema (`packages/shared/src/schemas/experience/experience.schema.ts`)

| Field | Action | Impact |
|-------|--------|--------|
| `transformNodes` | **REMOVE** | Old docs still parse via looseObject |
| `transformNodeSchema` import | **REMOVE** | No longer referenced |

### Transform Schema (`packages/shared/src/schemas/experience/transform.schema.ts`)

| Item | Action | Impact |
|------|--------|--------|
| Entire file | **EVALUATE** | May be unused after cleanup |
| `nodes/` directory | **EVALUATE** | May be unused after cleanup |

### Job Schema - No Changes

| Field | Status | Note |
|-------|--------|------|
| `overlay` | Keep deprecated | Still used in projectContext |
| `applyOverlay` | Keep deprecated | Still used in projectContext |
| `overlays` | Active | Current approach |

---

## 8. Documentation Status

### Functions README (`functions/README.md`)

| Section | Status | Issue |
|---------|--------|-------|
| Transform Pipeline | ✅ Accurate | Describes outcome-based flow |
| Media Processing Pipeline | ⚠️ "Legacy" label | Unclear relationship |
| File Structure | ✅ Accurate | Reflects current structure |

### Route File Comment (`$experienceId.tsx`)

```typescript
// Line 16: "Layout for experience designer routes (collect, generate)."
```
**Issue**: References "generate" which doesn't exist. Should say "collect, create".

---

## 9. Summary of Required Changes

### Category 1: Schema Field Removal (Shared Package)

1. Remove `answers` and `capturedMedia` fields from `sessionSchema`
2. Remove `answerSchema`, `answerValueSchema`, `capturedMediaSchema` definitions
3. Remove `Answer`, `AnswerValue`, `CapturedMedia` type exports
4. Remove `transformNodes` field from `experienceConfigSchema`
5. Remove `transformNodeSchema` import from experience.schema.ts
6. Evaluate `transform.schema.ts` and `nodes/` directory for removal

### Category 2: Dead Code Removal (Frontend)

1. Remove `domains/experience/transform/` directory (or evaluate use)
2. Remove `hasTransformConfig.ts` deprecated functions
3. Remove `transformNodes` initialization in `useCreateExperience.ts`
4. Remove `transformNodes` handling in `usePublishExperience.ts`

### Category 3: Validation Guardrails (Cloud Functions)

1. Add `experience.published` null check in job creation
2. Add `session.responses` empty check in job creation
3. Move unimplemented outcome type check to job creation
4. Add empty prompt validation in image outcome
5. Convert capture step not found from warning to error
6. Convert empty capture media from return null to error

### Category 4: Fallback Removal

1. Remove `answers` fallback in `initFromSession()`
2. Remove deprecated params from `useUpdateSessionProgress`

### Category 5: Deprecation Warnings (Development Only)

1. Add dev warning for `transformNodes` usage (if any code still references)
2. Add dev warning for `answers`/`capturedMedia` usage (if any code still references)

### Category 6: Documentation Updates

1. Fix route comment referencing "generate"
2. Review functions README for clarity

---

## Alternatives Considered

### Keep Deprecated Schema Fields with @deprecated

**Decision**: No - Remove them entirely

**Rationale**:
- Both schemas use `z.looseObject()` which ignores unknown fields
- Old Firestore documents will still parse successfully
- No data migration needed
- Cleaner codebase without deprecated baggage
- Prevents accidental usage of deprecated fields

### Keep Silent Fallbacks for Migration

**Decision**: No

**Rationale**:
- PRD explicitly requires fail-fast behavior
- Silent fallbacks hide issues and create unpredictable behavior
- Better to fail loudly and fix data than mask problems
