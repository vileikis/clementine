# Quickstart Guide: Inline Prompt Architecture - Phase 1a & 1b

**Feature**: 048-inline-prompt-phase-1ab
**Branch**: `048-inline-prompt-phase-1ab`
**Estimated Time**: 5-7 days

## Quick Navigation

- [Phase 1a: Schema Updates](#phase-1a-schema-updates-day-1-2) (Day 1-2)
- [Phase 1b: Step Editor UI](#phase-1b-step-editor-ui-day-3-5) (Day 3-5)
- [Testing & Validation](#testing--validation)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Environment Setup

```bash
# Checkout feature branch
git checkout 048-inline-prompt-phase-1ab

# Install dependencies
pnpm install

# Verify baseline (no errors)
pnpm app:check && pnpm app:type-check
```

### 2. Verify Tools

```bash
# Check versions
node --version      # Should be >= 18
pnpm --version      # Should be 10.18.1
firebase --version  # Should be >= 12
```

### 3. Start Dev Environment

```bash
# Terminal 1: Start app dev server
pnpm app:dev

# Terminal 2: Start Firebase emulators (optional for local testing)
firebase emulators:start

# Terminal 3: Watch shared package builds
pnpm --filter @clementine/shared dev
```

---

## Phase 1a: Schema Updates (Day 1-2)

**Goal**: Update shared schemas to support AI-aware features.

### Step 1: Update Step Name Schema

**File**: `packages/shared/src/schemas/experience/step.schema.ts`

```typescript
// LINE 26: Update experienceStepNameSchema
// BEFORE
export const experienceStepNameSchema = z.string().trim().min(1).max(50).optional()

// AFTER
export const experienceStepNameSchema = z
  .string()
  .trim()
  .min(1, 'Step name is required')
  .max(50, 'Step name must be 50 characters or less')
  .regex(
    /^[a-zA-Z0-9 \-_]+$/,
    'Step name can only contain letters, numbers, spaces, hyphens, and underscores',
  )
```

**Test**:
```bash
pnpm --filter @clementine/shared build
# Should compile without errors
```

---

### Step 2: Update Multiselect Option Schema

**File**: `packages/shared/src/schemas/experience/steps/input-multi-select.schema.ts`

```typescript
// Add import at top
import { z } from 'zod'
import { mediaReferenceSchema } from '../media.schema'  // <-- ADD THIS

// Create option schema (before config schema)
export const multiSelectOptionSchema = z.object({
  value: z.string().min(1).max(100),
  promptFragment: z.string().max(500).optional(),  // <-- NEW
  promptMedia: mediaReferenceSchema.optional(),    // <-- NEW
})

// Update config schema to use multiSelectOptionSchema
export const experienceInputMultiSelectStepConfigSchema = z.object({
  title: z.string().max(200),
  required: z.boolean().default(false),
  options: z.array(multiSelectOptionSchema).min(2).max(10),  // <-- Changed from string array
  multiSelect: z.boolean().default(false),
})

// Export type
export type MultiSelectOption = z.infer<typeof multiSelectOptionSchema>
```

**Breaking Change**: `options` changed from `string[]` to `MultiSelectOption[]`. Existing code using `config.options` directly will need updates.

**Test**:
```bash
pnpm --filter @clementine/shared build
# Check for type errors in dependent code
pnpm app:type-check
```

---

### Step 3: Create RefMedia Entry Schema

**New File**: `packages/shared/src/schemas/experience/nodes/ref-media-entry.schema.ts`

```typescript
import { z } from 'zod'
import { mediaReferenceSchema } from '../media.schema'

/**
 * RefMedia Entry Schema
 *
 * Extends MediaReference with displayName for prompt editor autocomplete.
 * Used in AI image generation nodes.
 */
export const refMediaEntrySchema = mediaReferenceSchema.extend({
  displayName: z.string().min(1).max(50),
})

export type RefMediaEntry = z.infer<typeof refMediaEntrySchema>
```

---

### Step 4: Create AI Image Node Schema

**New File**: `packages/shared/src/schemas/experience/nodes/ai-image-node.schema.ts`

```typescript
import { z } from 'zod'
import { refMediaEntrySchema } from './ref-media-entry.schema'

/**
 * AI Image Generation Node Config Schema
 *
 * Configuration for AI image generation with inline prompts.
 */
export const aiImageNodeConfigSchema = z.object({
  model: z.string().min(1),
  aspectRatio: z.enum(['1:1', '3:2', '2:3', '9:16', '16:9']),
  prompt: z.string().min(1),
  refMedia: z.array(refMediaEntrySchema).default([]),
})

/**
 * AI Image Generation Node Schema
 *
 * Transform pipeline node for AI image generation.
 */
export const aiImageNodeSchema = z.object({
  id: z.string(),
  type: z.literal('ai.imageGeneration'),
  config: aiImageNodeConfigSchema,
})

export type AIImageNodeConfig = z.infer<typeof aiImageNodeConfigSchema>
export type AIImageNode = z.infer<typeof aiImageNodeSchema>
```

---

### Step 5: Create Barrel Export for Nodes

**New File**: `packages/shared/src/schemas/experience/nodes/index.ts`

```typescript
export * from './ref-media-entry.schema'
export * from './ai-image-node.schema'
```

---

### Step 6: Update Transform Schema

**File**: `packages/shared/src/schemas/experience/transform.schema.ts`

```typescript
// REMOVE these lines (around line 22-32)
/**
 * Variable mapping from session data to transform inputs
 */
export const variableMappingSchema = z.looseObject({
  source: z.string(),
  target: z.string(),
  mappingType: z.enum(['direct', 'template', 'computed']).default('direct'),
})

// REMOVE this field from transformConfigSchema (around line 60)
export const transformConfigSchema = z.looseObject({
  nodes: z.array(transformNodeSchema).default([]),
  variableMappings: z.array(variableMappingSchema).default([]),  // <-- DELETE THIS LINE
  outputFormat: outputFormatSchema.nullable().default(null),
})

// REMOVE this type export (around line 68)
export type VariableMapping = z.infer<typeof variableMappingSchema>  // <-- DELETE THIS LINE
```

**After Changes**:
```typescript
export const transformConfigSchema = z.looseObject({
  nodes: z.array(transformNodeSchema).default([]),
  // variableMappings removed
  outputFormat: outputFormatSchema.nullable().default(null),
})
```

---

### Step 7: Write Unit Tests

**File**: `packages/shared/src/schemas/experience/step.schema.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { experienceStepNameSchema } from './step.schema'

describe('experienceStepNameSchema', () => {
  it('should validate step name with spaces', () => {
    const result = experienceStepNameSchema.safeParse('Pet Choice')
    expect(result.success).toBe(true)
  })

  it('should reject empty step name', () => {
    const result = experienceStepNameSchema.safeParse('')
    expect(result.success).toBe(false)
  })

  it('should reject step name with invalid characters', () => {
    const result = experienceStepNameSchema.safeParse('Pet@Choice!')
    expect(result.success).toBe(false)
  })

  it('should reject step name exceeding max length', () => {
    const longName = 'a'.repeat(51)
    const result = experienceStepNameSchema.safeParse(longName)
    expect(result.success).toBe(false)
  })

  it('should trim whitespace', () => {
    const result = experienceStepNameSchema.safeParse('  Pet Choice  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('Pet Choice')
    }
  })
})
```

**File**: `packages/shared/src/schemas/experience/steps/input-multi-select.schema.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { multiSelectOptionSchema } from './input-multi-select.schema'

describe('multiSelectOptionSchema', () => {
  it('should validate plain option', () => {
    const result = multiSelectOptionSchema.safeParse({ value: 'Cat' })
    expect(result.success).toBe(true)
  })

  it('should validate option with promptFragment', () => {
    const result = multiSelectOptionSchema.safeParse({
      value: 'Cat',
      promptFragment: 'fluffy orange tabby',
    })
    expect(result.success).toBe(true)
  })

  it('should validate option with promptMedia', () => {
    const result = multiSelectOptionSchema.safeParse({
      value: 'Cat',
      promptMedia: {
        mediaAssetId: 'abc-123',
        url: 'https://example.com/image.jpg',
        filePath: 'prompt-media/workspace/abc-123.jpg',
      },
    })
    expect(result.success).toBe(true)
  })

  it('should reject promptFragment exceeding max length', () => {
    const longFragment = 'a'.repeat(501)
    const result = multiSelectOptionSchema.safeParse({
      value: 'Cat',
      promptFragment: longFragment,
    })
    expect(result.success).toBe(false)
  })
})
```

---

### Step 8: Build and Test

```bash
# Build shared package
pnpm --filter @clementine/shared build

# Run tests
pnpm --filter @clementine/shared test

# Check for type errors in app
pnpm app:type-check
```

**Expected Output**:
```
✓ packages/shared/src/schemas/experience/step.schema.test.ts (5 tests)
✓ packages/shared/src/schemas/experience/steps/input-multi-select.schema.test.ts (4 tests)

All tests passed!
```

---

## Phase 1b: Step Editor UI (Day 3-5)

**Goal**: Add step name editing and AI-aware fields to step editors.

**Architecture Overview** (see Decision 6 in plan.md):

This phase follows the existing **callback pattern** used throughout the designer:

```
ExperienceDesignerPage (orchestrator)
  ↓ manages local steps state
StepConfigPanelContainer (auto-save container)
  ↓ react-hook-form + useAutoSave (2s debounce)
  ↓ handleConfigChange: updates form + local state + triggers save
StepConfigPanel (router)
  ↓ passes onConfigChange to individual config panels
InputMultiSelectConfigPanel
  ↓ manages options array
  ↓ handleOptionChange → onConfigChange
MultiSelectOptionEditor
  ↓ receives option + onChange callback
PromptFragmentInput / PromptMediaPicker
  ↓ controlled inputs with onChange
```

**Key principle**: Updates flow upward through callbacks, auto-save is debounced at container level, no race conditions due to `stepsRef` pattern.

### Step 1: Create useValidateStepName Hook

**New File**: `apps/clementine-app/src/domains/experience/designer/hooks/useValidateStepName.ts`

```typescript
import { experienceStepNameSchema } from '@clementine/shared'
import { useExperienceDesignerStore } from '../stores/useExperienceDesignerStore'

export function useValidateStepName(stepId: string) {
  const steps = useExperienceDesignerStore((state) => state.draft?.steps ?? [])

  return (name: string): { valid: boolean; error?: string } => {
    // Check format (Zod validation)
    const result = experienceStepNameSchema.safeParse(name)
    if (!result.success) {
      return { valid: false, error: result.error.errors[0].message }
    }

    // Check uniqueness (case-sensitive)
    const duplicate = steps.find((s) => s.id !== stepId && s.name === name)
    if (duplicate) {
      return { valid: false, error: `Name "${name}" is already used` }
    }

    return { valid: true }
  }
}
```

**Export**: Add to `apps/clementine-app/src/domains/experience/designer/hooks/index.ts`:
```typescript
export * from './useValidateStepName'
```

---

### Step 2: Create StepNameEditor Component

**New File**: `apps/clementine-app/src/domains/experience/designer/components/StepNameEditor.tsx`

```typescript
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useValidateStepName } from '../hooks/useValidateStepName'
import { useUpdateExperienceDraft } from '../hooks/useUpdateExperienceDraft'
import { useDebouncedCallback } from 'use-debounce'

interface StepNameEditorProps {
  stepId: string
  currentName: string
}

export function StepNameEditor({ stepId, currentName }: StepNameEditorProps) {
  const [name, setName] = useState(currentName)
  const [error, setError] = useState<string>()
  const validate = useValidateStepName(stepId)
  const updateDraft = useUpdateExperienceDraft()

  const debouncedSave = useDebouncedCallback((newName: string) => {
    const result = validate(newName)
    if (result.valid) {
      updateDraft((draft) => {
        const step = draft.steps.find((s) => s.id === stepId)
        if (step) {
          step.name = newName
        }
      })
    }
  }, 2000)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setName(newName)
    setError(undefined)
    debouncedSave(newName)
  }

  const handleBlur = () => {
    const result = validate(name)
    if (!result.valid) {
      setError(result.error)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`step-name-${stepId}`}>Step Name</Label>
      <Input
        id={`step-name-${stepId}`}
        value={name}
        onChange={handleChange}
        onBlur={handleBlur}
        className={error ? 'border-destructive' : ''}
        placeholder="Enter step name"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
```

**Export**: Add to `apps/clementine-app/src/domains/experience/designer/components/index.ts`:
```typescript
export * from './StepNameEditor'
```

---

### Step 3: Create RenameStepDialog Component

**New File**: `apps/clementine-app/src/domains/experience/designer/components/RenameStepDialog.tsx`

```typescript
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui-kit/ui/dialog'
import { Input } from '@/ui-kit/ui/input'
import { Label } from '@/ui-kit/ui/label'
import { Button } from '@/ui-kit/ui/button'
import { useValidateStepName } from '../hooks/useValidateStepName'
import { useUpdateStepName } from '../hooks/useUpdateStepName'

interface RenameStepDialogProps {
  stepId: string
  currentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RenameStepDialog({
  stepId,
  currentName,
  open,
  onOpenChange
}: RenameStepDialogProps) {
  const [name, setName] = useState(currentName)
  const [error, setError] = useState<string>()
  const validate = useValidateStepName(stepId)
  const updateStepName = useUpdateStepName()

  // Reset name when dialog opens
  useEffect(() => {
    if (open) {
      setName(currentName)
      setError(undefined)
    }
  }, [open, currentName])

  const handleRename = () => {
    const result = validate(name)
    if (!result.valid) {
      setError(result.error)
      return
    }

    updateStepName(stepId, name)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Step</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="step-name">Step Name</Label>
            <Input
              id="step-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(undefined)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') handleCancel()
              }}
              className={error ? 'border-destructive' : ''}
              placeholder="Enter step name"
              autoFocus
              // Cursor at end (not fully selected)
              onFocus={(e) => {
                const length = e.target.value.length
                e.target.setSelectionRange(length, length)
              }}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleRename}>
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Export**: Add to `apps/clementine-app/src/domains/experience/designer/components/index.ts`

---

### Step 4: Update StepListItem Context Menu

**File**: `apps/clementine-app/src/domains/experience/designer/components/StepListItem.tsx`

Add "Rename" menu item to context menu (position before "Delete"):

```typescript
import { Pencil } from 'lucide-react'

// In context menu items (before Delete)
<DropdownMenuItem onClick={() => onRename?.(step.id)}>
  <Pencil className="mr-2 h-4 w-4" />
  Rename...
</DropdownMenuItem>
```

Update interface to include onRename callback:

```typescript
interface StepListItemProps {
  // ... existing props
  onRename?: (stepId: string) => void
}
```

---

### Step 5: Update StepList Component

**File**: `apps/clementine-app/src/domains/experience/designer/components/StepList.tsx`

Add rename dialog state and wiring:

```typescript
import { useState } from 'react'
import { RenameStepDialog } from './RenameStepDialog'

// Add state
const [renameDialogOpen, setRenameDialogOpen] = useState(false)
const [renamingStepId, setRenamingStepId] = useState<string | null>(null)

// Add callback
const handleRenameStep = (stepId: string) => {
  setRenamingStepId(stepId)
  setRenameDialogOpen(true)
}

// Pass to StepListItem
<StepListItem
  // ... existing props
  onRename={handleRenameStep}
/>

// Render dialog (after StepList closing div)
{renamingStepId && (
  <RenameStepDialog
    stepId={renamingStepId}
    currentName={steps.find(s => s.id === renamingStepId)?.name || ''}
    open={renameDialogOpen}
    onOpenChange={setRenameDialogOpen}
  />
)}
```

Also update step name display:

```typescript
// Inside StepListItem rendering, update step name display
{step.name || step.config.title || 'Untitled Step'}
```

---

### Step 6: Add Step Type Badge

**File**: `apps/clementine-app/src/domains/experience/designer/components/StepListItem.tsx`

Add step type badge next to name:

```typescript
import { Badge } from '@/ui-kit/ui/badge'

// Inside component render, before step name
<Badge variant="outline" className="text-xs">
  {stepTypeLabel(step.type)}
</Badge>
<span className="font-medium">
  {step.name || step.config.title || 'Untitled Step'}
</span>

// Helper function (add at bottom of file)
function stepTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'input.multiSelect': 'Multi-Select',
    'input.shortText': 'Text',
    'input.scale': 'Scale',
    'capture.photo': 'Photo',
    'info': 'Info',
    // Add more as needed
  }
  return labels[type] || type
}
```

---

### Step 7: Create PromptFragmentInput Component

**New File**: `apps/clementine-app/src/domains/experience/steps/multiselect/components/PromptFragmentInput.tsx`

```typescript
import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useDebouncedCallback } from 'use-debounce'

