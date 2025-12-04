# Phase: AI Transform Step Playground

> **Status**: Not Started
> **Priority**: High
> **Dependencies**: Phase 3 (Steps Consolidation) - Complete

## Overview

Add an AI Playground test panel to the AI Transform step editor, allowing creators to test AI transformations directly within the Experience Editor without needing to use the deprecated AI Presets module.

### Problem Statement

Currently, the only way to test AI transformations is through the deprecated `ai-presets` module's AIPlayground component. Now that AI configuration lives within the `ai-transform` step type, creators need a way to test their prompts and settings directly in the Experience Editor.

### Solution

Add a "Test" button to the `AiTransformEditor` that opens an overlay/dialog containing an adapted version of the AIPlayground. This playground will:
- Accept an input image (upload or drag-drop)
- Run AI generation using the current step's configuration
- Display the result image
- Show generation time

## Scope

### In Scope

1. **Test Button UI** - Add button to AiTransformEditor
2. **Playground Dialog** - Modal/sheet overlay with test functionality
3. **Server Action** - New action to generate using step config (not aiPreset)
4. **Config Mapping** - Map step's `aiTransformConfigSchema` to AI client params

### Out of Scope

- `variables` field processing (ignored - static test only)
- `outputType` processing (always outputs image for now)
- Video/GIF generation (image only for MVP)
- Saving/persisting test results
- Multiple input images

## Technical Design

### 1. Component Architecture

```
AiTransformEditor.tsx
├── [existing editor fields]
└── Test Button → Opens StepPlaygroundDialog

StepPlaygroundDialog.tsx (new)
├── Dialog wrapper (centered modal, max-w-4xl)
└── StepAIPlayground (adapted from AIPlayground)
    ├── Horizontal layout (input left, result right)
    ├── Upload zone (drag-drop) on left
    ├── Generate button in center
    ├── Result preview on right
    └── Timer/status below result
```

### 2. Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ AiTransformEditor                                               │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Step Config (form state)                                    │ │
│ │ - model: string                                             │ │
│ │ - prompt: string                                            │ │
│ │ - aspectRatio: string                                       │ │
│ │ - referenceImageUrls: string[]                              │ │
│ │ - outputType: "image" | "video" | "gif" (IGNORED)           │ │
│ │ - variables: AiTransformVariable[] (IGNORED)                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                           │                                     │
│                           ▼                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Test Button                                                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────────┘
                            │ onClick
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ StepPlaygroundDialog                                            │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Props:                                                      │ │
│ │ - stepId: string                                            │ │
│ │ - config: AiTransformConfig (current form values)           │ │
│ │ - open: boolean                                             │ │
│ │ - onOpenChange: (open: boolean) => void                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                           │                                     │
│                           ▼                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ StepAIPlayground                                            │ │
│ │                                                             │ │
│ │ 1. User uploads test image                                  │ │
│ │ 2. Click "Generate"                                         │ │
│ │ 3. Call generateStepPreview() server action                 │ │
│ │ 4. Display result                                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼ Server Action
┌─────────────────────────────────────────────────────────────────┐
│ generateStepPreview()                                           │
│                                                                 │
│ Input:                                                          │
│ - stepId: string                                                │
│ - testImageBase64: string                                       │
│                                                                 │
│ Process:                                                        │
│ 1. Validate auth                                                │
│ 2. Fetch step from Firestore                                    │
│ 3. Validate step type === 'ai-transform'                        │
│ 4. Extract config: { model, prompt, aspectRatio, refImages }    │
│ 5. Upload test image to temp storage                            │
│ 6. Call AI client with extracted params                         │
│ 7. Return result as base64                                      │
│                                                                 │
│ Output:                                                         │
│ - resultImageBase64: string                                     │
│ - generationTimeMs: number                                      │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Server Action Design

**Location**: `web/src/features/steps/actions/step-playground.ts`

```typescript
// Input schema
const stepPlaygroundInputSchema = z.object({
  stepId: z.string().min(1, "Step ID is required"),
  testImageBase64: z
    .string()
    .min(1, "Test image is required")
    .refine(
      (val) => val.startsWith("data:image/"),
      "Test image must be a valid data URL"
    ),
});

// Output schema
const stepPlaygroundOutputSchema = z.object({
  resultImageBase64: z.string(),
  generationTimeMs: z.number().optional(),
});
```

**Implementation Notes**:
- Reuse utility functions from `ai-presets/actions/utils.ts` (or create shared utils)
- Fetch step document from `/experiences/{experienceId}/steps/{stepId}`
- The `experienceId` can be extracted from the step document's `experienceId` field
- Only process if `step.type === 'ai-transform'`
- Map step config to `TransformParams`:
  ```typescript
  const transformParams: TransformParams = {
    prompt: step.config.prompt,
    inputImageUrl: uploadedTestImageUrl,
    referenceImageUrls: step.config.referenceImageUrls || [],
    model: step.config.model || 'gemini-2.5-flash-image',
    aspectRatio: step.config.aspectRatio || '1:1',
  };
  ```

### 4. UI Components

#### 4.1 Test Button in AiTransformEditor

Add after the "Output Settings" section:

```tsx
{/* Test Section */}
<div className="border-t pt-4">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="text-sm font-medium">Test AI Transform</h3>
      <p className="text-xs text-muted-foreground">
        Test your configuration with a sample image
      </p>
    </div>
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShowPlayground(true)}
      disabled={!form.getValues("config.prompt")}
    >
      <FlaskConical className="h-4 w-4 mr-2" />
      Test
    </Button>
  </div>
</div>
```

