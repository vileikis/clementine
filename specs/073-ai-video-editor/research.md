# Research: AI Video Editor

**Branch**: `073-ai-video-editor` | **Date**: 2026-02-19

## R1: Existing Outcome Type Architecture

**Decision**: Follow the per-type config architecture established in Phase 1 (072-outcome-schema-redesign).

**Rationale**: The outcome schema already uses per-type nullable configs. AI Video has a slot (`aiVideo: null`) in the outcome schema. The pattern of preserving non-active configs during type switching is already implemented. The new AI Video config form just needs to follow the same patterns as Photo and AI Image.

**Alternatives considered**:
- New architecture: Rejected — would break consistency and require reworking existing Phase 1 code
- Shared base config: Rejected — each type has distinct enough fields that a shared base adds complexity without benefit

## R2: AI Video Task Schema Structure

**Decision**: The `aiVideoTaskSchema` exists in shared package but is NOT exported. It needs to be exported as `AIVideoTask` type for frontend consumption.

**Rationale**: The `aiImageTaskSchema` is exported and used extensively in the frontend. The AI Video task selector needs the same pattern. The schema defines `['animate', 'transform', 'reimagine']` and is used within `aiVideoOutcomeConfigSchema`.

**Findings**:
- `aiVideoTaskSchema` — defined at `packages/shared/src/schemas/experience/outcome.schema.ts:104` as `const` (not `export const`)
- `AIVideoOutcomeConfig` — already exported (type)
- `VideoGenerationConfig` — already exported (type)
- `VideoAspectRatio` — already exported (type) from `aspect-ratio.schema.ts`
- `VIDEO_ASPECT_RATIOS` — already exported (constant) from `aspect-ratio.schema.ts`

**Action needed**: Export `aiVideoTaskSchema` and `AIVideoTask` type.

## R3: AI Video Model Enum

**Decision**: Define a formal `aiVideoModelSchema` Zod enum in the shared package with two known models: `veo-3.1-generate-001` and `veo-3.1-fast-generate-001`. Update `videoGenerationConfigSchema.model` to use this enum instead of `z.string()`.

**Rationale**: The actual video generation models are known (Veo 3.1 standard and fast variants). Defining a proper enum provides type safety, matches the pattern used by `aiImageModelSchema`, and prevents invalid model values from being saved. The default should be the fast variant for better UX during testing.

**Models**:
- `veo-3.1-generate-001` — Standard quality (label: "Veo 3.1")
- `veo-3.1-fast-generate-001` — Fast generation (label: "Veo 3.1 Fast")

**Alternatives considered**:
- Generic `z.string()` with frontend placeholder: Rejected — models are now known, no reason to defer
- Single model only: Rejected — two variants available, users should choose speed vs quality

## R4: PromptComposer Reuse for Frame Generation

**Decision**: Reuse the existing `PromptComposer` component for frame image generation configs (startFrameImageGen, endFrameImageGen).

**Rationale**: Each frame generation config has the same fields as the AI Image's imageGeneration: prompt (with mention support), model, refMedia. The `PromptComposer` already accepts all these via props and supports `@{step:...}` and `@{ref:...}` mentions. The `hideAspectRatio` prop (default `true`) already hides the aspect ratio selector, which is correct for frame configs.

**Key props mapping**:
- `prompt` → `frameGen.prompt`
- `model` → `frameGen.model` (AI image model, not video model)
- `refMedia` → `frameGen.refMedia`
- `hideAspectRatio` → `true` (inherited from parent)
- `modelOptions` → `AI_IMAGE_MODELS` (same as AI Image)

## R5: useRefMediaUpload Hook Adaptation

**Decision**: The existing `useRefMediaUpload` hook is hardcoded to read `outcome.aiImage.imageGeneration.refMedia.length`. It needs to be generalized or a new hook created for AI Video frame configs.

**Rationale**: AI Video has up to two independent reference media collections (startFrameImageGen.refMedia and endFrameImageGen.refMedia). The current hook reads from a fixed path. We need a way to pass the current ref media count.

**Options evaluated**:
1. **Refactor hook to accept refMedia array directly** — cleanest, decouples from outcome shape
2. **Create separate hook for AI Video** — duplication, harder to maintain
3. **Pass a fake outcome** — hacky, already done for AI Image (`outcomeForUpload = { aiImage: config } as Outcome`)

**Decision**: Refactor `useRefMediaUpload` to accept `currentRefMedia: MediaReference[]` instead of `outcome: Outcome`. This decouples the hook from the outcome shape and makes it reusable for any config with ref media. The AI Image config form will pass `config.imageGeneration.refMedia`, and AI Video frame configs will pass `frameGen.refMedia`.

## R6: Aspect Ratio Cascade to Capture Step

**Decision**: Implement aspect ratio cascade at the `AIVideoConfigForm` level, same as the existing pattern in Photo/AI Image.

**Rationale**: When the creator changes the AI Video aspect ratio, the referenced capture step's aspect ratio should update to match. The spec requires this. The `onConfigChange` callback already handles this — the capture step config is updated via the experience's step editing mechanism.

**Finding**: The current Photo and AI Image forms handle aspect ratio as a local config change. The cascade to capture step config is NOT implemented in the current codebase — it's a TODO from Phase 1. For Phase 2, we will implement the same pattern: aspect ratio is stored on the AI Video config, and cascade is a separate concern to be addressed.

## R7: Video Generation Config UI

**Decision**: Create a dedicated `VideoGenerationSection` component for the video-specific fields (prompt, model, duration) that is distinct from the PromptComposer used for image generation.

**Rationale**: Video generation config differs from image generation config:
- Has `duration` field (not present in image generation)
- Uses video model (string), not AI image model (enum)
- Does NOT have reference media
- Does NOT need aspect ratio (inherited from parent)

The PromptComposer is designed for image generation with ref media, mentions, and model/aspect ratio. Forcing video generation into it would require too many conditional props. A simpler dedicated section is cleaner.

**Alternatives considered**:
- Reuse PromptComposer with many hidden props: Rejected — over-parameterization, confusing
- Plain form fields: Accepted — simple, focused, matches the video gen config shape

## R8: Config Persistence for Task Switching

**Decision**: Task switching within AI Video preserves frame generation configs by not clearing them when switching tasks — same pattern as output type switching.

**Rationale**: The `AIVideoOutcomeConfig` has nullable `startFrameImageGen` and `endFrameImageGen`. When switching from reimagine to animate, these fields remain in the config (just not displayed). When switching back, they're restored because they were never cleared.

**Implementation**: Task change handler only updates the `task` field. It initializes frame gen configs with defaults when they're null and the new task requires them. It never clears existing configs.

**Task → required frame configs**:
- `animate`: neither (both hidden)
- `transform`: endFrameImageGen (start hidden)
- `reimagine`: both startFrameImageGen and endFrameImageGen
