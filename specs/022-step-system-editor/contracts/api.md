# API Contracts: Step System & Experience Editor

**Feature**: 022-step-system-editor
**Date**: 2026-01-13

## Overview

This feature uses **client-side Firestore operations** following the client-first architecture. No REST/GraphQL API endpoints are created. All operations use Firebase client SDK with TanStack Query for state management.

---

## Internal API Contracts

### 1. Update Experience Draft

**Hook**: `useUpdateExperienceDraft`

Updates the draft section of an experience document with new step data.

```typescript
interface UpdateExperienceDraftInput {
  workspaceId: string
  experienceId: string
  draft: ExperienceConfig
}

interface UpdateExperienceDraftOutput {
  success: boolean
  updatedAt: Timestamp
}

// Usage
const updateDraft = useUpdateExperienceDraft()
await updateDraft.mutateAsync({
  workspaceId: 'ws_123',
  experienceId: 'exp_456',
  draft: {
    steps: [/* updated steps array */]
  }
})
```

**Firestore Operation**:
```typescript
updateDoc(
  doc(firestore, `workspaces/${workspaceId}/experiences/${experienceId}`),
  {
    draft: draft,
    updatedAt: serverTimestamp()
  }
)
```

**Error Handling**:
| Error | Cause | Recovery |
|-------|-------|----------|
| PERMISSION_DENIED | User not workspace member | Show auth error, redirect |
| NOT_FOUND | Experience deleted | Show error, navigate to list |
| NETWORK_ERROR | Offline | Retry with backoff, preserve local |

---

### 2. Publish Experience

**Hook**: `usePublishExperience`

Validates and copies draft to published, recording publish metadata.

```typescript
interface PublishExperienceInput {
  workspaceId: string
  experienceId: string
}

interface PublishExperienceOutput {
  success: boolean
  publishedAt: Timestamp
  errors?: ValidationError[]
}

interface ValidationError {
  field: string
  message: string
  stepId?: string
}

// Usage
const publishExperience = usePublishExperience()
const result = await publishExperience.mutateAsync({
  workspaceId: 'ws_123',
  experienceId: 'exp_456'
})

if (!result.success) {
  // Show result.errors to user
}
```

**Pre-Publish Validation** (client-side):
```typescript
function validateForPublish(experience: Experience): ValidationResult {
  const errors: ValidationError[] = []

  // 1. At least one step
  if (experience.draft.steps.length === 0) {
    errors.push({
      field: 'steps',
      message: 'At least one step is required to publish'
    })
  }

  // 2. All steps have valid config
  for (const step of experience.draft.steps) {
    const definition = stepRegistry[step.type]
    if (!definition) {
      errors.push({
        field: `steps`,
        stepId: step.id,
        message: `Unknown step type: ${step.type}`
      })
      continue
    }

    const result = definition.configSchema.safeParse(step.config)
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          field: `steps.${step.id}.config.${issue.path.join('.')}`,
          stepId: step.id,
          message: issue.message
        })
      }
    }
  }

  // 3. Profile constraints
  const allowedTypes = getStepTypesForProfile(experience.profile)
  for (const step of experience.draft.steps) {
    if (!allowedTypes.includes(step.type)) {
      errors.push({
        field: `steps`,
        stepId: step.id,
        message: `Step type "${step.type}" is not allowed for ${experience.profile} profile`
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
```

**Firestore Operation** (on validation success):
```typescript
updateDoc(
  doc(firestore, `workspaces/${workspaceId}/experiences/${experienceId}`),
  {
    published: experience.draft,
    publishedAt: serverTimestamp(),
    publishedBy: currentUserId,
    updatedAt: serverTimestamp()
  }
)
```

---

### 3. Step Registry

**Module**: `stepRegistry`

Central registry providing step definitions for rendering and validation.

```typescript
interface StepDefinition {
  type: StepType
  category: StepCategory
  label: string
  description: string
  icon: LucideIcon
  configSchema: z.ZodSchema
  defaultConfig: () => Record<string, unknown>
  EditRenderer: React.LazyExoticComponent<React.ComponentType<StepRendererProps>>
  ConfigPanel: React.LazyExoticComponent<React.ComponentType<StepConfigPanelProps>>
}

// Lookup
function getStepDefinition(type: StepType): StepDefinition | undefined

// Profile filtering
function getStepTypesForProfile(profile: ExperienceProfile): StepType[]

// Step creation
function createStep(type: StepType): Step
```