#### 4.2 StepPlaygroundDialog

**Location**: `web/src/features/steps/components/shared/StepPlaygroundDialog.tsx`

Uses shadcn/ui `Dialog` component (centered modal) with horizontal layout:
- Dialog width: `max-w-4xl` (~896px) for comfortable side-by-side comparison
- Contains the adapted playground component
- Receives current config as props (not from Firestore) for real-time preview

**Why Dialog over Sheet:**
- Testing is a distinct action from editing - modal signals "pause editing, test this"
- Avoids awkward sheet stacking (editor panel + another sheet)
- Horizontal layout enables intuitive before/after comparison
- Quick iteration: test → close → tweak → test again

#### 4.3 StepAIPlayground

**Location**: `web/src/features/steps/components/shared/StepAIPlayground.tsx`

Adapted from `ai-presets/components/shared/AIPlayground.tsx`:
- **Horizontal layout**: Input image on left, result on right
- Same upload/drag-drop functionality
- Same state machine (idle → ready → generating → result/error)
- Same timer during generation
- Different server action call (`generateStepPreview` instead of `generatePlaygroundPreview`)
- Props change: receives `stepId` + `config` instead of `experienceId` + `prompt`

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Test AI Transform                                      [X]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────┐              ┌───────────────────┐      │
│  │                   │              │                   │      │
│  │      INPUT        │  [Generate]  │      RESULT       │      │
│  │      IMAGE        │      →       │      IMAGE        │      │
│  │                   │              │                   │      │
│  │                   │              │                   │      │
│  └───────────────────┘              └───────────────────┘      │
│   Drop image or click                Generated in 12s          │
│   to upload                                                    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Error message (if any)                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Responsive Behavior:**
- On smaller screens (`< md`), stack vertically (input above, result below)
- Generate button moves between the two sections

### 5. Config to AI Params Mapping

| Step Config Field | AI Client Param | Notes |
|-------------------|-----------------|-------|
| `model` | `model` | Default: `gemini-2.5-flash-image` |
| `prompt` | `prompt` | Required for generation |
| `aspectRatio` | `aspectRatio` | Default: `1:1` |
| `referenceImageUrls` | `referenceImageUrls` | Optional, max 5 |
| `outputType` | (ignored) | Always image for testing |
| `variables` | (ignored) | No variable substitution in test |

### 6. Validation Rules

**Button Enabled When**:
- `prompt` is not empty (required for AI generation)

**Button Disabled When**:
- `prompt` is empty or null
- Form has validation errors

**Generation Blocked When**:
- No test image uploaded
- Step not found in database
- Step type is not `ai-transform`
- User not authenticated

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `web/src/features/steps/actions/step-playground.ts` | Server action for step-based AI generation |
| `web/src/features/steps/components/shared/StepPlaygroundDialog.tsx` | Dialog wrapper component |
| `web/src/features/steps/components/shared/StepAIPlayground.tsx` | Playground UI adapted for steps |
| `web/src/features/steps/schemas/step-playground.schemas.ts` | Zod schemas for playground input/output |

### Modified Files

| File | Changes |
|------|---------|
| `web/src/features/steps/components/editors/AiTransformEditor.tsx` | Add Test button and dialog state |
| `web/src/features/steps/actions/index.ts` | Export new server action |
| `web/src/features/steps/actions/types.ts` | Add new error codes if needed |

## Implementation Steps

### Step 1: Create Schemas
1. Create `step-playground.schemas.ts` with input/output schemas

### Step 2: Create Server Action
1. Create `step-playground.ts` server action
2. Implement step fetching and validation
3. Map config to AI client params
4. Reuse temp storage upload logic from ai-presets

### Step 3: Create UI Components
1. Create `StepAIPlayground.tsx` (adapt from AIPlayground with horizontal layout)
2. Create `StepPlaygroundDialog.tsx` (Dialog wrapper)

### Step 4: Integrate with Editor
1. Add dialog state to `AiTransformEditor`
2. Add Test button UI
3. Wire up dialog open/close
4. Pass current form values to playground

### Step 5: Testing
1. Test with valid prompt and model
2. Test with missing prompt (button disabled)
3. Test error states (network, AI failure)
4. Test timer and generation time display

## Error Handling

| Error | User Message | Recovery |
|-------|--------------|----------|
| Step not found | "Step configuration not found" | Reload page |
| Not ai-transform | "Test is only available for AI Transform steps" | N/A |
| No prompt | Button disabled | Add prompt first |
| AI generation failed | Show error message from AI | Retry button |
| Upload failed | "Failed to process image" | Try different image |
| Auth failed | "Please log in to test" | Redirect to login |

## Success Criteria

1. **Functional**
   - Can upload test image via click or drag-drop
   - Generate button calls AI with step config
   - Result displays correctly
   - Timer shows during generation
   - Total time shows after completion

2. **UX**
   - Test button clearly visible in editor
   - Dialog opens smoothly as centered modal
   - Horizontal layout provides clear input/output comparison
   - Loading state clear during generation
   - Error messages actionable

3. **Code Quality**
   - Reuses patterns from ai-presets playground
   - Follows existing conventions
   - Type-safe throughout
   - No code duplication

## Future Enhancements

- Support video/GIF output types
- Variable substitution preview
- Save favorite test images
- A/B testing multiple prompts
- Generation history

## Related Documentation

- `phase-3-steps-consolidate.md` - AI Transform step type definition
- `web/src/features/ai-presets/components/shared/AIPlayground.tsx` - Reference implementation
- `web/src/lib/ai/` - AI client interface