interface PromptFragmentInputProps {
  value: string | undefined
  onChange: (value: string | undefined) => void
}

export function PromptFragmentInput({ value, onChange }: PromptFragmentInputProps) {
  const [localValue, setLocalValue] = useState(value || '')

  const debouncedOnChange = useDebouncedCallback((newValue: string) => {
    onChange(newValue || undefined)
  }, 2000)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    debouncedOnChange(newValue)
  }

  const charCount = localValue.length
  const maxChars = 500

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Prompt Fragment (optional)</Label>
        <span className="text-xs text-muted-foreground">
          {charCount}/{maxChars}
        </span>
      </div>
      <Textarea
        value={localValue}
        onChange={handleChange}
        maxLength={maxChars}
        placeholder="Text to insert when this option is selected"
        className="min-h-20"
      />
      <p className="text-xs text-muted-foreground">
        This text will be added to the AI prompt when the user selects this option.
      </p>
    </div>
  )
}
```

---

### Step 8: Update MultiSelectOptionEditor

**File**: Find `MultiSelectOptionEditor.tsx` (exact location may vary)

**Architecture Note**: This component follows the callback pattern (see Decision 6 in plan.md). The flow is:
```
PromptFragmentInput (onChange) → MultiSelectOptionEditor (onChange) → InputMultiSelectConfigPanel (onConfigChange) → StepConfigPanelContainer (form + save)
```

**Component Interface**:
```typescript
interface MultiSelectOptionEditorProps {
  option: MultiSelectOption
  onChange: (updates: Partial<MultiSelectOption>) => void
  // ... other props
}
```

**Add promptFragment input**:

```typescript
import { PromptFragmentInput } from './PromptFragmentInput'

