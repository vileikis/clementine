# Quickstart: Admin Create Tab UX

**Feature**: 061-admin-create-ux
**Date**: 2026-02-05

## Overview

This guide provides a quick reference for implementing the Admin Create Tab UX feature. It summarizes key files, patterns, and implementation steps.

**Note**: This implementation renames "create outcome" to simply "outcome" for clarity.

---

## Key Files to Modify

### Prep Work: Schema Rename

| File | Change |
|------|--------|
| `packages/shared/src/schemas/experience/create-outcome.schema.ts` | Rename to `outcome.schema.ts`, update exports |
| `packages/shared/src/schemas/experience/experience.schema.ts` | Rename field `create` → `outcome` |
| `packages/shared/src/schemas/experience/index.ts` | Update exports |

### Refactor (Keep & Modify)

| File | Change |
|------|--------|
| `components/PromptComposer/PromptComposer.tsx` | Decouple from AIImageNode, accept composition props |
| `components/PromptComposer/ControlRow.tsx` | Accept model/aspectRatio options via props |
| `hooks/useRefMediaUpload.ts` | Work with `outcome.imageGeneration.refMedia` path |
| `containers/ExperienceCreatePage.tsx` | Replace TransformPipelineEditor with CreateTabForm |
| `components/index.ts` | Update barrel exports |
| `hooks/index.ts` | Update barrel exports |

### Create (New Files)

| File | Purpose |
|------|---------|
| `components/CreateTabForm/CreateTabForm.tsx` | Main form container |
| `components/CreateTabForm/OutcomeTypeSelector.tsx` | Image/GIF/Video toggle |
| `components/CreateTabForm/SourceImageSelector.tsx` | Capture step dropdown |
| `components/CreateTabForm/AIGenerationToggle.tsx` | Enable/disable AI |
| `components/CreateTabForm/ValidationSummary.tsx` | Error display |
| `components/CreateTabForm/index.ts` | Barrel export |
| `hooks/useUpdateOutcome.ts` | Mutation hook |
| `hooks/useOutcomeValidation.ts` | Validation hook |
| `lib/outcome-operations.ts` | Pure functions for config updates |
| `lib/model-options.ts` | Model/aspect ratio constants |

### Delete (Remove Files)

| File | Reason |
|------|--------|
| `components/NodeListItem/*` | Node-centric UI removed |
| `components/EmptyState.tsx` | Node-specific empty state |
| `components/AddNodeButton.tsx` | Node creation removed |
| `components/DeleteNodeDialog.tsx` | Node deletion removed |
| `components/NodeEditorPanel.tsx` | Node editor removed |
| `containers/TransformPipelineEditor.tsx` | Pipeline UI removed |
| `lib/transform-operations.ts` | Node operations removed |
| `hooks/useUpdateTransformNodes.ts` | Replaced by new hook |

---

## Implementation Order

### Phase 0: Schema Rename
1. Rename `create-outcome.schema.ts` → `outcome.schema.ts`
2. Rename exports: `createOutcomeSchema` → `outcomeSchema`, etc.
3. Update `experience.schema.ts`: field `create` → `outcome`
4. Update all imports in app code

### Phase 1: Foundation
5. Create `lib/model-options.ts` with constants
6. Create `lib/outcome-operations.ts` with pure functions
7. Create `hooks/useUpdateOutcome.ts` mutation

### Phase 2: PromptComposer Refactoring
8. Refactor `ControlRow.tsx` for prop-based options
9. Refactor `PromptComposer.tsx` for composition pattern
10. Refactor `useRefMediaUpload.ts` for new data path

### Phase 3: New Components
11. Create `OutcomeTypeSelector.tsx`
12. Create `SourceImageSelector.tsx`
13. Create `AIGenerationToggle.tsx`
14. Create `ValidationSummary.tsx`
15. Create `CreateTabForm.tsx` composing all parts

### Phase 4: Integration
16. Update `ExperienceCreatePage.tsx` to use CreateTabForm
17. Create `useOutcomeValidation.ts` hook
18. Wire validation to publish flow

### Phase 5: Cleanup
19. Delete node-based components
20. Update barrel exports
21. Run lint/type-check/format

---

## Code Patterns

### Mutation Hook Pattern

```typescript
// hooks/useUpdateOutcome.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateExperienceConfigField } from '@/domains/experience/shared'
import { useExperienceDesignerStore } from '@/domains/experience/designer'
import { useTrackedMutation } from '@/shared/editor-status'
import * as Sentry from '@sentry/react'
import type { Outcome } from '@clementine/shared'

export function useUpdateOutcome(
  workspaceId: string,
  experienceId: string,
) {
  const queryClient = useQueryClient()
  const store = useExperienceDesignerStore()

  const mutation = useMutation({
    mutationFn: async ({ outcome }: { outcome: Outcome }) => {
      await updateExperienceConfigField(workspaceId, experienceId, { outcome })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: experienceKeys.detail(workspaceId, experienceId),
      })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { domain: 'experience/create', action: 'update-outcome' },
      })
    },
  })

  return useTrackedMutation(mutation, store)
}
```

