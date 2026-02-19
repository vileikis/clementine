# Component Contracts: AI Video Editor

**Branch**: `073-ai-video-editor` | **Date**: 2026-02-19

## Overview

This document defines the component interfaces, their props, and interaction patterns for the AI Video Editor feature. No REST API endpoints are needed — this is a frontend-only feature with Firestore persistence via existing autosave patterns.

---

## 1. AIVideoConfigForm

**Location**: `domains/experience/create/components/ai-video-config/AIVideoConfigForm.tsx`

**Purpose**: Self-contained config form for AI Video outcome type. Follows the same pattern as `AIImageConfigForm`.

```typescript
interface AIVideoConfigFormProps {
  /** AI Video outcome configuration */
  config: AIVideoOutcomeConfig
  /** Callback when any config field changes */
  onConfigChange: (updates: Partial<AIVideoOutcomeConfig>) => void
  /** Experience steps */
  steps: ExperienceStep[]
  /** Validation errors */
  errors: FieldValidationError[]
  /** Workspace ID for media uploads */
  workspaceId: string
  /** User ID for media uploads */
  userId: string | undefined
}
```

**Responsibilities**:
- Renders task picker, shared fields, and task-specific frame gen sections
- Owns all AI-video-specific handlers for nested config updates
- Manages ref media uploads for frame generation configs
- Communicates to parent via single `onConfigChange` callback

---

## 2. AIVideoTaskSelector

**Location**: `domains/experience/create/components/ai-video-config/AIVideoTaskSelector.tsx`

**Purpose**: Task picker for selecting between animate, transform, and reimagine.

```typescript
interface AIVideoTaskSelectorProps {
  /** Current task */
  task: AIVideoTask
  /** Callback when task changes */
  onTaskChange: (task: AIVideoTask) => void
}
```

**Task options**:

| Value | Label | Description |
|-------|-------|-------------|
| `animate` | Animate | Bring a photo to life as video |
| `transform` | Transform | Photo transitions into AI-generated version |
| `reimagine` | Reimagine | Video between two AI-generated frames |

---

## 3. VideoGenerationSection

**Location**: `domains/experience/create/components/ai-video-config/VideoGenerationSection.tsx`

**Purpose**: Video generation config fields (prompt, model, duration). NOT the PromptComposer — this is a simpler form for video-specific settings.

```typescript
interface VideoGenerationSectionProps {
  /** Video generation config */
  config: VideoGenerationConfig
  /** Callback when any field changes */
  onConfigChange: (updates: Partial<VideoGenerationConfig>) => void
  /** Whether the section is disabled */
  disabled?: boolean
}
```

**Fields rendered**:
- Prompt text input (plain text, no mentions needed for video prompt)
- Model selector dropdown (Veo 3.1, Veo 3.1 Fast)
- Duration numeric input (1-60 seconds)

---

## 4. FrameGenerationSection

**Location**: `domains/experience/create/components/ai-video-config/FrameGenerationSection.tsx`

**Purpose**: Reusable section for start/end frame image generation config. Wraps PromptComposer with section header and label.

```typescript
interface FrameGenerationSectionProps {
  /** Section label (e.g., "Start Frame" or "End Frame") */
  label: string
  /** Frame generation config */
  config: ImageGenerationConfig
  /** Callback when any field changes */
  onConfigChange: (updates: Partial<ImageGenerationConfig>) => void
  /** Experience steps for @mention */
  steps: ExperienceStep[]
  /** Validation errors */
  errors: FieldValidationError[]
  /** Error field prefix for validation lookup (e.g., 'aiVideo.startFrameImageGen') */
  errorFieldPrefix: string
  /** Workspace ID for media uploads */
  workspaceId: string
  /** User ID for media uploads */
  userId: string | undefined
}
```

**Internal composition**:
- Section header with label
- `PromptComposer` with `hideAspectRatio=true`
- Uses `useRefMediaUpload` (refactored to accept `currentRefMedia`)

---

## 5. Updated Components (Existing)

### 5.1 CreateTabForm — Add AI Video Branch

```typescript
// New handler added alongside existing ones:
const handleAIVideoConfigChange = useCallback(
  (updates: Partial<AIVideoOutcomeConfig>) => {
    const currentConfig = form.getValues('aiVideo')
    form.setValue(
      'aiVideo',
      { ...currentConfig, ...updates } as AIVideoOutcomeConfig,
      { shouldDirty: true },
    )
    triggerSave()
  },
  [form, triggerSave],
)

// New render branch:
if (outcome.type === 'ai.video' && outcome.aiVideo) {
  return (
    <div className="space-y-6">
      <OutcomeTypeSelector value={outcome.type} onChange={handleOutcomeTypeSelect} />
      <AIVideoConfigForm
        config={outcome.aiVideo}
        onConfigChange={handleAIVideoConfigChange}
        steps={steps}
        errors={validationErrors}
        workspaceId={workspaceId}
        userId={user?.uid}
      />
      <div className="border-t pt-4">
        <RemoveOutcomeAction onRemove={handleRemoveOutcome} />
      </div>
    </div>
  )
}
```

