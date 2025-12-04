# Research: AI Transform Step Playground

**Feature**: 019-ai-transform-playground
**Date**: 2024-12-04

## Overview

Research findings for implementing the AI Transform Step Playground feature. All technical decisions were resolved by examining existing codebase patterns.

## Research Tasks

### 1. Server Action Pattern for Step-Based AI Generation

**Decision**: Adapt the existing `generatePlaygroundPreview` pattern from `ai-presets` module.

**Rationale**:
- The existing server action in `ai-presets/actions/playground-generate.ts` provides a proven pattern
- Key differences: fetch step config from `/experiences/{experienceId}/steps/{stepId}` instead of AI preset
- Same AI client interface (`getAIClient()` from `@/lib/ai/client`)
- Same temp storage pattern for ephemeral test images

**Alternatives Considered**:
- Creating a shared utility module: Rejected - would add unnecessary coupling between deprecated `ai-presets` and active `steps` module
- Inline implementation: Rejected - would duplicate complex logic unnecessarily

**Implementation Notes**:
- Step ID is sufficient; `experienceId` can be read from the step document
- Must validate `step.type === 'ai-transform'` before processing
- Map `step.config` fields to `TransformParams` interface

### 2. UI Component Structure for Horizontal Layout

**Decision**: Create `StepAIPlayground` with responsive horizontal/vertical layout using shadcn/ui Dialog.

**Rationale**:
- Dialog (modal) chosen over Sheet to avoid stacking with existing editor panel
- Horizontal layout (input left, result right) provides clear before/after comparison
- Responsive: stack vertically on mobile (`< md` breakpoint)

**Alternatives Considered**:
- Sheet component: Rejected - awkward stacking with editor panel already on right side
- Full-screen overlay: Rejected - too heavy for quick test iteration workflow
- Inline in editor: Rejected - not enough space for side-by-side comparison

**Implementation Notes**:
- Use `max-w-4xl` (~896px) for comfortable side-by-side on desktop
- Tailwind responsive classes: `flex flex-col md:flex-row`
- Touch targets minimum 44x44px per constitution

### 3. Step Configuration to AI Params Mapping

**Decision**: Direct mapping of step config fields to `TransformParams` interface.

**Rationale**:
- Step's `aiTransformConfigSchema` contains all needed fields
- Simple 1:1 mapping with sensible defaults
- `variables` and `outputType` explicitly ignored per spec

**Mapping**:
| Step Config Field | TransformParams | Default |
|-------------------|-----------------|---------|
| `config.model` | `model` | `'gemini-2.5-flash-image'` |
| `config.prompt` | `prompt` | Required (validation fails without) |
| `config.aspectRatio` | `aspectRatio` | `'1:1'` |
| `config.referenceImageUrls` | `referenceImageUrls` | `[]` |

**Ignored Fields**:
- `config.variables` - No variable substitution in playground (static test only)
- `config.outputType` - Always outputs image (video/GIF not supported in playground)

### 4. Error Handling Strategy

**Decision**: Extend existing `ErrorCodes` in steps module with `AI_GENERATION_FAILED`.

**Rationale**:
- Consistent with existing error code pattern in `steps/actions/types.ts`
- Clear distinction between validation errors and AI service errors
- Enables specific error messaging in UI

**Error Categories**:
1. **Validation Errors** (existing `VALIDATION_ERROR`):
   - Step not found
   - Step type not `ai-transform`
   - No prompt configured
   - Invalid image format/size

2. **Authentication Errors** (existing `PERMISSION_DENIED`):
   - User not authenticated

3. **AI Generation Errors** (new `AI_GENERATION_FAILED`):
   - AI service unavailable
   - Generation timeout
   - AI processing error

### 5. Temporary Storage Cleanup

**Decision**: Reuse existing `playground-temp/` storage path with metadata marking.

**Rationale**:
- Existing pattern in `ai-presets` uses `playground-temp/` prefix
- Files marked with `temporary: "true"` metadata for cleanup
- Signed URLs valid for 15 minutes (sufficient for AI processing)

**Implementation Notes**:
- Same `uploadToTempStorage` pattern from `ai-presets/actions/playground-generate.ts`
- Can be extracted to shared utility if needed in future

## Dependencies

All dependencies already exist in the project:

| Dependency | Purpose | Location |
|------------|---------|----------|
| `@/lib/ai/client` | AI client factory | `web/src/lib/ai/client.ts` |
| `@/lib/firebase/admin` | Admin SDK for Firestore/Storage | `web/src/lib/firebase/admin.ts` |
| `@/lib/auth` | Authentication verification | `web/src/lib/auth.ts` |
| `shadcn/ui Dialog` | Modal component | `@/components/ui/dialog` |
| `lucide-react` | Icons (Upload, Loader2, etc.) | Already installed |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI service latency | Medium | Medium | Live timer shows progress; 2-min timeout |
| Large images slow upload | Low | Low | 10MB limit; client-side validation |
| Step config not saved | Low | Medium | Button disabled if prompt empty |

## Conclusions

All technical decisions resolved. Implementation can proceed with:
1. No new dependencies required
2. Reuse of proven patterns from `ai-presets` module
3. Clear mapping from spec requirements to implementation
