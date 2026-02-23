# Data Model: PromptComposer Refactor

**Feature Branch**: `001-prompt-composer-refactor`
**Date**: 2026-02-23

> This feature is a pure frontend refactor. No backend/database changes. All entities below are TypeScript types.

## Entities

### ModalityDefinition

Declares a generation modality's capabilities and constraints. Static configuration — not runtime state.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'text' \| 'image' \| 'video'` | Yes | Modality identifier |
| `supports.negativePrompt` | `boolean` | Yes | Whether modality supports negative prompts |
| `supports.referenceMedia` | `boolean` | Yes | Whether modality supports reference image uploads |
| `supports.sound` | `boolean` | Yes | Whether modality supports sound/audio settings |
| `supports.enhance` | `boolean` | Yes | Whether modality supports prompt enhancement |
| `supports.duration` | `boolean` | Yes | Whether modality supports duration selection |
| `supports.aspectRatio` | `boolean` | Yes | Whether modality supports aspect ratio selection |
| `limits.maxRefImages` | `number` | Yes | Maximum number of reference images allowed |
| `limits.maxPromptLength` | `number` | Yes | Maximum prompt character count |
| `modelOptions` | `readonly SelectOption[]` | Yes | Available AI models for this modality |
| `durationOptions` | `readonly SelectOption[]` | No | Available duration options (only when supports.duration is true) |

**Relationships**: Referenced by PromptComposerContext. Predefined instances stored as constants (IMAGE_MODALITY, VIDEO_MODALITY).

**Validation**: Type-checked at compile time via TypeScript strict mode. No runtime validation needed — these are developer-authored constants, not user input.

### ModalityControlValues

Groups optional modality-specific control values and their change handlers. Only the controls supported by the active modality should be provided.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `aspectRatio` | `string` | No | Current aspect ratio value |
| `onAspectRatioChange` | `(value: string) => void` | No | Aspect ratio change callback |
| `duration` | `string` | No | Current duration value |
| `onDurationChange` | `(value: string) => void` | No | Duration change callback |

**Validation**: When `modality.supports.aspectRatio` is true, `aspectRatio` and `onAspectRatioChange` should be provided. Same for duration. Missing values for supported features cause the control to not render (graceful degradation per edge case spec).

### RefMediaState

Groups all reference media state and callbacks into a single object.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `items` | `MediaReference[]` | Yes | Currently uploaded reference media |
| `onRemove` | `(mediaAssetId: string) => void` | Yes | Remove callback |
| `uploadingFiles` | `UploadingFile[]` | Yes | Files currently being uploaded |
| `onFilesSelected` | `(files: File[]) => void` | Yes | File selection callback |
| `canAddMore` | `boolean` | Yes | Whether more files can be added |
| `isUploading` | `boolean` | Yes | Whether an upload is in progress |

**Relationships**: Populated by the existing `useRefMediaUpload` hook. Consumed by ReferenceMediaStrip and AddMediaButton via context.

### PromptComposerContextValue

The context value available to all child components. Derived from PromptComposer props.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `modality` | `ModalityDefinition` | Yes | Active modality configuration |
| `prompt` | `string` | Yes | Current prompt value |
| `onPromptChange` | `(value: string) => void` | Yes | Prompt change callback |
| `model` | `string` | Yes | Current model value |
| `onModelChange` | `(value: string) => void` | Yes | Model change callback |
| `controls` | `ModalityControlValues` | No | Modality-specific control values |
| `refMedia` | `RefMediaState` | No | Reference media state |
| `steps` | `ExperienceStep[]` | Yes | Steps available for @mention autocomplete |
| `disabled` | `boolean` | Yes | Whether all controls are disabled |
| `error` | `string \| undefined` | No | Validation error message |

**Relationships**: Created by PromptComposer component from its props. Consumed by ControlRow, ReferenceMediaStrip, AddMediaButton via `usePromptComposerContext()` hook.

## Predefined Modality Instances

### IMAGE_MODALITY

```
type: 'image'
supports: { negativePrompt: false, referenceMedia: true, sound: false, enhance: false, duration: false, aspectRatio: true }
limits: { maxRefImages: 5, maxPromptLength: 2000 }
modelOptions: AI_IMAGE_MODELS
```

### VIDEO_MODALITY

```
type: 'video'
supports: { negativePrompt: false, referenceMedia: true, sound: false, enhance: false, duration: true, aspectRatio: false }
limits: { maxRefImages: 2, maxPromptLength: 2000 }
modelOptions: AI_VIDEO_MODELS
durationOptions: DURATION_OPTIONS
```

### TEXT_MODALITY (future)

```
type: 'text'
supports: { negativePrompt: false, referenceMedia: false, sound: false, enhance: false, duration: false, aspectRatio: false }
limits: { maxRefImages: 0, maxPromptLength: 5000 }
modelOptions: []
```

## Entity Relationship

```
ModalityDefinition (static config)
       │
       ▼
PromptComposerContextValue (runtime state)
       │
       ├── ModalityControlValues (aspectRatio, duration)
       ├── RefMediaState (upload state)
       │
       ▼
Child Components read via usePromptComposerContext()
  ├── ControlRow (model, aspectRatio, duration selects)
  ├── ReferenceMediaStrip (media items, upload progress)
  └── AddMediaButton (file selection, canAddMore)
```