**Registry Contents**:

| Type | Category | Label | Icon |
|------|----------|-------|------|
| info | info | Information | `Info` |
| input.scale | input | Opinion Scale | `SlidersHorizontal` |
| input.yesNo | input | Yes/No | `CircleDot` |
| input.multiSelect | input | Multiple Choice | `ListChecks` |
| input.shortText | input | Short Answer | `Type` |
| input.longText | input | Long Answer | `AlignLeft` |
| capture.photo | capture | Photo Capture | `Camera` |
| transform.pipeline | transform | AI Transform | `Sparkles` |

---

## Component Contracts

### StepRendererProps

Props passed to all step edit-mode renderers.

```typescript
interface StepRendererProps {
  mode: 'edit' | 'run'
  step: Step
  config: StepConfig
}

// Edit mode: Non-interactive visual preview
// Run mode: Interactive (future - E5)
```

### StepConfigPanelProps

Props passed to all step configuration panels.

```typescript
interface StepConfigPanelProps {
  step: Step
  config: StepConfig
  onConfigChange: (updates: Partial<StepConfig>) => void
  disabled?: boolean
}
```

### StepListProps

Props for the step list component.

```typescript
interface StepListProps {
  steps: Step[]
  selectedStepId: string | null
  onSelectStep: (stepId: string) => void
  onReorderSteps: (steps: Step[]) => void
  onDeleteStep: (stepId: string) => void
  onAddStep: () => void
  disabled?: boolean
}
```

### AddStepDialogProps

Props for the add step modal.

```typescript
interface AddStepDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: ExperienceProfile
  onAddStep: (type: StepType) => void
}
```

---

## Query Keys

Following existing `experienceKeys` factory pattern:

```typescript
const experienceKeys = {
  // ... existing keys from E1

  // E2 additions (if needed for cache invalidation)
  draft: (workspaceId: string, experienceId: string) =>
    [...experienceKeys.detail(workspaceId, experienceId), 'draft'] as const,
}
```

**Cache Invalidation**:
- On draft update: Invalidate `experienceKeys.detail(workspaceId, experienceId)`
- On publish: Invalidate `experienceKeys.detail(workspaceId, experienceId)`

---

## Event Flows

### Add Step Flow

```
User clicks "Add Step"
       │
       ▼
┌─────────────────────────────┐
│    AddStepDialog opens      │
│  (filtered by profile)      │
└─────────────────────────────┘
       │
       │ User selects step type
       ▼
┌─────────────────────────────┐
│   createStep(type)          │
│   - Generate UUID           │
│   - Get default config      │
└─────────────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│   Update local steps array  │
│   - Append new step         │
│   - Select new step         │
└─────────────────────────────┘
       │
       │ triggerSave() (2s debounce)
       ▼
┌─────────────────────────────┐
│   updateDraft.mutateAsync() │
│   - Save to Firestore       │
└─────────────────────────────┘
```

### Reorder Steps Flow

```
User drags step to new position
       │
       ▼
┌─────────────────────────────┐
│   DndContext onDragEnd      │
│   - Calculate new order     │
└─────────────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│   Update local steps array  │
│   - Reorder in place        │
└─────────────────────────────┘
       │
       │ triggerSave() (2s debounce)
       ▼
┌─────────────────────────────┐
│   updateDraft.mutateAsync() │
│   - Save to Firestore       │
└─────────────────────────────┘
```

### Publish Flow

```
User clicks "Publish"
       │
       ▼
┌─────────────────────────────┐
│   validateForPublish()      │
│   - Check step count        │
│   - Validate configs        │
│   - Check profile rules     │
└─────────────────────────────┘
       │
       ├──── Validation fails ────▶ Show errors, abort
       │
       │ Validation passes
       ▼
┌─────────────────────────────┐
│   publishExperience()       │
│   - Copy draft → published  │
│   - Set publishedAt/By      │
└─────────────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│   Show success toast        │
│   Update UI state           │
└─────────────────────────────┘
```
