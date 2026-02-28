# Research: Gemini 3.1 Flash Image Model Support

**Feature**: 085-gemini-3-1-model
**Date**: 2026-02-28

## Research Tasks

### 1. Region Routing for New Model

**Decision**: Use `global` region for `gemini-3.1-flash-image-preview`, identical to `gemini-3-pro-image-preview`.

**Rationale**: User explicitly stated "it is only available in the global region. Same as gemini-3-pro-image-preview." The existing `getLocationForModel()` function in `aiGenerateImage.ts` already implements per-model region routing with a condition for global models.

**Alternatives considered**:
- Environment variable per model — rejected: unnecessary complexity for a static constraint
- Config file / lookup table — rejected: the inline condition is the established pattern and only 2 models need global routing

### 2. Shared Schema Extension Pattern

**Decision**: Add `'gemini-3.1-flash-image-preview'` to the `aiImageModelSchema` Zod enum in `packages/shared/`.

**Rationale**: The `aiImageModelSchema` is the single source of truth for valid model identifiers. Adding a value to `z.enum()` automatically updates the `AIImageModel` TypeScript type via `z.infer`. All downstream consumers (frontend, backend) import from this schema.

**Alternatives considered**:
- Separate config file for models — rejected: breaks established Zod-first validation pattern
- Runtime model registry — rejected: over-engineering for a static enum

### 3. Frontend Model Display

**Decision**: Add `{ value: 'gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash' }` to `AI_IMAGE_MODELS` in `model-options.ts`.

**Rationale**: The `AI_IMAGE_MODELS` constant feeds directly into `IMAGE_MODALITY.modelOptions`, which is consumed by the `PromptComposer` → `ControlRow` component chain. No other UI changes needed — the dropdown auto-renders from this array.

**Alternatives considered**:
- Generate model options from Zod schema — rejected: labels need human-friendly names not derivable from enum values

### 4. Default Model Behavior

**Decision**: Keep `gemini-2.5-flash-image` as the default model for new experiences.

**Rationale**: The new model is a preview model. The default should remain the stable, cost-effective option. The schema default in `imageGenerationConfigSchema` is `'gemini-2.5-flash-image'` and remains unchanged.

## No Unresolved Items

All technical decisions are clear. No NEEDS CLARIFICATION markers remain.
