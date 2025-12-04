# Quickstart: AI Transform Step Playground

**Feature**: 019-ai-transform-playground
**Date**: 2024-12-04

## Overview

This guide provides quick-start instructions for implementing the AI Transform Step Playground feature.

## Prerequisites

- Node.js 18+ and pnpm installed
- Firebase project configured (Firestore + Storage)
- AI provider configured (Google AI, n8n webhook, or mock)
- Running development server: `pnpm dev`

## Implementation Order

Follow these steps in order:

### 1. Create Zod Schemas (5 min)

**File**: `web/src/features/steps/schemas/step-playground.schemas.ts`

```typescript
import { z } from 'zod';

export const stepPlaygroundInputSchema = z.object({
  stepId: z.string().min(1, 'Step ID is required'),
  testImageBase64: z
    .string()
    .min(1, 'Test image is required')
    .refine(
      (val) => val.startsWith('data:image/'),
      'Test image must be a valid image data URL'
    ),
});

export const stepPlaygroundOutputSchema = z.object({
  resultImageBase64: z.string(),
  generationTimeMs: z.number().optional(),
});

export type StepPlaygroundInput = z.infer<typeof stepPlaygroundInputSchema>;
export type StepPlaygroundOutput = z.infer<typeof stepPlaygroundOutputSchema>;
```

**Export**: Add to `web/src/features/steps/schemas/index.ts`

### 2. Create Server Action (20 min)

**File**: `web/src/features/steps/actions/step-playground.ts`

Reference implementation: `web/src/features/ai-presets/actions/playground-generate.ts`

Key steps:
1. Validate auth with `verifyAdminSecret()`
2. Validate input with Zod schema
3. Fetch step from Firestore
4. Validate step type is `ai-transform`
5. Extract config (model, prompt, aspectRatio, referenceImageUrls)
6. Upload test image to temp storage
7. Call AI client with `getAIClient().generateImage()`
8. Return result as base64

**Export**: Add to `web/src/features/steps/actions/index.ts`

### 3. Create StepAIPlayground Component (30 min)

**File**: `web/src/features/steps/components/playground/StepAIPlayground.tsx`

Reference implementation: `web/src/features/ai-presets/components/shared/AIPlayground.tsx`

Key changes from reference:
- Horizontal layout: `flex flex-col md:flex-row`
- Props: `stepId` + `config` instead of `experienceId` + `prompt`
- Server action: import `generateStepPreview` from `../../actions/step-playground`

### 4. Create StepPlaygroundDialog Component (10 min)

**File**: `web/src/features/steps/components/playground/StepPlaygroundDialog.tsx`

```typescript
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StepAIPlayground } from './StepAIPlayground';
import type { AiTransformConfig } from '../../types';

interface StepPlaygroundDialogProps {
  stepId: string;
  config: AiTransformConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StepPlaygroundDialog({
  stepId,
  config,
  open,
  onOpenChange,
}: StepPlaygroundDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Test AI Transform</DialogTitle>
        </DialogHeader>
        <StepAIPlayground stepId={stepId} config={config} />
      </DialogContent>
    </Dialog>
  );
}
```

### 4.1. Create Barrel Export (2 min)

**File**: `web/src/features/steps/components/playground/index.ts`

```typescript
export { StepAIPlayground } from './StepAIPlayground';
export { StepPlaygroundDialog } from './StepPlaygroundDialog';
```

### 5. Integrate with AiTransformEditor (15 min)

**File**: `web/src/features/steps/components/editors/AiTransformEditor.tsx`

Add:
1. Dialog state: `const [showPlayground, setShowPlayground] = useState(false);`
2. Test button after Output Settings section
3. `StepPlaygroundDialog` component at end of form

```tsx
// After the Aspect Ratio FormField, before closing </form>

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
      disabled={!form.getValues('config.prompt')}
      type="button"
    >
      <FlaskConical className="h-4 w-4 mr-2" />
      Test
    </Button>
  </div>
</div>

{/* Playground Dialog */}
<StepPlaygroundDialog
  stepId={step.id}
  config={form.getValues('config')}
  open={showPlayground}
  onOpenChange={setShowPlayground}
/>
```

## Validation

After implementation, run:

```bash
pnpm lint          # Check code style
pnpm type-check    # Verify TypeScript
pnpm test          # Run unit tests
pnpm dev           # Test manually in browser
```

## Manual Testing Checklist

1. [ ] Open Experience Editor with an AI Transform step
2. [ ] Configure prompt, model, aspect ratio
3. [ ] Click "Test" button (verify disabled without prompt)
4. [ ] Upload image via click or drag-drop
5. [ ] Click "Generate" and observe timer
6. [ ] Verify result displays with generation time
7. [ ] Test "Regenerate" button
8. [ ] Test "Clear" button
9. [ ] Test error handling (remove prompt, try again)
10. [ ] Test on mobile viewport (vertical layout)

## Troubleshooting

### "Step not found" error
- Verify step ID is correct
- Check Firestore rules allow reading steps

### "Permission denied" error
- Verify user is authenticated
- Check `verifyAdminSecret()` is working

### AI generation fails
- Check AI_PROVIDER env variable
- Verify API keys are set
- Check network connectivity

### Dialog doesn't open
- Verify `showPlayground` state is toggling
- Check for JavaScript errors in console
