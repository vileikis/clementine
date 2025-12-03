# Quickstart: Steps Consolidation (Experience-Scoped Steps)

**Feature**: `017-steps-consolidate`
**Date**: 2025-12-03

## Overview

This document provides implementation guidance for the Steps Consolidation feature. It covers key implementation patterns, critical files, and decision points.

---

## Quick Reference

### Key Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `web/src/features/steps/types/step.types.ts` | UPDATE | Add `ai-transform` to StepType union |
| `web/src/features/steps/schemas/step.schemas.ts` | UPDATE | Add `AiTransformConfig` Zod schema |
| `web/src/features/steps/constants.ts` | UPDATE | Add STEP_TYPE_META and STEP_DEFAULTS for ai-transform |
| `web/src/features/steps/repositories/steps.repository.ts` | UPDATE | Change from eventId/journeyId to experienceId |
| `web/src/features/steps/actions/steps.ts` | UPDATE | Consolidate experience-scoped actions |
| `web/src/features/steps/components/editors/AiTransformEditor.tsx` | CREATE | New editor component |
| `web/src/features/experiences/actions/steps.ts` | DELETE | Remove duplicate file (FR-013) |
| `web/src/features/experiences/actions/index.ts` | UPDATE | Remove step action exports |
| `web/src/features/experiences/hooks/useStepMutations.ts` | UPDATE | Import from @/features/steps/actions |
| `web/src/features/sessions/actions/sessions.actions.ts` | UPDATE | Use experienceId instead of journeyId |

### Key Directories

```
web/src/features/steps/           # Primary module - all changes here
web/src/features/experiences/     # Remove duplicate step actions
web/src/features/sessions/        # Update to use experienceId
```

---

## Implementation Guide

### Step 1: Add AI Transform Type and Schema

**File**: `web/src/features/steps/types/step.types.ts`

Add `"ai-transform"` to the StepType union:

```typescript
export type StepType =
  | "info"
  | "experience-picker"
  | "capture"
  | "ai-transform"  // Add this
  | "short_text"
  // ... rest unchanged
```

**File**: `web/src/features/steps/schemas/step.schemas.ts`

Add the AiTransformConfig schema:

```typescript
export const aiTransformVariableSchema = z.object({
  key: z.string().min(1).max(50).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  sourceType: z.enum(["capture", "input", "static"]),
  sourceStepId: z.string().optional(),
  staticValue: z.string().optional(),
}).refine(/* validation - see data-model.md */);

export const aiTransformConfigSchema = z.object({
  model: z.string().nullable(),
  prompt: z.string().max(1000).nullable(),
  variables: z.array(aiTransformVariableSchema).default([]),
  outputType: z.enum(["image", "video", "gif"]).default("image"),
  aspectRatio: z.string().default("1:1"),
  referenceImageUrls: z.array(z.string().url()).max(5).default([]),
});
```

### Step 2: Add AI Transform Constants

**File**: `web/src/features/steps/constants.ts`

Add STEP_TYPE_META entry:

```typescript
"ai-transform": {
  label: "AI Transform",
  description: "Transform photos with AI models",
  icon: "wand-2",
  category: "capture",
  deprecated: false,
},
```

Add STEP_DEFAULTS entry:

```typescript
"ai-transform": {
  title: "AI Transform",
  ctaLabel: "Generate",
  config: {
    model: null,
    prompt: null,
    variables: [],
    outputType: "image",
    aspectRatio: "1:1",
    referenceImageUrls: [],
  },
},
```

### Step 3: Update Repository to Use experienceId

**File**: `web/src/features/steps/repositories/steps.repository.ts`

Change collection helper:

```typescript
// Before
function getStepsCollection(eventId: string) {
  return adminDb.collection(`events/${eventId}/steps`);
}

// After
function getStepsCollection(experienceId: string) {
  return adminDb.collection(`experiences/${experienceId}/steps`);
}
```

Update all functions to accept `experienceId` instead of `eventId` + `journeyId`.

### Step 4: Consolidate Server Actions

**File**: `web/src/features/steps/actions/steps.ts`

Update action signatures:

```typescript
// Before
export async function listStepsAction(eventId: string, journeyId: string)

// After
export async function listStepsAction(experienceId: string)
```

Use batch writes for atomic operations:

```typescript
export async function createStepAction(input: CreateStepInput) {
  const batch = adminDb.batch();

  // Create step document
  const stepRef = getStepsCollection(input.experienceId).doc();
  batch.set(stepRef, stepData);

  // Update experience.stepsOrder
  const expRef = adminDb.doc(`experiences/${input.experienceId}`);
  batch.update(expRef, {
    stepsOrder: FieldValue.arrayUnion(stepRef.id),
    updatedAt: Date.now(),
  });

  await batch.commit();
}
```