### 5.2 OutcomeTypePicker — Enable AI Video

```typescript
// Change in AI_OPTIONS array:
{
  type: 'ai.video',
  label: 'AI Video',
  description: 'Generate AI video from prompts',
  icon: <Video className="h-8 w-8" />,
  enabled: true,  // ← Change from false to true
}
```

### 5.3 OutcomeTypeSelector — Add AI Video Toggle

```typescript
// Add new ToggleGroupItem:
<ToggleGroupItem
  value="ai.video"
  className="min-h-11 min-w-11 gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
  aria-label="AI Video output"
>
  <Video className="h-4 w-4" />
  {OUTCOME_TYPE_LABELS['ai.video']}
</ToggleGroupItem>
```

### 5.4 model-options.ts — Update Constants

```typescript
// Enable ai.video
export const ENABLED_OUTCOME_TYPES: OutcomeType[] = ['photo', 'ai.image', 'ai.video']
export const COMING_SOON_TYPES: OutcomeType[] = ['gif', 'video']

// Add video model options
export const AI_VIDEO_MODELS = [
  { value: 'veo-3.1-generate-001', label: 'Veo 3.1' },
  { value: 'veo-3.1-fast-generate-001', label: 'Veo 3.1 Fast' },
] as const
```

### 5.5 outcome-operations.ts — Add AI Video Operations

```typescript
// New function:
export function createDefaultAIVideoConfig(
  captureStepId?: string,
): AIVideoOutcomeConfig {
  return {
    task: 'animate',
    captureStepId: captureStepId ?? '',
    aspectRatio: '9:16',
    startFrameImageGen: null,
    endFrameImageGen: null,
    videoGeneration: {
      prompt: '',
      model: 'veo-3.1-fast-generate-001',
      duration: 5,
      aspectRatio: null,
    },
  }
}

// Update initializeOutcomeType:
// Add 'ai.video' branch with auto-step detection
```

### 5.6 useOutcomeValidation.ts — Add AI Video Validation

```typescript
// Remove 'ai.video' from "coming soon" check
// Add ai.video validation:
if (outcome.type === 'ai.video') {
  const config = outcome.aiVideo
  if (!config) return errors

  // captureStepId required
  if (!config.captureStepId) {
    errors.push({ field: 'aiVideo.captureStepId', message: 'Select a source image step' })
  } else {
    // Check step exists
  }

  // Duplicate displayNames in startFrameImageGen.refMedia
  // Duplicate displayNames in endFrameImageGen.refMedia
}
```

### 5.7 useRefMediaUpload — Generalize

```typescript
// BEFORE:
interface UseRefMediaUploadParams {
  outcome: Outcome | null
  // ...
}

// AFTER:
interface UseRefMediaUploadParams {
  currentRefMedia: MediaReference[]  // Decouple from outcome shape
  // ...
}
```

---

## 6. Firestore Persistence

No new Firestore collections or documents. AI Video config is stored in `outcome.aiVideo` within the existing experience document structure:

```
workspaces/{workspaceId}/projects/{projectId}/experiences/{experienceId}
  └── draft.outcome.aiVideo: AIVideoOutcomeConfig | null
```

The existing `useUpdateOutcome` mutation handles saving the full outcome object (including aiVideo) via `updateExperienceConfigField`.

---

## 7. Shared Package Changes

### 7.1 Export AIVideoTask

```typescript
// packages/shared/src/schemas/experience/outcome.schema.ts
export const aiVideoTaskSchema = z.enum(['animate', 'transform', 'reimagine'])
export type AIVideoTask = z.infer<typeof aiVideoTaskSchema>
```

### 7.2 Add AIVideoModel Enum and Update VideoGenerationConfig

```typescript
// packages/shared/src/schemas/experience/outcome.schema.ts

// New enum:
export const aiVideoModelSchema = z.enum([
  'veo-3.1-generate-001',
  'veo-3.1-fast-generate-001',
])
export type AIVideoModel = z.infer<typeof aiVideoModelSchema>

// Updated videoGenerationConfigSchema:
export const videoGenerationConfigSchema = z.object({
  prompt: z.string().default(''),
  model: aiVideoModelSchema.default('veo-3.1-fast-generate-001'),  // was z.string()
  duration: z.number().min(1).max(60).default(5),
  aspectRatio: videoAspectRatioSchema.nullable().default(null),
})
```