// Inside component render, after value input
<PromptFragmentInput
  value={option.promptFragment}
  onChange={(value) => {
    // Call onChange callback received from parent (InputMultiSelectConfigPanel)
    onChange({ promptFragment: value })
  }}
/>
```

**Parent Component (InputMultiSelectConfigPanel)** should implement:
```typescript
// Handler for individual option updates
const handleOptionChange = (index: number, updates: Partial<MultiSelectOption>) => {
  const updatedOptions = [...options]
  updatedOptions[index] = { ...updatedOptions[index], ...updates }

  // Call onConfigChange (flows to StepConfigPanelContainer)
  onConfigChange({ options: updatedOptions })
}

// In render, pass to MultiSelectOptionEditor
<MultiSelectOptionEditor
  option={option}
  onChange={(updates) => handleOptionChange(index, updates)}
/>
```

---

### Step 9: Add StepNameEditor to Step Config Panels

Find all step config panels (e.g., `MultiSelectStepConfig.tsx`, `CapturePhotoStepConfig.tsx`) and add:

```typescript
import { StepNameEditor } from '../../designer/components/StepNameEditor'

// At top of config form
<StepNameEditor stepId={step.id} currentName={step.name || ''} />
```

---

### Step 10: Run Validation Loop

```bash
# Format and lint
pnpm app:check

