# Quickstart: AI Video Advanced Controls

**Feature**: 086-video-advanced-controls
**Date**: 2026-02-28

## What This Feature Does

Adds four advanced video controls to the AI video configuration. **Resolution, Sound, and Enhance** are inline in the PromptComposer's ControlRow (via the modality system). **Negative Prompt** is a standalone textarea below the PromptComposer. Resolution options filter dynamically based on the selected model.

## Files to Modify

### Shared Package (packages/shared/)

1. **`src/schemas/experience/experience-config.schema.ts`**
   - Add `videoResolutionSchema` enum (`'720p' | '1080p' | '4k'`)
   - Extend `videoGenerationConfigSchema` with 4 new fields: `resolution`, `negativePrompt`, `sound`, `enhance`
   - Export `VideoResolution` type

### Frontend (apps/clementine-app/)

2. **`src/domains/experience/create/lib/modality-definitions.ts`**
   - Add `resolution: boolean` to `ModalitySupports` interface
   - Flip `sound: true`, `enhance: true` for `VIDEO_MODALITY`
   - Set `resolution: true` for `VIDEO_MODALITY`

3. **`src/domains/experience/create/lib/model-options.ts`**
   - Add `RESOLUTION_OPTIONS` constant
   - Add `MODEL_RESOLUTION_MAP` mapping models → allowed resolutions

4. **`src/domains/experience/create/lib/experience-config-operations.ts`**
   - Update `createDefaultAIVideoConfig()` to include new field defaults

5. **`src/domains/experience/create/components/PromptComposer/PromptComposerContext.tsx`**
   - Extend `ModalityControlValues` with `resolution`, `sound`, `enhance` fields and callbacks

6. **`src/domains/experience/create/components/PromptComposer/ControlRow.tsx`**
   - Render resolution selector when `modality.supports.resolution` is true (model-aware filtering)
   - Render sound toggle when `modality.supports.sound` is true
   - Render enhance toggle when `modality.supports.enhance` is true
   - Show cost indicator when 4K resolution is selected

7. **`src/domains/experience/create/components/ai-video-config/AIVideoConfigForm.tsx`**
   - Add negative prompt textarea below PromptComposer
   - Wire model change handler to check resolution compatibility (auto-downgrade 4K → 1080p on fast model switch)
   - Pass resolution/sound/enhance values to PromptComposer via controls prop

### Backend (functions/)

8. **`src/services/transform/operations/aiGenerateVideo.ts`**
   - Extend `GenerateVideoRequest` interface with 4 new fields
   - Update `buildVeoParams` to include `resolution`, `negativePrompt`, `generateAudio`, `enhancePrompt` in config

9. **`src/services/transform/outcomes/aiVideoOutcome.ts`**
   - Pass new fields from `videoGeneration` config to `GenerateVideoRequest`

## Dev Workflow

```bash
# 1. Build shared package after schema changes
pnpm --filter @clementine/shared build

# 2. Start frontend dev server
pnpm app:dev

# 3. Verify type checking passes
pnpm app:type-check

# 4. Build functions after backend changes
pnpm functions:build

# 5. Run validation
pnpm app:check
```

## Testing Checklist

- [ ] New schema fields parse with defaults when not present (backward compat)
- [ ] Resolution selector shows correct options per model in ControlRow
- [ ] Switching from standard to fast model with 4K selected auto-downgrades to 1080p
- [ ] Negative prompt textarea visible below PromptComposer with 500 char limit
- [ ] Sound and Enhance toggles render in ControlRow and default to off
- [ ] Backend passes new params to Veo API
- [ ] Existing experiences without new fields still work