### Validation Hook Pattern

```typescript
// hooks/useOutcomeValidation.ts
import type { Outcome, ExperienceStep } from '@clementine/shared'

export interface ValidationError {
  field: string
  message: string
}

export function useOutcomeValidation(
  outcome: Outcome | null,
  steps: ExperienceStep[],
): ValidationError[] {
  if (!outcome) return []

  const errors: ValidationError[] = []

  // No outcome type
  if (!outcome.type) {
    errors.push({ field: 'type', message: 'Select an outcome type' })
  }

  // Passthrough without source
  if (!outcome.aiEnabled && !outcome.captureStepId) {
    errors.push({
      field: 'captureStepId',
      message: 'Passthrough mode requires a source image'
    })
  }

  // AI enabled but no prompt
  if (outcome.aiEnabled && outcome.imageGeneration.prompt.trim() === '') {
    errors.push({ field: 'prompt', message: 'Prompt is required' })
  }

  // Invalid captureStepId
  if (outcome.captureStepId) {
    const stepExists = steps.some(s => s.id === outcome.captureStepId)
    if (!stepExists) {
      errors.push({
        field: 'captureStepId',
        message: 'Selected source step no longer exists'
      })
    }
  }

  // Duplicate displayNames
  const names = outcome.imageGeneration.refMedia.map(m => m.displayName)
  const hasDuplicates = names.length !== new Set(names).size
  if (hasDuplicates) {
    errors.push({
      field: 'refMedia',
      message: 'Reference images must have unique names'
    })
  }

  return errors
}
```

### PromptComposer Refactored Props

```typescript
// components/PromptComposer/PromptComposer.tsx
export interface PromptComposerProps {
  // Core prompt
  prompt: string
  onPromptChange: (prompt: string) => void

  // Reference media
  refMedia: MediaReference[]
  onRefMediaAdd: (media: MediaReference) => void
  onRefMediaRemove: (mediaAssetId: string) => void

  // Model selection
  model: string
  onModelChange: (model: string) => void
  modelOptions: { value: string; label: string }[]

  // Aspect ratio (optional for non-image types)
  aspectRatio?: string
  onAspectRatioChange?: (ratio: string) => void
  aspectRatioOptions?: { value: string; label: string }[]

  // Context for mentions
  steps: ExperienceStep[]
  workspaceId: string

  // State
  disabled?: boolean
  isUploading?: boolean
}
```

### OutcomeTypeSelector Component

```typescript
// components/CreateTabForm/OutcomeTypeSelector.tsx
import { ToggleGroup, ToggleGroupItem } from '@/ui-kit/components/toggle-group'
import { ImageIcon, Film, Video } from 'lucide-react'

interface OutcomeTypeSelectorProps {
  value: string | null
  onChange: (value: string) => void
  disabled?: boolean
}

export function OutcomeTypeSelector({ value, onChange, disabled }: OutcomeTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Outcome Type</label>
      <ToggleGroup
        type="single"
        value={value ?? ''}
        onValueChange={onChange}
        disabled={disabled}
      >
        <ToggleGroupItem value="image" className="gap-2">
          <ImageIcon className="h-4 w-4" />
          Image
        </ToggleGroupItem>
        <ToggleGroupItem value="gif" disabled className="gap-2 opacity-50">
          <Film className="h-4 w-4" />
          GIF
          <span className="text-xs text-muted-foreground">(soon)</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="video" disabled className="gap-2 opacity-50">
          <Video className="h-4 w-4" />
          Video
          <span className="text-xs text-muted-foreground">(soon)</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
```

---

## Testing Checklist

### Unit Tests
- [ ] `useOutcomeValidation` returns correct errors for each scenario
- [ ] `outcome-operations.ts` pure functions work correctly

### Integration Tests
- [ ] Form saves on field changes (debounced for prompt)
- [ ] Validation errors appear/disappear correctly
- [ ] AI toggle preserves PromptComposer values
- [ ] @mention autocomplete shows correct options

### Manual Testing
- [ ] Visual layout matches PRD wireframe
- [ ] Touch targets are 44px minimum
- [ ] Mobile viewport works correctly
- [ ] Disabled states for GIF/Video show "coming soon"

---

## Validation Checklist

Before marking complete:

- [ ] `pnpm app:check` passes (lint + format)
- [ ] `pnpm app:type-check` passes
- [ ] No console errors in browser
- [ ] Dev server runs without issues
- [ ] All acceptance criteria from spec verified
