# Contract: Frontend Components

**Package**: `apps/clementine-app`
**Directory**: `src/domains/experience/create/`

## Component Hierarchy (New)

```
components/
├── CreateTabForm.tsx                   (thin orchestrator — top level)
├── outcome-picker/
│   ├── OutcomeTypePicker.tsx           (when outcome.type === null)
│   │   ├── Media group: Photo, GIF*, Video*
│   │   └── AI Generated group: AI Image, AI Video*
│   │                                   (* = disabled, "Coming soon")
│   ├── OutcomeTypeSelector.tsx         (dropdown to switch types)
│   └── RemoveOutcomeAction.tsx         (clears type to null)
├── photo-config/
│   └── PhotoConfigForm.tsx             (when type === 'photo')
│       ├── SourceImageSelector         (from shared-controls/)
│       └── AspectRatioSelector         (from shared-controls/)
├── ai-image-config/
│   ├── AIImageConfigForm.tsx           (when type === 'ai.image')
│   │   ├── TaskSelector               (t2i / i2i toggle)
│   │   ├── SourceImageSelector         (visible only for i2i, from shared-controls/)
│   │   ├── AspectRatioSelector         (from shared-controls/)
│   │   └── PromptComposer             (from PromptComposer/)
│   └── TaskSelector.tsx
├── shared-controls/
│   ├── SourceImageSelector.tsx         (capture step dropdown — reused)
│   └── AspectRatioSelector.tsx         (aspect ratio dropdown — reused)
└── PromptComposer/                     (unchanged)
```

## New Components

### OutcomeTypePicker (rewrite)

```
Props:
  onTypeSelect: (type: OutcomeType) => void
  steps: ExperienceStep[]      // For smart defaults (auto-select capture step)

Behavior:
  - Renders two groups: "Media" and "AI Generated"
  - Photo and AI Image are enabled (clickable)
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

### AIImageConfigForm (new)

```
Props:
  config: AIImageOutcomeConfig
  onConfigChange: (updates: Partial<AIImageOutcomeConfig>) => void
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

- **AIGenerationToggle** — Replaced by type selection (photo vs ai.image). The toggle concept is eliminated.

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
  type: 'ai.image',
  aiImage: {
    task: 'image-to-image',
    captureStepId: '...',
    aspectRatio: '1:1',
    prompt: '...',
    model: '...',
    refMedia: [...],
  },
})
```
