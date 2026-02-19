# Contract: Frontend Components

**Package**: `apps/clementine-app`
**Directory**: `src/domains/experience/create/`

## Component Hierarchy (New)

```
CreateTabForm
├── OutcomeTypePicker          (when outcome.type === null)
│   ├── Media group: Photo, GIF*, Video*
│   └── AI Generated group: AI Photo, AI Video*
│                              (* = disabled, "Coming soon")
│
├── [When type selected]:
│   ├── OutcomeTypeSelector    (dropdown to switch types)
│   ├── PhotoConfigForm        (when type === 'photo')
│   │   ├── SourceImageSelector
│   │   └── AspectRatioSelector
│   ├── AIPhotoConfigForm      (when type === 'ai.photo')
│   │   ├── TaskSelector       (text-to-image / image-to-image toggle)
│   │   ├── SourceImageSelector (visible only for image-to-image)
│   │   ├── AspectRatioSelector
│   │   └── PromptComposer     (reused as-is)
│   └── RemoveOutcomeAction    (clears type to null)
```

## New Components

### OutcomeTypePicker (rewrite)

```
Props:
  onTypeSelect: (type: OutcomeType) => void
  steps: ExperienceStep[]      // For smart defaults (auto-select capture step)

Behavior:
  - Renders two groups: "Media" and "AI Generated"
  - Photo and AI Photo are enabled (clickable)
  - GIF, Video, AI Video are disabled with "Coming soon" badge
  - On select: sets outcome.type AND initializes per-type config with defaults
  - Smart default: if exactly 1 capture.photo step, auto-set captureStepId
```

### PhotoConfigForm (new)

```
Props:
  config: PhotoOutcomeConfig
  onConfigChange: (updates: Partial<PhotoOutcomeConfig>) => void
  steps: ExperienceStep[]
  errors: FieldValidationError[]

Fields:
  - SourceImageSelector (captureStepId) — required
  - AspectRatioSelector (aspectRatio) — with cascade to capture step
```

### AIPhotoConfigForm (new)

```
Props:
  config: AIPhotoOutcomeConfig
  onConfigChange: (updates: Partial<AIPhotoOutcomeConfig>) => void
  steps: ExperienceStep[]
  errors: FieldValidationError[]
  // PromptComposer-related props (upload state, etc.)

Fields:
  - TaskSelector (task toggle: text-to-image / image-to-image)
  - SourceImageSelector (captureStepId) — visible only when task === 'image-to-image'
  - AspectRatioSelector (aspectRatio) — with cascade to capture step (when i2i)
  - PromptComposer (prompt, model, refMedia) — reused component
```

### TaskSelector (new)

```
Props:
  task: 'text-to-image' | 'image-to-image'
  onTaskChange: (task: 'text-to-image' | 'image-to-image') => void

Behavior:
  - Toggle/segmented control between two options
  - When switching to text-to-image: captureStepId becomes null
  - When switching to image-to-image: captureStepId must be selected
```

## Reused Components (no changes)

- **SourceImageSelector** — Dropdown for capture.photo steps. No API changes.
- **AspectRatioSelector** — Dropdown for image aspect ratios. No API changes.
- **PromptComposer** — Lexical editor with mentions, model selector, ref media. No API changes.
- **ReferenceMediaStrip** — Thumbnail strip for ref media. No changes.

## Removed Components

- **AIGenerationToggle** — Replaced by type selection (photo vs ai.photo). The toggle concept is eliminated.

## Data Flow

```
User changes field
  → onConfigChange({ field: value })
  → CreateTabForm updates outcome[activeType][field] in form state
  → triggerSave() (debounced 2s)
  → useUpdateOutcome mutation
  → Firestore write: draft.outcome

If field is aspectRatio AND captureStepId is set:
  → Also update draft.steps[captureStepIndex].config.aspectRatio
```

## Mutation Shape Change

```typescript
// Old: flat update
updateOutcome({
  type: 'image',
  aiEnabled: true,
  captureStepId: '...',
  aspectRatio: '1:1',
  imageGeneration: { prompt: '...', model: '...', refMedia: [...] },
})

// New: per-type config update
updateOutcome({
  type: 'ai.photo',
  aiPhoto: {
    task: 'image-to-image',
    captureStepId: '...',
    aspectRatio: '1:1',
    prompt: '...',
    model: '...',
    refMedia: [...],
  },
})
```