### Step 5: Delete Duplicate File and Update Imports

**Delete**: `web/src/features/experiences/actions/steps.ts`

**Update**: `web/src/features/experiences/actions/index.ts`

```typescript
// Remove step action exports
export * from "./experiences";
export * from "./types";
// Delete: export * from "./steps";
```

**Update**: `web/src/features/experiences/hooks/useStepMutations.ts`

```typescript
// Before
import { createStepAction, ... } from "../actions/steps";

// After
import { createStepAction, ... } from "@/features/steps/actions";
```

### Step 6: Create AI Transform Editor

**File**: `web/src/features/steps/components/editors/AiTransformEditor.tsx`

Follow the pattern of existing editors (e.g., `RewardEditor.tsx`):

```typescript
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { aiTransformConfigSchema } from "../../schemas";
import type { AiTransformConfig } from "../../types";

interface AiTransformEditorProps {
  config: AiTransformConfig;
  onConfigChange: (config: AiTransformConfig) => void;
}

export function AiTransformEditor({ config, onConfigChange }: AiTransformEditorProps) {
  const form = useForm({
    resolver: zodResolver(aiTransformConfigSchema),
    defaultValues: config,
  });

  // Auto-save on form changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      onConfigChange(value as AiTransformConfig);
    });
    return () => subscription.unsubscribe();
  }, [form, onConfigChange]);

  return (
    <div className="space-y-4">
      {/* Model Selection */}
      {/* Prompt Textarea */}
      {/* Variables List */}
      {/* Output Settings */}
      {/* Reference Images */}
    </div>
  );
}
```

### Step 7: Update Sessions to Use experienceId

**File**: `web/src/features/sessions/actions/sessions.actions.ts`

Update session-related actions to work with experiences:

```typescript
// Before
export async function startJourneySessionAction(eventId: string, journeyId: string)

// After (or add new function)
export async function startExperienceSessionAction(eventId: string, experienceId: string)
```

---

## Testing Checklist

### Type Safety
- [ ] `pnpm type-check` passes with zero errors
- [ ] No `any` types in new code
- [ ] AiTransformConfig properly typed

### Lint
- [ ] `pnpm lint` passes with no errors
- [ ] No unused imports after consolidation

### Build
- [ ] `pnpm build` completes successfully

### Functional Tests
- [ ] Can create ai-transform step in experience editor
- [ ] Can configure model, prompt, variables
- [ ] Step picker shows ai-transform, hides experience-picker
- [ ] Steps CRUD operations work via consolidated actions
- [ ] Steps load from `/experiences/{id}/steps/` path

### Code Search Verification
- [ ] `grep -r "journeyId" web/src/features/steps/` returns zero results
- [ ] `grep -r "journey" web/src/features/steps/` returns zero results (excluding comments)
- [ ] `features/experiences/actions/steps.ts` file is deleted

---

## Common Patterns

### Firestore Batch Writes

```typescript
const batch = adminDb.batch();
batch.set(docRef, data);
batch.update(parentRef, { field: value });
await batch.commit();
```

### Zod Schema with Refinement

```typescript
const schema = z.object({
  // fields
}).refine(
  (data) => /* validation logic */,
  { message: "Error message" }
);
```

### Server Action Response Pattern

```typescript
export async function myAction(): Promise<ActionResponse<T>> {
  try {
    // operation
    return { success: true, data: result };
  } catch (error) {
    console.error("[Action] Error:", error);
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Operation failed" },
    };
  }
}
```

---

## Decision Log

| Decision | Rationale |
|----------|-----------|
| Keep `experience-picker` in StepType union | Backward compatibility with existing data |
| Use batch writes for create/delete | Atomic operations prevent partial failures |
| Store config as flexible object | Different step types have different schemas |
| Import actions from steps module | Single source of truth (FR-007, FR-008) |

---

## Dependencies

### External
- Zod 4.x (validation)
- Firebase Admin SDK (Firestore)
- lucide-react (icons)
- shadcn/ui (UI components)

### Internal
- `@/features/experiences/` (experience repository)
- `@/lib/firebase/admin` (Firestore access)

---

## Rollback Plan

If issues are discovered:

1. Restore `features/experiences/actions/steps.ts` from git
2. Revert import changes in `useStepMutations.ts`
3. Revert `actions/index.ts` to re-export steps

The parallel collection structure (journeys + experiences) means no data migration is needed for rollback.