# Type check
pnpm app:type-check

# Run tests (if any component tests added)
pnpm app:test
```

---

### Step 11 (OPTIONAL - LOWEST PRIORITY): Create AIEnabledBadge Component

**Note**: This step is optional. Implement last and evaluate whether the visual indicator adds value or creates UI clutter.

**New File**: `apps/clementine-app/src/domains/experience/designer/components/AIEnabledBadge.tsx`

```typescript
import { Badge } from '@/ui-kit/ui/badge'
import { Sparkles } from 'lucide-react'

export function AIEnabledBadge() {
  return (
    <Badge variant="secondary" className="bg-primary/10 text-primary">
      <Sparkles className="mr-1 h-3 w-3" />
      AI
    </Badge>
  )
}
```

**Usage** (if implemented):

```typescript
// In MultiSelectOptionEditor option list
import { AIEnabledBadge } from '../../designer/components/AIEnabledBadge'

// Show badge if option has AI context
{(option.promptFragment || option.promptMedia) && <AIEnabledBadge />}
```

**Decision Point**: After implementation, evaluate:
- Does it help creators identify AI-enhanced options at a glance?
- Or does it add visual noise to the option list?
- Consider A/B testing or user feedback before keeping

---

## Testing & Validation

### Manual Testing Checklist

Open app in browser (`http://localhost:3000`):

