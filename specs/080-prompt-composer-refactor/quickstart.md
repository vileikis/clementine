# Quickstart: PromptComposer Refactor

**Feature Branch**: `080-prompt-composer-refactor`
**Date**: 2026-02-23

## Before & After

### Before (19 props)

```tsx
<PromptComposer
  prompt={imageGeneration.prompt}
  onPromptChange={handlePromptChange}
  model={imageGeneration.model}
  onModelChange={handleModelChange}
  modelOptions={AI_IMAGE_MODELS}        // ← absorbed into modality
  aspectRatio={aspectRatio}
  onAspectRatioChange={handleAspectRatio}
  hideAspectRatio={false}               // ← absorbed into modality
  duration={undefined}                  // ← not needed (modality says no duration)
  onDurationChange={undefined}          // ← not needed
  durationOptions={undefined}           // ← absorbed into modality
  refMedia={imageGeneration.refMedia}
  onRefMediaRemove={handleRemoveRefMedia}
  uploadingFiles={uploadingFiles}
  onFilesSelected={uploadFiles}
  canAddMore={canAddMore}
  isUploading={isUploading}
  hideRefMedia={false}                  // ← absorbed into modality
  steps={mentionableSteps}
  disabled={false}
  error={getFieldError(errors, 'aiImage.imageGeneration.prompt')}
/>
```

### After (8 props)

```tsx
<PromptComposer
  modality={IMAGE_MODALITY}
  prompt={imageGeneration.prompt}
  onPromptChange={handlePromptChange}
  model={imageGeneration.model}
  onModelChange={handleModelChange}
  controls={{ aspectRatio, onAspectRatioChange: handleAspectRatio }}
  refMedia={{
    items: imageGeneration.refMedia,
    onRemove: handleRemoveRefMedia,
    uploadingFiles,
    onFilesSelected: uploadFiles,
    canAddMore,
    isUploading,
  }}
  steps={mentionableSteps}
  error={getFieldError(errors, 'aiImage.imageGeneration.prompt')}
/>
```

## Adding a New Modality

### Step 1: Define the modality

In `lib/modality-definitions.ts`:

```tsx
export const AUDIO_MODALITY: ModalityDefinition = {
  type: 'audio',
  supports: {
    negativePrompt: false,
    referenceMedia: false,
    sound: true,
    enhance: false,
    duration: true,
    aspectRatio: false,
  },
  limits: {
    maxRefImages: 0,
    maxPromptLength: 1000,
  },
  modelOptions: AI_AUDIO_MODELS,
  durationOptions: AUDIO_DURATION_OPTIONS,
}
```

### Step 2: Use in a consumer form

```tsx
<PromptComposer
  modality={AUDIO_MODALITY}
  prompt={audioConfig.prompt}
  onPromptChange={handlePromptChange}
  model={audioConfig.model}
  onModelChange={handleModelChange}
  controls={{ duration: audioConfig.duration, onDurationChange: handleDuration }}
  steps={mentionableSteps}
/>
```

No reference media section renders (modality says `referenceMedia: false`).
Duration picker renders automatically (modality says `duration: true`).
No aspect ratio renders (modality says `aspectRatio: false`).

**Zero changes to PromptComposer or its child components.**

## Creating Task-Specific Variants

For cases like video remix (locked to 8s duration, 2 max ref images):

```tsx
const videoRemixModality = useMemo(() => ({
  ...VIDEO_MODALITY,
  durationOptions: REMIX_DURATION_OPTIONS,  // Only 8s
  limits: { ...VIDEO_MODALITY.limits, maxRefImages: 2 },
}), [])
```

For image-to-video (no reference media):

```tsx
const imageToVideoModality = useMemo(() => ({
  ...VIDEO_MODALITY,
  supports: { ...VIDEO_MODALITY.supports, referenceMedia: false },
}), [])
```

## Child Component Access Pattern

Child components access context instead of receiving props:

```tsx
// Before (ControlRow received 13 props)
function ControlRow({ model, onModelChange, modelOptions, aspectRatio, ... }) { }

// After (ControlRow reads from context)
function ControlRow() {
  const { modality, model, onModelChange, controls, disabled } = usePromptComposerContext()
  // Render controls based on modality.supports.*
}
```

## File Structure

```
domains/experience/create/
├── components/PromptComposer/
│   ├── PromptComposer.tsx              # Refactored (creates context)
│   ├── PromptComposerContext.tsx        # NEW (context + provider + hook)
│   ├── ControlRow.tsx                  # Refactored (reads from context)
│   ├── ReferenceMediaStrip.tsx         # Refactored (reads from context)
│   ├── AddMediaButton.tsx              # Minor update (reads from context)
│   ├── ReferenceMediaItem.tsx          # Unchanged
│   ├── LexicalPromptInput.tsx          # Unchanged
│   └── index.ts                        # Updated exports
└── lib/
    ├── model-options.ts                # Existing (unchanged)
    └── modality-definitions.ts         # NEW (ModalityDefinition + presets)
```