- [ ] Create new experience, add multiselect step
- [ ] Verify step name auto-generated (e.g., "Pet Choice")
- [ ] Right-click step in list, select "Rename...", verify dialog opens
- [ ] Rename to "My Pet Choice", verify saves and dialog closes
- [ ] Try duplicate name via dialog, verify inline error shown
- [ ] Try invalid characters (!@#) via dialog, verify error
- [ ] Open step config panel, edit name inline via StepNameEditor
- [ ] Verify inline editing works with debounced auto-save
- [ ] Add promptFragment "fluffy cat" to option
- [ ] Verify character counter shows correct count
- [ ] Reload page, verify changes persisted
- [ ] Test on mobile viewport (375px width)
- [ ] (Optional) If AIEnabledBadge implemented, verify badge appears on AI-enhanced options

### Performance Validation

- [ ] Step name validation responds within 200ms (use Chrome DevTools)
- [ ] Auto-save triggers after 2000ms (check Network tab)
- [ ] StepList renders quickly (< 100ms for 10 steps)

### Standards Compliance

- [ ] All components extend shadcn/ui (Input, Textarea, Dialog, Badge)
- [ ] RenameStepDialog uses Dialog component correctly
- [ ] File names follow pattern (`RenameStepDialog.tsx`, `useValidateStepName.ts`)
- [ ] Barrel exports updated (`index.ts` files)
- [ ] (Optional) If AIEnabledBadge implemented, uses theme tokens (`bg-primary/10 text-primary`)

---

## Troubleshooting

### Build Errors

**Error**: `Cannot find module '@clementine/shared'`
**Fix**:
```bash
pnpm --filter @clementine/shared build
pnpm install
```

**Error**: `Property 'promptFragment' does not exist on type 'string'`
**Fix**: You forgot to update `multiSelectOptionSchema`. Options are now objects, not strings.

---

### Type Errors

**Error**: `Type 'string | undefined' is not assignable to type 'string'`
**Fix**: Step names are now required. Add fallback:
```typescript
const name = step.name || step.config.title || 'Untitled'
```

---

### Test Failures

**Error**: `experienceStepNameSchema.safeParse is not a function`
**Fix**: Rebuild shared package:
```bash
pnpm --filter @clementine/shared build
```

---

### Runtime Errors

**Error**: `Cannot read property 'name' of undefined`
**Fix**: Old experiences don't have names. Add backward compatibility:
```typescript
const displayName = step.name || step.config.title || 'Untitled Step'
```

---

## Next Steps

After completing Phase 1a & 1b:

1. Run full test suite: `pnpm app:test`
2. Create PR with screenshots
3. Request code review
4. Deploy to dev environment
5. Test on real mobile devices
6. Run `/speckit.tasks` for Phase 1c

**Phase 1c Preview**:
- RefMedia upload UI
- DisplayName editing
- RefMedia management section

---

## Quick Commands Reference

```bash
# Build shared schemas
pnpm --filter @clementine/shared build

# Test shared schemas
pnpm --filter @clementine/shared test

# Check app formatting/linting
pnpm app:check

# Type check app
pnpm app:type-check

# Run app tests
pnpm app:test

# Start dev server
pnpm app:dev

# Full validation loop
pnpm --filter @clementine/shared build && \
pnpm --filter @clementine/shared test && \
pnpm app:check && \
pnpm app:type-check
```

---

## Need Help?

- **Spec**: See `spec.md` for requirements
- **Plan**: See `plan.md` for architecture details
- **Data Model**: See `data-model.md` for schema documentation
- **Research**: See `research.md` for technical decisions
